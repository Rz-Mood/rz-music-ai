"use strict";
// Rz Station — Internet Archive (free & legal music): search, play, download, share.
// Works both as a Chrome extension page and as a phone web app.
const $ = (id) => document.getElementById(id);
const AUDIO_EXT = /\.(mp3|ogg|oga|opus|flac|wav|m4a|aac)(\?.*)?$/i;
const GOOD_FORMATS = ["VBR MP3", "MP3", "128Kbps MP3", "64Kbps MP3", "Ogg Vorbis", "Flac", "WAVE", "Opus", "MPEG-4 Audio"];
const HAS_EXT_DL = typeof chrome !== "undefined" && chrome.downloads && chrome.downloads.download;
const ORIGIN = "https://archive.org";
const SITE_URL = location.protocol.startsWith("http") ? location.origin + location.pathname : "https://rz-mood.github.io/rz-music-ai/";
const SUGGESTIONS = ["jazz", "piano", "classical", "lofi", "ambient", "rock", "blues", "folk", "guitar", "orchestra"];

// ---------- Translations ----------
const I18N = {
  fa: {
    dir: "rtl", locale: "fa-IR", other: "EN", sep: "، ",
    badgeTitle: "وضعیت اتصال", badgeDirect: "اتصال مستقیم", badgeProxy: "پروکسی فعال", badgeBad: "اتصال ناموفق",
    searchPh: "جستجوی آهنگ، خواننده یا آلبوم…", search: "جستجو", chipsLabel: "پیشنهاد جستجو",
    linkSummary: "🔗 پخش از لینک", linkPh: "لینک فایل صوتی یا صفحه archive.org", play: "پخش",
    downloadAll: "دانلود همه",
    history: "تاریخچه", clearAll: "پاک کردن همه",
    historyEmpty: "هنوز آهنگی پخش نکرده‌اید. هر آهنگی که پخش کنید اینجا ذخیره می‌شود و می‌توانید دوباره پخش، دانلود یا برای دیگران بفرستید.",
    settings: "تنظیمات", proxyTitle: "اتصال (پروکسی)",
    proxyHint: "اگر archive.org روی اینترنت شما بسته است، آدرس پروکسی خودتان را وارد کنید. جستجو، پخش و دانلود از طریق آن انجام می‌شود.",
    proxyPh: "https://music-proxy.نام‌شما.workers.dev", save: "ذخیره", testConn: "تست اتصال", remove: "حذف",
    langTitle: "زبان", themeTitle: "رنگ برنامه", dataTitle: "داده‌ها",
    dataHint: "تاریخچه‌ی پخش و جستجوهای اخیر فقط روی همین دستگاه ذخیره می‌شوند.",
    clearSearches: "پاک کردن جستجوهای اخیر", clearHistory: "پاک کردن تاریخچه",
    helpTitle: "راهنما",
    helpHint: "منبع موسیقی Internet Archive است و فقط آثار آزاد و قانونی در آن پیدا می‌شود. اگر archive.org فقط به‌خاطر DNS بسته باشد، تغییر DNS گوشی (Private DNS روی <span dir=\"ltr\">dns.google</span>) هم ممکن است کافی باشد.",
    prev: "قبلی", next: "بعدی", dlNow: "⬇ دانلود", shareNow: "⤴ اشتراک",
    tabSearch: "جستجو", tabHistory: "تاریخچه", tabSettings: "تنظیمات", tabsLabel: "بخش‌ها",
    btnPlay: "▶ پخش", btnDownload: "⬇ دانلود", btnShare: "⤴ اشتراک", removeFromHistory: "حذف از تاریخچه",
    download: "دانلود", share: "اشتراک",
    shareTitle: "لینک اشتراک", shareCopied: "✔ لینک کپی شد", shareCopyFail: "کپی خودکار انجام نشد. روی «کپی» بزنید یا لینک را نگه دارید و انتخاب کنید.",
    copy: "کپی", shareVia: "ارسال با…", close: "بستن",
    searching: "در حال جستجو…", loadingTracks: "در حال دریافت لیست آهنگ‌ها…",
    noResults: "نتیجه‌ای پیدا نشد. این منبع فقط آثار آزاد دارد؛ مثلاً jazz یا piano را امتحان کنید.",
    noAudio: "فایل صوتی قابل پخش در این مورد پیدا نشد.",
    connFailed: "اتصال به archive.org برقرار نشد. اگر فیلتر است، پروکسی را تنظیم کنید.", goSettings: "تنظیمات اتصال",
    invalidLink: "لینک نامعتبر است.",
    unsupportedLink: "این لینک پشتیبانی نمی‌شود. فقط لینک مستقیم فایل صوتی (mp3، ogg، flac، wav، m4a) یا صفحه‌های archive.org قابل پخش و دانلود هستند.",
    playFailed: "پخش این فایل ممکن نیست؛ دانلود را امتحان کنید.",
    dlStarted: "دانلود شروع شد", dlProgress: "در حال دانلود…", dlOk: "دانلود شروع شد ✔", dlOpened: "لینک دانلود در تب جدید باز شد",
    confirmDlAll: "{n} فایل دانلود شود؟", confirmClear: "همه‌ی تاریخچه پاک شود؟",
    historyAlreadyEmpty: "تاریخچه خالی است", historyCleared: "تاریخچه پاک شد", searchesCleared: "جستجوهای اخیر پاک شد",
    settingsSaved: "تنظیمات ذخیره شد",
    proxySaved: "ذخیره شد. از این پس از پروکسی استفاده می‌شود.", proxyRemoved: "پروکسی حذف شد. اتصال مستقیم به archive.org.",
    proxyTesting: "در حال تست…", proxyOk: "✔ اتصال برقرار است. برای استفاده، «ذخیره» را بزنید.",
    proxyBadResp: "پاسخ نامعتبر بود.", proxyFail: "✘ اتصال برقرار نشد. آدرس را بررسی کنید.",
    shareCopyShort: "کپی شد ✔",
    tabFavorites: "علاقه‌مندی‌ها", favorites: "علاقه‌مندی‌ها", playAll: "پخش همه",
    favsEmpty: "هنوز آهنگی را لایک نکرده‌اید. روی ♡ کنار هر آهنگ بزنید تا اینجا ذخیره شود.",
    favorite: "افزودن به علاقه‌مندی‌ها", unfavorite: "حذف از علاقه‌مندی‌ها",
    favAdded: "به علاقه‌مندی‌ها اضافه شد ❤", favRemoved: "از علاقه‌مندی‌ها حذف شد",
    tabRadio: "رادیو", radio: "رادیو", radioSwitchLabel: "آهنگ بعدی بر اساس سبک", radioToggleTitle: "رادیو: آهنگ بعدی بر اساس سبک",
    radioHint: "وقتی روشن باشد، بعد از تمام شدن آهنگ (یا با زدن «بعدی») یک آهنگ با سبک مشابه آهنگ فعلی از Internet Archive انتخاب و پخش می‌شود.",
    radioStyleTitle: "سبک آهنگ فعلی", radioNoTrack: "هنوز آهنگی پخش نشده است. یک آهنگ پخش کنید یا از ایستگاه‌ها شروع کنید.",
    radioLoadingTags: "در حال تشخیص سبک…", radioNoTags: "برای این آهنگ سبکی ثبت نشده. از ایستگاه‌ها یک سبک انتخاب کنید.",
    radioModeAuto: "حالت خودکار: آهنگ بعدی با سبک همین آهنگ انتخاب می‌شود.",
    radioModeManual: "سبک ثابت: {tag}. آهنگ‌های بعدی از همین سبک انتخاب می‌شوند.",
    radioNextBtn: "⏭ آهنگ مشابه بعدی", radioAutoBtn: "🎯 حالت خودکار",
    radioStations: "ایستگاه‌ها (شروع با یک سبک)", radioRecent: "آخرین پیشنهادهای رادیو", radioPicksEmpty: "هنوز پیشنهادی نیست.",
    radioSearching: "در حال پیدا کردن آهنگ مشابه…", radioNoStyle: "سبک آهنگ مشخص نیست. یک ایستگاه انتخاب کنید.",
    radioNoResult: "آهنگ مشابهی پیدا نشد. سبک دیگری را امتحان کنید.", radioOn: "رادیو روشن شد 📻", radioOff: "رادیو خاموش شد",
    radioFail: "پیدا کردن آهنگ مشابه ناموفق بود. اتصال را بررسی کنید.", radioUseStyle: "سبک ثابت شد: {tag}",
    radioSourceTitle: "منبع رادیو",
    srcHintJam: "Jamendo: موسیقی Creative Commons. آهنگ بعدی بر اساس شباهت واقعی (ژانر، ساز، حال‌وهوا، وکال یا بی‌کلام) انتخاب می‌شود و دقیق‌تر است.",
    srcHintArc: "Internet Archive: انتخاب بر اساس برچسب‌های ثبت‌شده‌ی آلبوم؛ دقت کمتر.",
    srcNoKey: "برای رادیوی دقیق‌تر، Client ID رایگان Jamendo را در تنظیمات وارد کنید. تا آن موقع از Internet Archive استفاده می‌شود.",
    jamTitle: "سرویس رادیو (Jamendo)",
    jamHint: "Jamendo موسیقی آزاد (Creative Commons) دارد و آهنگ مشابه را بر اساس ژانر، ساز و حال‌وهوا پیدا می‌کند. یک Client ID رایگان از <a href=\"https://devportal.jamendo.com\" target=\"_blank\" rel=\"noopener\" dir=\"ltr\">devportal.jamendo.com</a> بگیرید (ثبت‌نام، ساخت اپلیکیشن، کپی Client ID) و اینجا بچسبانید.",
    jamPh: "Client ID",
    jamSaved: "ذخیره شد. رادیو از Jamendo استفاده می‌کند.", jamRemoved: "کلید حذف شد. رادیو از Internet Archive استفاده می‌کند.",
    jamBadId: "Client ID فقط شامل حروف و عدد انگلیسی است.",
    jamTestOk: "✔ کلید معتبر است و اتصال برقرار شد. برای استفاده «ذخیره» را بزنید.",
    jamTestFail: "✘ کلید معتبر نیست یا اتصال به Jamendo برقرار نشد.",
    jamFail: "ارتباط با Jamendo ناموفق بود. کلید یا اتصال را بررسی کنید.",
    jamNoDownload: "دانلود این آهنگ توسط هنرمند مجاز نشده است.",
    jamNeedsKey: "این آهنگ از Jamendo است. برای پخش، Client ID رایگان Jamendo را در تنظیمات وارد کنید.",
    jamNeedsKeyToast: "ابتدا Client ID را در تنظیمات وارد کنید",
    matchPct: "تطابق {n}٪",
    modeLabel: "نوع جستجو", modeFree: "آزاد (دانلودی)", modeOriginal: "اصلی (YouTube)",
    searchPhOriginal: "نام آهنگ و خواننده، مثلاً Shape of You Ed Sheeran…",
    modeHintFree: "آثار آزاد و قانونی؛ قابل پخش و دانلود.",
    modeHintOriginal: "نسخه‌ی اصلی آهنگ‌ها با پخش‌کننده‌ی رسمی YouTube پخش می‌شود. دانلود ندارد؛ ملاک، پخش آهنگ اصلی است. لینک YouTube، Spotify و SoundCloud را هم می‌توانید در «پخش از لینک» بچسبانید.",
    ytNeedKey: "برای جستجوی آهنگ اصلی، کلید رایگان YouTube را در تنظیمات وارد کنید. بدون کلید هم می‌توانید لینک YouTube/Spotify/SoundCloud را در «پخش از لینک» بچسبانید.",
    ytSearchFail: "جستجو در YouTube ناموفق بود. کلید یا اتصال را بررسی کنید (ممکن است YouTube روی اینترنت شما بسته باشد).",
    ytQuota: "سهمیه‌ی روزانه‌ی جستجوی YouTube تمام شده است. فردا دوباره امتحان کنید یا لینک آهنگ را مستقیم بچسبانید.",
    ytNoResults: "آهنگی پیدا نشد. نام خواننده را هم اضافه کنید.",
    ytTitle: "جستجوی آهنگ اصلی (YouTube)",
    ytHint: "برای جستجو در حالت «اصلی» یک کلید رایگان YouTube Data API لازم است: در <a href=\"https://console.cloud.google.com\" target=\"_blank\" rel=\"noopener\" dir=\"ltr\">console.cloud.google.com</a> یک پروژه بسازید، «YouTube Data API v3» را فعال کنید، یک API key بسازید و آن را فقط برای <span dir=\"ltr\">https://rz-mood.github.io/*</span> محدود کنید، بعد اینجا بچسبانید. سهمیه‌ی رایگان محدود است (حدود صد جستجو در روز).",
    ytPh: "API key", ytSaved: "ذخیره شد. جستجوی اصلی فعال است.", ytRemoved: "کلید حذف شد.",
    ytBadKey: "کلید معتبر نیست (فقط حروف، عدد، - و _).",
    ytTestOk: "✔ کلید معتبر است. برای استفاده «ذخیره» را بزنید.", ytTestFail: "✘ کلید معتبر نیست، محدودیت دامنه اشتباه است یا YouTube در دسترس نیست.",
    embedReopen: "▶ پخش‌کننده", embedNoDownload: "آهنگ‌های اصلی دانلود ندارند؛ فقط پخش می‌شوند.",
    embedNoteYt: "پخش با پخش‌کننده‌ی رسمی YouTube. با بستن این پنجره پخش متوقف می‌شود.",
    embedNoteSp: "پخش با پخش‌کننده‌ی رسمی Spotify. آهنگ کامل معمولاً فقط با ورود به حساب Spotify پخش می‌شود، وگرنه پیش‌نمایش است.",
    embedNoteSc: "پخش با پخش‌کننده‌ی رسمی SoundCloud.",
    openSource: "باز کردن در سایت"
  },
  en: {
    dir: "ltr", locale: "en-US", other: "فارسی", sep: ", ",
    badgeTitle: "Connection status", badgeDirect: "Direct", badgeProxy: "Proxy on", badgeBad: "No connection",
    searchPh: "Search songs, artists or albums…", search: "Search", chipsLabel: "Search suggestions",
    linkSummary: "🔗 Play from link", linkPh: "Audio file link or archive.org page", play: "Play",
    downloadAll: "Download all",
    history: "History", clearAll: "Clear all",
    historyEmpty: "You haven't played anything yet. Every song you play is saved here, so you can play it again, download it or send it to others.",
    settings: "Settings", proxyTitle: "Connection (proxy)",
    proxyHint: "If archive.org is blocked on your network, enter your own proxy address. Search, playback and downloads will go through it.",
    proxyPh: "https://music-proxy.yourname.workers.dev", save: "Save", testConn: "Test connection", remove: "Remove",
    langTitle: "Language", themeTitle: "App color", dataTitle: "Data",
    dataHint: "Play history and recent searches are stored on this device only.",
    clearSearches: "Clear recent searches", clearHistory: "Clear history",
    helpTitle: "Help",
    helpHint: "Music comes from the Internet Archive, which only has free and legal works. If archive.org is blocked only by DNS, changing your phone's DNS (Private DNS set to <span dir=\"ltr\">dns.google</span>) may be enough.",
    prev: "Previous", next: "Next", dlNow: "⬇ Download", shareNow: "⤴ Share",
    tabSearch: "Search", tabHistory: "History", tabSettings: "Settings", tabsLabel: "Sections",
    btnPlay: "▶ Play", btnDownload: "⬇ Download", btnShare: "⤴ Share", removeFromHistory: "Remove from history",
    download: "Download", share: "Share",
    shareTitle: "Share link", shareCopied: "✔ Link copied", shareCopyFail: "Automatic copy didn't work. Tap “Copy” or long-press the link to select it.",
    copy: "Copy", shareVia: "Share via…", close: "Close",
    searching: "Searching…", loadingTracks: "Loading tracks…",
    noResults: "Nothing found. This source only has free works; try jazz or piano.",
    noAudio: "No playable audio file found for this item.",
    connFailed: "Couldn't reach archive.org. If it's blocked, set up a proxy.", goSettings: "Connection settings",
    invalidLink: "Invalid link.",
    unsupportedLink: "This link isn't supported. Only direct audio file links (mp3, ogg, flac, wav, m4a) and archive.org pages can be played and downloaded.",
    playFailed: "This file can't be played. Try downloading it.",
    dlStarted: "Download started", dlProgress: "Downloading…", dlOk: "Download started ✔", dlOpened: "Download link opened in a new tab",
    confirmDlAll: "Download {n} files?", confirmClear: "Clear the whole history?",
    historyAlreadyEmpty: "History is empty", historyCleared: "History cleared", searchesCleared: "Recent searches cleared",
    settingsSaved: "Settings saved",
    proxySaved: "Saved. The proxy will be used from now on.", proxyRemoved: "Proxy removed. Connecting directly to archive.org.",
    proxyTesting: "Testing…", proxyOk: "✔ Connected. Press “Save” to use it.",
    proxyBadResp: "Invalid response.", proxyFail: "✘ Couldn't connect. Check the address.",
    shareCopyShort: "Copied ✔",
    tabFavorites: "Favorites", favorites: "Favorites", playAll: "Play all",
    favsEmpty: "You haven't liked any songs yet. Tap ♡ next to a song to save it here.",
    favorite: "Add to favorites", unfavorite: "Remove from favorites",
    favAdded: "Added to favorites ❤", favRemoved: "Removed from favorites",
    tabRadio: "Radio", radio: "Radio", radioSwitchLabel: "Next song by style", radioToggleTitle: "Radio: next song by style",
    radioHint: "When on, after a song ends (or when you press “Next”) a song with a similar style to the current one is picked from the Internet Archive and played.",
    radioStyleTitle: "Style of the current song", radioNoTrack: "Nothing is playing yet. Play a song or start from a station.",
    radioLoadingTags: "Detecting style…", radioNoTags: "No style is listed for this song. Pick one from the stations.",
    radioModeAuto: "Auto mode: the next song follows the style of this one.",
    radioModeManual: "Fixed style: {tag}. Next songs will come from this style.",
    radioNextBtn: "⏭ Next similar song", radioAutoBtn: "🎯 Auto mode",
    radioStations: "Stations (start from a style)", radioRecent: "Recent radio picks", radioPicksEmpty: "No picks yet.",
    radioSearching: "Finding a similar song…", radioNoStyle: "The style is unknown. Pick a station.",
    radioNoResult: "No similar song found. Try another style.", radioOn: "Radio on 📻", radioOff: "Radio off",
    radioFail: "Couldn't find a similar song. Check your connection.", radioUseStyle: "Style fixed: {tag}",
    radioSourceTitle: "Radio source",
    srcHintJam: "Jamendo: Creative Commons music. The next song is chosen by real similarity (genre, instruments, mood, vocal or instrumental), so it is more accurate.",
    srcHintArc: "Internet Archive: chosen from the tags listed on the album; less accurate.",
    srcNoKey: "For a more accurate radio, enter your free Jamendo Client ID in Settings. Until then the Internet Archive is used.",
    jamTitle: "Radio service (Jamendo)",
    jamHint: "Jamendo has free (Creative Commons) music and finds similar songs by genre, instruments and mood. Get a free Client ID from <a href=\"https://devportal.jamendo.com\" target=\"_blank\" rel=\"noopener\" dir=\"ltr\">devportal.jamendo.com</a> (sign up, create an app, copy the Client ID) and paste it here.",
    jamPh: "Client ID",
    jamSaved: "Saved. The radio now uses Jamendo.", jamRemoved: "Key removed. The radio now uses the Internet Archive.",
    jamBadId: "A Client ID only contains English letters and numbers.",
    jamTestOk: "✔ The key is valid and Jamendo is reachable. Press “Save” to use it.",
    jamTestFail: "✘ The key is invalid or Jamendo can't be reached.",
    jamFail: "Couldn't reach Jamendo. Check your key or connection.",
    jamNoDownload: "The artist doesn't allow downloading this song.",
    jamNeedsKey: "This song is from Jamendo. To play it, enter your free Jamendo Client ID in Settings.",
    jamNeedsKeyToast: "Enter your Client ID in Settings first",
    matchPct: "{n}% match",
    modeLabel: "Search type", modeFree: "Free (downloadable)", modeOriginal: "Original (YouTube)",
    searchPhOriginal: "Song and artist, e.g. Shape of You Ed Sheeran…",
    modeHintFree: "Free, legal works; can be played and downloaded.",
    modeHintOriginal: "Original recordings play in YouTube's official player. No download — the goal here is playing the original. You can also paste YouTube, Spotify and SoundCloud links under “Play from link”.",
    ytNeedKey: "To search original songs, enter a free YouTube key in Settings. Without a key you can still paste a YouTube/Spotify/SoundCloud link under “Play from link”.",
    ytSearchFail: "YouTube search failed. Check your key or connection (YouTube may be blocked on your network).",
    ytQuota: "The daily YouTube search quota is used up. Try again tomorrow or paste a song link directly.",
    ytNoResults: "No songs found. Try adding the artist name.",
    ytTitle: "Original song search (YouTube)",
    ytHint: "Searching in “Original” mode needs a free YouTube Data API key: in <a href=\"https://console.cloud.google.com\" target=\"_blank\" rel=\"noopener\" dir=\"ltr\">console.cloud.google.com</a> create a project, enable “YouTube Data API v3”, create an API key, restrict it to <span dir=\"ltr\">https://rz-mood.github.io/*</span>, then paste it here. The free quota is limited (roughly a hundred searches a day).",
    ytPh: "API key", ytSaved: "Saved. Original search is on.", ytRemoved: "Key removed.",
    ytBadKey: "That key doesn't look valid (letters, numbers, - and _ only).",
    ytTestOk: "✔ The key works. Press “Save” to use it.", ytTestFail: "✘ The key is invalid, its referrer restriction is wrong, or YouTube can't be reached.",
    embedReopen: "▶ Player", embedNoDownload: "Original songs can't be downloaded; they only play.",
    embedNoteYt: "Playing in YouTube's official player. Closing this window stops playback.",
    embedNoteSp: "Playing in Spotify's official player. Full songs usually play only when you're logged in to Spotify; otherwise it's a preview.",
    embedNoteSc: "Playing in SoundCloud's official player.",
    openSource: "Open on site"
  }
};
let lang = "fa";
function t(key, vars) {
  let s = (I18N[lang] && I18N[lang][key]) || I18N.fa[key] || key;
  if (vars) for (const k of Object.keys(vars)) s = s.replace("{" + k + "}", vars[k]);
  return s;
}

