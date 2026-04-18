// WORLD CONFIG
export const WORLD_WIDTH = 7000;
export const WORLD_HEIGHT = 7000;
// export const WORLD_BACKGROUND_COLOR = "#1b2c55";
export const WORLD_BACKGROUND_COLOR = "#0d1b2a";
export const WALL_THICKNESS = 50;
export const WALL_COLOR = "#3f6fb5";

// 1px = 0.03nm
// 10px = 0.3nm
// 1000px = 30nm
// 2000px = 60nm
// 3000px = 90nm

export const BOX = {
  base_x: 0,
  base_y: 0,
  width: 4000,
  height: 3000,
  depth: 3000,
  thickness: 50,
  color: "#c9a84c"
  // color:"#ce3e3e"
}

// pretty self-explanatory, the configuration for each ion type. 
export const ion_radius_factor = 1 // development feature, scales the size of all particles on the screen
export const ionConfig = {
  K: { charge: +1, radius: 10 * ion_radius_factor, color: "#f87171" },
  Na: { charge: +1, radius: 15 * ion_radius_factor, color: "#38bdf8" },
  Cl: { charge: -1, radius: 14 * ion_radius_factor, color: "#a78bfa" },
  Ca: { charge: +2, radius: 18 * ion_radius_factor, color: "#fbbf24" },
  Mg: { charge: +2, radius: 17 * ion_radius_factor, color: "#34d399" },
  A: { charge: -1, radius: 14 * ion_radius_factor, color: "#3138b6" }
}

export const distributionConfig = {
  multiplier: 10,
  K: { inside: 20, outside: 1 },
  A: { inside: 20, outside: 1 }
}

export const ION_NAMES = Object.keys(ionConfig);




export const physicsConfig = {
  GLOBAL_TEMPERATURE_CELCIUS: 37,
  GLOBAL_TEMPERATURE_KELVIN: 310,

  ACTIVATE_THERMAL_JITTER: true,
  THERMAL_JITTER_MAGNITUDE: 0.00005, // Base magnitude for thermal jitter, can be scaled by temperature

  ACTIVATE_COULOMB_FORCE: true,
  COULOMB_FORCE_MAGNITUDE: 0.0002,
  COULOMB_MIN_DISTANCE_SCALAR: 3, // ions on distance of 3x diameter or less will experience a capped force to avoid instability.,


  FLUX_FORCE_MAGNITUDE: 0.00001, // Attraction force towards the channel for permeable ions.
  FLUX_LINEAR_PUSH_SCALAR: 1.05, // Exponentially increases the push force as ions get closer to the channel


}
physicsConfig.GLOBAL_TEMPERATURE_KELVIN = physicsConfig.GLOBAL_TEMPERATURE_CELCIUS + 273.15;

// export const renderConfig = {
//   SHOW_LABELS: true,
//   MIN_ZOOM_SCALE_TO_SHOW_LABELS: 0.7,
//   LABEL_COLOR: "#000",
//   LABLE_FONT_SIZE: 15,
//   SHOW_FORCE_RADIUS: false,
//   SHOW_FORCE_DIRECTION: true,
//   SHOW_CHANNEL_IMPACT_RADIUS: true,
//   SHOW_LEAK_CHANNEL_LABELS: true,
// }
