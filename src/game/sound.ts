let audio: AudioContext | undefined;
export function playGameSound(kind: 'plant' | 'harvest' | 'coin' | 'build' | 'collect') {
  try {
    audio ??= new AudioContext();
    const notes = { plant: [260, 330], harvest: [440, 660], coin: [660, 880], build: [180, 240], collect: [520, 720] }[kind];
    notes.forEach((frequency, index) => {
      const oscillator = audio!.createOscillator();
      const gain = audio!.createGain();
      oscillator.type = 'square';
      oscillator.frequency.value = frequency;
      const start = audio!.currentTime + index * 0.07;
      gain.gain.setValueAtTime(0.035, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
      oscillator.connect(gain).connect(audio!.destination);
      oscillator.start(start); oscillator.stop(start + 0.1);
    });
  } catch { /* Sound is optional when the browser blocks audio. */ }
}
