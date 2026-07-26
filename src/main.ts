/**
 * Grid-Forge — entry point. Boots the game and shows the title scene.
 */

import { Game } from "./game/Game";
import { TitleScene } from "./game/scenes/TitleScene";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const game = new Game(canvas);
game.start(new TitleScene(game));

// Expose for debugging / automated smoke tests.
(window as unknown as { __game: Game }).__game = game;

// Prevent iOS bounce / double-tap zoom.
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("dblclick", (e) => e.preventDefault());

// Register the service worker so the installed PWA works offline.
// Guarded to https so it never errors on file:// or embedded previews.
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* offline support unavailable — game still runs online */
    });
  });
}
