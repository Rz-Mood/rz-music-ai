const $=id=>document.getElementById(id);
const form=$('searchForm'), queryInput=$('query'), artistInput=$('artist'), resultsEl=$('results'), messageEl=$('message'), titleEl=$('resultsTitle'), countEl=$('resultCount'), button=$('searchButton'), apiKeyInput=$('apiKey');
let lang=localStorage.getItem('rz_mood_lang')||'fa';
const copy={fa:{search:'کشف آهنگ‌ها',loading:'در حال جست‌وجو...',empty:'نتیجه‌ای پیدا نشد',try:'عبارت دیگری را امتحان کن.',artists:'هنرمندان مشابه',tracks:'آهنگ‌های مشابه',start:'از یک آهنگ شروع کن',startHint:'نام آهنگ یا هنرمند موردعلاقه‌ات را بالا بنویس.',searching:'در حال کشف موسیقی...',searchingHint:'در حال دریافت پیشنهادها از MusicAtlas',failed:'جست‌وجو کامل نشد',key:'ابتدا API Key رایگان MusicAtlas را در تنظیمات وارد و ذخیره کن.',invalid:'کلید API معتبر نیست یا دسترسی آن فعال نشده است.',quota:'سهمیه درخواست تمام شده است. بعداً دوباره امتحان کن.',network:'ارتباط با MusicAtlas برقرار نشد. اینترنت یا محدودیت مرورگر را بررسی کن.',copy:'کپی نام',copied:'کپی شد',spotify:'Spotify',open:'بازکردن منبع',share:'اشتراک',download:'دانلود',noDownload:'دانلود مستقیم برای این آهنگ ارائه نشده؛ از صفحه منبع استفاده کن.',saved:'کلید ذخیره شد.',removed:'کلید ذخیره‌شده پاک شد.'},en:{search:'Discover music',loading:'Searching...',empty:'No results found',try:'Try another search.',artists:'Similar artists',tracks:'Similar tracks',start:'Start with a song',startHint:'Enter your favorite song or artist above.',searching:'Discovering music...',searchingHint:'Fetching recommendations from MusicAtlas',failed:'Search failed',key:'Add and save your free MusicAtlas API key in settings first.',invalid:'API key is invalid or not enabled.',quota:'Request quota reached. Try again later.',network:'Could not connect to MusicAtlas. Check your connection.',copy:'Copy title',copied:'Copied',spotify:'Spotify',open:'Open source',share:'Share',download:'Download',noDownload:'No direct download is provided for this track. Use its source page.',saved:'API key saved.',removed:'Saved API key removed.'}};
function t(k){return copy[lang][k]||k}
function applyLanguage(){document.documentElement.lang=lang;document.documentElement.dir=lang==='fa'?'rtl':'ltr';$('langToggle').textContent=lang==='fa'?'EN':'فا';document.querySelectorAll('[data-fa][data-en]').forEach(el=>el.innerHTML=el.dataset[lang]);button.innerHTML=`${t('search')} <span>↗</span>`;queryInput.placeholder=lang==='fa'?'نام آهنگ یا خواننده؛ مثلاً Blinding Lights':'Song or artist, e.g. Blinding Lights';artistInput.placeholder=lang==='fa'?'مثلاً The Weeknd':'e.g. The Weeknd';}
$('langToggle').addEventListener('click',()=>{lang=lang==='fa'?'en':'fa';localStorage.setItem('rz_mood_lang',lang);applyLanguage();});
const theme=$('themeSelect');theme.value=localStorage.getItem('rz_mood_theme')||'rz';document.documentElement.dataset.theme=theme.value;theme.addEventListener('change',()=>{document.documentElement.dataset.theme=theme.value;localStorage.setItem('rz_mood_theme',theme.value);});
apiKeyInput.value=localStorage.getItem('rz_musicatlas_key')||'';
$('saveKey').addEventListener('click',()=>{const key=apiKeyInput.value.trim();if(!key){localStorage.removeItem('rz_musicatlas_key');alert(t('removed'));return;}localStorage.setItem('rz_musicatlas_key',key);alert(t('saved'));});
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeUrl(v){try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}}
function spotifySearch(track,artist){return 'https://open.spotify.com/search/'+encodeURIComponent(`${track} ${artist}`);}
function showMessage(title,detail,symbol='♫'){messageEl.classList.remove('hidden');messageEl.innerHTML=`<div class="empty-icon">${symbol}</div><strong>${esc(title)}</strong><span>${esc(detail)}</span>`;}
async function shareTrack(title,url){const payload={title:'RZ Mood',text:title,url};if(navigator.share){try{await navigator.share(payload);return;}catch(e){if(e.name==='AbortError')return;}}try{await navigator.clipboard.writeText(url);alert(lang==='fa'?'لینک کپی شد.':'Link copied.');}catch{prompt('Copy link:',url);}}
function renderTracks(items,kind='tracks'){
 resultsEl.innerHTML='';if(!items.length){showMessage(t('empty'),t('try'));countEl.textContent='';return;}
 messageEl.classList.add('hidden');countEl.textContent=`${items.length} ${kind==='artists'?'ARTISTS':'TRACKS'}`;
 items.forEach(item=>{
  const name=item.title||item.name||'Unknown', artist=item.artist||(kind==='artists'?(lang==='fa'?'هنرمند مشابه':'Similar artist'):'Unknown artist');
  const source=safeUrl(item.url||item.external_url||item.link);
  const download=safeUrl(item.download_url||item.audio_url);
  const spotify=spotifySearch(kind==='artists'?'':name,kind==='artists'?name:artist);
  const openUrl=source||spotify;
  const card=document.createElement('article');card.className='track glass-inner';
  card.innerHTML=`<div class="track-art">${kind==='artists'?'♬':'♫'}</div><div class="track-info"><div class="track-title" title="${esc(name)}">${esc(name)}</div><div class="track-artist">${esc(artist)}</div></div><div class="track-actions"><a class="spotify-link" href="${spotify}" target="_blank" rel="noopener">${t('spotify')} ↗</a><a class="source-link" href="${openUrl}" target="_blank" rel="noopener">${t('open')} ↗</a><button type="button" class="share-btn">${t('share')}</button><a class="download-link ${download?'':'disabled'}" ${download?`href="${download}" download target="_blank" rel="noopener"`:'aria-disabled="true"'}>${t('download')} ↓</a><button type="button" class="copy-btn" title="${t('copy')}">⧉</button></div>`;
  card.querySelector('.share-btn').addEventListener('click',()=>shareTrack(`${name} - ${artist}`,openUrl));
  card.querySelector('.copy-btn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(`${name} - ${artist}`);card.querySelector('.copy-btn').textContent='✓';}catch{showMessage(t('failed'),t('copy'));}});
  if(!download)card.querySelector('.download-link').addEventListener('click',e=>{e.preventDefault();alert(t('noDownload'));});
  resultsEl.appendChild(card);
 });
}
async function musicAtlas(endpoint,payload){
 const key=localStorage.getItem('rz_musicatlas_key');if(!key)throw new Error(t('key'));
 let response;try{response=await fetch(`https://musicatlas.ai/api/${endpoint}`,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});}catch{throw new Error(t('network'));}
 let data={};try{data=await response.json();}catch{}
 if(!response.ok){if([401,403].includes(response.status))throw new Error(t('invalid'));if(response.status===429)throw new Error(t('quota'));throw new Error(data.message||`MusicAtlas (${response.status})`);}return data;
}
form.addEventListener('submit',async e=>{e.preventDefault();const query=queryInput.value.trim(),artist=artistInput.value.trim();if(!query)return;button.disabled=true;button.textContent=t('loading');resultsEl.innerHTML='';countEl.textContent='';titleEl.textContent=`${query}`;showMessage(t('searching'),t('searchingHint'),'◌');try{if(artist){const data=await musicAtlas('similar_tracks',{artist,track:query});const tracks=Array.isArray(data.matches)?data.matches:[];if(!tracks.length&&data.in_catalog===false)throw new Error(data.message||t('empty'));titleEl.textContent=`${t('tracks')}: ${query}`;renderTracks(tracks,'tracks');}else{const data=await musicAtlas('similar_artists',{artist:query});const artists=Array.isArray(data.artists)?data.artists.map(a=>({name:a.name||a.artist||'Unknown',artist:t('artists')})):[];titleEl.textContent=`${t('artists')}: ${query}`;renderTracks(artists,'artists');}}catch(err){showMessage(t('failed'),err.message||'Unknown error','!');}finally{button.disabled=false;button.innerHTML=`${t('search')} <span>↗</span>`;}});
applyLanguage();
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));
