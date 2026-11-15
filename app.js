const form = document.getElementById('searchForm');
const queryInput = document.getElementById('query');
const resultsEl = document.getElementById('results');
const messageEl = document.getElementById('message');
const titleEl = document.getElementById('resultsTitle');
const countEl = document.getElementById('resultCount');
const button = document.getElementById('searchButton');
const apiKeyInput = document.getElementById('apiKey');

apiKeyInput.value = localStorage.getItem('rz_lastfm_key') || '';
document.getElementById('saveKey').addEventListener('click', () => {
  localStorage.setItem('rz_lastfm_key', apiKeyInput.value.trim());
  alert('کلید در همین مرورگر ذخیره شد.');
});

function showMessage(title, detail, symbol='♫') {
  messageEl.classList.remove('hidden');
  messageEl.innerHTML = `<div class="empty-icon">${symbol}</div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;
}
function escapeHtml(value='') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function spotifySearch(track, artist) {
  return 'https://open.spotify.com/search/' + encodeURIComponent(`${track} ${artist}`);
}
function renderTracks(tracks) {
  resultsEl.innerHTML = '';
  if (!tracks.length) {
    showMessage('نتیجه‌ای پیدا نشد', 'نام آهنگ یا خواننده دیگری را امتحان کن.');
    countEl.textContent = '';
    return;
  }
  messageEl.classList.add('hidden');
  countEl.textContent = `${tracks.length} TRACKS`;
  tracks.forEach((t, i) => {
    const name = t.name || 'Unknown track';
    const artist = t.artist?.name || t.artist || 'Unknown artist';
    const card = document.createElement('article');
    card.className = 'track';
    card.innerHTML = `
      <div class="track-art">♫</div>
      <div class="track-info">
        <div class="track-title" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
        <div class="track-artist">${escapeHtml(artist)}</div>
      </div>
      <div class="track-actions">
        <a class="spotify-link" href="${spotifySearch(name, artist)}" target="_blank" rel="noopener">Spotify ↗</a>
        <button type="button" aria-label="کپی نام آهنگ" title="کپی نام آهنگ">⧉</button>
      </div>`;
    card.querySelector('button').addEventListener('click', async () => {
      await navigator.clipboard.writeText(`${name} - ${artist}`);
      card.querySelector('button').textContent = '✓';
    });
    resultsEl.appendChild(card);
  });
}
async function lastfm(method, params) {
  const key = localStorage.getItem('rz_lastfm_key');
  if (!key) throw new Error('برای دریافت پیشنهادهای واقعی، ابتدا API Key رایگان Last.fm را در بخش تنظیمات وارد کن.');
  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  Object.entries({...params, method, api_key:key, format:'json'}).forEach(([k,v]) => url.searchParams.set(k,v));
  const response = await fetch(url);
  if (!response.ok) throw new Error('ارتباط با Last.fm برقرار نشد. دوباره تلاش کن.');
  const data = await response.json();
  if (data.error) throw new Error(data.message || 'خطای Last.fm');
  return data;
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = queryInput.value.trim();
  if (!query) return;
  button.disabled = true;
  button.textContent = 'در حال جست‌وجو...';
  resultsEl.innerHTML = '';
  titleEl.textContent = `نتایج برای «${query}»`;
  showMessage('در حال کشف موسیقی...', 'در حال جست‌وجو در Last.fm', '◌');
  try {
    const search = await lastfm('track.search', {'track':query, 'limit':1});
    const matches = search.results?.trackmatches?.track || [];
    if (!matches.length) throw new Error('آهنگی با این عبارت پیدا نشد.');
    const seed = matches[0];
    const similar = await lastfm('track.getSimilar', {'artist':seed.artist, 'track':seed.name, 'limit':20});
    const tracks = similar.similartracks?.track || [];
    titleEl.textContent = `آهنگ‌های مشابه ${seed.name}`;
    renderTracks(tracks);
  } catch (err) {
    showMessage('جست‌وجو کامل نشد', err.message || 'خطای ناشناخته. تنظیمات اتصال را بررسی کن.', '!');
  } finally {
    button.disabled = false;
    button.innerHTML = 'کشف آهنگ‌ها <span>↗</span>';
  }
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.warn));
}
