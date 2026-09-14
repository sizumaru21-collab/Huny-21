const APP_NAME = 'huny-player';

const Api = (() => {
let hosts = [
'https://discoveryprovider.audius.co',
'https://discoveryprovider2.audius.co',
'https://discoveryprovider3.audius.co'
];

let hostsFetched = false;

async function refreshHosts() {
if (hostsFetched) return;

```
try {
  const res = await fetch('https://api.audius.co');
  const json = await res.json();

  if (Array.isArray(json.data) && json.data.length) {
    hosts = json.data;
  }
} catch (e) {
  // Keep the fallback hosts above.
}

hostsFetched = true;
```

}

async function get(path) {
await refreshHosts();

```
let lastErr;

for (const host of hosts) {
  try {
    const url =
      host +
      path +
      (path.includes('?') ? '&' : '?') +
      'app_name=' +
      APP_NAME;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }

    const json = await res.json();

    return {
      data: json.data,
      host: host
    };
  } catch (e) {
    lastErr = e;
  }
}

throw lastErr || new Error('No Audius host reachable');
```

}

return {
trending: function () {
return get('/v1/tracks/trending?limit=24');
},

```
search: function (q) {
  return get('/v1/tracks/search?query=' + encodeURIComponent(q));
},

streamUrl: function (host, id) {
  return (
    host +
    '/v1/tracks/' +
    id +
    '/stream?app_name=' +
    APP_NAME
  );
},

allHosts: function () {
  return hosts;
}
```

};
})();

function artworkOf(track) {
const art = track.artwork || {};

return (
art['480x480'] ||
art['150x150'] ||
''
);
}

function escapeHtml(str) {
const d = document.createElement('div');
d.textContent = str || '';
return d.innerHTML;
}

function safeLoadLiked() {
try {
const saved = JSON.parse(
localStorage.getItem('huny-liked') || '[]'
);

```
return Array.isArray(saved) ? saved : [];
```

} catch (e) {
return [];
}
}

let queue = [];
let currentIndex = -1;
let currentHost = '';
let hostAttempt = 0;

let isShuffled = false;
let repeatMode = 0;

let liked = safeLoadLiked();

const audio = document.getElementById('audio');

const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');

const likeBtn = document.getElementById('likeBtn');

const seek = document.getElementById('seek');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

const volume = document.getElementById('volume');

const npArt = document.getElementById('npArt');
const npTitle = document.getElementById('npTitle');
const npArtist = document.getElementById('npArtist');

const themeToggle = document.getElementById('themeToggle');

const trendingGrid = document.getElementById('trendingGrid');
const resultsGrid = document.getElementById('resultsGrid');
const likedGrid = document.getElementById('likedGrid');

const searchInput = document.getElementById('searchInput');

const searchView = document.getElementById('searchView');
const homeView = document.getElementById('homeView');
const likedView = document.getElementById('likedView');

const searchHeading = document.getElementById('searchHeading');

/*
Status message

We create it inside the player center instead of
adding another grid item to the player bar.
*/
const statusMsg = document.createElement('p');

statusMsg.id = 'statusMsg';

statusMsg.style.cssText =
'margin:0;min-height:14px;color:#ff8a8a;font-size:11px;text-align:center;';

document.querySelector('.player-center').appendChild(statusMsg);

function renderGrid(container, tracks, host) {
container.innerHTML = '';

if (!tracks || !tracks.length) {
return;
}

tracks.forEach(function (t, i) {
const card = document.createElement('div');

```
card.className = 'card';

const thumb = document.createElement('div');
thumb.className = 'thumb';

const art = artworkOf(t);

if (art) {
  const img = document.createElement('img');

  img.src = art;
  img.alt = '';

  img.loading = 'lazy';

  img.onerror = function () {
    img.style.display = 'none';
  };

  thumb.appendChild(img);
}

const title = document.createElement('p');

title.className = 'title';
title.textContent = t.title || 'Untitled';

const artist = document.createElement('p');

artist.className = 'artist';
artist.textContent =
  t.user && t.user.name
    ? t.user.name
    : 'Unknown artist';

card.appendChild(thumb);
card.appendChild(title);
card.appendChild(artist);

card.addEventListener('click', function () {
  queue = tracks;
  currentHost = host;
  hostAttempt = 0;

  loadTrack(i);

  audio.play().catch(function () {});
});

container.appendChild(card);
```

});
}

