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
let hostAttempt = 0; // NEW: how many servers we've tried for the current song

const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const seek = document.getElementById('seek');
const currentTimeEl = document.getElementById('currentTime');
