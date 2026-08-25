/* Huny — Phase 3: talk to the Audius API */

const APP_NAME = 'huny-player';

/* Audius runs on many independent servers ("hosts").
   We ask for a working one, and fall back to known ones if that fails. */
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

/* Draw a grid of song cards into any container */
function renderGrid(container, tracks){
  container.innerHTML = '';
  tracks.forEach((t) => {
    const card = document.createElement('div');
    card.className = 'card';
    const art = artworkOf(t);
    card.innerHTML = `
      <div class="thumb">${art ? `<img src="${art}" alt="">` : ''}</div>
      <p class="title">${escapeHtml(t.title)}</p>
      <p class="artist">${escapeHtml(t.user?.name || 'Unknown artist')}</p>
    `;
    container.appendChild(card);
  });
}

/* Load trending songs when the page opens */
const trendingGrid = document.getElementById('trendingGrid');
Api.trending()
  .then(({ data }) => renderGrid(trendingGrid, data))
  .catch(() => { trendingGrid.innerHTML = '<p style="color:#8c8d90">Could not load trending songs. Refresh to retry.</p>'; });

/* Search bar */
const searchInput = document.getElementById('searchInput');
const searchView = document.getElementById('searchView');
const homeView = document.getElementById('homeView');
const resultsGrid = document.getElementById('resultsGrid');
const searchHeading = document.getElementById('searchHeading');

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const q = searchInput.value.trim();
  if (!q) {
    homeView.hidden = false;
    searchView.hidden = true;
    return;
  }
  searchTimer = setTimeout(() => {
    homeView.hidden = true;
    searchView.hidden = false;
    searchHeading.textContent = `Results for "${q}"`;
    Api.search(q)
      .then(({ data }) => renderGrid(resultsGrid, data))
      .catch(() => { resultsGrid.innerHTML = '<p style="color:#8c8d90">Search failed. Try again.</p>'; });
  }, 400);
});
