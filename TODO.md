# Desktop App Conversion - Task List

## Phase 1: Project Setup
- [x] Clone web app code to new repository
- [x] Initialize git with new GitHub remote
- [x] Create DESKTOP_CONVERSION.md documentation
- [x] Create TODO.md task tracker

## Phase 2: Database Migration to SQLite
- [x] Install better-sqlite3 package
- [x] Update package.json dependencies (remove MySQL packages)
- [x] Update drizzle.config.ts for SQLite
- [x] Modify drizzle/schema.ts for SQLite dialect
- [x] Update server/db.ts connection logic for SQLite
- [x] Remove DATABASE_URL environment variable references
- [x] Test database migrations with SQLite
- [x] Verify all CRUD operations work with SQLite

## Phase 3: PaddleOCR Integration
- [x] Create Python virtual environment setup
- [x] Write electron/ocr-service.py with PaddleOCR
- [x] Install PaddleOCR and dependencies
- [x] Update server/ocrService.ts to call Python service via child_process
- [x] Implement proper error handling for OCR failures
- [ ] Test OCR accuracy with sample images (deferred to Phase 7)
- [ ] Compare performance with cloud LLM version (deferred to Phase 7)
- [ ] Optimize OCR parameters for best accuracy (deferred to Phase 7)

## Phase 4: Remove Authentication
- [x] Remove server/_core/oauth.ts
- [x] Remove server/_core/context.ts (removed user context)
- [x] Remove protectedProcedure from server/routers.ts
- [x] Update all tRPC procedures to publicProcedure
- [x] Remove user table from drizzle/schema.ts
- [x] Remove auth routes from server
- [x] Update client auth hook (simplified to return mock user)
- [x] Update server/_core/index.ts (removed OAuth routes)
- [x] Remove OAUTH_* environment variable dependencies
- [x] Update all database queries (removed userId filters)
- [ ] Test app without authentication (deferred to Phase 7)

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