// ---------- Storage (always guarded) ----------
function getRaw(k) { try { return localStorage.getItem(k) || ""; } catch { return ""; } }
function setRaw(k, v) { try { localStorage.setItem(k, v); } catch {} }
function getJSON(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } }
function setJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

// ---------- State ----------
let tracks = [];          // the playback queue
let searchTracks = [];    // the list shown in the search tab
let tracksTitle = "";
let current = -1;
let recordPlays = true;
let playHistory = getJSON("rz-history", []);
let recent = getJSON("rz-searches", []);
let favs = getJSON("rz-favs", []);
const JAM_API = "https://api.jamendo.com/v3.0";
let jamId = /^[A-Za-z0-9]{4,40}$/.test(getRaw("rz-jamendo")) ? getRaw("rz-jamendo") : "";
const radio = { on: getRaw("rz-radio") === "1", source: getRaw("rz-radio-source"), manual: "", busy: false, seen: [], picks: getJSON("rz-radio-picks", []) };
const YT_API = "https://www.googleapis.com/youtube/v3";
let ytKey = /^[A-Za-z0-9_-]{20,80}$/.test(getRaw("rz-ytkey")) ? getRaw("rz-ytkey") : "";
let mode = getRaw("rz-mode") === "original" ? "original" : "free";
const tagCache = new Map();
let proxyBase = "";
let badState = false;
const audio = $("audio");

