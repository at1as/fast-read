const SAMPLE_TEXT = `Take a breath.

This reader moves one word at a time, but it does not have to feel robotic.
Commas can ease up, dashes can hang for a beat, and line breaks can leave a little air in the room.

Dial it down for a slow-burn rehearsal.
Push it up when you want to sprint.`;

const PRESETS = {
  chill: {
    label: "Chill",
    description: "Slow and roomy, with deliberate pauses for phrasing.",
    summary: "180 WPM with generous pauses",
    wpm: 180,
    commaMultiplier: 1.6,
    dashMultiplier: 1.35,
    newlineMultiplier: 1.9,
    periodMultiplier: 2.3,
  },
  moderate: {
    label: "Moderate",
    description: "Balanced enough to feel natural without dragging.",
    summary: "280 WPM with balanced pauses",
    wpm: 280,
    commaMultiplier: 1.4,
    dashMultiplier: 1.25,
    newlineMultiplier: 1.6,
    periodMultiplier: 2,
  },
  fast: {
    label: "Fast",
    description: "Quick, but still leaves punctuation room to land.",
    summary: "420 WPM with light pauses",
    wpm: 420,
    commaMultiplier: 1.25,
    dashMultiplier: 1.15,
    newlineMultiplier: 1.35,
    periodMultiplier: 1.7,
  },
  insane: {
    label: "Insane",
    description: "Minimal brakes. Good for a hard sprint, not subtlety.",
    summary: "650 WPM with minimal pauses",
    wpm: 650,
    commaMultiplier: 1.1,
    dashMultiplier: 1.05,
    newlineMultiplier: 1.2,
    periodMultiplier: 1.4,
  },
};

