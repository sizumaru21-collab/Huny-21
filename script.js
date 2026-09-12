:root{
  --font-ui: -apple-system, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif;
  --bar-h: 90px;
  --side-w: 220px;
}

body[data-theme="dark"]{
  --bg: #0a0a0b; --panel: #161719; --panel-2: #202124;
  --line: #2a2b2e; --text: #f2f2f0; --text-dim: #8c8d90;
  --accent: #ffffff; --accent-on: #0a0a0b;
}
body[data-theme="light"]{
  --bg: #f2f1ee; --panel: #ffffff; --panel-2: #eceae5;
  --line: #ddd9d1; --text: #171716; --text-dim: #75736c;
  --accent: #111111; --accent-on: #ffffff;
}

*{ box-sizing:border-box; }
html,body{ height:100%; margin:0; }
body{ background: var(--bg); color: var(--text); font-family: var(--font-ui); }

.app{
  display:grid;
  grid-template-columns: var(--side-w) 1fr;
  grid-template-rows: 1fr var(--bar-h);
  height:100vh;
}

.sidebar{
  border-right:1px solid var(--line);
  padding: 22px 16px;
  display:flex; flex-direction:column;
}
.brand{ display:flex; align-items:baseline; gap:8px; padding: 0 8px 26px; }
.brand-mark{
  font-weight:700; font-size:13px; width:26px; height:26px;
  border-radius:8px; border:1px solid var(--line);
  display:inline-flex; align-items:center; justify-content:center;
}
.brand-name{ font-size:12px; letter-spacing:.35em; text-transform:uppercase; color: var(--text-dim); }

.nav{ display:flex; flex-direction:column; gap:2px; flex:1; }
.nav-item{
  background:none; border:none; color: var(--text-dim);
  font-size:13.5px; text-align:left; padding:10px; border-radius:10px; cursor:pointer;
}
.nav-item:hover, .nav-item.active{ background: var(--panel-2); color: var(--text); }

.theme-toggle{
  width:44px; height:24px; border-radius:999px; border:1px solid var(--line);
  background: var(--panel-2); cursor:pointer; position:relative; margin:8px;
}
.theme-toggle .dot{
  position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%;
  background: var(--accent); transition: transform .25s ease;
}
body[data-theme="light"] .theme-toggle .dot{ transform: translateX(20px); }

.main{ overflow-y:auto; padding: 26px 34px 40px; }
.search-box{
  background: var(--panel); border:1px solid var(--line);
  border-radius: 999px; padding: 10px 18px; max-width: 460px;
}
.search-box input{
  border:none; background:none; outline:none; color: var(--text);
  font-size:14px; width:100%;
}
.view h2{ font-size:16px; font-weight:600; margin: 20px 0 16px; }

.grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
}
.card{
  background: var(--panel); border:1px solid var(--line);
  border-radius:14px; padding: 12px; cursor:pointer;
}
.card:hover{ background: var(--panel-2); }
.card .thumb{
  width:100%; aspect-ratio:1/1; border-radius:10px; overflow:hidden;
  background: linear-gradient(155deg, var(--panel-2), var(--bg)); margin-bottom:10px;
}
.card .thumb img{ width:100%; height:100%; object-fit:cover; display:block; }
.card .title{ font-size:13px; font-weight:600; margin:0 0 3px; }
.card .artist{ font-size:12px; color: var(--text-dim); margin:0; }

.player-bar{
  grid-column: 1 / 3;
  border-top:1px solid var(--line);
  background: var(--panel);
  display:grid;
  grid-template-columns: 240px 1fr 160px;
  align-items:center;
  padding: 0 20px;
  gap: 16px;
}
.np{ display:flex; align-items:center; gap:10px; min-width:0; }
.np-art{ width:48px; height:48px; border-radius:8px; object-fit:cover; background: var(--panel-2); flex-shrink:0; }
.np-meta{ display:flex; flex-direction:column; min-width:0; overflow:hidden; }
.np-title{ font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.np-artist{ font-size:12px; color: var(--text-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

.player-center{ display:flex; flex-direction:column; align-items:center; gap:6px; min-width:0; }
.controls{ display:flex; align-items:center; gap:6px; }
.controls button{
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-size:11px;
  font-weight:600;
  letter-spacing:.03em;
  cursor:pointer;
  padding: 7px 12px;
  border-radius: 8px;
  white-space: nowrap;
}
.controls button:hover{ background: var(--line); }
#playBtn{
  background: var(--accent);
  color: var(--accent-on);
  padding: 8px 18px;
}
#likeBtn{
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-size:10px;
  font-weight:600;
  cursor:pointer;
  padding: 5px 10px;
  border-radius: 999px;
  flex-shrink:0;
  margin-left: 6px;
}

.progress-row{ display:flex; align-items:center; gap:8px; width:100%; max-width:520px; }
.time{ font-size:10.5px; color: var(--text-dim); width:32px; flex-shrink:0; }

.seek{ flex:1; height:3px; }
.player-right{ display:flex; align-items:center; gap:8px; justify-self:end; }
.volume{ max-width:100px; }

@media (max-width: 800px){
  .app{
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
  .sidebar{
    flex-direction: row;
    align-items: center;
    border-right: none;
    border-bottom: 1px solid var(--line);
    padding: 12px 16px;
    gap: 16px;
    overflow-x: auto;
  }
  .brand{ padding: 0; flex-shrink: 0; }
  .nav{ flex-direction: row; flex: none; gap: 6px; }
  .theme-toggle{ margin: 0 0 0 auto; flex-shrink: 0; }
  .main{ padding: 18px 16px 30px; }
  .grid{ grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; }

  .player-bar{
    grid-column: 1 / 2;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    padding: 10px 14px;
    gap: 8px;
    height: auto;
  }
  .np{ justify-content: flex-start; }
  .player-right{ justify-self: center; }
  .controls button{ font-size:10px; padding: 6px 9px; }
}