// ---------- Helpers ----------
// One compact record for history / favorites / radio picks (keeps Jamendo stream info so replay works).
function slim(tr) {
  const o = { title: tr.title, album: tr.album || "", format: tr.format || "", orig: tr.orig, filename: tr.filename, tags: tr.tags, ts: Date.now() };
  if (tr.src) { o.src = tr.src; o.jid = tr.jid; o.streamUrl = tr.streamUrl; o.dlUrl = tr.dlUrl; if (tr.match != null) o.match = tr.match; }
  if (tr.src === "embed") { o.kind = tr.kind; o.etype = tr.etype; o.eid = tr.eid; }
  return o;
}
function sanitize(name) { return name.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 120); }

let toastTimer;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
}

let statusState = null;
function setStatus(key, action) { statusState = key ? { key, action } : null; renderStatus(); }
function renderStatus() {
  const el = $("status");
  el.textContent = "";
  if (!statusState) return;
  el.textContent = t(statusState.key);
  if (statusState.action) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "glass-button mini"; b.textContent = t(statusState.action.labelKey);
    b.addEventListener("click", statusState.action.fn);
    el.appendChild(b);
  }
}

let proxyState = null;
function proxyMsg(key, cls) { proxyState = key ? { key, cls } : null; renderProxyMsg(); }
function renderProxyMsg() {
  const el = $("proxyMsg");
  el.textContent = proxyState ? t(proxyState.key) : "";
  el.dataset.state = (proxyState && proxyState.cls) || "";
}

function makeBtn(text, label, fn) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "glass-button"; b.textContent = text;
  b.setAttribute("aria-label", label); b.title = label;
  b.addEventListener("click", (e) => { e.stopPropagation(); fn(); });
  return b;
}

