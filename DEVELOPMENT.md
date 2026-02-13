# Development Guide

This guide covers setting up the development environment, building from source, and contributing to the Book Page Converter desktop application.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v22.0.0 or later
- **pnpm** v10.0.0 or later
- **Python** 3.11 or later
- **Git**

### Platform-Specific Requirements

**macOS**:
- Xcode Command Line Tools: `xcode-select --install`

**Windows**:
- Visual Studio Build Tools (for native modules)
- Python added to PATH

**Linux**:
- build-essential: `sudo apt install build-essential`
- libfuse2: `sudo apt install libfuse2`

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/rstamps01/image-to-text-app.git
cd image-to-text-app
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Rebuild native modules for Electron
pnpm electron-rebuild
```

### 3. Set Up Python Environment

```bash
# Create virtual environment
python3 -m venv python-runtime

# Activate it
source python-runtime/bin/activate  # macOS/Linux
# or
python-runtime\Scripts\activate.bat  # Windows

# Install Python dependencies
pip install -r requirements.txt

# Download PaddleOCR models (first run)
python -c "from paddleocr import PaddleOCR; PaddleOCR(use_angle_cls=True, lang='en')"

# Deactivate when done
deactivate
```

### 4. Initialize Database

The SQLite database will be created automatically on first run. The schema is defined in `drizzle/schema.ts`.

To generate migrations:
```bash
pnpm drizzle-kit generate
```

To apply migrations:
```bash
pnpm drizzle-kit push
```

### 5. Run Development Server

```bash
# Start the app in development mode
pnpm electron:dev
```

This will:
1. Start the Express server with hot reload
2. Start Vite dev server for frontend
3. Launch Electron with DevTools open

## Project Structure

```
image-to-text-app/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # tRPC client
│   │   └── index.css         # Global styles
│   └── index.html
├── server/                    # Backend Express + tRPC
│   ├── _core/                # Core server functionality
│   │   ├── index.ts          # Server entry point
│   │   ├── trpc.ts           # tRPC setup
│   │   └── vite.ts           # Vite integration
│   ├── routers.ts            # tRPC API routes
│   ├── db.ts                 # Database helpers
│   ├── ocrService.ts         # OCR processing
│   ├── exportService.ts      # Document export
│   └── storage.ts            # File storage
├── electron/                  # Electron main process
│   ├── main.js               # Main process entry
│   ├── preload.js            # Preload script
│   └── ocr-service.py        # Python OCR service
├── drizzle/                   # Database schema
│   └── schema.ts
├── shared/                    # Shared types
├── build/                     # Build resources
│   ├── icon.icns             # macOS icon
│   ├── icon.ico              # Windows icon
│   └── entitlements.mac.plist
├── python-runtime/            # Bundled Python runtime
├── electron-builder.yml       # Packaging config
└── package.json
```

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Type Checking

```bash
# Check TypeScript types
pnpm check
```

### Linting

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix
```

### Building

```bash
# Build frontend and backend
pnpm build

# Build Electron app for current platform
pnpm electron:build

# Build for specific platforms
pnpm electron:build:mac    # macOS
pnpm electron:build:win    # Windows
```

## Architecture

### Frontend (React + Tailwind)

The frontend is a single-page application built with React 19 and Tailwind CSS 4. It communicates with the backend via tRPC for type-safe API calls.

**Key Components**:
- `Home.tsx` - Project list and management
- `NewProject.tsx` - Project creation and file upload
- `ProjectDetail.tsx` - Project view, page management, export

**State Management**:
- TanStack Query (via tRPC) for server state
- React hooks for local state
- No global state management needed

### Backend (Express + tRPC)

The backend is an Express server with tRPC for type-safe APIs. It handles OCR processing, database operations, and document export.

**Key Modules**:
- `routers.ts` - tRPC API endpoints
- `ocrService.ts` - OCR processing with Python integration
- `exportService.ts` - Document generation (PDF, DOCX, MD, TXT)
- `db.ts` - Database operations with Drizzle ORM

