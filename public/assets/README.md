# Assets Folder

This folder contains static assets for the ZapFan application.

## Logo File Setup

### Step 1: Add MF.png
Place your `MF.png` file in this folder: `public/assets/MF.png`

### Step 2: Run Setup Script
After adding the file, run the setup script to copy it to the app directory:

```bash
node scripts/setup-favicon.js
```

Or manually copy:
```bash
cp public/assets/MF.png app/icon.png
```

### Step 3: Restart & Refresh
1. Restart your Next.js dev server
2. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)

## How It Works

Next.js 13+ automatically detects `app/icon.png` and uses it as the favicon. No metadata configuration needed!

The logo will appear as:
- Browser tab favicon
- Apple touch icon (iOS home screen)