// ---------- Proxy (for when archive.org is filtered) ----------
function normalizeProxy(v) {
  v = (v || "").trim().replace(/\/+$/, "");
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  return v;
}
// When the site itself is hosted on Cloudflare Pages (…pages.dev), it ships its own /proxy route.
const SAME_SITE_PROXY = /\.pages\.dev$/.test(location.hostname) ? location.origin + "/proxy" : "";
proxyBase = normalizeProxy(getRaw("rz-proxy")) || SAME_SITE_PROXY;
function A(path) { return (proxyBase || ORIGIN) + path; }
function viaProxy(href) {
  if (!proxyBase) return href;
  try {
    const u = new URL(href);
    if (u.hostname === "archive.org" || u.hostname.endsWith(".archive.org")) return proxyBase + u.pathname + u.search;
  } catch {}
  return href;
}
function canonical(href) {
  if (proxyBase && href.startsWith(proxyBase + "/")) return ORIGIN + href.slice(proxyBase.length);
  return href;
}
function trackUrl(tr) { return tr.streamUrl || viaProxy(tr.orig); }

function updateBadge(bad) {
  if (bad === true) badState = true; else if (bad === false) badState = false;
  const b = $("connBadge");
  b.classList.remove("proxy", "bad");
  if (badState) { b.classList.add("bad"); b.textContent = t("badgeBad"); return; }
  if (proxyBase) { b.classList.add("proxy"); b.textContent = t("badgeProxy"); }
  else b.textContent = t("badgeDirect");
}

// ---------- Views ----------
function showView(name) {
  for (const v of ["search", "radio", "favorites", "history", "settings"]) $("view-" + v).hidden = v !== name;
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x.dataset.view === name));
  if (name === "history") renderHistory();
  if (name === "favorites") renderFavs();
  if (name === "radio") renderRadio();
  window.scrollTo({ top: 0 });
}
document.querySelectorAll(".tab").forEach((x) => x.addEventListener("click", () => showView(x.dataset.view)));
$("connBadge").addEventListener("click", () => showView("settings"));

// ---------- Theme ----------
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

// ---------- Language ----------
function applyLang(l) {
  lang = I18N[l] ? l : "fa";
  setRaw("rz-lang", lang);
  const root = document.documentElement;
  root.lang = lang;
  root.dir = I18N[lang].dir;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  $("langBtn").textContent = I18N[lang].other;
  $("langFa").classList.toggle("on", lang === "fa");
  $("langEn").classList.toggle("on", lang === "en");
  renderChips();
  updateBadge();
  if (!$("tracksBox").hidden) renderTrackList();
  if (!$("view-history").hidden) renderHistory();
  if (!$("view-favorites").hidden) renderFavs();
  updateHearts();
  renderRadio();
  renderSource();
  renderMode();
  renderJamMsg();
  renderYtMsg();
  renderStatus();
  renderProxyMsg();
  renderShareMsg();
}
$("langBtn").addEventListener("click", () => applyLang(lang === "fa" ? "en" : "fa"));
$("langFa").addEventListener("click", () => applyLang("fa"));
$("langEn").addEventListener("click", () => applyLang("en"));

// ---------- Chips: recent searches + suggestions ----------
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

// ---------- Search ----------
function connectionFailed() {
  updateBadge(true);
  setStatus("connFailed", { labelKey: "goSettings", fn: () => showView("settings") });
}

async function search(query) {
  query = query.trim();
  if (!query) return;
  showView("search");
  addRecent(query);
  if (mode === "original") { ytSearch(query); return; }
  setStatus("searching");
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
    updateBadge(false);
    if (!docs.length) { setStatus("noResults"); return; }
    setStatus(null);
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
    const creator = Array.isArray(d.creator) ? d.creator.join(t("sep")) : (d.creator || "");
    const title = Array.isArray(d.title) ? d.title[0] : (d.title || d.identifier);
    el.innerHTML = `<img alt="" loading="lazy" src="${A("/services/img/")}${encodeURIComponent(d.identifier)}"><div><div class="t"></div><div class="a"></div></div>`;
    el.querySelector(".t").textContent = title;
    el.querySelector(".a").textContent = creator;
    el.addEventListener("click", () => loadItem(d.identifier, title, true));
    box.appendChild(el);
  }
}

// ---------- Load one item ----------
async function fetchItemTracks(id, titleHint) {
  const r = await fetch(A("/metadata/") + encodeURIComponent(id));
  const meta = await r.json();
  const t0 = (meta.metadata && meta.metadata.title) || titleHint || id;
  const album = Array.isArray(t0) ? t0[0] : t0;
  const tags = extractTags(meta.metadata);
  tagCache.set(id, tags);
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
    tags,
    orig: `${ORIGIN}/download/${encodeURIComponent(id)}/${f.name.split("/").map(encodeURIComponent).join("/")}`,
    filename: f.name.split("/").pop()
  }));
  return { id, album, list, tags };
}

async function loadItem(id, titleHint, autoplay = false) {
  setStatus("loadingTracks");
  try {
    const { album, list } = await fetchItemTracks(id, titleHint);
    updateBadge(false);
    if (!list.length) { setStatus("noAudio"); return; }
    setStatus(null);
    showTracks(album, list, autoplay);
  } catch (e) {
    connectionFailed();
  }
}

function showTracks(title, list, autoplay = false) {
  showView("search");
  tracks = list;
  searchTracks = list;
  tracksTitle = title;
  current = -1;
  recordPlays = true;
  $("tracksBox").hidden = false;
  renderTrackList();
  $("tracksBox").scrollIntoView({ behavior: "smooth" });
  if (autoplay) play(0);
}

function renderTrackList() {
  $("itemTitle").textContent = tracksTitle;
  const ol = $("tracks");
  ol.innerHTML = "";
  searchTracks.forEach((tr, i) => {
    const li = document.createElement("li");
    li.className = "track";
    li.dataset.orig = tr.orig;
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = (i + 1) + ". " + tr.title;
    name.addEventListener("click", () => {
      tracks = searchTracks; recordPlays = true; play(i);
    });
    const fmt = document.createElement("span");
    fmt.className = "fmt";
    fmt.textContent = tr.format || "";
    li.append(name, fmt, makeHeart(tr), ...dlBtns(tr, "⬇", t("download")), makeBtn("⤴", t("share"), () => share(tr)));
    ol.appendChild(li);
  });
  $("dlAll").hidden = searchTracks.some((x) => x.src === "embed");
  markActive();
}

// ---------- Playback ----------
function markActive() {
  const o = current >= 0 && tracks[current] ? tracks[current].orig : null;
  document.querySelectorAll("[data-orig]").forEach((el) => el.classList.toggle("active", !!o && el.dataset.orig === o));
}

function play(i) {
  if (i < 0 || i >= tracks.length) return;
  current = i;
  const tr = tracks[i];
  const isEmbed = tr.src === "embed";
  if (isEmbed) {
    audio.pause();
    audio.hidden = true;
    openEmbed(tr);
  } else {
    closeEmbed();
    audio.hidden = false;
    audio.src = trackUrl(tr);
    audio.play().catch(() => {});
  }
  $("dlNow").hidden = isEmbed;
  $("embedReopen").hidden = !isEmbed;
  $("player").hidden = false;
  document.body.classList.add("has-player");
  $("nowPlaying").textContent = tr.title;
  $("nowAlbum").textContent = tr.album || "";
  markActive();
  updateHearts();
  renderRadio();
  if (recordPlays) addHistory(tr);
  if ("mediaSession" in navigator) {
    try { navigator.mediaSession.metadata = new MediaMetadata({ title: tr.title, artist: tr.album || "" }); } catch {}
  }
}
audio.addEventListener("ended", () => { if (radio.on) radioNext(); else if (current + 1 < tracks.length) play(current + 1); });
audio.addEventListener("error", () => { if (audio.getAttribute("src")) toast(t("playFailed")); });
$("next").addEventListener("click", () => goNext());
$("prev").addEventListener("click", () => play(current - 1));
if ("mediaSession" in navigator) {
  try {
    navigator.mediaSession.setActionHandler("nexttrack", () => goNext());
    navigator.mediaSession.setActionHandler("previoustrack", () => play(current - 1));
  } catch {}
}

// ---------- Download ----------
async function download(tr) {
  if (tr.src === "embed") { toast(t("embedNoDownload")); return; }
  const ext = (tr.filename.match(/\.[^.]+$/) || [".mp3"])[0];
  const base = sanitize(tr.title.replace(/\.[^.]+$/, "")) || "music";
  const url = tr.src === "jamendo" ? tr.dlUrl : trackUrl(tr);
  if (!url) { toast(t("jamNoDownload")); return; }
  if (HAS_EXT_DL) {
    chrome.downloads.download({ url, filename: "Music/" + base + ext, conflictAction: "uniquify" });
    toast(t("dlStarted"));
    return;
  }
  try {
    toast(t("dlProgress"));
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
    toast(t("dlOk"));
  } catch {
    window.open(url, "_blank", "noopener");
    toast(t("dlOpened"));
  }
}
$("dlNow").addEventListener("click", () => { if (current >= 0) download(tracks[current]); });
$("dlAll").addEventListener("click", async () => {
  if (!searchTracks.length) return;
  if (searchTracks.length > 15 && !confirm(t("confirmDlAll", { n: searchTracks.length }))) return;
  for (const tr of searchTracks) { await download(tr); await new Promise((r) => setTimeout(r, 400)); }
});