function loadTrack(i) {
if (!queue[i]) return;

currentIndex = i;

const t = queue[i];

statusMsg.textContent = '';

audio.src = Api.streamUrl(
currentHost,
t.id
);

npTitle.textContent =
t.title || 'Untitled';

npArtist.textContent =
t.user && t.user.name
? t.user.name
: 'Unknown artist';

const art = artworkOf(t);

if (art) {
npArt.src = art;
} else {
npArt.removeAttribute('src');
}

refreshLikeButton();
}

audio.addEventListener('error', function () {
const hosts = Api.allHosts();

hostAttempt++;

if (
hostAttempt < hosts.length &&
queue[currentIndex]
) {
currentHost = hosts[hostAttempt];

```
statusMsg.textContent =
  'That server was down, trying another...';

audio.src = Api.streamUrl(
  currentHost,
  queue[currentIndex].id
);

audio.play().catch(function () {});
```

} else {
statusMsg.textContent =
'This track is unavailable right now. Try another song.';
}
});

playBtn.addEventListener('click', function () {
if (currentIndex === -1) return;

if (audio.paused) {
audio.play().catch(function () {});
} else {
audio.pause();
}
});

audio.addEventListener('play', function () {
playBtn.textContent = 'PAUSE';
});

audio.addEventListener('pause', function () {
playBtn.textContent = 'PLAY';
});

function step(direction) {
if (!queue.length) return;

let next;

if (isShuffled) {
if (queue.length === 1) {
next = 0;
} else {
do {
next = Math.floor(
Math.random() * queue.length
);
} while (next === currentIndex);
}
} else {
next = currentIndex + direction;

```
if (next < 0) {
  next = queue.length - 1;
}

if (next >= queue.length) {
  next = 0;
}
```

}

hostAttempt = 0;

loadTrack(next);

audio.play().catch(function () {});
}

prevBtn.addEventListener('click', function () {
step(-1);
});

nextBtn.addEventListener('click', function () {
step(1);
});

audio.addEventListener('ended', function () {
/*
Repeat One
*/
if (repeatMode === 2) {
audio.currentTime = 0;

```
audio.play().catch(function () {});

return;
```

}

/*
Repeat All
*/
if (repeatMode === 1) {
step(1);

```
return;
```

}

/*
Repeat Off

```
Stop when the final track finishes.
```

*/
if (currentIndex < queue.length - 1) {
step(1);
}
});

shuffleBtn.addEventListener('click', function () {
isShuffled = !isShuffled;

shuffleBtn.style.opacity =
isShuffled ? '1' : '0.5';
});

const repeatLabels = [
'Repeat: off',
'Repeat: all',
'Repeat: one'
];

repeatBtn.addEventListener('click', function () {
repeatMode =
(repeatMode + 1) % 3;

repeatBtn.title =
repeatLabels[repeatMode];

repeatBtn.style.opacity =
repeatMode === 0 ? '0.5' : '1';
});

audio.addEventListener('loadedmetadata', function () {
if (Number.isFinite(audio.duration)) {
seek.max = audio.duration;

```
durationEl.textContent =
  formatTime(audio.duration);
```

}
});

let isSeeking = false;

audio.addEventListener('timeupdate', function () {
if (!isSeeking) {
seek.value = audio.currentTime;
}

currentTimeEl.textContent =
formatTime(audio.currentTime);
});

seek.addEventListener('input', function () {
isSeeking = true;
});

seek.addEventListener('change', function () {
audio.currentTime = Number(seek.value);

isSeeking = false;
});

function formatTime(sec) {
if (!sec && sec !== 0) {
return '0:00';
}

sec = Math.floor(sec);

const m = Math.floor(sec / 60);

const s = String(
sec % 60
).padStart(2, '0');

return m + ':' + s;
}

