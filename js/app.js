"use strict";

// Interactive Audio Adventures v0.3.0. Uses plain JSON and static assets.
const app = document.getElementById("app");
const main = document.getElementById("main");
const audio = document.getElementById("sceneAudio");
let music = document.getElementById("backgroundMusic");
let standbyMusic = document.getElementById("standbyMusic");
let musicTransition = 0;
const homeButton = document.getElementById("homeButton");

const state = {
  catalog: null,
  category: null,
  adventure: null,
  scene: null,
  manifestUrl: null,
  completedAudio: false,
  loadToken: 0,
  musicReady: false,
  musicLevel: 0.2,
  musicPlayPending: false,
  musicSrc: "",
  musicConfig: null,
  musicPlayingDesired: false
}; // end state

const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (className) node.className = className;
  return node;
}; // end el

const button = (text, onClick, className = "") => {
  const node = el("button", text, className);
  node.type = "button";
  node.addEventListener("click", onClick);
  return node;
}; // end button

function emptyScreen(label, title, description) {
  stopAudio();
  app.replaceChildren();
  if (label) app.append(el("p", label, "eyebrow"));
  const heading = el("h1", title);
  heading.tabIndex = -1;
  app.append(heading);
  if (description) app.append(el("p", description));
  app.setAttribute("aria-busy", "false");
  requestAnimationFrame(() => heading.focus());
} // end emptyScreen

function musicMessage(message) {
  const status = document.getElementById("musicStatus") || document.getElementById("categoryMusicStatus");
  if (status) status.textContent = message;
} // end musicMessage

function cancelMusicFade() {
  musicTransition += 1;
  standbyMusic.pause();
  standbyMusic.removeAttribute("src");
  standbyMusic.load();
} // end cancelMusicFade

function stopMusic() {
  cancelMusicFade();
  music.pause();
  music.removeAttribute("src");
  music.load();
  state.musicReady = false;
  state.musicSrc = "";
  state.musicConfig = null;
  state.musicPlayingDesired = false;
  state.musicPlayPending = false;
} // end stopMusic

function normalizeMusic(config, baseUrl) {
  if (!config) return null;
  const entry = typeof config === "string" ? { src: config } : config;
  if (!entry || typeof entry.src !== "string" || !entry.src.trim()) return null;
  return {
    src: new URL(entry.src, baseUrl).href,
    volume: typeof entry.volume === "number" ? Math.max(0, Math.min(1, entry.volume)) : 0.2
  }; // end normalized config
} // end normalizeMusic

function categorySoundtrack(category) {
  return normalizeMusic(category.music, new URL("adventures/catalog.json", document.baseURI));
} // end categorySoundtrack

function playMusic(element = music) {
  if (!element.src || !state.musicPlayingDesired) return;
  const playRequest = element.play();
  if (playRequest && typeof playRequest.catch === "function") {
    playRequest.catch(error => {
      if (error.name === "AbortError") return;
      if (error.name === "NotAllowedError") {
        musicMessage("Your browser blocked automatic music. Select Start background music.");
      } else {
        musicMessage("Music could not start: " + error.name + ". Select Start background music.");
      } // end error handling
    }); // end playback result
  } // end promise support
} // end playMusic

function resumeMusic() {
  state.musicPlayingDesired = true;
  playMusic(music);
} // end resumeMusic

function pauseMusic() {
  state.musicPlayingDesired = false;
  music.pause();
  standbyMusic.pause();
  cancelMusicFade();
  music.volume = state.musicLevel;
} // end pauseMusic

function setSoundtrack(config, shouldPlay = true) {
  const desired = config;
  if (!desired) {
    stopMusic();
    return;
  } // end no soundtrack

  const wasPlaying = !music.paused;
  if (state.musicSrc === desired.src) {
    state.musicConfig = desired;
    state.musicLevel = desired.volume;
    music.volume = state.musicLevel;
    state.musicPlayingDesired = shouldPlay;
    if (shouldPlay) playMusic(music);
    return;
  } // end same track

  cancelMusicFade();
  state.musicReady = true;
  state.musicSrc = desired.src;
  state.musicConfig = desired;
  state.musicLevel = desired.volume;
  state.musicPlayingDesired = shouldPlay;

  if (!music.src || !wasPlaying || !shouldPlay) {
    music.pause();
    music.src = desired.src;
    music.preload = "auto";
    music.loop = true;
    music.volume = desired.volume;
    music.load();
    if (shouldPlay) playMusic(music);
    return;
  } // end immediate switch

  const fadingOut = music;
  const fadingIn = standbyMusic;
  fadingIn.src = desired.src;
  fadingIn.preload = "auto";
  fadingIn.loop = true;
  fadingIn.volume = 0;
  fadingIn.load();
  const token = ++musicTransition;
  const durationMs = 1200;
  let startedAt = null;
  const oldVolume = fadingOut.volume;

  const doFade = timestamp => {
    if (token !== musicTransition) return;
    if (startedAt === null) startedAt = timestamp;
    const progress = Math.min(1, (timestamp - startedAt) / durationMs);
    fadingOut.volume = oldVolume * (1 - progress);
    fadingIn.volume = desired.volume * progress;
    if (progress < 1) {
      requestAnimationFrame(doFade);
    } else {
      fadingOut.pause();
      fadingOut.removeAttribute("src");
      fadingOut.load();
      music = fadingIn;
      standbyMusic = fadingOut;
      music.volume = state.musicLevel;
    } // end fade
  }; // end doFade
  playMusic(fadingIn);
  requestAnimationFrame(doFade);
} // end setSoundtrack