// ---------- Share: show the link and copy it automatically ----------
let shareLink = "";
let shareOk = null;
function legacyCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch {}
  ta.remove();
  if (!ok) throw new Error("copy failed");
}
function renderShareMsg() {
  const el = $("shareMsg");
  if (shareOk === null) { el.textContent = ""; el.dataset.state = ""; return; }
  el.textContent = t(shareOk ? "shareCopied" : "shareCopyFail");
  el.dataset.state = shareOk ? "ok" : "bad";
}
function copyShareLink() {
  const done = (ok) => {
    shareOk = ok;
    renderShareMsg();
    try { $("shareLink").focus(); $("shareLink").select(); } catch {}
  };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareLink).then(
        () => done(true),
        () => { try { legacyCopy(shareLink); done(true); } catch { done(false); } }
      );
    } else {
      legacyCopy(shareLink);
      done(true);
    }
  } catch { done(false); }
}
function share(tr) {
  shareLink = SITE_URL + "?url=" + encodeURIComponent(tr.orig);
  $("shareName").textContent = tr.title;
  $("shareLink").value = shareLink;
  shareOk = null;
  renderShareMsg();
  $("shareVia").hidden = !navigator.share;
  $("shareSheet").hidden = false;
  copyShareLink(); // runs inside the click, so the browser allows the copy
}
function closeShare() { $("shareSheet").hidden = true; }
$("shareNow").addEventListener("click", () => { if (current >= 0) share(tracks[current]); });
$("shareCopy").addEventListener("click", copyShareLink);
$("shareClose").addEventListener("click", closeShare);
$("shareVia").addEventListener("click", () => {
  if (!navigator.share) return;
  navigator.share({ title: $("shareName").textContent, url: shareLink }).catch(() => {});
});
$("shareSheet").addEventListener("click", (e) => { if (e.target === $("shareSheet")) closeShare(); });
$("shareLink").addEventListener("focus", () => { try { $("shareLink").select(); } catch {} });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("shareSheet").hidden) closeShare(); });

// ---------- History ----------
function addHistory(tr) {
  const entry = slim(tr);
  playHistory = [entry, ...playHistory.filter((h) => h.orig !== tr.orig)].slice(0, 100);
  setJSON("rz-history", playHistory);
  if (!$("view-history").hidden) renderHistory();
}
function fmtDate(ts) {
  try { return new Date(ts).toLocaleString(t("locale"), { dateStyle: "short", timeStyle: "short" }); } catch { return ""; }
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
    const ti = document.createElement("div"); ti.className = "t"; ti.textContent = h.title;
    const a = document.createElement("div"); a.className = "a";
    a.textContent = [h.album, fmtDate(h.ts)].filter(Boolean).join(" · ");
    info.append(ti, a);
    info.addEventListener("click", () => playFromHistory(i));
    const btns = document.createElement("div");
    btns.className = "hbtns";
    btns.append(
      makeBtn(t("btnPlay"), t("play"), () => playFromHistory(i)),
      makeHeart(h),
      ...dlBtns(h, t("btnDownload"), t("download")),
      makeBtn(t("btnShare"), t("share"), () => share(h)),
      makeBtn("✕", t("removeFromHistory"), () => removeHistory(h.orig))
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
  if (!playHistory.length) { toast(t("historyAlreadyEmpty")); return; }
  if (!confirm(t("confirmClear"))) return;
  playHistory = [];
  setJSON("rz-history", playHistory);
  renderHistory();
  toast(t("historyCleared"));
}
$("clearHistory").addEventListener("click", clearHistory);
$("clearHistory2").addEventListener("click", clearHistory);
$("clearSearches").addEventListener("click", () => {
  recent = [];
  setJSON("rz-searches", recent);
  renderChips();
  toast(t("searchesCleared"));
});

// ---------- Favorites ----------
function isFav(orig) { return favs.some((f) => f.orig === orig); }
function setHeartState(b, on) {
  b.textContent = on ? "❤" : "♡";
  b.classList.toggle("liked", on);
  const label = t(on ? "unfavorite" : "favorite");
  b.setAttribute("aria-label", label);
  b.title = label;
  b.setAttribute("aria-pressed", on ? "true" : "false");
}
function makeHeart(tr) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "glass-button heart"; b.dataset.fav = tr.orig;
  b.addEventListener("click", (e) => { e.stopPropagation(); toggleFav(tr); });
  setHeartState(b, isFav(tr.orig));
  return b;
}
function toggleFav(tr) {
  if (isFav(tr.orig)) {
    favs = favs.filter((f) => f.orig !== tr.orig);
    toast(t("favRemoved"));
  } else {
    favs = [slim(tr), ...favs].slice(0, 500);
    toast(t("favAdded"));
  }
  setJSON("rz-favs", favs);
  updateHearts();
  if (!$("view-favorites").hidden) renderFavs();
}
function updateHearts() {
  document.querySelectorAll("[data-fav]").forEach((b) => setHeartState(b, isFav(b.dataset.fav)));
  const o = current >= 0 && tracks[current] ? tracks[current].orig : null;
  setHeartState($("favNow"), !!o && isFav(o));
}
function renderFavs() {
  const box = $("favsList");
  box.innerHTML = "";
  $("favsEmpty").hidden = favs.length > 0;
  $("playAllFavs").hidden = favs.length === 0;
  favs.forEach((f, i) => {
    const row = document.createElement("div");
    row.className = "hrow glass fade-in";
    row.dataset.orig = f.orig;
    const info = document.createElement("div");
    info.className = "hinfo";
    const ti = document.createElement("div"); ti.className = "t"; ti.textContent = f.title;
    const a = document.createElement("div"); a.className = "a"; a.textContent = f.album || "";
    info.append(ti, a);
    info.addEventListener("click", () => playFromFavs(i));
    const btns = document.createElement("div");
    btns.className = "hbtns";
    btns.append(
      makeBtn(t("btnPlay"), t("play"), () => playFromFavs(i)),
      makeHeart(f),
      ...dlBtns(f, t("btnDownload"), t("download")),
      makeBtn(t("btnShare"), t("share"), () => share(f))
    );
    row.append(info, btns);
    box.appendChild(row);
  });
  markActive();
}
function playFromFavs(i) {
  tracks = favs.map((f) => ({ ...f }));
  recordPlays = true;
  play(i);
}
$("favNow").addEventListener("click", () => { if (current >= 0 && tracks[current]) toggleFav(tracks[current]); });
$("playAllFavs").addEventListener("click", () => playFromFavs(0));

// ---------- Radio: next song by style ----------
const STATIONS = ["jazz", "classical", "piano", "ambient", "rock", "blues", "folk", "electronic", "hip hop", "reggae", "country", "metal", "soul", "lofi"];
const STOP_TAGS = new Set(["audio", "music", "mp3", "mp3s", "album", "albums", "song", "songs", "free", "download", "creative commons",
  "opensource_audio", "open source audio", "sound", "recording", "recordings", "live", "archive", "internet archive", "cc", "unknown",
  "various", "various artists", "vbr mp3", "flac", "ogg", "wav", "stream", "streaming", "podcast", "radio", "english", "untitled"]);

