# Desktop App Conversion - Task List

## Phase 1: Project Setup
- [x] Clone web app code to new repository
- [x] Initialize git with new GitHub remote
- [x] Create DESKTOP_CONVERSION.md documentation
- [x] Create TODO.md task tracker

## Phase 2: Database Migration to SQLite
- [ ] Install better-sqlite3 package
- [ ] Update package.json dependencies (remove MySQL packages)
- [ ] Update drizzle.config.ts for SQLite
- [ ] Modify drizzle/schema.ts for SQLite dialect
- [ ] Update server/db.ts connection logic for SQLite
- [ ] Remove DATABASE_URL environment variable references
- [ ] Test database migrations with SQLite
- [ ] Verify all CRUD operations work with SQLite

## Phase 3: PaddleOCR Integration
- [ ] Create Python virtual environment setup
- [ ] Write electron/ocr-service.py with PaddleOCR
- [ ] Install PaddleOCR and dependencies
- [ ] Update server/ocrService.ts to call Python service via child_process
- [ ] Implement proper error handling for OCR failures
- [ ] Test OCR accuracy with sample images
- [ ] Compare performance with cloud LLM version
- [ ] Optimize OCR parameters for best accuracy

## Phase 4: Remove Authentication
- [ ] Remove server/_core/oauth.ts
- [ ] Remove server/_core/auth.ts
- [ ] Update server/_core/context.ts (remove user context)
- [ ] Remove protectedProcedure from server/routers.ts
- [ ] Update all tRPC procedures to publicProcedure
- [ ] Remove user table from drizzle/schema.ts
- [ ] Remove auth.me and auth.logout routes
- [ ] Update client/src/contexts/AuthContext.tsx (remove or simplify)
- [ ] Remove login/logout UI components
- [ ] Update client/src/pages/Home.tsx (remove auth checks)
- [ ] Remove OAUTH_* environment variables
- [ ] Update all database queries (remove userId filters)
- [ ] Test app without authentication

## Phase 5: Electron Main Process Setup
- [ ] Install electron and electron-builder packages
- [ ] Create electron/main.js (main process entry point)
- [ ] Create electron/preload.js (secure IPC bridge)
- [ ] Set up BrowserWindow configuration
- [ ] Implement Express server startup in main process
- [ ] Configure IPC channels for OCR communication
- [ ] Set up menu bar and application menu
- [ ] Implement window state management
- [ ] Add app lifecycle handlers (ready, quit, etc.)
- [ ] Configure dev tools for development mode

## Phase 6: Electron Packaging Configuration
- [ ] Create electron-builder.yml configuration
- [ ] Configure macOS DMG packaging settings
- [ ] Configure Windows NSIS installer settings
- [ ] Design and add application icons (Mac .icns, Windows .ico)
- [ ] Set up file associations for project files
- [ ] Configure Python runtime bundling
- [ ] Configure SQLite database bundling
- [ ] Set up code signing (optional)
- [ ] Configure auto-updater (optional)
- [ ] Add build scripts to package.json

## Phase 7: Testing & Quality Assurance
- [ ] Test on macOS (development mode)
- [ ] Test on Windows (development mode)
- [ ] Test OCR with various image types
- [ ] Test all export formats (PDF, DOCX, MD, TXT)
- [ ] Test project creation and management
- [ ] Test page reordering and deletion
- [ ] Test cleanup functionality
- [ ] Build macOS installer and test
- [ ] Build Windows installer and test
- [ ] Performance testing (startup time, OCR speed)
- [ ] Memory usage testing
- [ ] Fix any platform-specific bugs

## Phase 8: Documentation & Delivery
- [ ] Write README.md for end users
- [ ] Document system requirements
- [ ] Create installation guide for Mac
- [ ] Create installation guide for Windows
- [ ] Write user manual with screenshots
- [ ] Add troubleshooting section
- [ ] Document development setup
- [ ] Add contribution guidelines
- [ ] Commit all changes to GitHub
- [ ] Create GitHub release with installers
- [ ] Tag release version (v2.0.0-desktop)

## Optional Enhancements
- [ ] Implement auto-update functionality
- [ ] Add GPU acceleration for OCR
- [ ] Support additional languages in OCR
- [ ] Add batch import functionality
- [ ] Implement dark mode toggle
- [ ] Add keyboard shortcuts
- [ ] Create application preferences/settings
- [ ] Add export templates customization
