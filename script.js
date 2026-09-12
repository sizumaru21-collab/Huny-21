/* Huny — Phase 4: real playback (with auto-retry if a server fails) */

const APP_NAME = 'huny-player';

const Api = (() => {
  let hosts = [
    'https://discoveryprovider.audius.co',
    'https://discoveryprovider2.audius.co',
    'https://discoveryprovider3.audius.co'
  ];
  let hostsFetched = false;

  async function refreshHosts(){
    if (hostsFetched) return;
    try {
      const res = await fetch('https://api.audius.co');
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length) hosts = json.data;
    } catch (e) {}
    hostsFetched = true;
  }

  async function get(path){
    await refreshHosts();
    let lastErr;
    for (const host of hosts){
      try {
        const url = `${host}${path}${path.includes('?') ? '&' : '?'}app_name=${APP_NAME}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        return { data: json.data, host };
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('No Audius host reachable');
  }

  return {
    trending: () => get('/v1/tracks/trending?limit=24'),
    search:   (q) => get(`/v1/tracks/search?query=${encodeURIComponent(q)}`),
    streamUrl: (host, id) => `${host}/v1/tracks/${id}/stream?app_name=${APP_NAME}`,
    allHosts: () => hosts,
  };
})();

function artworkOf(track){
  const art = track.artwork || {};
  return art['480x480'] || art['150x150'] || '';
}
function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

let queue = [];
let currentIndex = -1;
let currentHost = '';
let hostAttempt = 0;

const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const seek = document.getElementById('seek');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const volume = document.getElementById('volume');
const npArt = document.getElementById('npArt');
const npTitle = document.getElementById('npTitle');
const npArtist = document.getElementById('npArtist');
const statusMsg = document.createElement('p');
statusMsg.style.cssText = 'color:#ff8a8a;font-size:11px;grid-column:1/4;text-align:center;';
document.querySelector('.player-bar').appendChild(statusMsg);

function renderGrid(container, tracks, host){
  container.innerHTML = '';
  tracks.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    const art = artworkOf(t);
    card.innerHTML = `
      <div class="thumb">${art ? `<img src="${art}" alt="">` : ''}</div>
      <p class="title">${escapeHtml(t.title)}</p>
      <p class="artist">${escapeHtml(t.user?.name || 'Unknown artist')}</p>
    `;
    card.addEventListener('click', () => {
      queue = tracks;
      currentHost = host;
      hostAttempt = 0;
      loadTrack(i);
      audio.play().catch(() => {});
    });
    container.appendChild(card);
  });
}

function loadTrack(i){
  currentIndex = i;
  const t = queue[i];
  statusMsg.textContent = '';
  audio.src = Api.streamUrl(currentHost, t.id);
  npTitle.textContent = t.title;
  npArtist.textContent = t.user?.name || 'Unknown artist';
  npArt.src = artworkOf(t);
}

audio.addEventListener('error', () => {
  const hosts = Api.allHosts();
  hostAttempt++;
  if (hostAttempt < hosts.length && queue[currentIndex]){
    currentHost = hosts[hostAttempt];
    statusMsg.textContent = 'That server was down — trying another…';
    audio.src = Api.streamUrl(currentHost, queue[currentIndex].id);
    audio.play().catch(() => {});
  } else {
    statusMsg.textContent = 'This track is unavailable right now. Try another song.';
  }
});

playBtn.addEventListener('click', () => {
  if (currentIndex === -1) return;
  if (audio.paused) audio.play().catch(() => {}); else audio.pause();
});
audio.addEventListener('play',  () => { playBtn.textContent = '⏸'; });
audio.addEventListener('pause', () => { playBtn.textContent = '▶'; });

function step(direction){
  if (!queue.length) return;
  let next = currentIndex + direction;
  if (next < 0) next = queue.length - 1;
  if (next >= queue.length) next = 0;
  hostAttempt = 0;
  loadTrack(next);
  audio.play().catch(() => {});
}
prevBtn.addEventListener('click', () => step(-1));
nextBtn.addEventListener('click', () => step(1));
audio.addEventListener('ended', () => step(1));

audio.addEventListener('loadedmetadata', () => {
  seek.max = audio.duration || 0;
  durationEl.textContent = formatTime(audio.duration);
});
let isSeeking = false;
audio.addEventListener('timeupdate', () => {
  if (!isSeeking) seek.value = audio.currentTime;
  currentTimeEl.textContent = formatTime(audio.currentTime);
});
seek.addEventListener('input', () => { isSeeking = true; });
seek.addEventListener('change', () => { audio.currentTime = seek.value; isSeeking = false; });

function formatTime(sec){
  if (!sec && sec !== 0) return '0:00';
  sec = Math.floor(sec);
  return Math.floor(sec/60) + ':' + String(sec%60).padStart(2,'0');
}
volume.addEventListener('input', () => { audio.volume = volume.value; });

const trendingGrid = document.getElementById('trendingGrid');
Api.trending()
  .then(({ data, host }) => renderGrid(trendingGrid, data, host))
  .catch(() => { trendingGrid.innerHTML = '<p style="color:#8c8d90">Could not load trending songs. Refresh to retry.</p>'; });

const searchInput = document.getElementById('searchInput');
const searchView = document.getElementById('searchView');
const homeView = document.getElementById('homeView');
const resultsGrid = document.getElementById('resultsGrid');
const searchHeading = document.getElementById('searchHeading');

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const q = searchInput.value.trim();
  if (!q) { homeView.hidden = false; searchView.hidden = true; return; }
  searchTimer = setTimeout(() => {
    homeView.hidden = true;
    searchView.hidden = false;
    searchHeading.textContent = `Results for "${q}"`;
    Api.search(q)
      .then(({ data, host }) => renderGrid(resultsGrid, data, host))
      .catch(() => { resultsGrid.innerHTML = '<p style="color:#8c8d90">Search failed. Try again.</p>'; });
  }, 400);
});
