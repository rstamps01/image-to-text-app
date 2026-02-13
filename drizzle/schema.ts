import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Projects table - represents a document conversion project
 * Each project contains multiple book page images to be converted
 * Note: User authentication removed for desktop app - single user mode
 */
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["uploading", "processing", "completed", "failed"] }).default("uploading").notNull(),
  totalPages: integer("totalPages").default(0).notNull(),
  processedPages: integer("processedPages").default(0).notNull(),
  /** Enable post-OCR text cleanup to remove common artifacts */
  enableCleanup: text("enableCleanup", { enum: ["yes", "no"] }).default("no").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Pages table - represents individual book page images and their OCR results
 * Each page belongs to a project and contains the extracted text and metadata
 */
export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("projectId").notNull(),
  /** Original filename of the uploaded image */
  filename: text("filename").notNull(),
  /** Local file path for the uploaded image (desktop app uses local storage) */
  imageKey: text("imageKey").notNull(),
  /** File URL to access the image */
  imageUrl: text("imageUrl").notNull(),
  /** Detected page number (can be Arabic numeral, Roman numeral, or null if not detected) */
  detectedPageNumber: text("detectedPageNumber"),
  /** Numeric sort order based on detected page number */
  sortOrder: integer("sortOrder"),
  /** OCR processing status */
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).default("pending").notNull(),
  /** Extracted text content from OCR */
  extractedText: text("extractedText"),
  /** OCR confidence score (0-100) indicating the reliability of the extracted text */
  confidenceScore: integer("confidenceScore"),
  /** Placement confidence (0-100) indicating how certain the page placement is */
  placementConfidence: integer("placementConfidence").default(100),
  /** Whether this page needs user validation for placement */
  needsValidation: text("needsValidation", { enum: ["yes", "no"] }).default("no").notNull(),
  /** Structured formatting information (paragraphs, headings, lists, etc.) stored as JSON text */
  formattingData: text("formattingData"),
  /** Error message if OCR failed */
  errorMessage: text("errorMessage"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type Page = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;
