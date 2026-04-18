// Initializes Matter.js engine, renderer, and world. 

import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  WORLD_BACKGROUND_COLOR,
  WALL_THICKNESS,
  WALL_COLOR,

} from "../config/config.js";

const { Engine, Render, Runner, World, Bodies, Composite } = Matter;


export const engine = Engine.create();
engine.world.gravity.y = 0;

const canvas = document.getElementById("world");


export const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false, // rendering option
    hasBounds: true, // = hasMovableCamera?
    background: WORLD_BACKGROUND_COLOR
  }
});

// Sets up the static bodies like, borders, membrane, and cytoplasm.
// Defining Bounds

const vw = window.innerWidth;
const vh = window.innerHeight;

render.bounds.min.x = -vw / 2;
render.bounds.min.y = -vh / 2;
render.bounds.max.x = vw / 2;
render.bounds.max.y = vh / 2;

Render.run(render);
Runner.run(Runner.create(), engine);

export const world = engine.world;

// Panning
let isPanning = false;
let lastMouse = { x: 0, y: 0 };
let currentPointerClientPosition = null;
const mouseSpeedScale = 1;

function screenToWorld(clientX, clientY) {
  return {
    x: render.bounds.min.x + (clientX / vw) * (render.bounds.max.x - render.bounds.min.x),
    y: render.bounds.min.y + (clientY / vh) * (render.bounds.max.y - render.bounds.min.y),
  };
}


export function getCurrentZoomScale() {
  const currentWidth = render.bounds.max.x - render.bounds.min.x;
  const zoomScale = (currentWidth / vw).toFixed(2);
  return zoomScale
}

export function getCurrentPointerWorldPosition() {
  if (!currentPointerClientPosition) return null;
  return screenToWorld(currentPointerClientPosition.x, currentPointerClientPosition.y);
}

export function setCameraView(x, y, zoom = 1) {
  const halfW = (vw * zoom) / 2;
  const halfH = (vh * zoom) / 2;

  render.bounds.min.x = x - halfW;
  render.bounds.max.x = x + halfW;
  render.bounds.min.y = y - halfH;
  render.bounds.max.y = y + halfH;
}

