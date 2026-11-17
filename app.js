"use strict";
// منبع موسیقی: Internet Archive (آثار آزاد و قانونی برای پخش و دانلود)
// این فایل هم داخل افزونه کروم و هم به‌صورت وب‌اپ روی گوشی کار می‌کند.
const $ = (id) => document.getElementById(id);
const AUDIO_EXT = /\.(mp3|ogg|oga|opus|flac|wav|m4a|aac)(\?.*)?$/i;
const GOOD_FORMATS = ["VBR MP3", "MP3", "128Kbps MP3", "64Kbps MP3", "Ogg Vorbis", "Flac", "WAVE", "Opus", "MPEG-4 Audio"];
const HAS_EXT_DL = typeof chrome !== "undefined" && chrome.downloads && chrome.downloads.download;

let tracks = [];
let current = -1;
const audio = $("audio");

// ---------- پروکسی (برای وقتی archive.org فیلتر است) ----------
const ORIGIN = "https://archive.org";
let proxyBase = "";
try { proxyBase = localStorage.getItem("rz-proxy") || ""; } catch {}
function normalizeProxy(v) {
  v = (v || "").trim().replace(/\/+$/, "");
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  return v;
}
proxyBase = normalizeProxy(proxyBase);
// آدرس کامل برای یک مسیر archive.org (با پروکسی یا مستقیم)
function A(path) { return (proxyBase || ORIGIN) + path; }
// یک لینک کامل archive.org را به آدرس پروکسی تبدیل می‌کند
function viaProxy(href) {
  if (!proxyBase) return href;
  try {
    const u = new URL(href);
    if (/(^|\.)archive\.org$/.test(u.hostname)) return proxyBase + u.pathname + u.search;
  } catch {}
  return href;
}

function setStatus(msg) { $("status").textContent = msg || ""; }
function sanitize(name) { return name.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 120); }

// ---------- تم رنگی ----------
const THEMES = [
  ["purple", "#b47aff"], ["green", "#00ff9d"], ["blue", "#42a5ff"],
  ["orange", "#ff8a32"], ["pink", "#ff72b6"], ["light", "#aabaff"]
];
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem("rz-glass-theme", theme); } catch {}
  document.querySelectorAll(".dot").forEach((d) => d.classList.toggle("on", d.dataset.t === theme));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "light" ? "#eef1fb" : "#0b0c12";
}
for (const [name, color] of THEMES) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "dot"; b.dataset.t = name; b.title = name;
  b.style.background = color;
  b.addEventListener("click", () => setTheme(name));
  $("themes").appendChild(b);
}
let saved = null;
try { saved = localStorage.getItem("rz-glass-theme"); } catch {}
setTheme(saved || "purple");

