
const notes = [
  { solfa: "Do",  pitch: "C4", frequency: 261.6256, sample: "audio/C4.mp3", x: 100, y: 190 },
  { solfa: "Re",  pitch: "D4", frequency: 293.6648, sample: "audio/D4.mp3", x: 165, y: 180 },
  { solfa: "Mi",  pitch: "E4", frequency: 329.6276, sample: "audio/E4.mp3", x: 230, y: 170 },
  { solfa: "Fa",  pitch: "F4", frequency: 349.2282, sample: "audio/F4.mp3", x: 295, y: 160 },
  { solfa: "Sol", pitch: "G4", frequency: 391.9954, sample: "audio/G4.mp3", x: 360, y: 150 },
  { solfa: "La",  pitch: "A4", frequency: 440.0000, sample: "audio/A4.mp3", x: 425, y: 140 },
  { solfa: "Ti",  pitch: "B4", frequency: 493.8833, sample: "audio/B4.mp3", x: 490, y: 130 },
  { solfa: "Do′", pitch: "C5", frequency: 523.2511, sample: "audio/C5.mp3", x: 555, y: 120 }
];

const staff = document.getElementById("notes-layer");
const noteList = document.getElementById("note-list");
const selectedSolfa = document.getElementById("selected-solfa");
const selectedPitch = document.getElementById("selected-pitch");
const playButton = document.getElementById("play-button");
const status = document.getElementById("status");

let selectedIndex = 0;
let audioContext = null;
let currentPianoAudio = null;

// Create the browser audio engine when the user first plays a note.
function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("Your browser does not support Web Audio.");
    }

    audioContext = new AudioContextClass();
  }

  return audioContext;
}

// Play the recorded piano sample for the selected musical note.
async function playPianoNote(note) {
  if (currentPianoAudio) {
    currentPianoAudio.pause();
    currentPianoAudio.currentTime = 0;
  }

  currentPianoAudio = new Audio(note.sample);
  currentPianoAudio.volume = 0.8;
  await currentPianoAudio.play();
}

// Draw one clickable note on the SVG staff.
function createStaffNote(note, index) {
  const group = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );

  group.classList.add("note");
  group.dataset.index = index;
  group.setAttribute("role", "button");
  group.setAttribute("tabindex", "0");
  group.setAttribute(
    "aria-label",
    `${note.solfa}, ${note.pitch}, play note`
  );

  // Invisible hit area makes the note easier to click.
  const hitArea = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );

  hitArea.setAttribute("class", "hit-area");
  hitArea.setAttribute("cx", note.x);
  hitArea.setAttribute("cy", note.y);
  hitArea.setAttribute("r", "23");

  // Draw the stem upward from each notehead.
  const stem = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );

  stem.setAttribute("class", "stem");
  const stemGoesUp = note.y >= 130;
  const stemX = stemGoesUp ? note.x + 7 : note.x - 7;
  stem.setAttribute("x1", stemX);
  stem.setAttribute("y1", note.y);
  stem.setAttribute("x2", stemX);
  stem.setAttribute("y2", note.y + (stemGoesUp ? -40 : 40));

  // Ellipse gives the notehead its traditional shape.
  const head = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "ellipse"
  );

  head.setAttribute("class", "notehead");
  head.setAttribute("cx", note.x);
  head.setAttribute("cy", note.y);
  head.setAttribute("rx", "9");
  head.setAttribute("ry", "6.5");
  head.setAttribute(
    "transform",
    `rotate(-20 ${note.x} ${note.y})`
  );

  // Label beneath the staff.
  const label = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );

  label.setAttribute("class", "note-label");
  label.setAttribute("x", note.x);
  label.setAttribute("y", "224");
  label.textContent = note.pitch;

  group.append(hitArea, stem, head, label);

  group.addEventListener("click", () => {
    selectNote(index, true);
  });

  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectNote(index, true);
    }
  });

  staff.appendChild(group);
}

