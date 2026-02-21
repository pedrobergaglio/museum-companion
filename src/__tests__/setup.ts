import "@testing-library/jest-dom/vitest";

// Polyfill for happy-dom if needed
if (typeof globalThis.Audio === "undefined") {
  globalThis.Audio = class Audio {
    src = "";
    volume = 1;
    paused = true;
    currentTime = 0;
    onplay: (() => void) | null = null;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(src?: string) { if (src) this.src = src; }
    async play() { this.paused = false; this.onplay?.(); }
    pause() { this.paused = true; }
  } as unknown as typeof Audio;
}
