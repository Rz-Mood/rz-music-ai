"use strict";
// منبع موسیقی: Internet Archive (آثار آزاد و قانونی برای پخش و دانلود)
// این فایل هم داخل افزونه کروم و هم به‌صورت وب‌اپ روی گوشی کار می‌کند.
const $ = (id) => document.getElementById(id);
const AUDIO_EXT = /\.(mp3|ogg|oga|opus|flac|wav|m4a|aac)(\?.*)?$/i;
const GOOD_FORMATS = ["VBR MP3", "MP3", "128Kbps MP3", "64Kbps MP3", "Ogg Vorbis", "Flac", "WAVE", "Opus", "MPEG-4 Audio"];
const HAS_EXT_DL = typeof chrome !== "undefined" && chrome.downloads && chrome.downloads.download;
const ORIGIN = "https://archive.org";
const SITE_URL = location.protocol.startsWith("http") ? location.origin + location.pathname : "https://rz-mood.github.io/rz-music-ai/";
const SUGGESTIONS = ["jazz", "piano", "classical", "lofi", "ambient", "rock", "blues", "folk", "guitar", "orchestra"];

// ---------- ذخیره‌سازی (همه‌جا با try/catch) ----------
function getRaw(k) { try { return localStorage.getItem(k) || ""; } catch { return ""; } }
function setRaw(k, v) { try { localStorage.setItem(k, v); } catch {} }
function getJSON(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } }
function setJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

// ---------- حالت برنامه ----------
let tracks = [];
let current = -1;
let recordPlays = true;
let playHistory = getJSON("rz-history", []);
let recent = getJSON("rz-searches", []);
let proxyBase = "";
const audio = $("audio");

// ---------- ابزارها ----------
function sanitize(name) { return name.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 120); }

let toastTimer;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
}

function setStatus(msg, action) {
  const el = $("status");
  el.textContent = msg || "";
  if (msg && action) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "glass-button mini"; b.textContent = action.label;
    b.addEventListener("click", action.fn);
    el.appendChild(b);
  }
}

function makeBtn(text, label, fn) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "glass-button"; b.textContent = text;
  b.setAttribute("aria-label", label); b.title = label;
  b.addEventListener("click", (e) => { e.stopPropagation(); fn(); });
  return b;
}

// ---------- پروکسی (برای وقتی archive.org فیلتر است) ----------
function normalizeProxy(v) {
  v = (v || "").trim().replace(/\/+$/, "");
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  return v;
}
proxyBase = normalizeProxy(getRaw("rz-proxy"));
function A(path) { return (proxyBase || ORIGIN) + path; }
function viaProxy(href) {
  if (!proxyBase) return href;
  try {
    const u = new URL(href);
    if (u.hostname === "archive.org" || u.hostname.endsWith(".archive.org")) return proxyBase + u.pathname + u.search;
  } catch {}
  return href;
}
// اگر کسی آدرس پروکسی را چسباند، به آدرس اصلی archive.org برمی‌گردانیم
function canonical(href) {
  if (proxyBase && href.startsWith(proxyBase + "/")) return ORIGIN + href.slice(proxyBase.length);
  return href;
}
function trackUrl(t) { return viaProxy(t.orig); }

function updateBadge(state) {
  const b = $("connBadge");
  b.classList.remove("proxy", "bad");
  if (state === "bad") { b.classList.add("bad"); b.textContent = "اتصال ناموفق"; return; }
  if (proxyBase) { b.classList.add("proxy"); b.textContent = "پروکسی فعال"; }
  else b.textContent = "اتصال مستقیم";
}

// ---------- ناوبری بین بخش‌ها ----------
function showView(name) {
  for (const v of ["search", "history", "settings"]) $("view-" + v).hidden = v !== name;
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.dataset.view === name));
  if (name === "history") renderHistory();
  window.scrollTo({ top: 0 });
}
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));
$("connBadge").addEventListener("click", () => showView("settings"));

// ---------- تم رنگی ----------
const THEMES = [
  ["purple", "#b47aff"], ["green", "#00ff9d"], ["blue", "#42a5ff"],
  ["orange", "#ff8a32"], ["pink", "#ff72b6"], ["light", "#aabaff"]
];
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  setRaw("rz-glass-theme", theme);
  document.querySelectorAll(".dot").forEach((d) => d.classList.toggle("on", d.dataset.t === theme));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "light" ? "#eef1fb" : "#0b0c12";
}
for (const [name, color] of THEMES) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "dot"; b.dataset.t = name; b.title = name; b.setAttribute("aria-label", name);
  b.style.background = color;
  b.addEventListener("click", () => setTheme(name));
  $("themes").appendChild(b);
}
setTheme(getRaw("rz-glass-theme") || "purple");

