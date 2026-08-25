/* Huny — Phase 4: real playback */

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

/* ---------- PLAYER STATE ----------
   These variables remember "what's going on right now":
   which list of songs we're playing through, and which
   song in that list is currently active. */
let queue = [];
let currentIndex = -1;
let currentHost = '';

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

/* Draw song cards, and make each one clickable */
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
    // This is the new part: clicking a card sets it as "now playing"
    card.addEventListener('click', () => {
      queue = tracks;       // remember the whole list we clicked from
      currentHost = host;   // remember which Audius server has these songs
      loadTrack(i);         // set this specific song as current
      audio.play();         // start playing it
    });
    container.appendChild(card);
  });
}

/* Load a track into the <audio> player and update the bottom bar */
function loadTrack(i){
  currentIndex = i;
  const t = queue[i];
  audio.src = Api.streamUrl(currentHost,
