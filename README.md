# Interactive Audio Adventures

A reusable, accessible, static choose-your-own-adventure web app with categories, independent adventures, branching scenes, optional images and recorded audio. No build step, account system, or backend.

**Current version: 0.4.0**

## Start locally

From the project directory, run:

```powershell
python -m http.server 8000
```

Then visit http://localhost:8000/ in your browser. (Any local HTTP server works. Do not double-click `index.html`, because browser security prevents loading the JSON manifest from `file://`.)

## GitHub Pages

In your repository's **Settings > Pages**, select **Deploy from a branch**, choose `main` and `/(root)`, then Save. Once published, the site should appear at:

https://antlaw0.github.io/interactive-audio-adventures/

GitHub Pages must be enabled in repository settings; committing these files alone does not enable it.

## How the library is organized

- `adventures/catalog.json`: categories and adventure registry.
- `adventures/<category>/<adventure>/adventure.json`: story metadata and scenes.
- `adventures/<category>/<adventure>/audio/`: optional audio files.
- `adventures/<category>/<adventure>/images/`: optional scene art.
- `js/app.js`: the shared game engine.
- `css/style.css`: accessible layout and visual styling.

Both example stories are **text-only demonstrations**, not the user's recorded noir scenes. They let you test navigation without audio files.

## Add a category

In `adventures/catalog.json`, add another item to `categories`:

```json
{
  "id": "fantasy-adventures",
  "title": "Fantasy Adventures",
  "description": "Magic, monsters, and difficult choices.",
  "adventures": ["alchemists-errand"]
}
```

Then register each adventure in the catalog's top-level `adventures` array:

```json
{
  "id": "alchemists-errand",
  "manifest": "fantasy-adventures/alchemists-errand/adventure.json"
}
```

Keep category IDs and adventure IDs unique. Adventure IDs are independent from their category paths.

## Adventure file format

```json
{
  "version": 1,
  "id": "alchemists-errand",
  "title": "The Alchemist's Errand",
  "description": "A branching fantasy audio drama.",
  "startScene": "opening",
  "scenes": [
    {
      "id": "opening",
      "title": "An Unexpected Visitor",
      "text": "A stranger knocks on the door.",
      "audio": "audio/opening.mp3",
      "image": "images/opening.jpg",
      "imageAlt": "A lantern beside a wooden door.",
      "transcript": "Optional full text transcript.",
      "choices": [
        { "text": "Open the door.", "nextScene": "ending-a" },
        { "text": "Wait quietly.", "nextScene": "ending-b" }
      ]
    },
    {
      "id": "ending-a",
      "title": "The Visitor",
      "text": "Your journey begins.",
      "ending": { "type": "success", "label": "Adventure complete" }
    },
    {
      "id": "ending-b",
      "title": "A Quiet Night",
      "text": "The stranger leaves a letter behind.",
      "ending": { "type": "neutral", "label": "A different ending" }
    }
  ]
}
```

**Rules:** The `startScene` must match a scene ID. Non-ending scenes need two or more choices, with valid `nextScene` IDs. Ending scenes use `ending` instead of choices. `audio`, `image`, `imageAlt`, `text`, and `transcript` are optional. Media paths are relative to that adventure's own `adventure.json`.

If audio exists, choices stay disabled until the recording ends; users may select **Reveal choices without finishing audio** instead. If audio is omitted, choices are available immediately.

## Audio controls

The player supports Play/Pause/Resume, Restart, Rewind 15 seconds, Forward 15 seconds, and an accessible timeline slider. Changing scenes clears the previous audio. Autoplay is attempted after a story choice, but some browsers require tapping Play.

WAV and MP3 work, but MP3 is recommended to reduce GitHub Pages storage and bandwidth. Do not commit large uncompressed source audio unnecessarily.

## Next steps

- Replace the example noir story with the actual seven scene IDs and branching choices from the generated script.
- Add the corresponding WAV or MP3 recordings.
- Add optional artwork.
- Test device and screen casting behaviors on the target phone and television.
- Expand the data model later for inventories, conditional decisions, and failure states.