const COMMA_RE = /[,;:]["')\]]*$/;
const DASH_RE = /(?:-|–|—)+["')\]]*$/;
const SENTENCE_RE = /[.!?]["')\]]*$/;

const elements = {
  scriptInput: document.querySelector("#scriptInput"),
  fileInput: document.querySelector("#fileInput"),
  loadSampleButton: document.querySelector("#loadSampleButton"),
  presetButtons: Array.from(document.querySelectorAll(".preset-button")),
  presetDescription: document.querySelector("#presetDescription"),
  resetPresetButton: document.querySelector("#resetPresetButton"),
  playPauseButton: document.querySelector("#playPauseButton"),
  restartButton: document.querySelector("#restartButton"),
  infoPanel: document.querySelector("#infoPanel"),
  previousWord: document.querySelector("#previousWord"),
  currentWord: document.querySelector("#currentWord"),
  upcomingWord: document.querySelector("#upcomingWord"),
  delayLabel: document.querySelector("#delayLabel"),
  nextWordLabel: document.querySelector("#nextWordLabel"),
  statusBadge: document.querySelector("#statusBadge"),
  counterBadge: document.querySelector("#counterBadge"),
  progressBar: document.querySelector("#progressBar"),
  profileBadge: document.querySelector("#profileBadge"),
  profileSummary: document.querySelector("#profileSummary"),
  wpmInput: document.querySelector("#wpmInput"),
  commaInput: document.querySelector("#commaInput"),
  dashInput: document.querySelector("#dashInput"),
  newlineInput: document.querySelector("#newlineInput"),
  periodInput: document.querySelector("#periodInput"),
  contextWordsInput: document.querySelector("#contextWordsInput"),
  wpmValue: document.querySelector("#wpmValue"),
  commaValue: document.querySelector("#commaValue"),
  dashValue: document.querySelector("#dashValue"),
  newlineValue: document.querySelector("#newlineValue"),
  periodValue: document.querySelector("#periodValue"),
};

const state = {
  tokens: [],
  index: 0,
  timerId: null,
  isPlaying: false,
  selectedPreset: "moderate",
  isCustomized: false,
  showInfo: false,
};

function tokenize(text) {
  const matches = Array.from(text.matchAll(/\S+/g));

  return matches.map((match, index) => {
    const value = match[0];
    const start = match.index ?? 0;
    const end = start + value.length;
    const nextStart = index < matches.length - 1 ? matches[index + 1].index ?? text.length : text.length;
    const gap = text.slice(end, nextStart);

    return {
      text: value,
      gap,
    };
  });
}

function formatMultiplier(value) {
  return `${value.toFixed(2)}x`;
}

function hasLineBreak(gap) {
  return /\n/.test(gap);
}

function getSettings() {
  return {
    wpm: Number(elements.wpmInput.value),
    commaMultiplier: Number(elements.commaInput.value),
    dashMultiplier: Number(elements.dashInput.value),
    newlineMultiplier: Number(elements.newlineInput.value),
    periodMultiplier: Number(elements.periodInput.value),
  };
}

function applySettings(settings) {
  elements.wpmInput.value = String(settings.wpm);
  elements.commaInput.value = String(settings.commaMultiplier);
  elements.dashInput.value = String(settings.dashMultiplier);
  elements.newlineInput.value = String(settings.newlineMultiplier);
  elements.periodInput.value = String(settings.periodMultiplier);
  renderControlValues();
}

function settingsMatchPreset(settings, preset) {
  return (
    settings.wpm === preset.wpm &&
    settings.commaMultiplier === preset.commaMultiplier &&
    settings.dashMultiplier === preset.dashMultiplier &&
    settings.newlineMultiplier === preset.newlineMultiplier &&
    settings.periodMultiplier === preset.periodMultiplier
  );
}

function getDelayInfo(token, settings) {
  const baseDelay = Math.round(60000 / settings.wpm);
  let multiplier = 1;
  const reasons = [];

  if (COMMA_RE.test(token.text)) {
    multiplier *= settings.commaMultiplier;
    reasons.push(`comma ${formatMultiplier(settings.commaMultiplier)}`);
  }

  if (DASH_RE.test(token.text)) {
    multiplier *= settings.dashMultiplier;
    reasons.push(`dash ${formatMultiplier(settings.dashMultiplier)}`);
  }

  if (SENTENCE_RE.test(token.text)) {
    multiplier *= settings.periodMultiplier;
    reasons.push(`sentence ${formatMultiplier(settings.periodMultiplier)}`);
  }

  const newlineCount = (token.gap.match(/\n/g) || []).length;
  if (newlineCount > 0) {
    multiplier *= Math.pow(settings.newlineMultiplier, Math.min(newlineCount, 2));
    reasons.push(`line break ${formatMultiplier(settings.newlineMultiplier)}`);
  }

  return {
    delay: Math.round(baseDelay * multiplier),
    baseDelay,
    reasons,
  };
}

function clearPlaybackTimer() {
  if (state.timerId !== null) {
    window.clearTimeout(state.timerId);
    state.timerId = null;
  }
}

function stopPlayback() {
  clearPlaybackTimer();
  state.isPlaying = false;
}

function syncCustomizationState() {
  const settings = getSettings();
  state.isCustomized = !settingsMatchPreset(settings, PRESETS[state.selectedPreset]);
}

function renderControlValues() {
  elements.wpmValue.textContent = `${elements.wpmInput.value} WPM`;
  elements.commaValue.textContent = formatMultiplier(Number(elements.commaInput.value));
  elements.dashValue.textContent = formatMultiplier(Number(elements.dashInput.value));
  elements.newlineValue.textContent = formatMultiplier(Number(elements.newlineInput.value));
  elements.periodValue.textContent = formatMultiplier(Number(elements.periodInput.value));
}

function renderPresetButtons() {
  elements.presetButtons.forEach((button) => {
    const isSelected = button.dataset.preset === state.selectedPreset;
    button.classList.toggle("is-active", isSelected);
    button.classList.toggle("is-customized", isSelected && state.isCustomized);
  });
}

function refreshTokens() {
  state.tokens = tokenize(elements.scriptInput.value);
  state.index = 0;
}

function getCurrentToken() {
  if (!state.tokens.length) {
    return null;
  }

  if (state.index >= state.tokens.length) {
    return null;
  }

  return state.tokens[state.index];
}

function setContextWord(element, text) {
  element.textContent = text;
  element.classList.toggle("is-hidden", !text);
}

function clearContextWords() {
  setContextWord(elements.previousWord, "");
  setContextWord(elements.upcomingWord, "");
}

function renderStage() {
  const settings = getSettings();
  const token = getCurrentToken();

  if (!state.tokens.length) {
    clearContextWords();
    elements.currentWord.textContent = "Paste a script to begin.";
    elements.delayLabel.textContent = "The next delay will adapt to punctuation and line breaks.";
    elements.nextWordLabel.textContent = "Next: —";
    elements.counterBadge.textContent = "0 / 0";
    elements.progressBar.style.width = "0%";
    return;
  }

  if (state.index >= state.tokens.length) {
    clearContextWords();
    elements.currentWord.textContent = "Finished.";
    elements.delayLabel.textContent = "Restart to read the script again.";
    elements.nextWordLabel.textContent = "Next: —";
    elements.counterBadge.textContent = `${state.tokens.length} / ${state.tokens.length}`;
    elements.progressBar.style.width = "100%";
    return;
  }

  const delayInfo = getDelayInfo(token, settings);
  const reasonText = delayInfo.reasons.length ? delayInfo.reasons.join(" + ") : "base word timing only";
  const previousToken = state.tokens[state.index - 1];
  const nextToken = state.tokens[state.index + 1];
  const progress = ((state.index + 1) / state.tokens.length) * 100;
  const showContextWords = elements.contextWordsInput.checked;
  const previousContext = showContextWords && previousToken && !hasLineBreak(previousToken.gap) ? previousToken.text : "";
  const nextContext = showContextWords && nextToken && !hasLineBreak(token.gap) ? nextToken.text : "";
  const nextLabel = nextToken
    ? hasLineBreak(token.gap)
      ? `Next: ${nextToken.text} (after line break)`
      : `Next: ${nextToken.text}`
    : "Next: —";

  setContextWord(elements.previousWord, previousContext);
  elements.currentWord.textContent = token.text;
  setContextWord(elements.upcomingWord, nextContext);
  elements.delayLabel.textContent = `${delayInfo.delay} ms on this word (${reasonText})`;
  elements.nextWordLabel.textContent = nextLabel;
  elements.counterBadge.textContent = `${state.index + 1} / ${state.tokens.length}`;
  elements.progressBar.style.width = `${progress}%`;
}

function renderStatus() {
  if (!state.tokens.length) {
    elements.statusBadge.textContent = "Idle";
    return;
  }

  if (state.isPlaying) {
    elements.statusBadge.textContent = "Playing";
    return;
  }

  if (state.index >= state.tokens.length) {
    elements.statusBadge.textContent = "Complete";
    return;
  }

  elements.statusBadge.textContent = "Paused";
}

function renderProfile() {
  const preset = PRESETS[state.selectedPreset];
  const label = state.isCustomized ? `${preset.label} + custom` : preset.label;
  const summary = state.isCustomized ? "Using preset as a base with manual timing changes" : preset.summary;

  elements.profileBadge.textContent = label;
  elements.profileSummary.textContent = summary;
  elements.presetDescription.textContent = preset.description;
}

function renderPlayPauseButton() {
  elements.playPauseButton.textContent = state.isPlaying ? "Pause" : "Play";
}

function renderInfoPanel() {
  elements.infoPanel.hidden = !state.showInfo;
}

function render() {
  renderControlValues();
  renderPresetButtons();
  renderProfile();
  renderStatus();
  renderStage();
  renderPlayPauseButton();
  renderInfoPanel();
}

function tick() {
  clearPlaybackTimer();

  if (!state.isPlaying) {
    return;
  }

  const token = getCurrentToken();
  if (!token) {
    stopPlayback();
    render();
    return;
  }

  render();
  const delayInfo = getDelayInfo(token, getSettings());

  state.timerId = window.setTimeout(() => {
    state.index += 1;

    if (state.index >= state.tokens.length) {
      stopPlayback();
      render();
      return;
    }

    tick();
  }, delayInfo.delay);
}

function applyPreset(name) {
  state.selectedPreset = name;
  state.isCustomized = false;
  applySettings(PRESETS[name]);

  if (state.isPlaying) {
    tick();
  } else {
    render();
  }
}

function togglePlayback() {
  if (!state.tokens.length) {
    refreshTokens();
  }

  if (!state.tokens.length) {
    render();
    return;
  }

  if (state.index >= state.tokens.length) {
    state.index = 0;
  }

  state.isPlaying = !state.isPlaying;

  if (state.isPlaying) {
    tick();
    return;
  }

  clearPlaybackTimer();
  render();
}

function restartPlayback() {
  stopPlayback();
  refreshTokens();
  render();
}

function toggleInfoPanel() {
  state.showInfo = !state.showInfo;
  renderInfoPanel();
}

function handleScriptUpdate(nextText) {
  stopPlayback();
  elements.scriptInput.value = nextText;
  refreshTokens();
  render();
}

elements.scriptInput.addEventListener("input", (event) => {
  handleScriptUpdate(event.currentTarget.value);
});

elements.fileInput.addEventListener("change", async (event) => {
  const file = event.currentTarget.files?.[0];
  if (!file) {
    return;
  }

  const text = await file.text();
  handleScriptUpdate(text);
});

elements.loadSampleButton.addEventListener("click", () => {
  handleScriptUpdate(SAMPLE_TEXT);
});

elements.presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyPreset(button.dataset.preset);
  });
});

elements.resetPresetButton.addEventListener("click", () => {
  applyPreset(state.selectedPreset);
});

[elements.wpmInput, elements.commaInput, elements.dashInput, elements.newlineInput, elements.periodInput].forEach(
  (input) => {
    input.addEventListener("input", () => {
      syncCustomizationState();

      if (state.isPlaying) {
        tick();
        return;
      }

      render();
    });
  },
);

elements.playPauseButton.addEventListener("click", () => {
  togglePlayback();
});

elements.restartButton.addEventListener("click", () => {
  restartPlayback();
});

elements.contextWordsInput.addEventListener("input", () => {
  render();
});

document.addEventListener("keydown", (event) => {
  const activeElement = document.activeElement;
  const typingIntoField =
    activeElement instanceof HTMLElement && activeElement.matches("textarea, input");

  if (event.code === "Space" && !typingIntoField) {
    event.preventDefault();
    togglePlayback();
  }

  if (event.key.toLowerCase() === "r" && !typingIntoField) {
    restartPlayback();
  }

  if (event.key.toLowerCase() === "t" && !typingIntoField) {
    toggleInfoPanel();
  }
});

applyPreset("moderate");
handleScriptUpdate(SAMPLE_TEXT);