// ---------- پیشنهاد و جستجوهای اخیر ----------
function renderChips() {
  const box = $("chips");
  box.innerHTML = "";
  const seen = new Set();
  const add = (q, isRecent) => {
    if (seen.has(q.toLowerCase())) return;
    seen.add(q.toLowerCase());
    const c = document.createElement("button");
    c.type = "button"; c.className = "chip" + (isRecent ? " recent" : "");
    c.textContent = (isRecent ? "🕘 " : "") + q;
    c.addEventListener("click", () => { $("q").value = q; search(q); });
    box.appendChild(c);
  };
  recent.slice(0, 6).forEach((q) => add(q, true));
  SUGGESTIONS.forEach((q) => add(q, false));
}
function addRecent(q) {
  recent = [q, ...recent.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 12);
  setJSON("rz-searches", recent);
  renderChips();
}

// ---------- جستجو ----------
function connectionFailed() {
  updateBadge("bad");
  setStatus("اتصال به archive.org برقرار نشد. اگر فیلتر است، پروکسی را تنظیم کنید.", { label: "تنظیمات اتصال", fn: () => showView("settings") });
}

async function search(query) {
  query = query.trim();
  if (!query) return;
  showView("search");
  addRecent(query);
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
    const docs = (data.response && data.response.docs) || [];
    updateBadge();
    if (!docs.length) { setStatus("نتیجه‌ای پیدا نشد. این منبع فقط آثار آزاد دارد؛ مثلاً jazz یا piano را امتحان کنید."); return; }
    setStatus("");
    renderResults(docs);
  } catch (e) {
    connectionFailed();
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
    const t0 = (meta.metadata && meta.metadata.title) || titleHint || id;
    const album = Array.isArray(t0) ? t0[0] : t0;
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
      album,
      format: f.format,
      orig: `${ORIGIN}/download/${encodeURIComponent(id)}/${f.name.split("/").map(encodeURIComponent).join("/")}`,
      filename: f.name.split("/").pop()
    }));
    updateBadge();
    if (!list.length) { setStatus("فایل صوتی قابل پخش در این مورد پیدا نشد."); return; }
    setStatus("");
    showTracks(album, list, autoplay);
  } catch (e) {
    connectionFailed();
  }
}

function showTracks(title, list, autoplay = false) {
  showView("search");
  tracks = list;
  current = -1;
  recordPlays = true;
  $("itemTitle").textContent = title;
  $("tracksBox").hidden = false;
  const ol = $("tracks");
  ol.innerHTML = "";
  list.forEach((t, i) => {
    const li = document.createElement("li");
    li.className = "track";
    li.dataset.orig = t.orig;
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = (i + 1) + ". " + t.title;
    name.addEventListener("click", () => play(i));
    const fmt = document.createElement("span");
    fmt.className = "fmt";
    fmt.textContent = t.format || "";
    li.append(name, fmt, makeBtn("⬇", "دانلود", () => download(t)), makeBtn("⤴", "اشتراک", () => share(t)));
    ol.appendChild(li);
  });
  $("tracksBox").scrollIntoView({ behavior: "smooth" });
  if (autoplay) play(0);
}

// ---------- پخش ----------
function markActive() {
  const o = current >= 0 && tracks[current] ? tracks[current].orig : null;
  document.querySelectorAll("[data-orig]").forEach((el) => el.classList.toggle("active", !!o && el.dataset.orig === o));
}

function play(i) {
  if (i < 0 || i >= tracks.length) return;
  current = i;
  const t = tracks[i];
  audio.src = trackUrl(t);
  audio.play().catch(() => {});
  $("player").hidden = false;
  document.body.classList.add("has-player");
  $("nowPlaying").textContent = t.title;
  $("nowAlbum").textContent = t.album || "";
  markActive();
  if (recordPlays) addHistory(t);
  if ("mediaSession" in navigator) {
    try { navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.album || "" }); } catch {}
  }
}
audio.addEventListener("ended", () => { if (current + 1 < tracks.length) play(current + 1); });
audio.addEventListener("error", () => { if (audio.getAttribute("src")) toast("پخش این فایل ممکن نیست؛ دانلود را امتحان کنید."); });
$("next").addEventListener("click", () => play(current + 1));
$("prev").addEventListener("click", () => play(current - 1));
if ("mediaSession" in navigator) {
  try {
    navigator.mediaSession.setActionHandler("nexttrack", () => play(current + 1));
    navigator.mediaSession.setActionHandler("previoustrack", () => play(current - 1));
  } catch {}
}