function addCategoryMusicControl() {
  const musicControl = el("section", null, "player");
  musicControl.setAttribute("aria-label", "Category background music controls");
  const start = button("Start background music", () => resumeMusic(), "secondary");
  const pause = button("Pause background music", () => pauseMusic(), "secondary");
  const sliderLabel = el("label", "Background music volume");
  const slider = el("input");
  slider.type = "range";
  slider.id = "categoryMusicVolume";
  slider.min = "0";
  slider.max = "100";
  slider.step = "5";
  slider.value = String(Math.round(state.musicLevel * 100));
  sliderLabel.htmlFor = slider.id;
  slider.addEventListener("input", () => {
    state.musicLevel = Number(slider.value) / 100;
    music.volume = state.musicLevel;
  }); // end slider
  musicControl.append(start, pause, sliderLabel, slider);
  const status = el("p", "", "music-status");
  status.id = "categoryMusicStatus";
  musicControl.append(status);
  app.append(musicControl);
} // end addCategoryMusicControl

function stopAudio() {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
} // end stopAudio

function errorScreen(message, recovery) {
  stopMusic();
  emptyScreen("Unable to continue", "Something went wrong", message);
  app.append(button("Return to main library", () => showLibrary(), "secondary"));
  if (recovery) app.append(el("p", recovery, "info"));
} // end errorScreen

async function fetchJSON(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error("Could not load " + url + " (HTTP " + response.status + ").");
  return response.json();
} // end fetchJSON

function findCategory(categoryId) {
  return state.catalog.categories.find(category => category.id === categoryId);
} // end findCategory

function findListing(adventureId) {
  return state.catalog.adventures.find(adventure => adventure.id === adventureId);
} // end findListing

function addBack(label, callback) {
  app.append(button(label, callback, "secondary back"));
} // end addBack

function showLibrary() {
  stopMusic();
  state.loadToken += 1;
  state.category = null;
  state.adventure = null;
  state.scene = null;
  emptyScreen("Your story starts here", "Choose a category", "Explore collections of interactive audio adventures.");
  const grid = el("div", null, "grid");
  for (const category of state.catalog.categories) {
    const count = category.adventures.length;
    const tile = button("", () => showCategory(category.id), "tile");
    tile.append(el("span", category.title, "tile-title"));
    tile.append(el("span", category.description || "", "tile-description"));
    tile.append(el("span", count + (count === 1 ? " adventure" : " adventures"), "tile-count"));
    grid.append(tile);
  } // end category loop
  app.append(grid);
} // end showLibrary

async function showCategory(categoryId) {
  const category = findCategory(categoryId);
  if (!category) return errorScreen("Unknown category: " + categoryId);
  const token = ++state.loadToken;
  state.category = category;
  state.adventure = null;
  state.scene = null;
  setSoundtrack(categorySoundtrack(category), true);
  emptyScreen("Adventure category", category.title, category.description);
  if (state.musicReady) addCategoryMusicControl();
  addBack("Back to categories", showLibrary);
  const grid = el("div", null, "grid");
  app.append(grid);
  for (const id of category.adventures) {
    const listing = findListing(id);
    if (!listing) {
      grid.append(el("p", "Unregistered adventure: " + id, "info error"));
      continue;
    } // end missing listing
    const tile = button("Loading " + id + "…", () => {}, "tile");
    tile.disabled = true;
    grid.append(tile);
    try {
      const url = new URL(listing.manifest, new URL("adventures/catalog.json", document.baseURI)).href;
      const manifest = await fetchJSON(url);
      if (token !== state.loadToken) return;
      tile.disabled = false;
      tile.replaceChildren();
      tile.append(el("span", manifest.title, "tile-title"));
      tile.append(el("span", manifest.description || "", "tile-description"));
      tile.addEventListener("click", () => openAdventure(id));
    } catch (error) {
      if (token !== state.loadToken) return;
      tile.textContent = "Unavailable: " + id + ". " + error.message;
    } // end load listing
  } // end listing loop
} // end showCategory

