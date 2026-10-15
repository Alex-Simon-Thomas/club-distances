// The install hint: how to add the app to the home screen. It shows only in the browser,
// never in the installed app, and stays away once dismissed on that phone.

export const INSTALL_HINT = {
  lead: "Use it like an app.",
  text: "On iPhone: Share, then Add to Home Screen. On Android: menu, then Install app. Works with no signal.",
};

// True when the app runs from the home screen rather than in a browser tab.
export function isInstalled(win = globalThis) {
  try {
    if (win.navigator && win.navigator.standalone === true) return true; // iPhone
    return ["standalone", "fullscreen", "minimal-ui"].some(m => win.matchMedia && win.matchMedia(`(display-mode: ${m})`).matches);
  } catch { return false; }
}

export const showInstallHint = ({ installed, dismissed }) => !installed && !dismissed;