// Create the clickable note guide below the staff.
function createNoteButton(note, index) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "note-button";
  button.innerHTML = `
    <span class="note-name"></span>
    <span class="note-pitch"></span>
  `;

  button.querySelector(".note-name").textContent = note.solfa;
  button.querySelector(".note-pitch").textContent =
    `${note.pitch} · ${note.frequency.toFixed(2)} Hz`;

  button.setAttribute(
    "aria-label",
    `Play ${note.solfa}, ${note.pitch}`
  );

  button.addEventListener("click", () => {
    selectNote(index, true);
  });

  noteList.appendChild(button);
}

// Update the interface and optionally play the selected note.
async function selectNote(index, shouldPlay = false) {
  selectedIndex = index;
  const note = notes[index];

  selectedSolfa.textContent = note.solfa;
  selectedPitch.textContent = note.pitch;

  document.querySelectorAll(".note").forEach((element, i) => {
    element.classList.toggle("selected", i === index);
    element.setAttribute("aria-pressed", String(i === index));
  });

  document.querySelectorAll(".note-button").forEach((element, i) => {
    element.classList.toggle("selected", i === index);
    element.setAttribute("aria-pressed", String(i === index));
  });

  status.textContent = `Selected ${note.solfa} (${note.pitch}).`;

  if (shouldPlay) {
    status.textContent = `Playing ${note.solfa} (${note.pitch})…`;

    try {
      await playPianoNote(note);
      status.textContent =
        `You heard ${note.solfa} — ${note.pitch}. Try singing it!`;
    } catch (error) {
      console.error("Could not play the note:", error);
      status.textContent =
        "Audio could not start. Please check your browser settings.";
    }
  }
}

// Draw all eight notes and create their guide buttons.
notes.forEach((note, index) => {
  createStaffNote(note, index);
  createNoteButton(note, index);
});

// The play button repeats the currently selected note.
playButton.addEventListener("click", () => {
  selectNote(selectedIndex, true);
});

// Show Do as the starting selection, without playing audio automatically.
selectNote(0);


const micButton = document.getElementById("mic-button");
const voiceFrequency = document.getElementById("voice-frequency");
const pitchDifference = document.getElementById("pitch-difference");
const pitchMarker = document.getElementById("pitch-marker");
const pitchMeter = document.querySelector(".pitch-meter");
const pitchFeedback = document.getElementById("pitch-feedback");

const MIN_VOICE_RMS = 0.02;
let micStream = null;
let micSource = null;
let analyser = null;
let micBuffer = null;
let animationFrame = null;
let micRunning = false;

// Estimate the fundamental frequency of a voice using autocorrelation.
function detectVoicePitch(buffer, sampleRate) {
  const size = buffer.length;

  // Reject silence and very quiet signals.
  let energy = 0;

  for (let i = 0; i < size; i++) {
    energy += buffer[i] * buffer[i];
  }

  const rms = Math.sqrt(energy / size);

  if (rms < MIN_VOICE_RMS) {
    return null;
  }

  // Only search for plausible singing pitches: 70–1000 Hz.
  const minLag = Math.floor(sampleRate / 1000);
  const maxLag = Math.min(
    Math.floor(sampleRate / 70),
    size - 1
  );

  let bestLag = -1;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let correlation = 0;
    let leftEnergy = 0;
    let rightEnergy = 0;

    for (let i = 0; i < size - lag; i++) {
      const a = buffer[i];
      const b = buffer[i + lag];

      correlation += a * b;
      leftEnergy += a * a;
      rightEnergy += b * b;
    }

    const denominator = Math.sqrt(leftEnergy * rightEnergy);

    if (denominator === 0) {
      continue;
    }

    const normalized = correlation / denominator;

    if (normalized > bestCorrelation) {
      bestCorrelation = normalized;
      bestLag = lag;
    }
  }

  // Avoid reporting unreliable estimates for noisy signals.
  if (bestLag < 0 || bestCorrelation < 0.72) {
    return null;
  }

  // Refine the lag using the neighbouring correlation values.
  function correlationAt(lag) {
    let sum = 0;
    let aEnergy = 0;
    let bEnergy = 0;

    for (let i = 0; i < size - lag; i++) {
      const a = buffer[i];
      const b = buffer[i + lag];

      sum += a * b;
      aEnergy += a * a;
      bEnergy += b * b;
    }

    const denominator = Math.sqrt(aEnergy * bEnergy);

    return denominator ? sum / denominator : 0;
  }

  const left = correlationAt(Math.max(minLag, bestLag - 1));
  const middle = correlationAt(bestLag);
  const right = correlationAt(Math.min(maxLag, bestLag + 1));

  const curve = left - 2 * middle + right;

  let refinedLag = bestLag;

  if (Math.abs(curve) > 0.000001) {
    refinedLag += 0.5 * (left - right) / curve;
  }

  return sampleRate / refinedLag;
}

