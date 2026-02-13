# Book Page Converter - Desktop App Conversion

## Project Overview

This repository contains the desktop version of the Book Page Converter application, converted from a web-based application to a standalone Electron desktop app that runs locally on Mac and Windows without internet connectivity.

## Conversion Goals

### Architecture Changes

1. **OCR Engine**: Replace cloud-based LLM with PaddleOCR (Python-based, local processing)
2. **Database**: Replace MySQL/TiDB with SQLite (file-based, no server required)
3. **Authentication**: Remove Manus OAuth and all authentication requirements
4. **Packaging**: Bundle as Electron app with installers for Mac (.dmg) and Windows (.exe)

### Key Features Retained

- Upload and process book page images
- Extract text using OCR
- Smart page number detection
- Post-OCR text cleanup
- Export to PDF, DOCX, Markdown, TXT formats
- Project management and organization
- Drag-and-drop page reordering

### Features Removed

- User authentication and OAuth
- Multi-user support
- Cloud storage integration
- Online deployment capabilities

## Technical Stack

### Frontend
- React 19
- Tailwind CSS 4
- Wouter (routing)
- shadcn/ui components
- tRPC client

### Backend
- Node.js + Express 4
- tRPC 11 server
- SQLite database (better-sqlite3)
- Drizzle ORM
- PaddleOCR Python service

### Desktop Framework
- Electron (main process)
- electron-builder (packaging)
- IPC communication between renderer and main

### OCR Processing
- PaddleOCR (Python 3.8+)
- Local image processing
- No internet required

## Project Structure

```
book-page-converter-desktop/
├── electron/                 # Electron main process
│   ├── main.js              # Main process entry
│   ├── preload.js           # Preload scripts
│   └── ocr-service.py       # PaddleOCR Python service
├── client/                   # React frontend (unchanged)
│   ├── src/
│   └── public/
├── server/                   # Express backend (modified)
│   ├── _core/               # Core services (auth removed)
│   ├── db.ts                # Database layer (SQLite)
│   ├── ocrService.ts        # OCR integration (PaddleOCR)
│   └── routers.ts           # tRPC routers (auth removed)
├── drizzle/                  # Database schema (SQLite)
│   └── schema.ts
├── package.json              # Dependencies + Electron scripts
└── electron-builder.yml      # Packaging configuration
```

## Development Phases

### Phase 1: Project Setup ✓
- [x] Clone web app code to new repository
- [x] Initialize git with new remote
- [x] Create project documentation

### Phase 2: Database Migration
- [ ] Install better-sqlite3 and update dependencies
- [ ] Update Drizzle schema for SQLite
- [ ] Migrate database connection logic
- [ ] Remove MySQL-specific code
- [ ] Test database operations

### Phase 3: OCR Integration
- [ ] Set up Python environment for PaddleOCR
- [ ] Create PaddleOCR service script
- [ ] Update ocrService.ts to call Python service
- [ ] Implement IPC communication for OCR
- [ ] Test OCR accuracy and performance

### Phase 4: Authentication Removal
- [ ] Remove OAuth dependencies
- [ ] Remove auth middleware and routes
- [ ] Update tRPC context (no user)
- [ ] Remove protected procedures
- [ ] Update frontend (remove login/logout)
- [ ] Simplify project ownership model

### Phase 5: Electron Setup
- [ ] Install Electron and electron-builder
- [ ] Create main process (electron/main.js)
- [ ] Create preload script
- [ ] Set up IPC channels
- [ ] Configure window management
- [ ] Bundle Express server in Electron

### Phase 6: Packaging Configuration
- [ ] Configure electron-builder.yml
- [ ] Set up Mac DMG packaging
- [ ] Set up Windows NSIS installer
- [ ] Include Python runtime and PaddleOCR
- [ ] Embed SQLite database
- [ ] Configure app icons and metadata

### Phase 7: Testing
- [ ] Test on macOS
- [ ] Test on Windows
- [ ] Verify OCR accuracy
- [ ] Test all export formats
- [ ] Performance testing
- [ ] Create test installers

### Phase 8: Documentation & Delivery
- [ ] Write installation instructions
- [ ] Document system requirements
- [ ] Create user guide
- [ ] Add troubleshooting section
- [ ] Commit to GitHub
- [ ] Create release

## System Requirements

### Development
- Node.js 22.x
- Python 3.8+
- Git
- macOS (for Mac builds) or Windows (for Windows builds)

### Runtime (End Users)
- **macOS**: 10.15 (Catalina) or later
- **Windows**: Windows 10 or later
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 500MB for app + storage for projects

## Installation (Development)

```bash
# Clone repository
git clone https://github.com/rstamps01/image-to-text-app.git
cd image-to-text-app

# Install Node.js dependencies
pnpm install

# Set up Python environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install paddleocr paddlepaddle

# Run in development mode
pnpm dev:electron
```

## Building Installers

```bash
# Build for current platform
pnpm build:electron

# Build for macOS
pnpm build:mac

# Build for Windows
pnpm build:win

# Build for both platforms (requires appropriate OS)
pnpm build:all
```

## Key Differences from Web Version

| Feature | Web App | Desktop App |
|---------|---------|-------------|
| Authentication | Manus OAuth | None (local only) |
| Database | MySQL/TiDB | SQLite |
| OCR Engine | Cloud LLM | PaddleOCR (local) |
| Deployment | Web server | Standalone installer |
| Internet Required | Yes | No |
| Multi-user | Yes | No (single user) |
| Updates | Automatic | Manual/auto-update |

## Known Limitations

1. **OCR Accuracy**: PaddleOCR may be less accurate than cloud LLM for complex layouts
2. **Single User**: No multi-user support or user profiles
3. **Manual Updates**: Users must download new versions manually (unless auto-update is implemented)
4. **Platform-Specific Builds**: Must build separately for Mac and Windows

## Future Enhancements

- Auto-update functionality
- Multi-language OCR support
- GPU acceleration for OCR
- Cloud backup/sync (optional)
- Batch processing improvements

## License

Same as original web application

## Support

For issues and questions, please open an issue on GitHub:
https://github.com/rstamps01/image-to-text-app/issues
