# Python Runtime Directory

This directory should contain a portable Python runtime with PaddleOCR and all dependencies pre-installed.

## For macOS:
- Download Python 3.11 standalone build from python.org
- Install PaddleOCR and dependencies using pip
- Copy the entire Python installation here

## For Windows:
- Download Python 3.11 embeddable package
- Install PaddleOCR and dependencies using pip
- Copy the entire Python installation here

## Directory Structure:
```
python-runtime/
├── bin/           (Python executable)
├── lib/           (Python libraries)
├── site-packages/ (Installed packages including PaddleOCR)
└── README.md      (This file)
```

## Installation Script:
```bash
# Create virtual environment
python3 -m venv python-runtime

# Activate it
source python-runtime/bin/activate  # macOS/Linux
# or
python-runtime\Scripts\activate  # Windows

# Install dependencies
pip install -r ../requirements.txt

# Download PaddleOCR models
python -c "from paddleocr import PaddleOCR; PaddleOCR(use_angle_cls=True, lang='en')"
```

## Note:
The Python runtime will be bundled with the Electron app, making it completely standalone.
Users won't need to install Python separately.