function validateAdventure(manifest) {
  if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.scenes)) throw new Error("Adventure needs a scenes array.");
  if (typeof manifest.startScene !== "string") throw new Error("Adventure needs startScene.");
  const ids = new Set();
  for (const scene of manifest.scenes) {
    if (!scene.id || ids.has(scene.id)) throw new Error("Each scene needs a unique id.");
    ids.add(scene.id);
  } // end scene ids
  if (!ids.has(manifest.startScene)) throw new Error("Starting scene was not found.");
  for (const scene of manifest.scenes) {
    if (scene.ending) continue;
    if (!Array.isArray(scene.choices) || scene.choices.length < 1) throw new Error("Scene " + scene.id + " needs at least one choice or an ending.");
    for (const choice of scene.choices) {
      if (!choice.text || !ids.has(choice.nextScene)) throw new Error("Scene " + scene.id + " has an invalid choice target.");
    } // end choices
  } // end scenes
} // end validateAdventure

async function openAdventure(id) {
  const listing = findListing(id);
  if (!listing) return errorScreen("Adventure is not registered: " + id);
  const token = ++state.loadToken;
  emptyScreen("Loading adventure", "Opening your story…");
  try {
    const url = new URL(listing.manifest, new URL("adventures/catalog.json", document.baseURI)).href;
    const manifest = await fetchJSON(url);
    if (token !== state.loadToken) return;
    validateAdventure(manifest);
    state.adventure = manifest;
    state.manifestUrl = url;
    const chosen = manifest.music ? normalizeMusic(manifest.music, url) : categorySoundtrack(state.category);
    setSoundtrack(chosen, true);
    showScene(manifest.startScene);
  } catch (error) {
    if (token === state.loadToken) errorScreen(error.message);
  } // end load adventure
} // end openAdventure

function sceneById(id) {
  return state.adventure.scenes.find(scene => scene.id === id);
} // end sceneById

function mediaUrl(path) {
  return new URL(path, state.manifestUrl).href;
} // end mediaUrl

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0");
} // end formatTime

function showScene(id) {
  const scene = sceneById(id);
  if (!scene) return errorScreen("Unknown scene: " + id);
  const token = ++state.loadToken;
  state.scene = scene;
  state.completedAudio = !scene.audio;
  emptyScreen(state.adventure.title, scene.title, scene.text || scene.description);
  addBack("Back to adventures", () => showCategory(state.category.id));

  if (scene.image) {
    const art = el("img", null, "story-art");
    art.src = mediaUrl(scene.image);
    art.alt = scene.imageAlt || "";
    art.addEventListener("error", () => art.remove(), { once: true });
    app.append(art);
  } // end optional image

  if (scene.audio) {
    buildPlayer(scene, token);
  } else {
    app.append(el("p", "Text-only preview: no audio file assigned to this scene.", "info"));
  } // end optional audio

  if (scene.transcript) {
    const details = el("details");
    details.append(el("summary", "Read scene transcript"));
    details.append(el("p", scene.transcript));
    app.append(details);
  } // end optional transcript

  if (scene.ending) {
    app.append(el("h2", scene.ending.label || "The end"));
    app.append(el("p", "You have reached an ending."));
    const actions = el("div", null, "end-actions");
    actions.append(button("Replay this adventure", () => { showScene(state.adventure.startScene); }));
    actions.append(button("More adventures in this category", () => showCategory(state.category.id)));
    actions.append(button("Main library", showLibrary, "secondary"));
    app.append(actions);
  } else {
    app.append(el("h2", "What will you do?"));
    const choices = el("div", null, "choices");
    const choiceButtons = scene.choices.map((choice, index) => {
      const item = button((index + 1) + ". " + choice.text, () => showScene(choice.nextScene), "choice");
      item.disabled = !state.completedAudio;
      choices.append(item);
      return item;
    }); // end choiceButtons
    app.append(choices);
    if (scene.audio) {
      const skip = button("Reveal choices without finishing audio", () => unlockChoices(), "secondary");
      skip.id = "revealChoices";
      app.insertBefore(skip, choices);
    } // end skip action
    function unlockChoices() {
      if (token !== state.loadToken) return;
      state.completedAudio = true;
      choiceButtons.forEach(choice => { choice.disabled = false; });
      const reveal = document.getElementById("revealChoices");
      if (reveal) reveal.remove();
    } // end unlockChoices
    audio.onended = unlockChoices;
  } // end scene branch

  if (scene.audio) {
    audio.play().catch(() => {
      const status = document.getElementById("audioStatus");
      if (status && token === state.loadToken) status.textContent = "Select Play to start the scene audio.";
    }); // end autoplay fallback
  } // end auto play
} // end showScene