### Database (SQLite)

SQLite provides a file-based database that's perfect for desktop applications. The schema is managed with Drizzle ORM.

**Tables**:
- `projects` - Project metadata
- `pages` - Page data with extracted text

### OCR (PaddleOCR)

OCR processing is handled by a Python script (`electron/ocr-service.py`) that uses PaddleOCR. The Node.js backend spawns the Python process and communicates via JSON.

**Flow**:
1. User uploads image
2. Backend saves image to local storage
3. Backend spawns Python OCR process
4. Python extracts text and returns JSON
5. Backend saves results to database

### Electron Integration

Electron wraps the Express server and React frontend into a desktop application.

**Main Process** (`electron/main.js`):
- Creates application window
- Starts Express server in child process
- Handles IPC communication
- Manages application lifecycle

**Preload Script** (`electron/preload.js`):
- Exposes secure IPC APIs to renderer
- Bridges main and renderer processes

## Building for Distribution

### Prerequisites

**macOS**:
- Apple Developer ID (for code signing)
- Xcode installed

**Windows**:
- Code signing certificate (optional)

### Build Process

1. **Prepare Python Runtime**:
   ```bash
   # Create portable Python environment
   python3 -m venv python-runtime
   source python-runtime/bin/activate
   pip install -r requirements.txt
   
   # Download OCR models
   python -c "from paddleocr import PaddleOCR; PaddleOCR(use_angle_cls=True, lang='en')"
   ```

2. **Build Application**:
   ```bash
   # Build for current platform
   pnpm electron:build
   
   # Or build for specific platform
   pnpm electron:build:mac
   pnpm electron:build:win
   ```

3. **Find Installers**:
   - macOS: `dist-electron/Book Page Converter-2.0.0.dmg`
   - Windows: `dist-electron/Book-Page-Converter-Setup-2.0.0.exe`
   - Linux: `dist-electron/Book-Page-Converter-2.0.0.AppImage`

### Code Signing

**macOS**:
```bash
# Set environment variables
export APPLE_ID="your@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="your-team-id"

# Build with signing
pnpm electron:build:mac
```

**Windows**:
```bash
# Set environment variables
export WIN_CSC_LINK="path/to/certificate.pfx"
export WIN_CSC_KEY_PASSWORD="certificate-password"

# Build with signing
pnpm electron:build:win
```

## Contributing

We welcome contributions! Here's how to get started:

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/image-to-text-app.git
cd image-to-text-app
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Run tests before committing

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Debugging

### Backend Debugging

Add breakpoints in VS Code:

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "program": "${workspaceFolder}/server/_core/index.ts",
      "preLaunchTask": "npm: dev",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

### Frontend Debugging

Use Chrome DevTools in Electron:
- Press `Cmd+Option+I` (macOS) or `Ctrl+Shift+I` (Windows/Linux)
- Or enable in `electron/main.js`: `mainWindow.webContents.openDevTools()`

### Python OCR Debugging

Add logging to `electron/ocr-service.py`:

```python
import sys
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)

logger = logging.getLogger(__name__)
logger.debug("OCR processing started")
```

## Common Issues

### Native Module Build Errors

```bash
# Rebuild native modules for Electron
pnpm electron-rebuild

# Or manually
cd node_modules/better-sqlite3
npm run build-release
```

### Python Module Not Found

```bash
# Ensure virtual environment is activated
source python-runtime/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Database Locked Errors

SQLite doesn't handle concurrent writes well. Ensure:
- Only one app instance is running
- Close database connections properly
- Use transactions for multiple operations

### Electron App Won't Start

```bash
# Clear Electron cache
rm -rf ~/Library/Application\ Support/Electron  # macOS
rm -rf %APPDATA%/Electron  # Windows

# Rebuild
pnpm electron-rebuild
```

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [PaddleOCR Documentation](https://github.com/PaddlePaddle/PaddleOCR)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

MIT License - see [LICENSE](LICENSE) file for details.
