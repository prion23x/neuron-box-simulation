// Initializes Matter.js engine, renderer, and world. 
// Sets up the static bodies like, borders, membrane, and cytoplasm.

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_BACKGROUND_COLOR,
  cx,
  cy,
  MEMBRANE,
  CYTOPLASM,
  ION_POPULATION,
  
} from "./config.js";

const { Engine, Render, Runner, World, Bodies } = Matter;


export const engine = Engine.create();
engine.world.gravity.y = 0;

export const render = Render.create({
  canvas: document.getElementById("world"),
  engine: engine,
  options: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    wireframes: false,
    background: CANVAS_BACKGROUND_COLOR
  }
});

Render.run(render);
Runner.run(Runner.create(), engine);

export const world = engine.world;



// Border collision walls
const w = CANVAS_WIDTH; // convention
const h = CANVAS_HEIGHT; // convention
const walls = [
  // Here the wall thickness is 50 but it doesnt matter. it was needed only for calculation. 
  // The thing is these bodies are outside of the canvas thus invisible, and the change in thickness leaves the canvas unaffected.
  // Because the walls are always snapped to the edge of the canvas.
  Bodies.rectangle(w/2, -50/2, w, 50, { isStatic: true, render: { visible: false } }),
  Bodies.rectangle(w/2, h + 50/2, w, 50, { isStatic: true, render: { visible: false } }),
  Bodies.rectangle(-50/2, h/2, 50, h, { isStatic: true, render: { visible: false } }),
  Bodies.rectangle(w + 50/2, h/2, 50, h, { isStatic: true, render: { visible: false } })
];

// Membrane: rectangle chain (tunable, collidable)
for (let i = 0; i < MEMBRANE.segment_num; i++) {
  const a = (i / MEMBRANE.segment_num) * Math.PI * 2;
  const seg = Bodies.rectangle(
    cx + Math.cos(a) * MEMBRANE.radius,
    cy + Math.sin(a) * MEMBRANE.radius,
    MEMBRANE.segment_length,
    MEMBRANE.segment_thickness,
    {
      isStatic: true,
      angle: a,
      render: {
        fillStyle: MEMBRANE.segment_color
      },
      chamfer: {
        radius: MEMBRANE.segment_chamfer
      }
    }
  );
  seg.friction = MEMBRANE.segment_friction;
  MEMBRANE.segments.push(seg);
}

// Inner cytoplasm (dark yellow disk, non-collidable)
CYTOPLASM.body = Bodies.polygon(cx, cy, 128, CYTOPLASM.radius, {
  isStatic: true, // cytoplasm doesn't move
  isSensor: true, // cytoplasm is non-collidable
  render: { fillStyle: CYTOPLASM.color }
});

console.log('MMMEEME: ', MEMBRANE);

// Add everything to the world sequentiilly.
World.add(world, walls);
World.add(world, CYTOPLASM.body);
World.add(world, MEMBRANE.segments);
World.add(world, ION_POPULATION);