## Updating locally

```powershell
git pull --ff-only
```

## Per-adventure background music (v0.2.1)

Every adventure may define one looping background soundtrack in its `adventure.json`:

```json
"music": {
  "src": "music/background.mp3",
  "volume": 0.2
}
```

- The music file path is **relative to the adventure.json file**, just like each scene's audio and image paths.
- `volume` is from 0 (silent) to 1 (full volume); `0.2` is the recommended starting point under speech. The scene recording volume is not changed.
- Place the soundtrack file into the adventure's `music` folder, with exactly the filename given in `src`.
- The soundtrack loops continuously across branching choices and scene changes. The same music element is retained, so selecting a choice does **not** reset its playback position.
- Pausing the scene player also pauses the soundtrack. Playing or resuming the scene resumes the soundtrack from where it left off.
- When a scene ends, the music keeps playing during audience discussion until the next choice. Leaving the adventure for its category or the main library stops and clears the music.
- A soundtrack-volume slider appears only in adventures with a `music` setting. It is independently adjustable and keyboard/screen-reader accessible.
- The browser might block autoplay until the player presses Play; the soundtrack is started from the same user-initiated playback action.
- If a music file is absent, scene audio still plays, but the music cannot start. The noir adventure is now configured to look for `adventures/detective-mystery/the-dame-with-the-hat/music/background.mp3`; **you must add that file yourself**. The engine does not include a music recording.

If no `music` property is defined, an adventure plays exactly as it did previously.


### Music playback troubleshooting

The player includes a **Start background music** button, which explicitly starts music in response to a user gesture if a browser blocks automatic playback. If music fails, the UI distinguishes browser autoplay restriction from other playback errors. The soundtrack stays running across scene changes and remains independently adjustable.

## Category soundtracks (v0.3.0)

Categories in `adventures/catalog.json` can define their own looping music. Music paths in the catalog are relative to `adventures/catalog.json`:

```json
"music": {
  "src": "detective-mystery/the-dame-with-the-hat/music/background.mp3",
  "volume": 0.2
}
```

A category soundtrack starts when the user opens the category (subject to browser gesture/autoplay rules) and repeats while browsing its adventures. A particular adventure can omit `music` to inherit the category track. Or it can set its own `music` property relative to its own `adventure.json`.

When a category and adventure resolve to the **same audio URL**, the music element is reused without restarting playback. When the URLs differ, the app crossfades from the prior track to the new track over approximately 1.2 seconds. Returning to the category restores its music; returning to the main library stops music.

Examples:
- Detective Mystery category currently uses the existing noir `music/background.mp3` shared with The Dame With the Hat.
- Other categories may omit `music` entirely until a track is added.
- The optional adventure music player volume slider remains available.

Browsers may block initial automatic playback, especially on mobile and cast environments. Use the **Start background music** button on the category screen when needed. MP3s should be loop-ready and uploaded at their configured paths.

## Presentation view (v0.4.0)

Use the **Presentation view** button in the header to switch to an audience-friendly layout, with larger artwork, scene headings, choices and playback controls. Switch back using **Standard view**. The mode works throughout the category library and in individual adventures.

This is a layout change, not a separate player: music, scene audio, story progress and keyboard/screen-reader focus are preserved when toggling the view. Native controls and semantic headings are retained. An optional **Full screen** button appears in presentation mode; it uses the browser fullscreen API when available. Fullscreen permission varies by browser and device. The presentation layout works even if fullscreen is unavailable.

When mirroring a phone or casting the *entire screen*, the audience sees the same view and controls as the host, including story choices. The host continues to make the selections on the original device. Independent phone-control and TV-display sessions require a separate synchronized multi-device feature and are **not** part of this release. Browser or OS-level mirroring/casting setup is outside the app.

Test presentation view on the target phone and television, since landscape and portrait orientations, TV overscan and browser fullscreen restrictions vary.
