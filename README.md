# Fast Read

Fast Read is a small browser app for showing a script one word at a time, with adjustable pacing for different kinds of pauses.

## Features

- Paste text directly or load a `.txt` / `.md` file.
- Read one word at a time in a focused stage view.
- Start from four presets: `chill`, `moderate`, `fast`, and `insane`.
- Adjust base `WPM`.
- Add extra delay after commas, dashes, line breaks, and sentence endings.
- Optionally show semi-blurred previous and next context words.
- Prevent context-word previews across line breaks.

## Requirements

- `make`
- `python3` for the local web server
- `node` for `make check`

## Quick Start

Run the app:

```bash
make run
```

Then open `http://localhost:8000`.

Use a different port if needed:

```bash
make run PORT=9000
```

## Make Targets

- `make run` starts the local server.
- `make serve` is an alias for `make run`.
- `make check` validates the JavaScript entrypoint.
- `make help` lists the available targets.

## Reader Controls

- `Space` toggles play and pause.
- `R` restarts from the beginning.
- `T` toggles verbose reader info like timing details and next-word context.
- `F` toggles fullscreen for the reader panel.
- Preset buttons apply sensible default timing profiles.
- Timing sliders control pause multipliers on top of the base word speed.
- `Show context words` enables the blurred previous/next word view.

## Project Files

- `index.html` contains the app structure.
- `styles.css` contains the layout and visual styling.
- `app.js` contains tokenization, playback, presets, and rendering logic.
- `Makefile` is the only supported command entrypoint.

## Notes

- Newline pauses stack slightly more for larger paragraph breaks.
- Context words do not cross line breaks.
- The app is static and does not require a build step.
