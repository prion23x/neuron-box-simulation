
// --------------------------------------------------| SYSTEM CONFIGURATION |-------------------------------------------------- //
export const CANVAS_WIDTH = 880;
export const CANVAS_HEIGHT = 880;
export const cx = CANVAS_WIDTH / 2; // a convention for the center of canvas (x)
export const cy = CANVAS_HEIGHT / 2; // a convention for the center of canvas (y)
export const CANVAS_BACKGROUND_COLOR = "#0f172a";




// --------------------------------------------------| PARTICLE CONFIGURATION |-------------------------------------------------- //


const radius_factor = 0.7 // development feature, scales the size of all particles on the screen

// pretty self-explanatory, the configuration for each ion type. 
// Used for easy access to ion properties when creating particles.
export const ionConfig = {
  Na: { charge: +1, radius: 15 * radius_factor, color: "#38bdf8" },
  K: { charge: +1, radius: 15 * radius_factor, color: "#f87171" },
  Cl: { charge: -1, radius: 14 * radius_factor, color: "#a78bfa" },
  Ca: { charge: +2, radius: 18 * radius_factor, color: "#fbbf24" },
  Mg: { charge: +2, radius: 17 * radius_factor, color: "#34d399" }
}

//  PURPOSE OF MEMBRANE: 
// Membane will be needed for channel management: opening, closing, applying force, repelling, etc.
// It also blocks the particles from escaping the cell unless the channels are open. 
export const MEMBRANE = {
  segments: [], // Contains the segment/bodies that make up the membrane. Used for channel and collision management.
  radius: 250, // literally, the size of the membrane.
  segment_num: 50, // ↑ = tighter packing / less gaps.
  segment_length: 20, // the side to side size of each segment.
  segment_thickness: 30, // in-to-out size of each segment.
  segment_chamfer: 2, // the roundness of the segment edges.
  segment_color: "#2557afa9", // the color of the membrane segments.
  segment_friction: 0.0 // No friction for smooth sliding of particles along the membrane
};


export const CHANNEL_PROXIMITY = 60;                // same value used for force
export const CHANNEL_IMPACT_COLOR = "#37ff005e"; // orange glow
export const SHOW_CHANNEL_IMPACT_RADIUS = true;     // ← toggle this



// PURPOSE OF CYTOPLASM:
// Cytoplasm is used for calculating the concentration of ions inside of the cell to determine the gradient.
// It is easier to calculate how many bodies (ions) are inside another body (cytoplasm) than to calculate how many bodies are inside a general area (membrane).
// That's why we added it.
export const CYTOPLASM = {
  body: null, // The inner area of the cell, used for calculating the concentration of ions inside of the cell to determine the gradient.
  radius: MEMBRANE.radius - MEMBRANE.segment_thickness / 2, // literally the size of the cytoplasm, which is (membrane size - segment size)
  color: "#2ab5b3bc" // the color of the cytoplasm
};
// Reason for using a property of CYTOPLASM is because we cannot reassing a value to an exported variable, but we can change the properties of an exported object.
// And the cytoplasm is built using a library function, so we can't just create it in the config file, we have to create it in the actual script. 











// --------------------------------------------------| RENDER CONFIGURATION |-------------------------------------------------- //


export const ION_POPULATION = []; // List of all ion particles in the simulation, used for easy access and management of ions.

export const SHOW_LABELS = true; // Draws labels on top of particles (Na, K, etc.)
export const SHOW_FORCE_RADIUS = true; // Draws a circle around each particle to visualize the interaction radius.

// Why radius^2? at small scale the forces are very strong, so we need to scale them down more aggressively to avoid chaos.
export const ION_FIELD_RADIUS = 160 * radius_factor * radius_factor; // Radius within which ions will attract/repel each other.
export const ION_FORCE_SCALE = 0.02 * radius_factor * radius_factor;   // Scales Coulombic repulsion/attraction between ions
export const RANDOM_JITTER_FORCE = 0.0002 * radius_factor * radius_factor; // Random jitter to simulate thermal motion (temperature effect)
export const GLOBAL_TEMPERATURE = 36 // CURRENTLY UNDER DEVELOPMENT: Higher temperature = more vibration (simulation only)


// STATS UPDATER
export const _createZeroIonDict = () => Object.fromEntries(Object.keys(ionConfig).map(ion => [ion, 0])); // A helper function to initial a zero dictionary with available ion, {Na:0, K:0, ...}
export const ION_STATS = {
  TOTAL_IONS_NUM: 0,
  INTRA_IONS_NUM: 0,
  EXTRA_IONS_NUM: 0,
  TOTAL_IONS_COUNT: _createZeroIonDict(),
  INTRA_IONS_COUNT: _createZeroIonDict(),
  EXTRA_IONS_COUNT: _createZeroIonDict(),
  GRADIENTS: _createZeroIonDict() // ratio of INTRA to EXTRA for each ion.
}

