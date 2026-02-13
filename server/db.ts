import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { projects, pages, InsertProject, InsertPage, Project, Page } from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";

let _db: BetterSQLite3Database | null = null;
let _sqlite: Database.Database | null = null;

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "book-converter.db");

// Initialize SQLite database
export function getDb(): BetterSQLite3Database {
  if (!_db) {
    _sqlite = new Database(dbPath);
    _db = drizzle(_sqlite);
    console.log(`[Database] Connected to SQLite at ${dbPath}`);
  }
  return _db;
}

// Close database connection (for cleanup)
export function closeDb() {
  if (_sqlite) {
    _sqlite.close();
    _sqlite = null;
    _db = null;
    console.log("[Database] Database connection closed");
  }
}

// ============================================================================
// Project Operations
// ============================================================================

export async function createProject(data: InsertProject): Promise<Project> {
  const db = getDb();
  const result = db.insert(projects).values(data).returning().get();
  return result;
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  const db = getDb();
  return db.select().from(projects).where(eq(projects.id, id)).get();
}

export async function getAllProjects(): Promise<Project[]> {
  const db = getDb();
  return db.select().from(projects).orderBy(desc(projects.createdAt)).all();
}

export async function updateProject(id: number, data: Partial<InsertProject>): Promise<void> {
  const db = getDb();
  db.update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .run();
}

export async function deleteProject(id: number): Promise<void> {
  const db = getDb();
  // Delete all pages first
  db.delete(pages).where(eq(pages.projectId, id)).run();
  // Then delete the project
  db.delete(projects).where(eq(projects.id, id)).run();
}

export async function getProjectStats(projectId: number) {
  const db = getDb();
  
  const stats = db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when ${pages.status} = 'completed' then 1 else 0 end)`,
      processing: sql<number>`sum(case when ${pages.status} = 'processing' then 1 else 0 end)`,
      failed: sql<number>`sum(case when ${pages.status} = 'failed' then 1 else 0 end)`,
    })
    .from(pages)
    .where(eq(pages.projectId, projectId))
    .get();

  return {
    total: Number(stats?.total || 0),
    completed: Number(stats?.completed || 0),
    processing: Number(stats?.processing || 0),
    failed: Number(stats?.failed || 0),
  };
}

// ============================================================================
// Page Operations
// ============================================================================

export async function createPage(data: InsertPage): Promise<Page> {
  const db = getDb();
  const result = db.insert(pages).values(data).returning().get();
  return result;
}

export async function getPageById(id: number): Promise<Page | undefined> {
  const db = getDb();
  return db.select().from(pages).where(eq(pages.id, id)).get();
}

export async function getPagesByProject(projectId: number): Promise<Page[]> {
  const db = getDb();
  return db
    .select()
    .from(pages)
    .where(eq(pages.projectId, projectId))
    .orderBy(pages.sortOrder, pages.id)
    .all();
}

export async function updatePage(id: number, data: Partial<InsertPage>): Promise<void> {
  const db = getDb();
  db.update(pages)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pages.id, id))
    .run();
}

export async function deletePage(id: number): Promise<void> {
  const db = getDb();
  db.delete(pages).where(eq(pages.id, id)).run();
}

export async function getPagesByStatus(projectId: number, status: string): Promise<Page[]> {
  const db = getDb();
  return db
    .select()
    .from(pages)
    .where(and(eq(pages.projectId, projectId), eq(pages.status, status)))
    .all();
}

export async function updatePageOrder(pageId: number, newSortOrder: number): Promise<void> {
  const db = getDb();
  db.update(pages)
    .set({ sortOrder: newSortOrder, updatedAt: new Date() })
    .where(eq(pages.id, pageId))
    .run();
}

export async function bulkUpdatePageStatus(
  pageIds: number[],
  status: string,
  errorMessage?: string
): Promise<void> {
  const db = getDb();
  for (const pageId of pageIds) {
    db.update(pages)
      .set({
        status: status as any,
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId))
      .run();
  }
}
