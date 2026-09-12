# Huny 🎧

A minimal, free music player — search and stream real songs, straight from your browser. No backend, no signup, no cost. Built entirely with HTML, CSS, and JavaScript, hosted free on GitHub Pages.

**🔗 Live app:** https://sizumaru21-collab.github.io/Huny-21/

---

## Features

- 🔍 Search and stream real songs (powered by the [Audius](https://audius.co) API — an open-source, decentralized music protocol featuring independent artists)
- ▶️ Play, pause, next, previous
- 🔀 Shuffle and 🔁 repeat (off / repeat all / repeat one)
- ❤️ Liked Songs, saved in your browser
- 🌗 Dark / light theme toggle
- ⌨️ Keyboard shortcuts — Space to play/pause, Arrow keys to skip
- 📱 Responsive layout for mobile

## How it works

Huny is a fully static site — three files, no server:

- `index.html` — page structure
- `style.css` — the minimal white/grey/dark/black theme
- `script.js` — talks to the Audius API to search, stream, and control playback

Since there's no backend, everything runs directly in your browser: searches, streaming links, your Liked Songs, and your theme preference (saved via `localStorage`) all happen client-side.

## Why Audius?

There's no free API for mainstream commercial music (Spotify, Apple Music, and YouTube Music are all paid/licensed). Audius is the one open, free, full-track-streaming option — its catalog features independent and emerging artists rather than major-label releases, which is the honest trade-off for a project built at zero cost.

## Tech stack

Plain HTML, CSS, and JavaScript. No frameworks, no build step, no dependencies.

## Running it locally

Just download the three files and open `index.html` in your browser — no installation needed.

## Deploying your own copy

1. Fork or download this repo
2. Push it to your own GitHub repository
3. Go to **Settings → Pages** → set Source to your `main` branch, folder `/ (root)`
4. Your site goes live at `https://<your-username>.github.io/<repo-name>/`

## Support

If you enjoy Huny, consider buying me a coffee ☕

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-yellow?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://www.buymeacoffee.com/yourusername)

---

Built as a learning project — from zero to a working, deployed app, one phase at a time.

— MD.