// ---------- جستجو ----------
async function search(query) {
  query = query.trim();
  if (!query) return;
  setStatus("در حال جستجو…");
  $("results").innerHTML = "";
  $("tracksBox").hidden = true;
  const esc = query.replace(/["\\]/g, " ");
  const q = `(title:("${esc}") OR creator:("${esc}")) AND mediatype:audio`;
  const url = A("/advancedsearch.php?q=") + encodeURIComponent(q) +
    "&fl[]=identifier&fl[]=title&fl[]=creator&sort[]=downloads desc&rows=30&output=json";
  try {
    const r = await fetch(url);
    const data = await r.json();
    const docs = data.response.docs || [];
    if (!docs.length) { setStatus("نتیجه‌ای پیدا نشد."); return; }
    setStatus("");
    renderResults(docs);
  } catch (e) {
    setStatus("اتصال به archive.org برقرار نشد. اگر فیلتر است، آدرس پروکسی را در «تنظیمات» بالای صفحه وارد کنید.");
    const det = document.getElementById("settings");
    if (det && !proxyBase) det.open = true;
  }
}

function renderResults(docs) {
  const box = $("results");
  box.innerHTML = "";
  for (const d of docs) {
    const el = document.createElement("div");
    el.className = "item glass glass-hover fade-in";
    const creator = Array.isArray(d.creator) ? d.creator.join("، ") : (d.creator || "");
    const title = Array.isArray(d.title) ? d.title[0] : (d.title || d.identifier);
    el.innerHTML = `<img alt="" loading="lazy" src="${A("/services/img/")}${encodeURIComponent(d.identifier)}"><div><div class="t"></div><div class="a"></div></div>`;
    el.querySelector(".t").textContent = title;
    el.querySelector(".a").textContent = creator;
    el.addEventListener("click", () => loadItem(d.identifier, title));
    box.appendChild(el);
  }
}

// ---------- بارگذاری یک آیتم ----------
async function loadItem(id, titleHint, autoplay = false) {
  setStatus("در حال دریافت لیست آهنگ‌ها…");
  try {
    const r = await fetch(A("/metadata/") + encodeURIComponent(id));
    const meta = await r.json();
    const files = (meta.files || []).filter((f) => GOOD_FORMATS.includes(f.format));
    const byBase = new Map();
    for (const f of files) {
      const base = f.name.replace(/\.[^.]+$/, "");
      const rank = GOOD_FORMATS.indexOf(f.format);
      const prev = byBase.get(base);
      if (!prev || rank < prev.rank) byBase.set(base, { f, rank });
    }
    const list = [...byBase.values()].map(({ f }) => ({
      title: f.title || f.name.replace(/\.[^.]+$/, ""),
      format: f.format,
      url: `${A("/download/")}${encodeURIComponent(id)}/${f.name.split("/").map(encodeURIComponent).join("/")}`,
      filename: f.name.split("/").pop()
    }));
    if (!list.length) { setStatus("فایل صوتی قابل پخش در این مورد پیدا نشد."); return; }
    const t = (meta.metadata && meta.metadata.title) || titleHint || id;
    setStatus("");
    showTracks(Array.isArray(t) ? t[0] : t, list, autoplay);
  } catch (e) {
    setStatus("خطا: " + e.message);
  }
}

function showTracks(title, list, autoplay = false) {
  tracks = list;
  current = -1;
  $("itemTitle").textContent = title;
  $("tracksBox").hidden = false;
  const ol = $("tracks");
  ol.innerHTML = "";
  list.forEach((t, i) => {
    const li = document.createElement("li");
    li.className = "track";
    li.dataset.i = i;
    li.innerHTML = `<span class="name"></span><span class="fmt"></span><button class="glass-button" type="button" aria-label="دانلود">⬇</button>`;
    li.querySelector(".name").textContent = (i + 1) + ". " + t.title;
    li.querySelector(".fmt").textContent = t.format || "";
    li.querySelector(".name").addEventListener("click", () => play(i));
    li.querySelector("button").addEventListener("click", () => download(t));
    ol.appendChild(li);
  });
  $("tracksBox").scrollIntoView({ behavior: "smooth" });
  if (autoplay) play(0);
}

// ---------- پخش ----------
function play(i) {
  if (i < 0 || i >= tracks.length) return;
  current = i;
  const t = tracks[i];
  audio.src = t.url;
  audio.play().catch(() => {});
  $("player").hidden = false;
  $("nowPlaying").textContent = t.title;
  document.querySelectorAll("li.track").forEach((li) => li.classList.toggle("active", Number(li.dataset.i) === i));
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: $("itemTitle").textContent });
  }
}
audio.addEventListener("ended", () => { if (current + 1 < tracks.length) play(current + 1); });
audio.addEventListener("error", () => { if (audio.src) setStatus("پخش این فایل ممکن نیست؛ می‌توانید آن را دانلود کنید."); });
$("next").addEventListener("click", () => play(current + 1));
$("prev").addEventListener("click", () => play(current - 1));
if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("nexttrack", () => play(current + 1));
  navigator.mediaSession.setActionHandler("previoustrack", () => play(current - 1));
}

