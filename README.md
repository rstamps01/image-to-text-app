# Book Page Converter - Desktop Application

A standalone desktop application for converting scanned book pages to editable text using OCR. Works completely offline with no internet connection required.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **🔒 Complete Offline Operation**: No internet required - all processing happens locally
- **🎯 High-Accuracy OCR**: Powered by PaddleOCR for excellent text extraction
- **📄 Multi-Format Export**: PDF, DOCX, Markdown, and plain text
- **🔢 Smart Page Detection**: Automatic page number recognition and sorting
- **✨ Text Cleanup**: Removes OCR artifacts and formatting issues
- **📁 Project Management**: Organize multiple books with page reordering
- **⚡ Batch Processing**: Upload and process multiple pages simultaneously
- **🔐 Privacy First**: No accounts, no cloud, no data collection
- **💾 Local Storage**: SQLite database - your data stays on your computer

## 📋 System Requirements

### macOS
- macOS 10.13 (High Sierra) or later
- 4 GB RAM minimum (8 GB recommended)
- 2 GB free disk space

### Windows
- Windows 10 or later (64-bit)
- 4 GB RAM minimum (8 GB recommended)
- 2 GB free disk space

### Linux
- Ubuntu 20.04 or later / equivalent
- 4 GB RAM minimum (8 GB recommended)
- 2 GB free disk space

## 📥 Installation

### macOS

1. Download `Book-Page-Converter-2.0.0.dmg` from [Releases](https://github.com/rstamps01/image-to-text-app/releases)
2. Open the DMG file
3. Drag "Book Page Converter" to Applications
4. Launch from Applications (right-click → Open first time)

### Windows

1. Download `Book-Page-Converter-Setup-2.0.0.exe` from [Releases](https://github.com/rstamps01/image-to-text-app/releases)
2. Run the installer
3. Follow the wizard
4. Launch from Start Menu or Desktop

### Linux

1. Download `Book-Page-Converter-2.0.0.AppImage` from [Releases](https://github.com/rstamps01/image-to-text-app/releases)
2. Make executable: `chmod +x Book-Page-Converter-2.0.0.AppImage`
3. Run: `./Book-Page-Converter-2.0.0.AppImage`

## 🚀 Quick Start

1. **Create Project** → `Cmd/Ctrl+N`
2. **Add Pages** → Select images (JPG, PNG, TIFF)
3. **Review** → Edit text, reorder pages
4. **Export** → Choose format and save

## 📖 User Guide

See [USER_GUIDE.md](USER_GUIDE.md) for detailed instructions on:
- Creating and managing projects
- Understanding OCR processing
- Using text cleanup features
- Exporting in different formats
- Keyboard shortcuts
- Troubleshooting

## 🛠️ Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for:
- Setting up development environment
- Building from source
- Running tests
- Contributing guidelines
- Technical architecture

## 🔧 Technical Stack

- **Frontend**: React 19 + Tailwind CSS 4
- **Backend**: Express 4 + tRPC 11
- **Database**: SQLite (better-sqlite3)
- **OCR**: PaddleOCR (Python)
- **Desktop**: Electron 34
- **Packaging**: electron-builder

## 📂 Data Storage

**macOS**: `~/Library/Application Support/Book Page Converter/`  
**Windows**: `%APPDATA%/Book Page Converter/`  
**Linux**: `~/.config/Book Page Converter/`

Contains:
- `database.db` - All projects and pages
- `uploads/` - Original images
- `logs/` - Application logs

## 🔐 Privacy & Security

- ✅ Works completely offline
- ✅ No data collection or tracking
- ✅ No accounts or cloud storage
- ✅ All processing on your computer
- ✅ Your documents never leave your machine

## 🐛 Troubleshooting

### OCR Issues
- Use clear, well-lit images
- Reduce resolution to ~2000px width
- Enable cleanup for better results
- Restart app if processing stalls

### App Won't Start
- **macOS**: Right-click → Open (first time)
- **Windows**: Run as Administrator
- **Linux**: Install libfuse2 if needed

### Database Errors
- Backup database file first
- Delete `database.db` to reset (loses data!)
- Check logs in application data folder

## 📝 License

MIT License - see [LICENSE](LICENSE)

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/rstamps01/image-to-text-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rstamps01/image-to-text-app/discussions)

## 📜 Changelog

### v2.0.0 - Desktop Release
- ✨ Complete rewrite as standalone desktop app
- 🔄 Replaced cloud LLM with local PaddleOCR
- 💾 Migrated MySQL → SQLite
- 🔓 Removed authentication (single-user)
- 📦 Electron packaging for Mac/Windows/Linux
- ✨ Enhanced text cleanup
- 🔄 Retry functionality for failed pages

### v1.0.0 - Web App
- Initial web application release
- Cloud-based OCR
- Multi-user authentication
- Project management
- Export formats

## 🙏 Acknowledgments

- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) - OCR engine
- [Electron](https://www.electronjs.org/) - Desktop framework
- [Drizzle ORM](https://orm.drizzle.team/) - Database
- [tRPC](https://trpc.io/) - Type-safe APIs

---

**Made with ❤️ for book lovers and digital archivists**
