// Keyboard and mouse: which way the chef is steered, whether "use" was pressed,
// and where the canvas was clicked, in the game's own 1280 by 720 coordinates.

import { SCREEN } from './config.js';

const STEER_KEYS = {
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
};
const USE_KEYS = ['Space', 'KeyE', 'Enter'];

export function listenForInput(canvas) {
  const held = new Set();
  const pressed = [];
  let click = null;
  let pointer = null;

  function toGamePoint(event) {
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * SCREEN.width,
      y: ((event.clientY - box.top) / box.height) * SCREEN.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (STEER_KEYS[event.code] || USE_KEYS.includes(event.code)) event.preventDefault();
    if (!event.repeat) pressed.push(event.code);
    held.add(event.code);
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('mousedown', (event) => {
    click = toGamePoint(event);
  });
  canvas.addEventListener('mousemove', (event) => {
    pointer = toGamePoint(event);
  });
  canvas.addEventListener('mouseleave', () => {
    pointer = null;
  });

  return {
    steering() {
      const axis = { x: 0, y: 0 };
      for (const code of held) {
        const way = STEER_KEYS[code];
        if (way) {
          axis.x += way[0];
          axis.y += way[1];
        }
      }
      return axis;
    },
    /** Every key pressed since the last call, each once. */
    takePresses() {
      return pressed.splice(0, pressed.length);
    },
    takeClick() {
      const point = click;
      click = null;
      return point;
    },
    pointer: () => pointer,
    isUseKey: (code) => USE_KEYS.includes(code),
  };
}