// ---------- دانلود ----------
async function download(t) {
  const ext = (t.filename.match(/\.[^.]+$/) || [".mp3"])[0];
  const base = sanitize(t.title.replace(/\.[^.]+$/, "")) || "music";
  if (HAS_EXT_DL) {
    chrome.downloads.download({ url: t.url, filename: "Music/" + base + ext, conflictAction: "uniquify" });
    return;
  }
  // وب‌اپ / گوشی: دریافت فایل و ذخیره با نام درست
  try {
    setStatus("در حال دانلود: " + t.title + " …");
    const r = await fetch(t.url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = base + ext;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    setStatus("دانلود شروع شد ✔");
  } catch {
    // اگر مرورگر اجازه نداد، لینک مستقیم در تب جدید باز می‌شود
    window.open(t.url, "_blank", "noopener");
    setStatus("لینک دانلود در تب جدید باز شد.");
  }
}
$("dlNow").addEventListener("click", () => { if (current >= 0) download(tracks[current]); });
$("dlAll").addEventListener("click", async () => {
  if (!tracks.length) return;
  if (tracks.length > 15 && !confirm(tracks.length + " فایل دانلود شود؟")) return;
  for (const t of tracks) { await download(t); await new Promise((r) => setTimeout(r, 400)); }
});

// ---------- لینک اشتراکی / چسباندن لینک ----------
function openFromUrl(raw) {
  let u;
  try { u = new URL(raw.trim()); } catch { setStatus("لینک نامعتبر است."); return; }
  if (/(^|\.)archive\.org$/.test(u.hostname)) {
    const m = u.pathname.match(/^\/(?:details|download)\/([^/]+)(?:\/(.+))?/);
    if (m) {
      const id = decodeURIComponent(m[1]);
      if (m[2] && AUDIO_EXT.test(m[2])) {
        const name = decodeURIComponent(m[2]);
        showTracks(id, [{ title: name.replace(/\.[^.]+$/, ""), format: "", url: viaProxy(u.href), filename: name.split("/").pop() }], true);
      } else {
        loadItem(id, id, true);
      }
      return;
    }
  }
  if (AUDIO_EXT.test(u.pathname)) {
    const name = decodeURIComponent(u.pathname.split("/").pop());
    showTracks(name, [{ title: name.replace(/\.[^.]+$/, ""), format: "", url: u.href, filename: name }], true);
    return;
  }
  setStatus("این لینک پشتیبانی نمی‌شود. فقط لینک مستقیم فایل صوتی (mp3، ogg، flac، wav، m4a) یا صفحه‌های archive.org قابل پخش و دانلود هستند.");
}

$("searchForm").addEventListener("submit", (e) => { e.preventDefault(); search($("q").value); });
$("linkForm").addEventListener("submit", (e) => { e.preventDefault(); openFromUrl($("linkInput").value); });

// لینک از منوی راست‌کلیک (افزونه) یا از Share گوشی (وب‌اپ نصب‌شده)
const params = new URLSearchParams(location.search);
let shared = params.get("url");
if (!shared) {
  const m = (params.get("text") || "").match(/https?:\/\/\S+/);
  if (m) shared = m[0];
}
if (shared) { $("linkInput").value = shared; openFromUrl(shared); }

// ---------- تنظیمات پروکسی ----------
$("proxyInput").value = proxyBase;
$("proxyForm").addEventListener("submit", (e) => {
  e.preventDefault();
  proxyBase = normalizeProxy($("proxyInput").value);
  try { localStorage.setItem("rz-proxy", proxyBase); } catch {}
  $("proxyInput").value = proxyBase;
  $("proxyMsg").textContent = proxyBase ? "ذخیره شد. از این پس از پروکسی استفاده می‌شود." : "پروکسی حذف شد. اتصال مستقیم به archive.org.";
});
$("proxyTest").addEventListener("click", async () => {
  const v = normalizeProxy($("proxyInput").value);
  $("proxyMsg").textContent = "در حال تست…";
  try {
    const r = await fetch((v || ORIGIN) + "/advancedsearch.php?q=" + encodeURIComponent("title:test AND mediatype:audio") + "&fl[]=identifier&rows=1&output=json");
    const d = await r.json();
    $("proxyMsg").textContent = d && d.response ? "✔ اتصال برقرار است." : "پاسخ نامعتبر بود.";
  } catch (err) {
    $("proxyMsg").textContent = "✘ اتصال برقرار نشد. آدرس را بررسی کنید.";
  }
});

// ---------- نصب به‌عنوان اپ روی گوشی (PWA) ----------
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
