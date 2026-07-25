/**
 * Grid-Forge — entry point. Boots the game and shows the title scene.
 */

import { Game } from "./game/Game";
import { TitleScene } from "./game/scenes/TitleScene";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const game = new Game(canvas);
game.start(new TitleScene(game));

// Prevent iOS bounce / double-tap zoom.
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("dblclick", (e) => e.preventDefault());
