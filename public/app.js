const input = document.getElementById("videoInput");
const drop = document.getElementById("dropzone");
const title = document.getElementById("fileTitle");
const sub = document.getElementById("fileSub");
const button = document.getElementById("convertBtn");
const statusEl = document.getElementById("status");
let selectedFile = null;

function setStatus(message, kind="") {
  statusEl.textContent = message;
  statusEl.className = "status " + kind;
}
function chooseFile(file) {
  if (!file) return;
  const valid = file.type.startsWith("video/") || /\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(file.name);
  if (!valid) { setStatus("Please choose a supported video file.", "error"); return; }
  if (file.size > 500 * 1024 * 1024) { setStatus("That file is larger than 500 MB.", "error"); return; }
  selectedFile = file;
  title.textContent = file.name;
  sub.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · Ready to convert`;
  button.disabled = false;
  setStatus("Your video is ready. Choose MP3 or WAV.");
}
input.addEventListener("change", () => chooseFile(input.files[0]));
["dragenter","dragover"].forEach(name => drop.addEventListener(name, e => {e.preventDefault();drop.classList.add("drag")}));
["dragleave","drop"].forEach(name => drop.addEventListener(name, e => {e.preventDefault();drop.classList.remove("drag")}));
drop.addEventListener("drop", e => chooseFile(e.dataTransfer.files[0]));
document.querySelectorAll(".format-card input").forEach(radio => radio.addEventListener("change", () => {
  document.querySelectorAll(".format-card").forEach(card => card.classList.toggle("selected", card.querySelector("input").checked));
}));
document.getElementById("openYoutube").addEventListener("click", () => {
  const raw = document.getElementById("youtubeUrl").value.trim();
  try {
    const url = new URL(raw);
    const isYouTube = ["youtube.com","www.youtube.com","m.youtube.com","youtu.be"].includes(url.hostname);
    if (!isYouTube || url.protocol !== "https:") throw new Error();
    window.open(url.href, "_blank", "noopener,noreferrer");
    setStatus("Opened YouTube. Upload an authorized video file here to extract its audio.");
  } catch {
    setStatus("Paste a valid https://youtube.com or https://youtu.be link.", "error");
  }
});
button.addEventListener("click", async () => {
  if (!selectedFile) return;
  const format = document.querySelector('input[name="format"]:checked').value;
  const data = new FormData();
  data.append("video", selectedFile);
  data.append("format", format);
  button.disabled = true;
  button.querySelector("span").textContent = "Extracting audio…";
  setStatus("Working on your audio. Larger videos may take a little longer.");
  try {
    const response = await fetch("/api/extract", { method: "POST", body: data });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Conversion failed.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g,"_") || "tuneflow-audio"}.${format}`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    setStatus("Done! Your audio download should be ready.", "success");
  } catch (err) {
    setStatus(err.message || "Something went wrong.", "error");
  } finally {
    button.disabled = !selectedFile;
    button.querySelector("span").textContent = "Extract audio";
  }
});
