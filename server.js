const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({
  dest: path.join(os.tmpdir(), "tuneflow-uploads"),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^video\//.test(file.mimetype) ||
      /\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(file.originalname);
    cb(ok ? null : new Error("Please upload a supported video file."), ok);
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/api/extract", upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose a video first." });

  const format = String(req.body.format || "mp3").toLowerCase();
  if (!["mp3", "wav"].includes(format)) {
    fs.rm(req.file.path, { force: true }, () => {});
    return res.status(400).json({ error: "Only MP3 and WAV are supported." });
  }

  const input = req.file.path;
  const output = `${input}.${format}`;
  const args = format === "mp3"
    ? ["-y", "-i", input, "-vn", "-codec:a", "libmp3lame", "-q:a", "2", output]
    : ["-y", "-i", input, "-vn", "-c:a", "pcm_s16le", output];

  const ffmpeg = spawn(process.env.FFMPEG_PATH || "ffmpeg", args);
  let errorText = "";
  ffmpeg.stderr.on("data", chunk => { errorText += chunk.toString(); });

  ffmpeg.on("error", () => {
    cleanup();
    return res.status(500).json({ error: "FFmpeg was not found. Install FFmpeg and try again." });
  });

  ffmpeg.on("close", code => {
    if (code !== 0) {
      cleanup();
      return res.status(500).json({ error: "Audio extraction failed. Check that the video contains an audio track." });
    }
    const base = path.parse(req.file.originalname).name.replace(/[^\w.-]+/g, "_") || "tuneflow-audio";
    res.download(output, `${base}.${format}`, () => cleanup());
  });

  function cleanup() {
    fs.rm(input, { force: true }, () => {});
    fs.rm(output, { force: true }, () => {});
  }
});

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || "Upload failed." });
});

app.listen(PORT, () => console.log(`TuneFlow running at http://localhost:${PORT}`));
