// Dispatch a custom event once the React app is mounted to hide the HTML loader
export function signalAppReady() {
  try {
    const event = new CustomEvent('ezcar24:ready');
    window.dispatchEvent(event);
  } catch {}
}

