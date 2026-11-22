# Interactive Audio Adventures

A reusable, accessible, static choose-your-own-adventure web app with categories, independent adventures, branching scenes, optional images and recorded audio. No build step, account system, or backend.

**Current version: 0.1.0**

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
