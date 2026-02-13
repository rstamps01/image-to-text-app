// Desktop app routers - no authentication required
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createProject,
  getProjectById,
  getAllProjects,
  updateProject,
  deleteProject,
  createPage,
  getPageById,
  getPagesByProject,
  updatePage,
  deletePage,
  getProjectStats,
  getPagesByStatus,
  updatePageOrder,
  bulkUpdatePageStatus,
} from "./db";
import { performOCR, cleanupOCRText } from "./ocrService";
import { exportDocument, ExportFormat } from "./exportService";
import * as fs from "fs";
import * as path from "path";

export const appRouter = router({
  projects: router({
    // Create a new project
    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          description: z.string().optional(),
          enableCleanup: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const project = await createProject({
          title: input.title,
          description: input.description,
          enableCleanup: (input.enableCleanup ?? false) ? "yes" : "no",
        });
        return project;
      }),

    // Get all projects
    list: publicProcedure.query(async () => {
      return getAllProjects();
    }),

    // Get a specific project with its pages
    get: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const project = await getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        const pages = await getPagesByProject(input.projectId);
        const stats = await getProjectStats(input.projectId);
        
        return { project, pages, stats };
      }),

    // Delete a project
    delete: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const project = await getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        await deleteProject(input.projectId);
        return { success: true };
      }),

    // Bulk delete projects
    bulkDelete: publicProcedure
      .input(z.object({ projectIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        let deletedCount = 0;
        const errors: string[] = [];

        for (const projectId of input.projectIds) {
          try {
            const project = await getProjectById(projectId);
            if (!project) {
              errors.push(`Project ${projectId} not found`);
              continue;
            }

            await deleteProject(projectId);
            deletedCount++;
          } catch (error) {
            errors.push(`Failed to delete project ${projectId}: ${error}`);
          }
        }

        return { deletedCount, errors, success: deletedCount > 0 };
      }),

    // Update project settings (cleanup toggle, etc.)
    updateSettings: publicProcedure
      .input(
        z.object({
          projectId: z.number(),
          enableCleanup: z.enum(["yes", "no"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const project = await getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        const updates: any = {};
        if (input.enableCleanup !== undefined) {
          updates.enableCleanup = input.enableCleanup;
        }

        await updateProject(input.projectId, updates);
        return { success: true };
      }),

    // Preview cleanup effect on a sample page
    previewCleanup: publicProcedure
      .input(
        z.object({
          projectId: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { projectId } = input;

        // Get the project
        const project = await getProjectById(projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        // Get a sample completed page (first one)
        const pages = await getPagesByProject(projectId);
        const completedPage = pages.find(p => p.status === "completed" && p.extractedText);

        if (!completedPage || !completedPage.extractedText) {
          return {
            hasPreview: false,
            message: "No completed pages with text found. Upload and process pages first.",
          };
        }

        const originalText = completedPage.extractedText;
        const cleanedText = cleanupOCRText(originalText);

        return {
          hasPreview: true,
          originalText,
          cleanedText,
          pageNumber: completedPage.detectedPageNumber || completedPage.sortOrder?.toString(),
          filename: completedPage.filename,
        };
      }),
  }),

  pages: router({
    // Upload a page image and create page record
    upload: publicProcedure
      .input(
        z.object({
          projectId: z.number(),
          filename: z.string(),
          filePath: z.string(), // Local file path for desktop app
        })
      )
      .mutation(async ({ input }) => {
        const project = await getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        // For desktop app, store files locally in data/uploads directory
        const uploadsDir = path.join(process.cwd(), "data", "uploads", input.projectId.toString());
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Copy file to uploads directory
        const destPath = path.join(uploadsDir, input.filename);
        fs.copyFileSync(input.filePath, destPath);

        // Create page record
        const page = await createPage({
          projectId: input.projectId,
          filename: input.filename,
          imageKey: destPath, // Store local path
          imageUrl: `file://${destPath}`, // Use file:// protocol for local files
          status: "pending",
        });

        return page;
      }),

    // Process OCR for a page
    processOCR: publicProcedure
      .input(z.object({ pageId: z.number() }))
      .mutation(async ({ input }) => {
        const page = await getPageById(input.pageId);
        
        if (!page) {
          throw new Error("Page not found");
        }

        const project = await getProjectById(page.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        try {
          // Update status to processing
          await updatePage(input.pageId, { status: "processing" });

          // Perform OCR (imageUrl contains local file path with file:// protocol)
          const ocrResult = await performOCR(page.imageUrl);

          // Apply cleanup if enabled for this project
          const extractedText = project.enableCleanup === 'yes' 
            ? cleanupOCRText(ocrResult.extractedText)
            : ocrResult.extractedText;

          // Update page with OCR results
          await updatePage(input.pageId, {
            extractedText,
            detectedPageNumber: ocrResult.detectedPageNumber,
            formattingData: ocrResult.formattingData as any,
            confidenceScore: ocrResult.confidence,
            status: "completed",
          });

          return {
            success: true,
            pageNumber: ocrResult.detectedPageNumber,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "OCR processing failed";
          await updatePage(input.pageId, {
            status: "failed",
            errorMessage,
          });
          throw error;
        }
      }),

    // Reorder pages based on detected page numbers
    reorder: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const project = await getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        const pages = await getPagesByProject(input.projectId);
        
        // Sort pages by detected page number
        const sortedPages = pages.sort((a, b) => {
          const aNum = parseInt(a.detectedPageNumber || "0");
          const bNum = parseInt(b.detectedPageNumber || "0");
          return aNum - bNum;
        });

        // Update sort order
        for (let i = 0; i < sortedPages.length; i++) {
          await updatePageOrder(sortedPages[i].id, i);
        }

        return { success: true, reorderedCount: sortedPages.length };
      }),

    // Manual reorder (drag and drop)
    manualReorder: publicProcedure
      .input(
        z.object({
          projectId: z.number(),
          pageOrders: z.array(
            z.object({
              pageId: z.number(),
              sortOrder: z.number(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const project = await getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        for (const { pageId, sortOrder } of input.pageOrders) {
          await updatePageOrder(pageId, sortOrder);
        }

        return { success: true };
      }),

    // Update page text (manual editing)
    updateText: publicProcedure
      .input(
        z.object({
          pageId: z.number(),
          extractedText: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const page = await getPageById(input.pageId);
        if (!page) {
          throw new Error("Page not found");
        }

        await updatePage(input.pageId, {
          extractedText: input.extractedText,
        });

        return { success: true };
      }),

    // Delete a page
    delete: publicProcedure
      .input(z.object({ pageId: z.number() }))
      .mutation(async ({ input }) => {
        const page = await getPageById(input.pageId);
        if (!page) {
          throw new Error("Page not found");
        }

        // Delete local file
        try {
          const filePath = page.imageUrl.replace('file://', '');
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.warn(`Failed to delete file: ${error}`);
        }

        await deletePage(input.pageId);
        return { success: true };
      }),

    // Retry failed pages
    retryFailed: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const failedPages = await getPagesByStatus(input.projectId, "failed");
        
        await bulkUpdatePageStatus(
          failedPages.map(p => p.id),
          "pending",
          undefined
        );

        return { success: true, retriedCount: failedPages.length };
      }),

    // Retry single page
    retrySingle: publicProcedure
      .input(z.object({ pageId: z.number() }))
      .mutation(async ({ input }) => {
        const page = await getPageById(input.pageId);
        if (!page) {
          throw new Error("Page not found");
        }

        if (page.status !== "failed" && page.status !== "pending") {
          throw new Error("Only failed or pending pages can be retried");
        }

        await updatePage(input.pageId, {
          status: "pending",
          errorMessage: null,
        });

        return { success: true };
      }),

    // Reprocess completed page (for improved OCR)
    reprocessPage: publicProcedure
      .input(z.object({ pageId: z.number() }))
      .mutation(async ({ input }) => {
        const page = await getPageById(input.pageId);
        if (!page) {
          throw new Error("Page not found");
        }

        // Reset page to pending for reprocessing
        await updatePage(input.pageId, {
          status: "pending",
          extractedText: null,
          detectedPageNumber: null,
          formattingData: null,
          confidenceScore: null,
          errorMessage: null,
        });

        return { success: true };
      }),
  }),

  export: router({
    // Export project to specified format
    generate: publicProcedure
      .input(
        z.object({
          projectId: z.number(),
          format: z.enum(["pdf", "docx", "txt", "markdown"]),
        })
      )
      .mutation(async ({ input }) => {
        const project = await getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        const pages = await getPagesByProject(input.projectId);
        const completedPages = pages
          .filter(p => p.status === "completed" && p.extractedText)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        if (completedPages.length === 0) {
          throw new Error("No completed pages to export");
        }

        // Generate export file
        const buffer = await exportDocument(
          completedPages,
          input.format as ExportFormat,
          project.title
        );

        // Save to exports directory
        const exportsDir = path.join(process.cwd(), "data", "exports");
        if (!fs.existsSync(exportsDir)) {
          fs.mkdirSync(exportsDir, { recursive: true });
        }

        const filename = `${project.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${input.format}`;
        const filePath = path.join(exportsDir, filename);
        fs.writeFileSync(filePath, buffer);

        return {
          success: true,
          filePath,
          filename,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