// ---------- دانلود ----------
async function download(t) {
  const ext = (t.filename.match(/\.[^.]+$/) || [".mp3"])[0];
  const base = sanitize(t.title.replace(/\.[^.]+$/, "")) || "music";
  const url = trackUrl(t);
  if (HAS_EXT_DL) {
    chrome.downloads.download({ url, filename: "Music/" + base + ext, conflictAction: "uniquify" });
    toast("دانلود شروع شد");
    return;
  }
  try {
    toast("در حال دانلود…");
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = base + ext;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    toast("دانلود شروع شد ✔");
  } catch {
    window.open(url, "_blank", "noopener");
    toast("لینک دانلود در تب جدید باز شد");
  }
}
$("dlNow").addEventListener("click", () => { if (current >= 0) download(tracks[current]); });
$("dlAll").addEventListener("click", async () => {
  if (!tracks.length) return;
  if (tracks.length > 15 && !confirm(tracks.length + " فایل دانلود شود؟")) return;
  for (const t of tracks) { await download(t); await new Promise((r) => setTimeout(r, 400)); }
});

// ---------- اشتراک‌گذاری ----------
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
  }
  return Promise.resolve(legacyCopy(text));
}
function legacyCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch {}
  ta.remove();
  if (!ok) throw new Error("copy failed");
}
async function share(t) {
  const link = SITE_URL + "?url=" + encodeURIComponent(t.orig);
  if (navigator.share) {
    try { await navigator.share({ title: t.title, text: t.title, url: link }); return; }
    catch (e) { if (e && e.name === "AbortError") return; }
  }
  try { await copyText(link); toast("لینک کپی شد"); }
  catch { window.prompt("این لینک را کپی کنید:", link); }
}
$("shareNow").addEventListener("click", () => { if (current >= 0) share(tracks[current]); });