function buildPlayer(scene, token) {
  const panel = el("section", null, "player");
  panel.setAttribute("aria-label", "Scene audio controls");
  const status = el("p", "Audio loading. If playback does not start, select Play.", "info");
  status.id = "audioStatus";
  panel.append(status);
  const controls = el("div", null, "player-buttons");
  const restart = button("Restart", () => { audio.currentTime = 0; audio.play().catch(() => {}); resumeMusic(); });
  const rewind = button("Rewind 15 seconds", () => { audio.currentTime = Math.max(0, audio.currentTime - 15); });
  const play = button("Play", () => {
    if (audio.paused) {
      audio.play().catch(() => { status.textContent = "Playback failed. Check that the audio file exists."; });
      resumeMusic();
    } else {
      audio.pause();
      pauseMusic();
    } // end play toggle
  });
  const forward = button("Forward 15 seconds", () => { audio.currentTime = Math.min(Number.isFinite(audio.duration) ? audio.duration : Infinity, audio.currentTime + 15); });
  controls.append(restart, rewind, play, forward);
  panel.append(controls);
  const seekRow = el("div", null, "seek-row");
  const elapsed = el("span", "0:00", "time");
  const seek = el("input");
  seek.type = "range";
  seek.min = "0";
  seek.max = "100";
  seek.value = "0";
  seek.step = "1";
  seek.setAttribute("aria-label", "Seek through scene audio");
  const duration = el("span", "0:00", "time");
  seekRow.append(elapsed, seek, duration);
  panel.append(seekRow);
  if (state.musicReady) {
    const musicControl = el("div", null, "music-controls");
    const musicLabel = el("label", "Background music volume");
    const musicSlider = el("input");
    musicSlider.type = "range";
    musicSlider.min = "0";
    musicSlider.max = "100";
    musicSlider.step = "5";
    musicSlider.value = String(Math.round(state.musicLevel * 100));
    musicSlider.id = "musicVolume";
    musicLabel.htmlFor = musicSlider.id;
    musicSlider.addEventListener("input", () => {
      state.musicLevel = Number(musicSlider.value) / 100;
      music.volume = state.musicLevel;
    }); // end slider input
    musicControl.append(musicLabel, musicSlider);
    const startMusic = button("Start background music", () => resumeMusic(), "secondary");
    musicControl.append(startMusic);
    const musicStatus = el("p", "", "music-status");
    musicStatus.id = "musicStatus";
    musicControl.append(musicStatus);
    music.onerror = () => {
      if (token === state.loadToken) musicStatus.textContent = "Background music file could not be loaded. Scene audio is unaffected.";
    }; // end soundtrack error
    music.onplay = () => {
      if (token === state.loadToken) musicStatus.textContent = "";
    }; // end soundtrack started
    panel.append(musicControl);
  } // end optional soundtrack controls
  app.append(panel);
  audio.src = mediaUrl(scene.audio);
  audio.load();
  audio.onplay = () => { if (token === state.loadToken) { play.textContent = "Pause"; status.textContent = "Audio playing."; resumeMusic(); } };
  audio.onpause = () => { if (token === state.loadToken) play.textContent = "Play"; };
  audio.onloadedmetadata = () => {
    if (token !== state.loadToken) return;
    seek.max = String(Number.isFinite(audio.duration) ? Math.floor(audio.duration) : 0);
    duration.textContent = formatTime(audio.duration);
  }; // end loadedmetadata
  audio.ontimeupdate = () => {
    if (token !== state.loadToken) return;
    seek.value = String(Math.floor(audio.currentTime));
    elapsed.textContent = formatTime(audio.currentTime);
  }; // end timeupdate
  audio.onerror = () => {
    if (token !== state.loadToken) return;
    status.textContent = "Audio could not be loaded. You can still reveal the story choices below.";
    status.classList.add("error");
  }; // end onerror
  seek.addEventListener("input", () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value); });
} // end buildPlayer

homeButton.addEventListener("click", () => { if (state.catalog) showLibrary(); });
(async () => {
  try {
    state.catalog = await fetchJSON(new URL("adventures/catalog.json", document.baseURI).href);
    if (!Array.isArray(state.catalog.categories) || !Array.isArray(state.catalog.adventures)) throw new Error("Invalid adventure catalog.");
    showLibrary();
  } catch (error) {
    errorScreen(error.message, "This app must be served over HTTP, not opened directly from a file:// URL.");
  } // end startup
})(); // end startup