// Reads genre/subject from the archive.org metadata and turns it into a clean list of style tags.
function extractTags(md) {
  if (!md) return [];
  const raw = [].concat(md.genre || [], md.subject || []);
  const out = [];
  for (const item of raw) {
    for (const part of String(item).split(/[;,]/)) {
      const tag = part.trim().toLowerCase();
      if (tag.length < 2 || tag.length > 28 || STOP_TAGS.has(tag) || /^\d{1,4}s?$/.test(tag)) continue;
      if (!out.includes(tag)) out.push(tag);
    }
  }
  return out.slice(0, 8);
}
function trackId(tr) {
  const m = /^https:\/\/archive\.org\/download\/([^/]+)\//.exec((tr && tr.orig) || "");
  try { return m ? decodeURIComponent(m[1]) : ""; } catch { return ""; }
}
function curTrack() { return current >= 0 ? tracks[current] || null : null; }
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Style tags for a track (fetched once from archive.org if the track doesn't carry them yet).
async function ensureTags(tr) {
  if (Array.isArray(tr.tags)) return tr.tags;
  const id = trackId(tr);
  if (!id) { tr.tags = []; return tr.tags; }
  if (tagCache.has(id)) { tr.tags = tagCache.get(id); return tr.tags; }
  try {
    const r = await fetch(A("/metadata/") + encodeURIComponent(id));
    const meta = await r.json();
    const tags = extractTags(meta.metadata);
    tagCache.set(id, tags);
    tr.tags = tags;
    return tags;
  } catch {
    tr.tagsFailed = true;
    return [];
  }
}

let radioState = null;
function radioMsg(key, cls) { radioState = key ? { key, cls } : null; renderRadioMsg(); }
function renderRadioMsg() {
  const el = $("radioStatus");
  el.textContent = radioState ? t(radioState.key) : "";
  el.dataset.state = (radioState && radioState.cls) || "";
}

function radioQuery(tags) {
  const parts = tags.map((tag) => { const e = tag.replace(/["\\]/g, " "); return `subject:("${e}") OR genre:("${e}")`; });
  return `(${parts.join(" OR ")}) AND mediatype:audio`;
}
async function radioCandidates(tags, page) {
  const url = A("/advancedsearch.php?q=") + encodeURIComponent(radioQuery(tags)) +
    "&fl[]=identifier&fl[]=title&sort[]=downloads desc&rows=40&page=" + page + "&output=json";
  const r = await fetch(url);
  const data = await r.json();
  return (data.response && data.response.docs) || [];
}
async function radioFind(seeds, curId) {
  const sets = seeds.length > 1 ? [seeds, seeds.slice(0, 1)] : [seeds];
  for (const set of sets) {
    for (const page of [1 + Math.floor(Math.random() * 3), 1]) {
      const docs = shuffle((await radioCandidates(set, page)).filter((d) => d.identifier !== curId && !radio.seen.includes(d.identifier)));
      for (const d of docs.slice(0, 5)) {
        const item = await fetchItemTracks(d.identifier, d.title);
        if (item.list.length) return item;
      }
    }
  }
  return null;
}
async function radioSeeds() {
  if (radio.manual) return [radio.manual];
  const cur = curTrack();
  if (!cur) return [];
  return (await ensureTags(cur)).slice(0, 3);
}

// ----- Jamendo (free Creative Commons music; has a real "similar tracks" endpoint) -----
function jamUrl(path, params, key) {
  const q = ["client_id=" + encodeURIComponent(key), "format=json"];
  for (const [k, v] of Object.entries(params || {})) {
    // tags are joined with a literal "+" (that is how Jamendo separates several tags)
    const val = (k === "fuzzytags" || k === "tags") ? String(v).split("+").map(encodeURIComponent).join("+") : encodeURIComponent(v);
    q.push(k + "=" + val);
  }
  return JAM_API + path + "?" + q.join("&");
}
// Fallback for browsers/networks where a cross-origin fetch is refused: JSONP (Jamendo supports it).
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = "jamcb_" + Math.random().toString(36).slice(2);
    const el = document.createElement("script");
    const timer = setTimeout(() => { cleanup(); reject(new Error("timeout")); }, 12000);
    function cleanup() { clearTimeout(timer); delete window[cb]; el.remove(); }
    window[cb] = (d) => { cleanup(); resolve(d); };
    el.onerror = () => { cleanup(); reject(new Error("script")); };
    el.src = url + "&callback=" + cb;
    document.head.appendChild(el);
  });
}
async function jamGet(path, params, key = jamId) {
  if (!key) throw new Error("no key");
  const url = jamUrl(path, params, key);
  let data;
  try { data = await (await fetch(url)).json(); }
  catch { data = await jsonp(url); }
  const hd = data && data.headers;
  if (!hd || hd.status === "failed" || (hd.code && Number(hd.code) !== 0)) throw new Error((hd && hd.error_message) || "jamendo error");
  return data.results || [];
}
function jamTag(tag) { return String(tag || "").toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, ""); }
function jamTrack(r) {
  const mi = r.musicinfo || {};
  const tg = mi.tags && typeof mi.tags === "object" ? mi.tags : {};
  const tags = [].concat(tg.genres || [], tg.instruments || [], tg.vartags || []).map((x) => String(x).toLowerCase()).filter((x, i, arr) => x && arr.indexOf(x) === i).slice(0, 8);
  const allowed = r.audiodownload_allowed !== false && !!r.audiodownload;
  return {
    src: "jamendo", jid: String(r.id),
    title: r.name || r.title || "Jamendo " + r.id,
    album: [r.artist_name, r.album_name].filter(Boolean).join(" · "),
    format: "MP3",
    orig: "https://www.jamendo.com/track/" + r.id,
    streamUrl: r.audio || "",
    dlUrl: allowed ? r.audiodownload : "",
    filename: r.id + ".mp3",
    tags,
    match: typeof r.score === "number" ? r.score : undefined
  };
}
function radioSource() {
  const src = radio.source || (jamId ? "jamendo" : "archive");
  return src === "jamendo" && !jamId ? "archive" : src;
}

// Pick and play a song with the same style as the current one.
async function radioNext() {
  if (radio.busy) return;
  radio.busy = true;
  radioMsg("radioSearching");
  renderRadio();
  try {
    if (radioSource() === "jamendo") await radioStepJamendo(); else await radioStepArchive();
  } finally {
    radio.busy = false;
    renderRadio();
  }
}

async function radioStepArchive() {
  try {
    const seeds = await radioSeeds();
    if (!seeds.length) { radioMsg("radioNoStyle", "bad"); return; }
    const cur = curTrack();
    const curId = cur ? trackId(cur) : "";
    let found = await radioFind(seeds, curId);
    if (!found && radio.seen.length) { radio.seen = []; found = await radioFind(seeds, curId); }
    updateBadge(false);
    if (!found) { radioMsg("radioNoResult", "bad"); return; }
    radio.seen = [...radio.seen, found.id].slice(-40);
    const idx = Math.floor(Math.random() * found.list.length);
    tracks = found.list;
    recordPlays = true;
    play(idx);
    addPick(found.list[idx]);
    radioMsg(null);
  } catch (e) {
    updateBadge(true);
    radioMsg("radioFail", "bad");
  }
}

async function radioStepJamendo() {
  try {
    const cur = curTrack();
    const base = { include: "musicinfo", audioformat: "mp32", audiodlformat: "mp32" };
    let pool = [], similar = false;
    if (!radio.manual && cur && cur.src === "jamendo" && cur.jid) {
      // The current song is from Jamendo: ask Jamendo for songs similar to exactly this one.
      pool = await jamGet("/tracks/similar/", { ...base, id: cur.jid, limit: 30 });
      similar = true;
    } else {
      // Start from a style (station / chosen tag / tags of the current non-Jamendo song).
      const seeds = (await radioSeeds()).map(jamTag).filter(Boolean);
      if (!seeds.length) { radioMsg("radioNoStyle", "bad"); return; }
      const order = { order: "popularity_week", limit: 50 };
      pool = await jamGet("/tracks/", { ...base, ...order, fuzzytags: seeds.slice(0, 3).join("+") });
      if (!pool.length) pool = await jamGet("/tracks/", { ...base, ...order, search: seeds[0] });
    }
    const curKey = cur && cur.jid ? "j" + cur.jid : "";
    const usable = pool.filter((r) => r && r.id != null && r.audio && "j" + r.id !== curKey);
    let fresh = usable.filter((r) => !radio.seen.includes("j" + r.id));
    if (!fresh.length && usable.length) { radio.seen = []; fresh = usable; }
    if (!fresh.length) { radioMsg("radioNoResult", "bad"); return; }
    // "Similar" results are sorted best-match first, so choose among the top few; style lists vary more.
    const pick = fresh[Math.floor(Math.random() * Math.min(similar ? 3 : 25, fresh.length))];
    const tr = jamTrack(pick);
    radio.seen = [...radio.seen, "j" + pick.id].slice(-60);
    tracks = [tr];
    recordPlays = true;
    play(0);
    addPick(tr);
    radioMsg(null);
  } catch (e) {
    radioMsg("jamFail", "bad");
  }
}
function goNext() {
  const cur = curTrack();
  if (radio.on && !(cur && cur.src === "embed")) radioNext(); else play(current + 1);
}

function addPick(tr) {
  radio.picks = [slim(tr), ...radio.picks.filter((p) => p.orig !== tr.orig)].slice(0, 10);
  setJSON("rz-radio-picks", radio.picks);
}
function setRadio(on, silent) {
  radio.on = !!on;
  setRaw("rz-radio", radio.on ? "1" : "0");
  if (!silent) toast(t(radio.on ? "radioOn" : "radioOff"));
  renderRadio();
}
function playPick(i) {
  tracks = radio.picks.map((p) => ({ ...p }));
  recordPlays = true;
  play(i);
}
function chipButton(text, on, fn) {
  const c = document.createElement("button");
  c.type = "button"; c.className = "chip" + (on ? " on" : ""); c.textContent = text;
  c.addEventListener("click", fn);
  return c;
}

function setSource(src) {
  radio.source = src;
  setRaw("rz-radio-source", src);
  radio.seen = [];
  renderSource();
  renderRadio();
}
function renderSource() {
  const eff = radioSource();
  $("srcJamendo").setAttribute("aria-checked", eff === "jamendo" ? "true" : "false");
  $("srcArchive").setAttribute("aria-checked", eff === "archive" ? "true" : "false");
  $("radioSourceHint").textContent = !jamId ? t("srcNoKey") : t(eff === "jamendo" ? "srcHintJam" : "srcHintArc");
}

function renderRadio() {
  const sw = $("radioSwitch"), tg = $("radioToggle");
  sw.classList.toggle("on", radio.on); sw.setAttribute("aria-checked", radio.on ? "true" : "false");
  tg.classList.toggle("on", radio.on); tg.setAttribute("aria-pressed", radio.on ? "true" : "false");
  $("radioNextBtn").disabled = radio.busy;

  const cur = curTrack();
  const visible = !$("view-radio").hidden;
  // Fetch the style in the background only when it is needed (radio on, or the radio tab is open).
  if (cur && !Array.isArray(cur.tags) && !cur.tagsFailed && (radio.on || visible)) ensureTags(cur).then(renderRadio);
  if (!visible) return;

  $("radioMode").textContent = radio.manual ? t("radioModeManual", { tag: radio.manual }) : t("radioModeAuto");
  $("radioAutoBtn").hidden = !radio.manual;
  const now = $("radioNow"), box = $("radioTags");
  box.innerHTML = "";
  if (!cur) { now.textContent = t("radioNoTrack"); }
  else if (!Array.isArray(cur.tags)) { now.textContent = cur.title; box.textContent = cur.tagsFailed ? t("radioNoTags") : t("radioLoadingTags"); }
  else {
    now.textContent = cur.title + (cur.match != null ? " · " + t("matchPct", { n: Math.round(cur.match * 100) }) : "");
    if (!cur.tags.length) box.textContent = t("radioNoTags");
    cur.tags.forEach((tag) => box.appendChild(chipButton(tag, radio.manual === tag, () => {
      radio.manual = tag; toast(t("radioUseStyle", { tag })); renderRadio();
    })));
  }
  renderRadioMsg();

  const list = $("radioPicks");
  list.innerHTML = "";
  $("radioPicksEmpty").hidden = radio.picks.length > 0;
  radio.picks.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "hrow glass";
    row.dataset.orig = p.orig;
    const info = document.createElement("div"); info.className = "hinfo";
    const ti = document.createElement("div"); ti.className = "t"; ti.textContent = p.title;
    const a = document.createElement("div"); a.className = "a"; a.textContent = [p.album, p.match != null ? t("matchPct", { n: Math.round(p.match * 100) }) : (p.tags || []).slice(0, 3).join(" · ")].filter(Boolean).join(" — ");
    info.append(ti, a);
    info.addEventListener("click", () => playPick(i));
    const btns = document.createElement("div"); btns.className = "hbtns";
    btns.append(makeBtn(t("btnPlay"), t("play"), () => playPick(i)), makeHeart(p), makeBtn(t("btnShare"), t("share"), () => share(p)));
    row.append(info, btns);
    list.appendChild(row);
  });
  markActive();
}

