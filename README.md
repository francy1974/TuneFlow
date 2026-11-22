# TuneFlow

TuneFlow is a responsive video-to-audio converter starter with MP3 and WAV output, plus a Capacitor Android wrapper.

## What works in this starter
- Responsive web interface for desktop and mobile
- Upload a local video file
- Convert its audio track to MP3 or WAV using FFmpeg
- Download the resulting audio
- YouTube URL field validates and opens the video on YouTube; it does **not** download or extract from YouTube

## Requirements
- Node.js 18+
- FFmpeg installed and available on your PATH (`ffmpeg -version`)
- Android Studio + Android SDK for Android builds

## Run the website locally
```bash
npm install
npm start
```
Open http://localhost:3000

## Build the Android wrapper
First, deploy the Node server somewhere reachable over HTTPS and set the API URL in `public/app.js` if you want the packaged Android app to call that hosted server. The starter currently uses a relative `/api/extract` URL, which works when served from the same origin.

Then:
```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```
Build/sign the APK or Android App Bundle in Android Studio. For production, configure a secure HTTPS API endpoint and update the fetch URL in `public/app.js` to that endpoint.

## Production hardening before public launch
- Add authentication, request quotas, rate limiting, and upload cleanup jobs.
- Set file-size and duration limits appropriate to your hosting budget.
- Use HTTPS and private temporary storage.
- Add progress reporting and cancellation.
- Keep FFmpeg and Node dependencies patched.
- Do not use this app to circumvent platform download restrictions or process content without permission.

## YouTube
YouTube's official APIs do not provide a general-purpose audio-download endpoint. TuneFlow therefore opens YouTube links but only converts user-supplied files that the user owns or is authorized to process. For a YouTube video, use an official download/export feature when available and then upload that authorized file.
