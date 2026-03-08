

// DON'T add any particles here - this file is only for setting up the scene (membrane, cytoplasm)


import { world } from "./init_script.js";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  cx,
  cy,
  ionConfig,
  MEMBRANE,
  CYTOPLASM,
  ION_POPULATION,
  ION_STATS,
  _createZeroIonDict
} from "./config.js";
const { Bodies, World } = Matter;


/**
 * Helper function. 
 * Avoid using directly - use createParticle instead, which also adds an ion to rendered list and updates the ION_STATS.TOTAL_IONS_COUNT object.
 * 
 * @param {string} name - The name of the particle
 * @param {number|null} x
 * @param {number|null} y
 * @param {number|null} radius
 * @param {string|null} color
 */
export function _createParticle(
  name, // e.g, 
  x = null,
  y = null,
  radius = null,
  color = null) {
  const cfg = ionConfig[name] || {};
  if (!cfg) throw new Error(`Unkown ion: ${name}`);

  const _x = x ?? Math.random() * (CANVAS_WIDTH * 0.7); // 70% of canvas for safety margin
  const _y = y ?? Math.random() * (CANVAS_HEIGHT * 0.7); // 70% of canvas for safety margin
  const _radius = radius ?? cfg.radius;
  const _color = color ?? cfg.color;
  const _name = name;
  const _charge = cfg.charge;

  const particle = Bodies.circle(
    _x,
    _y,
    _radius,
    {
      isStatic: false,
      render: { fillStyle: _color }
    }
  );
  particle.charge = _charge;
  particle.name = _name;
  particle.color = _color

  return particle;
}

/**
 * 1. Creates a particle; 
 * 2. Adds a particle to rendering population; 
 * 3. Updates the ION_STATS.TOTAL_IONS_COUNT object for that ion type.
 * 
 * @param {string} name - The name of the particle
 * @param {number|null} x
 * @param {number|null} y
 * @param {number|null} radius
 * @param {string|null} color
 */
export function createParticle(name, x = null, y = null, radius = null, color = null) {
  const particle = _createParticle(name, x, y, radius, color);
  ION_POPULATION.push(particle);
  ION_STATS.TOTAL_IONS_COUNT[particle.name] = (ION_STATS.TOTAL_IONS_COUNT[particle.name] || 0) + 1;
  World.add(world, particle);
  return particle;
}



// Development of concentration gradient calculations
// ------part 1 : defining the base functions;


//helper function to check if ion inside cytoplasm
function _isIonInsideCytoplasm(ion) {
  const dx = ion.position.x - cx;
  const dy = ion.position.y - cy;
  return dx * dx + dy * dy < CYTOPLASM.radius * CYTOPLASM.radius;
}


// --------------------| Number Related |--------------------|


// Number of all ions in total
function getTotalIonsNum() {
  return ION_POPULATION.length;
}

// Number of specific ion in total
function getTotalIonNum(ionName) {
  let count = 0;
  for (const _ion of ION_POPULATION) {
    if (_ion.name === ionName) {
      count++;
    }
  }
  return count;
}

// Number of all ions inside the cytoplasm
function getIntraIonsNum() {
  let total = 0;
  for (const ion of ION_POPULATION) {
    if (_isIonInsideCytoplasm(ion)) {
      total++;
    }
  }
  return total;
}

// Number of specific ions inside the cytoplasm
function getIntraIonNum(ionName) {
  let total = 0;
  for (const ion of ION_POPULATION) {
    if (_isIonInsideCytoplasm(ion) && ion.name === ionName) {
      total++;
    }
  }
  return total;
}

// Number of all ions outside the cytoplasm
function getExtraIonsNum() {
  return getTotalIonsNum() - getIntraIonsNum();
}

// Number of specific ions outside the cytoplasm
function getExtraIonNum(ionName) {
  return getTotalIonNum(ionName) - getIntraIonNum(ionName);
}


// --------------------| Count {} Related |--------------------|


// Count of Ions in total
function getTotalIonsCount() {
  const counts = _createZeroIonDict() // a zero dict of ions, e.g., {Na:0, K:0, etc}
  for (const ion of ION_POPULATION) {
    counts[ion.name]++;
  }
  return counts;
}

// Count of Ions inside the cytoplasm
function getIntraIonsCount() {
  const intraCounts = _createZeroIonDict() // a zero dict of ions, e.g., {Na:0, K:0, etc}
  for (const ion of ION_POPULATION) {
    if (_isIonInsideCytoplasm(ion)) {
      intraCounts[ion.name]++;
    }
  }
  return intraCounts;
}

// Count of Ions outside the cytoplasm
function getExtraIonsCount() {
  const extraCounts = _createZeroIonDict() // a zero dict of ions, e.g., {Na:0, K:0, etc}
  for (const ion of ION_POPULATION) {
    if (!_isIonInsideCytoplasm(ion)) {
      extraCounts[ion.name]++;
    }
  }
  return extraCounts;
}

// Count of Ions inside, outside, and in total (separately)
// More efficient to use than separate getExtraIonsCount() / getIntraIonsCount()
// returns {intra: ..., extra: ..., total: ...}
function getIonsCountsByLocation() {
  const intra = _createZeroIonDict();
  const extra = _createZeroIonDict();
  const total = _createZeroIonDict();

  for (const ion of ION_POPULATION) {
    total[ion.name]++;
    if (_isIonInsideCytoplasm(ion)) {
      intra[ion.name]++;
    } else {
      extra[ion.name]++;
    }
  }

  return { intra, extra, total };
}


// --------------------| Gradient Related |--------------------|


// Concentration Gradient (intra:extra) of specific ion 
// In other words, concentrationof specific ion inside the cytoplasm
// Example: 10 of Na inside and 90 outside => returns 0.1 (=10%)
export function getIonConcentrationGradient(ionName) {
  const intraNum = getIntraIonNum(ionName);
  const totalNum = getTotalIonNum(ionName);
  return intraNum / (totalNum || 1) // 1 if all inside; 0 if all outside
}

// Ratio of concentraion of specific ion {intra: x, extra: y} (x+y=1) 
// Example: 10 of Na inside and 90 outside => returns {intra: 0.1 , extra: 0.9} 
function getIonConcentrationRatios(ionName) {
  const intraNum = getIntraIonNum(ionName);
  const extraNum = getExtraIonNum(ionName);
  const totalNum = getTotalIonNum(ionName);
  return {
    intra: intraNum / (totalNum || 1),
    extra: extraNum / (totalNum || 1)
  }
}



setInterval(() => {
  ION_STATS.TOTAL_IONS_NUM = getTotalIonsNum();
  ION_STATS.INTRA_IONS_NUM = getIntraIonsNum();
  ION_STATS.EXTRA_IONS_NUM = getExtraIonsNum();

  ION_STATS.TOTAL_IONS_COUNT = getTotalIonsCount();
  ION_STATS.INTRA_IONS_COUNT = getIntraIonsCount();
  ION_STATS.EXTRA_IONS_COUNT = getExtraIonsCount();

  console.log(getIonConcentrationGradient("Na"));
}, 1000);


export const LEAK_INDICES = [1, 2, 3, 4];

for (const idx in LEAK_INDICES) {
  MEMBRANE.segments[idx].render.fillStyle = "#37ff00"; // Reset channel segments to default color
  MEMBRANE.segments[idx].isSensor = true; // Make channel segments static
}