(function initRadio() {
  const box = $("radioStations");
  STATIONS.forEach((st) => box.appendChild(chipButton(st, false, () => {
    radio.manual = st; setRadio(true, true); radioNext();
  })));
  $("radioSwitch").addEventListener("click", () => setRadio(!radio.on));
  $("radioToggle").addEventListener("click", () => setRadio(!radio.on));
  $("radioNextBtn").addEventListener("click", () => radioNext());
  $("radioAutoBtn").addEventListener("click", () => { radio.manual = ""; renderRadio(); });
  $("srcJamendo").addEventListener("click", () => {
    if (!jamId) { toast(t("jamNeedsKeyToast")); showView("settings"); return; }
    setSource("jamendo");
  });
  $("srcArchive").addEventListener("click", () => setSource("archive"));
})();

// ---------- Original songs: official players only (YouTube / Spotify / SoundCloud embeds) ----------
// Nothing here downloads or re-hosts audio; the song plays inside the service's own player.
const KIND_NAME = { youtube: "YouTube", spotify: "Spotify", soundcloud: "SoundCloud" };
const SC_RESERVED = new Set(["discover", "stream", "search", "you", "upload", "pages", "charts", "feed", "settings", "messages", "notifications", "terms-of-use"]);
function parseEmbed(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
  const seg = u.pathname.split("/").filter(Boolean);
  if (host === "youtu.be" || host === "youtube.com" || host === "youtube-nocookie.com") {
    let id = "";
    if (host === "youtu.be") id = seg[0] || "";
    else if (u.pathname === "/watch") id = u.searchParams.get("v") || "";
    else if (["shorts", "embed", "live", "v"].includes(seg[0])) id = seg[1] || "";
    if (/^[A-Za-z0-9_-]{11}$/.test(id)) {
      return { kind: "youtube", etype: "video", eid: id, orig: "https://www.youtube.com/watch?v=" + id };
    }
    return null;
  }
  if (host === "open.spotify.com") {
    const s = seg[0] && seg[0].startsWith("intl-") ? seg.slice(1) : seg;
    if (["track", "album", "playlist", "episode", "show", "artist"].includes(s[0]) && /^[A-Za-z0-9]{10,30}$/.test(s[1] || "")) {
      return { kind: "spotify", etype: s[0], eid: s[1], orig: "https://open.spotify.com/" + s[0] + "/" + s[1] };
    }
    return null;
  }
  if (host === "soundcloud.com" && seg.length >= 2 && !SC_RESERVED.has(seg[0].toLowerCase()) && seg.every((p) => /^[\w.%-]+$/.test(p))) {
    const path = seg.slice(0, 3).join("/");
    return { kind: "soundcloud", etype: "track", eid: path, orig: "https://soundcloud.com/" + path };
  }
  return null;
}
function embedTrack(e, title, album) {
  return { src: "embed", kind: e.kind, etype: e.etype, eid: e.eid, title: title || KIND_NAME[e.kind], album: album || KIND_NAME[e.kind], format: KIND_NAME[e.kind], orig: e.orig, filename: "", tags: [] };
}
function dlBtns(tr, text, label) {
  return tr.src === "embed" ? [] : [makeBtn(text, label, () => download(tr))];
}
function embedSrc(tr) {
  if (tr.kind === "youtube") return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(tr.eid) + "?autoplay=1&playsinline=1&rel=0";
  if (tr.kind === "spotify") return "https://open.spotify.com/embed/" + tr.etype + "/" + encodeURIComponent(tr.eid);
  return "https://w.soundcloud.com/player/?url=" + encodeURIComponent(tr.orig) + "&auto_play=true&visual=false";
}
function embedHeight(tr) {
  if (tr.kind === "spotify") return tr.etype === "track" || tr.etype === "episode" ? 152 : 352;
  if (tr.kind === "soundcloud") return 166;
  return 0; // youtube: 16:9
}
function openEmbed(tr) {
  const frame = $("embedFrame");
  frame.innerHTML = "";
  const f = document.createElement("iframe");
  f.src = embedSrc(tr);
  f.title = tr.title;
  f.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write";
  f.allowFullscreen = true;
  f.referrerPolicy = "strict-origin-when-cross-origin";
  const hgt = embedHeight(tr);
  frame.classList.toggle("video", !hgt);
  if (hgt) f.height = String(hgt);
  frame.appendChild(f);
  $("embedTitle").textContent = tr.title;
  $("embedSub").textContent = tr.album || "";
  $("embedNote").textContent = t(tr.kind === "youtube" ? "embedNoteYt" : tr.kind === "spotify" ? "embedNoteSp" : "embedNoteSc");
  $("embedOpen").href = tr.orig;
  $("embedFav").dataset.fav = tr.orig;
  setHeartState($("embedFav"), isFav(tr.orig));
  $("embedSheet").hidden = false;
}
function closeEmbed() {
  $("embedSheet").hidden = true;
  $("embedFrame").innerHTML = ""; // removing the iframe stops the playback
}
$("embedClose").addEventListener("click", closeEmbed);
$("embedSheet").addEventListener("click", (e) => { if (e.target === $("embedSheet")) closeEmbed(); });
$("embedReopen").addEventListener("click", () => { const c = curTrack(); if (c && c.src === "embed") openEmbed(c); });
$("embedFav").addEventListener("click", () => { const c = curTrack(); if (c) toggleFav(c); });
$("embedShare").addEventListener("click", () => { const c = curTrack(); if (c) share(c); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("embedSheet").hidden && $("shareSheet").hidden) closeEmbed(); });

function decodeHtml(s) { const ta = document.createElement("textarea"); ta.innerHTML = String(s || ""); return ta.value; }