// Question for revise: Why canvas for mousedown and window for mouseup?
canvas.addEventListener("mousedown", (e) => {
  isPanning = true;
  lastMouse = { x: e.clientX, y: e.clientY };
  currentPointerClientPosition = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("mousemove", (e) => {
  currentPointerClientPosition = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("mouseleave", () => {
  currentPointerClientPosition = null;
});

window.addEventListener("mouseup", () => {
  isPanning = false;

});

window.addEventListener("mousemove", (e) => {
  if (!isPanning) return;

  const dx = e.clientX - lastMouse.x;
  const dy = e.clientY - lastMouse.y;

  render.bounds.min.x -= dx * mouseSpeedScale;
  render.bounds.min.y -= dy * mouseSpeedScale;
  render.bounds.max.x -= dx * mouseSpeedScale;
  render.bounds.max.y -= dy * mouseSpeedScale;

  // Right boundary
  if (render.bounds.max.x >= WORLD_WIDTH / 2) {
    let dX = render.bounds.max.x - render.bounds.min.x;
    render.bounds.max.x = WORLD_WIDTH / 2;
    render.bounds.min.x = render.bounds.max.x - dX;
  }

  // Left boundary
  if (render.bounds.min.x <= -WORLD_WIDTH / 2) {
    let dX = render.bounds.max.x - render.bounds.min.x;
    render.bounds.min.x = -WORLD_WIDTH / 2;
    render.bounds.max.x = render.bounds.min.x + dX;
  }

  // Bottom boundary
  if (render.bounds.max.y >= WORLD_HEIGHT / 2) {
    let dY = render.bounds.max.y - render.bounds.min.y;
    render.bounds.max.y = WORLD_HEIGHT / 2;
    render.bounds.min.y = render.bounds.max.y - dY;
  }

  // Top boundary
  if (render.bounds.min.y <= -WORLD_HEIGHT / 2) {
    let dY = render.bounds.max.y - render.bounds.min.y;
    render.bounds.min.y = -WORLD_HEIGHT / 2;
    render.bounds.max.y = render.bounds.min.y + dY;
  }

  lastMouse = { x: e.clientX, y: e.clientY };
});


// Zoom Layers:
// Global zoom limits — is the viewport already too big or too small? Stop entirely.
// Compute new bounds — actually apply the zoom anchored to the mouse.
// Edge clamps — did we drift outside the world boundary? Slide back in while preserving size.
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();

  const factor = e.deltaY > 0 ? 1.1 : 0.9;

  const currentWidth = render.bounds.max.x - render.bounds.min.x;
  if (factor >= 1 && currentWidth >= WORLD_WIDTH) return; // stop zooming out
  if (factor < 1 && currentWidth <= vw * 0.2) return;    // stop zooming in

  currentPointerClientPosition = { x: e.clientX, y: e.clientY };
  const mouseWorld = screenToWorld(e.clientX, e.clientY);

  const current_max_x = mouseWorld.x + (render.bounds.max.x - mouseWorld.x) * factor;
  const current_min_x = mouseWorld.x + (render.bounds.min.x - mouseWorld.x) * factor;
  if (factor >= 1 && (current_max_x - current_min_x) >= WORLD_WIDTH) return; // stop zooming out if future action result in inappropriate zoom

  // Compute new bounds
  render.bounds.min.x = mouseWorld.x + (render.bounds.min.x - mouseWorld.x) * factor;
  render.bounds.min.y = mouseWorld.y + (render.bounds.min.y - mouseWorld.y) * factor;
  render.bounds.max.x = mouseWorld.x + (render.bounds.max.x - mouseWorld.x) * factor;
  render.bounds.max.y = mouseWorld.y + (render.bounds.max.y - mouseWorld.y) * factor;

  // Clamp right
  if (render.bounds.max.x >= WORLD_WIDTH / 2) {
    let dX = render.bounds.max.x - render.bounds.min.x;
    render.bounds.max.x = WORLD_WIDTH / 2;
    render.bounds.min.x = render.bounds.max.x - dX;
  }

  // Clamp left
  if (render.bounds.min.x <= -WORLD_WIDTH / 2) {
    let dX = render.bounds.max.x - render.bounds.min.x;
    render.bounds.min.x = -WORLD_WIDTH / 2;
    render.bounds.max.x = render.bounds.min.x + dX;
  }

  // Clamp bottom
  if (render.bounds.max.y >= WORLD_HEIGHT / 2) {
    let dY = render.bounds.max.y - render.bounds.min.y;
    render.bounds.max.y = WORLD_HEIGHT / 2;
    render.bounds.min.y = render.bounds.max.y - dY;
  }

  // Clamp top
  if (render.bounds.min.y <= -WORLD_HEIGHT / 2) {
    let dY = render.bounds.max.y - render.bounds.min.y;
    render.bounds.min.y = -WORLD_HEIGHT / 2;
    render.bounds.max.y = render.bounds.min.y + dY;
  }

}, { passive: false });


// Border collision walls (centered at 0,0)
const halfWorldWidth = WORLD_WIDTH / 2;
const halfWorldHeight = WORLD_HEIGHT / 2;

const walls = [
  // Top
  Bodies.rectangle(0, -halfWorldHeight + WALL_THICKNESS / 2, WORLD_WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS, {
    isStatic: true,
    render: { fillStyle: WALL_COLOR }
  }),
  // Bottom
  Bodies.rectangle(0, halfWorldHeight - WALL_THICKNESS / 2, WORLD_WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS, {
    isStatic: true,
    render: { fillStyle: WALL_COLOR }
  }),
  // Left
  Bodies.rectangle(-halfWorldWidth + WALL_THICKNESS / 2, 0, WALL_THICKNESS, WORLD_HEIGHT + WALL_THICKNESS * 2, {
    isStatic: true,
    render: { fillStyle: WALL_COLOR }
  }),
  // Right
  Bodies.rectangle(halfWorldWidth - WALL_THICKNESS / 2, 0, WALL_THICKNESS, WORLD_HEIGHT + WALL_THICKNESS * 2, {
    isStatic: true,
    render: { fillStyle: WALL_COLOR }
  })
];

// Add everything to the world sequentiilly.
World.add(world, walls);

// A red dot at 0,0 simply for orientation
// Render last by keeping it inside its own Composite (composites render after world bodies).
// export const cPoint = Composite.create({ label: "cPoint" });
// const cPointBody = Bodies.circle(0, 0, 10, {
//   isStatic: true,
//   isSensor: true,
//   render: { fillStyle: "#ff0000" }
// });
// Composite.add(cPoint, cPointBody);
// World.add(world, cPoint);
