const BEEP = {
  FREQUENCY_HZ: 880,
  VOLUME: 0.08,
  SILENCE: 0.0001,
  ATTACK_S: 0.01,
  DURATION_S: 0.18,
} as const;

const GESTURE_EVENTS = ['pointerdown', 'keydown'] as const;

let context: AudioContext | null = null;
let isArmed = false;

function unlock(): void {
  GESTURE_EVENTS.forEach((type) => document.removeEventListener(type, unlock, true));

  try {
    context ??= new AudioContext();
    void context.resume().catch(() => undefined);
  } catch {
    context = null;
  }
}

export function armSound(): void {
  if (isArmed || typeof AudioContext === 'undefined') {
    return;
  }

  isArmed = true;
  GESTURE_EVENTS.forEach((type) => document.addEventListener(type, unlock, true));
}

async function getRunningContext(): Promise<AudioContext | null> {
  if (!navigator.userActivation.hasBeenActive || typeof AudioContext === 'undefined') {
    return null;
  }

  context ??= new AudioContext();

  if (context.state === 'suspended') {
    await context.resume();
  }

  return context.state === 'running' ? context : null;
}

function playTone(audio: AudioContext): void {
  const start = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = BEEP.FREQUENCY_HZ;
  gain.gain.setValueAtTime(BEEP.SILENCE, start);
  gain.gain.exponentialRampToValueAtTime(BEEP.VOLUME, start + BEEP.ATTACK_S);
  gain.gain.exponentialRampToValueAtTime(BEEP.SILENCE, start + BEEP.DURATION_S);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + BEEP.DURATION_S);
}

export async function playBeep(): Promise<void> {
  try {
    const audio = await getRunningContext();

    if (audio !== null) {
      playTone(audio);
    }
  } catch {
    context = null;
  }
}