async function ytSearch(query) {
  if (!ytKey) { setStatus("ytNeedKey", { labelKey: "goSettings", fn: () => showView("settings") }); return; }
  setStatus("searching");
  const url = YT_API + "/search?part=snippet&type=video&videoCategoryId=10&videoEmbeddable=true&maxResults=15&q=" +
    encodeURIComponent(query) + "&key=" + encodeURIComponent(ytKey);
  try {
    const r = await fetch(url);
    const d = await r.json();
    if (d && d.error) {
      const reason = d.error.errors && d.error.errors[0] && d.error.errors[0].reason;
      setStatus(reason === "quotaExceeded" || reason === "dailyLimitExceeded" || reason === "rateLimitExceeded" ? "ytQuota" : "ytSearchFail");
      return;
    }
    const list = ((d && d.items) || []).filter((it) => it && it.id && it.id.videoId).map((it) => {
      const sn = it.snippet || {};
      return embedTrack({ kind: "youtube", etype: "video", eid: it.id.videoId, orig: "https://www.youtube.com/watch?v=" + it.id.videoId }, decodeHtml(sn.title), decodeHtml(sn.channelTitle));
    });
    if (!list.length) { setStatus("ytNoResults"); return; }
    setStatus(null);
    showTracks(query, list, false);
  } catch (e) {
    setStatus("ytSearchFail");
  }
}

async function openEmbedLink(e) {
  let title = "", album = "";
  const oe = e.kind === "youtube" ? "https://www.youtube.com/oembed?format=json&url="
    : e.kind === "spotify" ? "https://open.spotify.com/oembed?url="
    : "https://soundcloud.com/oembed?format=json&url=";
  try { // best effort: a nicer title if the service answers quickly
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 3500);
    const r = await fetch(oe + encodeURIComponent(e.orig), { signal: ac.signal });
    clearTimeout(to);
    const d = await r.json();
    title = decodeHtml(d.title); album = decodeHtml(d.author_name || d.provider_name || "");
  } catch {}
  setStatus(null);
  showTracks(title || KIND_NAME[e.kind], [embedTrack(e, title, album)], true);
}

function renderMode() {
  $("modeFree").setAttribute("aria-checked", mode === "free" ? "true" : "false");
  $("modeOriginal").setAttribute("aria-checked", mode === "original" ? "true" : "false");
  $("q").placeholder = t(mode === "original" ? "searchPhOriginal" : "searchPh");
  $("modeHint").textContent = t(mode === "original" ? "modeHintOriginal" : "modeHintFree");
}
function setMode(m) {
  mode = m;
  setRaw("rz-mode", m);
  renderMode();
}
$("modeFree").addEventListener("click", () => setMode("free"));
$("modeOriginal").addEventListener("click", () => setMode("original"));

// ---------- Shared link / pasted link ----------
async function loadJamendoTrack(id) {
  if (!jamId) { setStatus("jamNeedsKey", { labelKey: "goSettings", fn: () => showView("settings") }); return; }
  setStatus("loadingTracks");
  try {
    const res = await jamGet("/tracks/", { id, include: "musicinfo", audioformat: "mp32", audiodlformat: "mp32" });
    if (!res.length) { setStatus("noAudio"); return; }
    const tr = jamTrack(res[0]);
    setStatus(null);
    showTracks(tr.album || tr.title, [tr], true);
  } catch (e) {
    setStatus("jamFail");
  }
}

function openFromUrl(raw) {
  let u;
  try { u = new URL(canonical(raw.trim())); } catch { setStatus("invalidLink"); return; }
  const emb = parseEmbed(u.href);
  if (emb) { openEmbedLink(emb); return; }
  if (u.hostname === "jamendo.com" || u.hostname.endsWith(".jamendo.com")) {
    const jm = u.pathname.match(/\/track\/(\d+)/);
    if (jm) { loadJamendoTrack(jm[1]); return; }
  }
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
  setStatus("unsupportedLink");
}

$("searchForm").addEventListener("submit", (e) => { e.preventDefault(); search($("q").value); });
$("linkForm").addEventListener("submit", (e) => { e.preventDefault(); openFromUrl($("linkInput").value); });

// ---------- Proxy settings ----------
$("proxyInput").value = proxyBase;
$("proxyForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const typed = normalizeProxy($("proxyInput").value);
  setRaw("rz-proxy", typed);
  proxyBase = typed || SAME_SITE_PROXY;
  $("proxyInput").value = proxyBase;
  updateBadge(false);
  proxyMsg(proxyBase ? "proxySaved" : "proxyRemoved");
  toast(t("settingsSaved"));
});
$("proxyClear").addEventListener("click", () => {
  setRaw("rz-proxy", "");
  proxyBase = SAME_SITE_PROXY;
  $("proxyInput").value = proxyBase;
  updateBadge(false);
  proxyMsg("proxyRemoved");
});
$("proxyTest").addEventListener("click", async () => {
  const v = normalizeProxy($("proxyInput").value);
  proxyMsg("proxyTesting");
  try {
    const r = await fetch((v || ORIGIN) + "/advancedsearch.php?q=" + encodeURIComponent("title:test AND mediatype:audio") + "&fl[]=identifier&rows=1&output=json");
    const d = await r.json();
    if (d && d.response) proxyMsg("proxyOk", "ok");
    else proxyMsg("proxyBadResp", "bad");
  } catch {
    proxyMsg("proxyFail", "bad");
  }
});

// ---------- Jamendo key settings ----------
let jamState = null;
function jamMsg(key, cls) { jamState = key ? { key, cls } : null; renderJamMsg(); }
function renderJamMsg() {
  const el = $("jamMsg");
  el.textContent = jamState ? t(jamState.key) : "";
  el.dataset.state = (jamState && jamState.cls) || "";
}
function normalizeJam(v) { v = (v || "").trim(); return /^[A-Za-z0-9]{4,40}$/.test(v) ? v : ""; }
$("jamInput").value = jamId;
$("jamForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = $("jamInput").value.trim();
  const v = normalizeJam(raw);
  if (raw && !v) { jamMsg("jamBadId", "bad"); return; }
  jamId = v;
  setRaw("rz-jamendo", v);
  radio.seen = [];
  jamMsg(v ? "jamSaved" : "jamRemoved");
  renderSource();
  renderRadio();
  toast(t("settingsSaved"));
});
$("jamClear").addEventListener("click", () => {
  jamId = "";
  setRaw("rz-jamendo", "");
  $("jamInput").value = "";
  radio.seen = [];
  jamMsg("jamRemoved");
  renderSource();
  renderRadio();
});
$("jamTest").addEventListener("click", async () => {
  const raw = $("jamInput").value.trim();
  const v = normalizeJam(raw);
  if (!v) { jamMsg("jamBadId", "bad"); return; }
  jamMsg("proxyTesting");
  try { await jamGet("/tracks/", { limit: 1 }, v); jamMsg("jamTestOk", "ok"); }
  catch { jamMsg("jamTestFail", "bad"); }
});

// ---------- YouTube key settings ----------
let ytState = null;
function ytMsg(key, cls) { ytState = key ? { key, cls } : null; renderYtMsg(); }
function renderYtMsg() {
  const el = $("ytMsg");
  el.textContent = ytState ? t(ytState.key) : "";
  el.dataset.state = (ytState && ytState.cls) || "";
}
function normalizeYt(v) { v = (v || "").trim(); return /^[A-Za-z0-9_-]{20,80}$/.test(v) ? v : ""; }
$("ytInput").value = ytKey;
$("ytForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = $("ytInput").value.trim();
  const v = normalizeYt(raw);
  if (raw && !v) { ytMsg("ytBadKey", "bad"); return; }
  ytKey = v;
  setRaw("rz-ytkey", v);
  ytMsg(v ? "ytSaved" : "ytRemoved");
  toast(t("settingsSaved"));
});
$("ytClear").addEventListener("click", () => {
  ytKey = "";
  setRaw("rz-ytkey", "");
  $("ytInput").value = "";
  ytMsg("ytRemoved");
});
$("ytTest").addEventListener("click", async () => {
  const v = normalizeYt($("ytInput").value);
  if (!v) { ytMsg("ytBadKey", "bad"); return; }
  ytMsg("proxyTesting");
  try {
    const d = await (await fetch(YT_API + "/videos?part=id&id=dQw4w9WgXcQ&key=" + encodeURIComponent(v))).json();
    if (d && !d.error && Array.isArray(d.items)) ytMsg("ytTestOk", "ok"); else ytMsg("ytTestFail", "bad");
  } catch { ytMsg("ytTestFail", "bad"); }
});

// ---------- Start ----------
applyLang(getRaw("rz-lang") || "fa");
const params = new URLSearchParams(location.search);
let shared = params.get("url");
if (!shared) {
  const m = (params.get("text") || "").match(/https?:\/\/\S+/);
  if (m) shared = m[0];
}
if (shared) { $("linkInput").value = shared; $("linkBox").open = true; openFromUrl(shared); }

// ---------- Install as a phone app (PWA) ----------
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
