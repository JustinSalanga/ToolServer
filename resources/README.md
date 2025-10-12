# Application Icon and Resources

This directory contains the application icon and resource files for the TailorResume Authentication Server.

## Icon Files

- **icon.svg** - Vector source file with gears design
- **icon.ico** - Windows icon file (generated from SVG)
- **app.rc** - Windows resource script with metadata

## Generating Icon from SVG

To convert the SVG to ICO format, you can use one of these methods:

### Method 1: Online Converter
1. Go to https://convertio.co/svg-ico/ or https://cloudconvert.com/svg-to-ico
2. Upload `icon.svg`
3. Convert to ICO format with multiple sizes (16x16, 32x32, 48x48, 256x256)
4. Download and save as `icon.ico` in this directory

### Method 2: Using ImageMagick (if installed)
```bash
convert icon.svg -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

### Method 3: Using Node.js (requires dependencies)
```bash
npm install -g svg2img
svg2img icon.svg icon.png -w 256 -h 256
# Then use an online tool or ImageMagick to convert PNG to ICO
```

## Icon Design

The icon features:
- Two interlocking gears representing system automation and management
- Purple/indigo brand color (#4f46e5)
- Clean, professional design suitable for enterprise applications
- Text identifying the application as "TailorResume Auth Server"

## Resource File (app.rc)

The `app.rc` file contains:
- Icon reference
- Version information
- File description: "TailorResume Authentication Server - User, IP, and Settings Management"
- Copyright: "Copyright (C) 2024 TailorResume. All rights reserved."
- Company name: TailorResume
- Product name and version

This resource file is used during the PKG build process to embed metadata into the Windows executable.

## Building with Icon

The icon is automatically included when building with PKG. The build scripts in package.json reference this icon for Windows builds.

To build with the icon:
```bash
npm run build:win
```

The resulting executable will have:
- The gears icon visible in Windows Explorer
- Proper version information
- Company and copyright metadata
- File description for Windows properties dialog
