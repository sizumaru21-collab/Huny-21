/* ================= HUNY - full player script ================= */

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
        const url = host + path + (path.includes('?') ? '&' : '?') + 'app_name=' + APP_NAME;
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        return { data: json.data, host: host };
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('No Audius host reachable');
  }

  return {
    trending: function(){ return get('/v1/tracks/trending?limit=24'); },
    search: function(q){ return get('/v1/tracks/search?query=' + encodeURIComponent(q)); },
    streamUrl: function(host, id){ return host + '/v1/tracks/' + id + '/stream?app_name=' + APP_NAME; },
    allHosts: function(){ return hosts; }
  };
})();

function artworkOf(track){
  var art = track.artwork || {};
  return art['480x480'] || art['150x150'] || '';
}
function escapeHtml(str){
  var d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

var queue = [];
var currentIndex = -1;
var currentHost = '';
var hostAttempt = 0;
var isShuffled = false;
var repeatMode = 0;
var liked = JSON.parse(localStorage.getItem('huny-liked') || '[]');

var audio = document.getElementById('audio');
var playBtn = document.getElementById('playBtn');
var prevBtn = document.getElementById('prevBtn');
var nextBtn = document.getElementById('nextBtn');
var shuffleBtn = document.getElementById('shuffleBtn');
var repeatBtn = document.getElementById('repeatBtn');
var likeBtn = document.getElementById('likeBtn');
var seek = document.getElementById('seek');
var currentTimeEl = document.getElementById('currentTime');
var durationEl = document.getElementById('duration');
var volume = document.getElementById('volume');
var npArt = document.getElementById('npArt');
var npTitle = document.getElementById('npTitle');
var npArtist = document.getElementById('npArtist');
var themeToggle = document.getElementById('themeToggle');

var trendingGrid = document.getElementById('trendingGrid');
var resultsGrid = document.getElementById('resultsGrid');
var likedGrid = document.getElementById('likedGrid');
var searchInput = document.getElementById('searchInput');
var searchView = document.getElementById('searchView');
var homeView = document.getElementById('homeView');
var likedView = document.getElementById('likedView');
var searchHeading = document.getElementById('searchHeading');

var statusMsg = document.createElement('p');
statusMsg.style.cssText = 'color:#ff8a8a;font-size:11px;grid-column:1/4;text-align:center;';
document.querySelector('.player-bar').appendChild(statusMsg);

function renderGrid(container, tracks, host){
  container.innerHTML = '';
  tracks.forEach(function(t, i){
    var card = document.createElement('div');
    card.className = 'card';
    var art = artworkOf(t);
    var artHtml = art ? '<img src="' + art + '" alt="">' : '';
    card.innerHTML = '<div class="thumb">' + artHtml + '</div>' +
      '<p class="title">' + escapeHtml(t.title) + '</p>' +
      '<p class="artist">' + escapeHtml(t.user && t.user.name ? t.user.name : 'Unknown artist') + '</p>';
    card.addEventListener('click', function(){
      queue = tracks;
      currentHost = host;
      hostAttempt = 0;
      loadTrack(i);
      audio.play().catch(function(){});
    });
    container.appendChild(card);
  });
}

function loadTrack(i){
  currentIndex = i;
  var t = queue[i];
  statusMsg.textContent = '';
  audio.src = Api.streamUrl(currentHost, t.id);
  npTitle.textContent = t.title;
  npArtist.textContent = t.user && t.user.name ? t.user.name : 'Unknown artist';
  npArt.src = artworkOf(t);
  refreshLikeButton();
}

audio.addEventListener('error', function(){
  var hosts = Api.allHosts();
  hostAttempt++;
  if (hostAttempt < hosts.length && queue[currentIndex]){
    currentHost = hosts[hostAttempt];
    statusMsg.textContent = 'That server was down, trying another...';
    audio.src = Api.streamUrl(currentHost, queue[currentIndex].id);
    audio.play().catch(function(){});
  } else {
    statusMsg.textContent = 'This track is unavailable right now. Try another song.';
  }
});

playBtn.addEventListener('click', function(){
  if (currentIndex === -1) return;
  if (audio.paused) audio.play().catch(function(){}); else audio.pause();
});
audio.addEventListener('play', function(){ playBtn.textContent = 'PAUSE'; });
audio.addEventListener('pause', function(){ playBtn.textContent = 'PLAY'; });

function step(direction){
  if (!queue.length) return;
  var next;
  if (isShuffled){
    next = Math.floor(Math.random() * queue.length);
  } else {
    next = currentIndex + direction;
    if (next < 0) next = queue.length - 1;
    if (next >= queue.length) next = 0;
  }
  hostAttempt = 0;
  loadTrack(next);
  audio.play().catch(function(){});
}
prevBtn.addEventListener('click', function(){ step(-1); });
nextBtn.addEventListener('click', function(){ step(1); });

audio.addEventListener('ended', function(){
  if (repeatMode === 2) { audio.currentTime = 0; audio.play(); return; }
  step(1);
});

shuffleBtn.addEventListener('click', function(){
  isShuffled = !isShuffled;
  shuffleBtn.style.opacity = isShuffled ? '1' : '0.5';
});

var repeatLabels = ['Repeat: off', 'Repeat: all', 'Repeat: one'];
repeatBtn.addEventListener('click', function(){
  repeatMode = (repeatMode + 1) % 3;
  repeatBtn.title = repeatLabels[repeatMode];
  repeatBtn.style.opacity = repeatMode === 0 ? '0.5' : '1';
});

audio.addEventListener('loadedmetadata', function(){
  seek.max = audio.duration || 0;
  durationEl.textContent = formatTime(audio.duration);
});
var isSeeking = false;
audio.addEventListener('timeupdate', function(){
  if (!isSeeking) seek.value = audio.currentTime;
  currentTimeEl.textContent = formatTime(audio.currentTime);
});
seek.addEventListener('input', function(){ isSeeking = true; });
seek.addEventListener('change', function(){ audio.currentTime = seek.value; isSeeking = false; });

function formatTime(sec){
  if (!sec && sec !== 0) return '0:00';
  sec = Math.floor(sec);
  var m = Math.floor(sec / 60);
  var s = String(sec % 60).padStart(2, '0');
  return m + ':' + s;
}
volume.addEventListener('input', function(){ audio.volume = volume.value; });

function isTrackLiked(track){
  return liked.some(function(t){ return t.id === track.id; });
}
function refreshLikeButton(){
  var t = queue[currentIndex];
  likeBtn.textContent = (t && isTrackLiked(t)) ? 'LIKED' : 'LIKE';
}
likeBtn.addEventListener('click', function(){
  var t = queue[currentIndex];
  if (!t) return;
  if (isTrackLiked(t)) {
    liked = liked.filter(function(x){ return x.id !== t.id; });
  } else {
    liked.push(t);
  }
  localStorage.setItem('huny-liked', JSON.stringify(liked));
  refreshLikeButton();
  if (!likedView.hidden) renderGrid(likedGrid, liked, currentHost);
});

var navItems = document.querySelectorAll('.nav-item');
navItems.forEach(function(btn){
  btn.addEventListener('click', function(){
    navItems.forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    var view = btn.getAttribute('data-view');
    homeView.hidden = view !== 'home';
    searchView.hidden = view !== 'search';
    likedView.hidden = view !== 'liked';
    if (view === 'liked') renderGrid(likedGrid, liked, currentHost);
  });
});

document.body.setAttribute('data-theme', localStorage.getItem('huny-theme') || 'dark');
themeToggle.addEventListener('click', function(){
  var current = document.body.getAttribute('data-theme');
  var next = current === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next);
  localStorage.setItem('huny-theme', next);
});

