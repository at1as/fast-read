# Fast Read

Small browser app for speed-reading a script one word at a time.

## What it does

- Paste text or load a `.txt` / `.md` file.
- Play the script back one token at a time.
- Adjust base `WPM`.
- Add extra pause after commas, dashes, line breaks, and sentence endings.
- Start from four presets: `chill`, `moderate`, `fast`, and `insane`.

## Run it

Everything goes through the [Makefile](/Users/jasonwillems/Repos/fast-read/Makefile).

```bash
make run
```

Then open `http://localhost:8000`.

You can override the port if needed:

```bash
make run PORT=9000
```

## Validate

```bash
make check
```

## Notes

- Timing controls are multipliers on top of the base word speed.
- Newline pauses stack a bit more for larger paragraph breaks.
- `Space` toggles play and pause. `R` restarts from the beginning.