volume.addEventListener('input', function () {
audio.volume = Number(volume.value);
});

function isTrackLiked(track) {
return liked.some(function (t) {
return t.id === track.id;
});
}

function refreshLikeButton() {
const t = queue[currentIndex];

likeBtn.textContent =
t && isTrackLiked(t)
? 'LIKED'
: 'LIKE';
}

likeBtn.addEventListener('click', function () {
const t = queue[currentIndex];

if (!t) return;

if (isTrackLiked(t)) {
liked = liked.filter(function (x) {
return x.id !== t.id;
});
} else {
liked.push(t);
}

try {
localStorage.setItem(
'huny-liked',
JSON.stringify(liked)
);
} catch (e) {
statusMsg.textContent =
'Could not save liked songs on this device.';
}

refreshLikeButton();

if (!likedView.hidden) {
renderGrid(
likedGrid,
liked,
currentHost
);
}
});

const navItems =
document.querySelectorAll('.nav-item');

function setActiveNav(view) {
navItems.forEach(function (btn) {
btn.classList.toggle(
'active',
btn.getAttribute('data-view') === view
);
});
}

navItems.forEach(function (btn) {
btn.addEventListener('click', function () {
const view =
btn.getAttribute('data-view');

```
navItems.forEach(function (b) {
  b.classList.remove('active');
});

btn.classList.add('active');

homeView.hidden =
  view !== 'home';

searchView.hidden =
  view !== 'search';

likedView.hidden =
  view !== 'liked';

if (view === 'liked') {
  renderGrid(
    likedGrid,
    liked,
    currentHost
  );
}
```

});
});

document.body.setAttribute(
'data-theme',
localStorage.getItem('huny-theme') || 'dark'
);

themeToggle.addEventListener('click', function () {
const current =
document.body.getAttribute('data-theme');

const next =
current === 'dark'
? 'light'
: 'dark';

document.body.setAttribute(
'data-theme',
next
);

localStorage.setItem(
'huny-theme',
next
);
});

document.addEventListener('keydown', function (e) {
if (
e.target.tagName === 'INPUT' ||
e.target.tagName === 'TEXTAREA'
) {
return;
}

if (e.code === 'Space') {
e.preventDefault();

```
if (currentIndex === -1) {
  return;
}

if (audio.paused) {
  audio.play().catch(function () {});
} else {
  audio.pause();
}
```

}

if (e.code === 'ArrowRight') {
step(1);
}

if (e.code === 'ArrowLeft') {
step(-1);
}
});

/*
Load trending songs
*/
Api.trending()
.then(function (result) {
renderGrid(
trendingGrid,
result.data,
result.host
);
})
.catch(function () {
trendingGrid.innerHTML =
'<p style="color:#8c8d90">' +
'Could not load trending songs. Refresh to retry.' +
'</p>';
});

/*
Search
*/
let searchTimer;

searchInput.addEventListener(
'input',
function () {
clearTimeout(searchTimer);

```
const q =
  searchInput.value.trim();

if (!q) {
  homeView.hidden = false;
  searchView.hidden = true;

  setActiveNav('home');

  return;
}

searchTimer = setTimeout(
  function () {
    homeView.hidden = true;
    searchView.hidden = false;

    setActiveNav('search');

    searchHeading.textContent =
      'Results for "' + q + '"';

    resultsGrid.innerHTML =
      '<p style="color:#8c8d90">' +
      'Searching...' +
      '</p>';

    Api.search(q)
      .then(function (result) {
        if (!result.data.length) {
          resultsGrid.innerHTML =
            '<p style="color:#8c8d90">' +
            'No results for "' +
            escapeHtml(q) +
            '". Audius mainly features independent/emerging artists rather than major-label commercial releases. Try an independent artist name or a genre like "lofi" or "hindi indie".' +
            '</p>';
        } else {
          renderGrid(
            resultsGrid,
            result.data,
            result.host
          );
        }
      })
      .catch(function () {
        resultsGrid.innerHTML =
          '<p style="color:#8c8d90">' +
          'Search failed. Try again.' +
          '</p>';
      });
  },
  400
);
```

}
);