document.addEventListener('keydown', function(e){
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space'){
    e.preventDefault();
    if (currentIndex === -1) return;
    if (audio.paused) audio.play(); else audio.pause();
  }
  if (e.code === 'ArrowRight') step(1);
  if (e.code === 'ArrowLeft') step(-1);
});

Api.trending()
  .then(function(result){ renderGrid(trendingGrid, result.data, result.host); })
  .catch(function(){ trendingGrid.innerHTML = '<p style="color:#8c8d90">Could not load trending songs. Refresh to retry.</p>'; });

var searchTimer;
searchInput.addEventListener('input', function(){
  clearTimeout(searchTimer);
  var q = searchInput.value.trim();
  if (!q) { homeView.hidden = false; searchView.hidden = true; return; }
  searchTimer = setTimeout(function(){
    homeView.hidden = true;
    searchView.hidden = false;
    searchHeading.textContent = 'Results for "' + q + '"';
    Api.search(q)
      .then(function(result){
        if (!result.data.length){
          resultsGrid.innerHTML = '<p style="color:#8c8d90">No results for "' + q + '". Audius mainly features independent/emerging artists rather than major-label commercial releases, so mainstream Bollywood/film tracks often will not appear. Try an independent artist name or a genre like "lofi" or "hindi indie".</p>';
        } else {
          renderGrid(resultsGrid, result.data, result.host);
        }
      })
      .catch(function(){ resultsGrid.innerHTML = '<p style="color:#8c8d90">Search failed. Try again.</p>'; });
  }, 400);
});