// ---------- تاریخچه ----------
function addHistory(t) {
  const entry = { title: t.title, album: t.album || "", format: t.format || "", orig: t.orig, filename: t.filename, ts: Date.now() };
  playHistory = [entry, ...playHistory.filter((h) => h.orig !== t.orig)].slice(0, 100);
  setJSON("rz-history", playHistory);
  if (!$("view-history").hidden) renderHistory();
}
function fmtDate(ts) {
  try { return new Date(ts).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" }); } catch { return ""; }
}
function renderHistory() {
  const box = $("historyList");
  box.innerHTML = "";
  $("historyEmpty").hidden = playHistory.length > 0;
  $("clearHistory").hidden = playHistory.length === 0;
  playHistory.forEach((h, i) => {
    const row = document.createElement("div");
    row.className = "hrow glass fade-in";
    row.dataset.orig = h.orig;
    const info = document.createElement("div");
    info.className = "hinfo";
    const t = document.createElement("div"); t.className = "t"; t.textContent = h.title;
    const a = document.createElement("div"); a.className = "a";
    a.textContent = [h.album, fmtDate(h.ts)].filter(Boolean).join(" · ");
    info.append(t, a);
    info.addEventListener("click", () => playFromHistory(i));
    const btns = document.createElement("div");
    btns.className = "hbtns";
    btns.append(
      makeBtn("▶ پخش", "پخش", () => playFromHistory(i)),
      makeBtn("⬇ دانلود", "دانلود", () => download(h)),
      makeBtn("⤴ اشتراک", "اشتراک", () => share(h)),
      makeBtn("✕", "حذف از تاریخچه", () => removeHistory(h.orig))
    );
    row.append(info, btns);
    box.appendChild(row);
  });
  markActive();
}
function playFromHistory(i) {
  tracks = playHistory.map((h) => ({ ...h }));
  recordPlays = false;
  play(i);
}
function removeHistory(orig) {
  playHistory = playHistory.filter((h) => h.orig !== orig);
  setJSON("rz-history", playHistory);
  renderHistory();
}
function clearHistory() {
  if (!playHistory.length) { toast("تاریخچه خالی است"); return; }
  if (!confirm("همه‌ی تاریخچه پاک شود؟")) return;
  playHistory = [];
  setJSON("rz-history", playHistory);
  renderHistory();
  toast("تاریخچه پاک شد");
}
$("clearHistory").addEventListener("click", clearHistory);
$("clearHistory2").addEventListener("click", clearHistory);
$("clearSearches").addEventListener("click", () => {
  recent = [];
  setJSON("rz-searches", recent);
  renderChips();
  toast("جستجوهای اخیر پاک شد");
});

// ---------- لینک اشتراکی / چسباندن لینک ----------
function openFromUrl(raw) {
  let u;
  try { u = new URL(canonical(raw.trim())); } catch { setStatus("لینک نامعتبر است."); return; }
  if (u.hostname === "archive.org" || u.hostname.endsWith(".archive.org")) {
    const m = u.pathname.match(/^\/(?:details|download)\/([^/]+)(?:\/(.+))?/);
    if (m) {
      const id = decodeURIComponent(m[1]);
      if (m[2] && AUDIO_EXT.test(m[2])) {
        const name = decodeURIComponent(m[2]);
        showTracks(id, [{ title: name.replace(/\.[^.]+$/, ""), album: id, format: "", orig: u.href, filename: name.split("/").pop() }], true);
      } else {
        loadItem(id, id, true);
      }
      return;
    }
  }
  if (AUDIO_EXT.test(u.pathname)) {
    const name = decodeURIComponent(u.pathname.split("/").pop());
    showTracks(name, [{ title: name.replace(/\.[^.]+$/, ""), album: u.hostname, format: "", orig: u.href, filename: name }], true);
    return;
  }
  setStatus("این لینک پشتیبانی نمی‌شود. فقط لینک مستقیم فایل صوتی (mp3، ogg، flac، wav، m4a) یا صفحه‌های archive.org قابل پخش و دانلود هستند.");
}

$("searchForm").addEventListener("submit", (e) => { e.preventDefault(); search($("q").value); });
$("linkForm").addEventListener("submit", (e) => { e.preventDefault(); openFromUrl($("linkInput").value); });

// ---------- تنظیمات پروکسی ----------
$("proxyInput").value = proxyBase;
function proxyMsg(text, cls) {
  const el = $("proxyMsg");
  el.textContent = text;
  el.dataset.state = cls || "";
}
$("proxyForm").addEventListener("submit", (e) => {
  e.preventDefault();
  proxyBase = normalizeProxy($("proxyInput").value);
  setRaw("rz-proxy", proxyBase);
  $("proxyInput").value = proxyBase;
  updateBadge();
  proxyMsg(proxyBase ? "ذخیره شد. از این پس از پروکسی استفاده می‌شود." : "پروکسی حذف شد. اتصال مستقیم به archive.org.");
  toast("تنظیمات ذخیره شد");
});
$("proxyClear").addEventListener("click", () => {
  proxyBase = "";
  setRaw("rz-proxy", "");
  $("proxyInput").value = "";
  updateBadge();
  proxyMsg("پروکسی حذف شد. اتصال مستقیم به archive.org.");
});
$("proxyTest").addEventListener("click", async () => {
  const v = normalizeProxy($("proxyInput").value);
  proxyMsg("در حال تست…");
  try {
    const r = await fetch((v || ORIGIN) + "/advancedsearch.php?q=" + encodeURIComponent("title:test AND mediatype:audio") + "&fl[]=identifier&rows=1&output=json");
    const d = await r.json();
    if (d && d.response) { proxyMsg("✔ اتصال برقرار است. برای استفاده، «ذخیره» را بزنید.", "ok"); }
    else proxyMsg("پاسخ نامعتبر بود.", "bad");
  } catch {
    proxyMsg("✘ اتصال برقرار نشد. آدرس را بررسی کنید.", "bad");
  }
});

// ---------- شروع ----------
renderChips();
updateBadge();
const params = new URLSearchParams(location.search);
let shared = params.get("url");
if (!shared) {
  const m = (params.get("text") || "").match(/https?:\/\/\S+/);
  if (m) shared = m[0];
}
if (shared) { $("linkInput").value = shared; $("linkBox").open = true; openFromUrl(shared); }

// ---------- نصب به‌عنوان اپ روی گوشی (PWA) ----------
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
