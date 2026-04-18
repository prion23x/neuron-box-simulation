# Project Chart

Neuro-Science Simulations is a 2D top-view experimental box that visualizes ion movement across a membrane. The world is split into two compartments: left = “inside,” right = “outside,” separated by a phospholipid bilayer and configurable leak channels. Users can start, pause, reset, and change simulation speed while watching concentration gradients, electric forces, membrane potential, and other live readouts in a simple but physically grounded demo. The simulation uses vanilla JavaScript, Canvas, and Matter.js for motion, collision handling, and force-driven dynamics. Navigation is map-like so you can drag, pan, and zoom to explore the scene beyond a single viewport.

## Project Structure
```bash
├── PROJECT-DESCRIPTION.MD
├── src
│   ├── config
│   │   └── config.js
│   ├── entities
│   │   ├── Ion.js
│   │   ├── IonSpawner.js
│   │   ├── Membrane.js
│   ├── main.js
│   ├── simulation
│       ├── Navigation.js
│       ├── Physics.js
│       ├── Render.js
│       ├── Scene.js
│       └── Simulation.js
│   └── ui
│       └── controls.js
└── static
    ├── index.html
    └── style.css
```

- `config/config.js` - contains configuration for objects, like sizes, colors, coordinates, defaults.
- `entities/` - dir with modules/classes whose objects are used in other scripts, non usable on their own.
    - `Ion.js` - represents individual ion particles and their physical properties.
    - `IonSpawner.js` - manages ion generation and placement in the inside/outside compartments.
    - `Membrane.js` - defines the bilayer, leak channels, and permeability behavior.
- `simulation/` - dir that contains the main simulation files
    - `Navigation.js` - handles map-like navigation, camera view, zoom level, and current pointer position in world coordinates.
    - `Scene.js` - set up a scene for simulation, like a static box, global variable declaration, object initiation etc
    - `Simulation.js` - the core of simulation; the sequence of events happen here as well as the generation of dynamic objects, time scale control, and membrane geometry/capacitance calculations.
    - `Physics.js` - handles movement + physics like custom collision logic, ionic force
    - `Render.js` - handles overlays like force vector arrows, show a normal of leak channels.
- `ui/controls.js` - handles the control panel, live stats, time-scale slider, zoom/pointer readout, and geometry values like area, volume, and capacitance.

## Config Examples
You can change values in `src/config/config.js` to tune the simulation. For example:

```js
export const WORLD_WIDTH = 7000;
export const WORLD_HEIGHT = 7000;

export const BOX = {
  width: 4000,
  height: 3000,
  depth: 3000,
}

export const distributionConfig = {
  multiplier: 10,
  K: { inside: 20, outside: 1 },
}

export const physicsConfig = {
  GLOBAL_TEMPERATURE_CELCIUS: 37,
}
```

These values can be adjusted to change map size, box dimensions, ion distribution, and temperature.
