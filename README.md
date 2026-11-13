# Naseem · نسيم

A Windows video and audio downloader with an Arabic/English interface, built with Electron on top of [yt-dlp](https://github.com/yt-dlp/yt-dlp) and [FFmpeg](https://ffmpeg.org).

برنامج لتنزيل الفيديو والصوت من يوتيوب وتيك توك وإكس وإنستغرام وأكثر من ألف موقع.

## Features

- Quality picker with approximate file sizes; audio-only as MP3, M4A, OPUS, FLAC or WAV
- Download queue with parallel downloads, progress, speed, ETA, pause / resume / cancel / retry
- Playlists with per-item selection
- Batch mode: many links at once
- Trim: download only a section of a video
- Embedded subtitles, thumbnails and metadata
- Clipboard watcher, drag-and-drop links, Ctrl+V anywhere
- Searchable download history with stats
- SponsorBlock, browser cookies, proxy and speed limit
- Completion notifications, dark/light themes, Arabic and English
- One-click engine install and update (yt-dlp + FFmpeg are downloaded from GitHub on first run)

## Run from source

```bash
npm install
npm start
```

## Build installers

```bash
npm run dist
```

Builds `dist/Naseem-Setup-<version>.exe` and `dist/Naseem-Portable-<version>.exe`. NSIS fails on very long paths, so build from a short folder path.

## License notes

yt-dlp (Unlicense) and FFmpeg (LGPL/GPL) are downloaded at runtime and keep their own licenses. The interface font is IBM Plex Sans Arabic (SIL OFL 1.1). Only download content you have the right to download.