// Compare the user's pitch with the selected reference note.
function updatePitchDisplay(frequency) {
  if (!frequency) {
    voiceFrequency.textContent = "— Hz";
    pitchDifference.textContent = "— cents";
    pitchFeedback.textContent = "Sing a steady note…";
    pitchFeedback.className = "pitch-feedback";
    pitchMarker.style.left = "50%";
    pitchMeter.setAttribute("aria-valuenow", "0");
    return;
  }

  const target = notes[selectedIndex].frequency;

  // 1200 cents = one octave.
  const cents = 1200 * Math.log2(frequency / target);

  voiceFrequency.textContent = `${frequency.toFixed(1)} Hz`;
  pitchDifference.textContent =
    `${cents > 0 ? "+" : ""}${Math.round(cents)} cents`;

  // Keep the marker within the visual range of -50 to +50 cents.
  const boundedCents = Math.max(-50, Math.min(50, cents));
  pitchMarker.style.left = `${50 + boundedCents}%`;

  pitchMeter.setAttribute(
    "aria-valuenow",
    String(Math.round(boundedCents))
  );

  if (Math.abs(cents) <= 25) {
    pitchFeedback.textContent = "✓ In tune!";
    pitchFeedback.className = "pitch-feedback good";
  } else if (cents > 0) {
    pitchFeedback.textContent = "↑ Too sharp — sing a little lower";
    pitchFeedback.className = "pitch-feedback high";
  } else {
    pitchFeedback.textContent = "↓ Too flat — sing a little higher";
    pitchFeedback.className = "pitch-feedback low";
  }
}

// Read the microphone repeatedly while singing.
function listenForPitch() {
  if (!micRunning || !analyser || !micBuffer) {
    return;
  }

  analyser.getFloatTimeDomainData(micBuffer);

  const frequency = detectVoicePitch(
    micBuffer,
    analyser.context.sampleRate
  );

  updatePitchDisplay(frequency);

  animationFrame = requestAnimationFrame(listenForPitch);
}

function stopMicrophone() {
  micRunning = false;

  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  if (micSource) {
    micSource.disconnect();
    micSource = null;
  }

  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }

  analyser = null;
  micBuffer = null;

  micButton.innerHTML = "<span aria-hidden='true'>🎤</span> Start singing";
  voiceFrequency.textContent = "— Hz";
  pitchDifference.textContent = "— cents";
  pitchMarker.style.left = "50%";
  pitchMeter.setAttribute("aria-valuenow", "0");
  pitchFeedback.textContent = "Microphone stopped.";
  pitchFeedback.className = "pitch-feedback";
}

async function startMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia) {
    pitchFeedback.textContent =
      "Microphone access requires HTTPS or localhost in a supported browser.";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: { ideal: true },
        autoGainControl: false
      }
    });

    micStream = stream;

    const context = getAudioContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    analyser = context.createAnalyser();
    analyser.fftSize = 8192;
    analyser.smoothingTimeConstant = 0;

    micSource = context.createMediaStreamSource(stream);
    micSource.connect(analyser);

    micBuffer = new Float32Array(analyser.fftSize);
    micRunning = true;

    micButton.innerHTML = "■ Stop singing";
    pitchFeedback.textContent =
      `Listening for ${notes[selectedIndex].solfa} (${notes[selectedIndex].pitch})…`;

    listenForPitch();
  } catch (error) {
    console.error("Microphone access failed:", error);

    stopMicrophone();

    pitchFeedback.textContent =
      error.name === "NotAllowedError"
        ? "Microphone permission was denied. Allow access in your browser settings."
        : "Couldn't start the microphone. Check your microphone and try again.";
  }
}

micButton.addEventListener("click", () => {
  if (micRunning) {
    stopMicrophone();
  } else {
    startMicrophone();
  }
});
