# AllFileTools — Universal File Converter starter

A responsive website/PWA starter that can be installed on Android from a supported browser. It includes a file-upload interface and a Node.js conversion API.

## Included
- Responsive mobile-friendly interface and installable PWA basics
- Image conversion (ImageMagick required)
- Audio/video conversion (FFmpeg required)
- Office documents/spreadsheets/presentations (LibreOffice required)
- Upload limit, rate limiting, security headers, temporary-file cleanup
- Advertisement placeholder (not connected to an ad network)

## Requirements
- Node.js 18+
- ImageMagick (`magick`) for images
- FFmpeg (`ffmpeg`) for audio/video
- LibreOffice (`libreoffice`) for office files

These command-line programs must be installed on the server and available in its PATH. Format support varies; not every input/output pair is valid.

## Run locally
1. Install Node.js and the three conversion tools above.
2. In this folder, run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000`.

## Android
This is a Progressive Web App starter, not a signed Play Store APK. Deploy it over HTTPS, open the website in Chrome on Android, then use the browser menu's **Install app** or **Add to Home screen**. For a Play Store release, package the web app with a suitable Android wrapper and follow Google Play requirements.

## Before public launch
- Configure HTTPS, storage limits, backups, monitoring, and a production hosting environment.
- Add file-signature validation, malware scanning, stricter conversion allowlists, isolated worker containers, per-user quotas, and robust cleanup/timeout handling.
- Review privacy policy and terms. Do not claim complete security until tested.
- Connect an ad network only after approval and required consent/privacy setup.
- Register and verify a domain; the suggested brand name and domain availability are not guaranteed.
- This starter exposes a basic conversion API; it is not yet a complete 50+ tool service. Add and test each conversion type before advertising it as supported.
