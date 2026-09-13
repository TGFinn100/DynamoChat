import { MAIN_CHANNEL, type ChannelId } from "@ron-voice/shared";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  // Short fade in/out avoids an audible click at the start/end of the tone.
  const fade = 0.015;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.2, startTime + fade);
  gain.gain.linearRampToValueAtTime(0.2, startTime + duration - fade);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/**
 * Two-note chirp: rising when switching to a team, falling when returning to
 * Main, so which way you just switched is audible without looking.
 */
export function playChannelSwitchCue(newChannel: ChannelId): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const noteDuration = 0.09;
  const gap = 0.07;

  const [firstFreq, secondFreq] = newChannel === MAIN_CHANNEL ? [880, 660] : [660, 880];

  playTone(ctx, firstFreq, now, noteDuration);
  playTone(ctx, secondFreq, now + gap, noteDuration);
}
