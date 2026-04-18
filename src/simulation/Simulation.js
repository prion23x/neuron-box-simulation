const { World } = Matter;
import { world, engine, setCameraView } from "./Navigation.js";
import { ionConfig, BOX, physicsConfig, distributionConfig } from "../config/config.js";
import { LeakChannel, _spreadBilayer } from "../entities/Membrane.js"
import { INSIDE_CX, INSIDE_CY, ION_SPAWNER, OUTSIDE_CX, OUTSIDE_CY, LEAK_CHANNELS } from "./Scene.js";

export const DEFAULT_TIME_SCALE = 1.0;
export const MIN_TIME_SCALE = 0.1;
export const MAX_TIME_SCALE = 3.0;
export const PAUSED_TIME_SCALE = 0.0;
const ELECTRON_CHARGE_C = 1.602e-19;
const MEMBRANE_SPECIFIC_CAPACITANCE_F_PER_CM2 = 1e-6;
const PX_TO_CM = 0.03e-7;

export function setSimulationTimeScale(value) {
  const nextTimeScale = Number(value);

  if (Number.isNaN(nextTimeScale)) return engine.timing.timeScale;

  engine.timing.timeScale = Math.max(PAUSED_TIME_SCALE, Math.min(MAX_TIME_SCALE, nextTimeScale));
  return engine.timing.timeScale;
}

setSimulationTimeScale(PAUSED_TIME_SCALE); // Start paused
const GLOBAL_TEMPERATURE_CELCIUS = physicsConfig.GLOBAL_TEMPERATURE_CELCIUS;
const GLOBAL_TEMPERATURE_KELVIN = physicsConfig.GLOBAL_TEMPERATURE_KELVIN;

setCameraView(0, 0, 3.5);

// ARRANGE Leak Channels
LEAK_CHANNELS.push(
  new LeakChannel("K", 0, -700, ionConfig["K"].radius),
  new LeakChannel("K", 0, -350, ionConfig["K"].radius),
  new LeakChannel("K", 0, 0, ionConfig["K"].radius),
  new LeakChannel("K", 0, 350, ionConfig["K"].radius),
  new LeakChannel("K", 0, 700, ionConfig["K"].radius),
);
LEAK_CHANNELS.forEach(channel => channel.setAngle(Math.PI * 0.5));
LEAK_CHANNELS.forEach(channel => channel.close());


// FILL Phospholipid Layer
_spreadBilayer(0, -BOX.height / 2, 0, BOX.height / 2, 3, LEAK_CHANNELS, world);

// ADD Leak Channels to the world
World.add(world, LEAK_CHANNELS.flatMap(c => c.bodies));


// SPAWN the IONS 
// Note: Anions don't move across the membrane

const multiplier = distributionConfig.multiplier || 1;
const K_inside_concentration = distributionConfig.K.inside * multiplier;
const A_inside_concentration = distributionConfig.A.inside * multiplier;
const K_outside_concentration = distributionConfig.K.outside * multiplier;
const A_outside_concentration = distributionConfig.A.outside * multiplier;

ION_SPAWNER.spawnInRectangle("A", A_inside_concentration, INSIDE_CX, INSIDE_CY, (BOX.width / 2) * 0.9, BOX.height * 0.8);
ION_SPAWNER.spawnInRectangle("K", K_inside_concentration, INSIDE_CX, INSIDE_CY, (BOX.width / 2) * 0.9, BOX.height * 0.8);

ION_SPAWNER.spawnInRectangle("A", A_outside_concentration, OUTSIDE_CX, OUTSIDE_CY, (BOX.width / 2) * 0.9, BOX.height * 0.8);
ION_SPAWNER.spawnInRectangle("K", K_outside_concentration, OUTSIDE_CX, OUTSIDE_CY, (BOX.width / 2) * 0.9, BOX.height * 0.8);

export function nernst_K(cout, cin, T = 310, z = 1) {
  const R = 8.314;
  const F = 96485;
  return ((R * T) / (z * F)) * Math.log(cout / cin) * 1000; // returns mV
}

export const EQUILIBRIUM_POTENTIAL = nernst_K(K_outside_concentration, K_inside_concentration, GLOBAL_TEMPERATURE_KELVIN, ionConfig["K"].charge);

setInterval(() => {
  LEAK_CHANNELS.forEach(channel => channel.open());
}, 1000);






function _getMembranePotential(charge_inside, charge_outside, width_px = BOX.width / 2, height_px = BOX.height, depth_px = BOX.depth) {
  const Q = (charge_inside - charge_outside) * ELECTRON_CHARGE_C;
  const C = getMembraneCapacitance(width_px, height_px, depth_px);

  return (Q / C) * 1000; // Return voltage in mV
};

export function getMembraneSurfaceArea(width_px = BOX.width / 2, height_px = BOX.height, depth_px = BOX.depth) {
  const w = width_px * PX_TO_CM;
  const h = height_px * PX_TO_CM;
  const d = depth_px * PX_TO_CM;
  return 2 * (w * h + w * d + h * d);
}

export function getMembraneVolume(width_px = BOX.width / 2, height_px = BOX.height, depth_px = BOX.depth) {
  const w = width_px * PX_TO_CM;
  const h = height_px * PX_TO_CM;
  const d = depth_px * PX_TO_CM;
  return w * h * d;
}

export function getMembraneCapacitance(width_px = BOX.width / 2, height_px = BOX.height, depth_px = BOX.depth) {
  const A = getMembraneSurfaceArea(width_px, height_px, depth_px);
  return MEMBRANE_SPECIFIC_CAPACITANCE_F_PER_CM2 * A;
}


export function calculateMembraneState() {
  const channel = LEAK_CHANNELS[0];
  if (!channel) throw new Error("calculateMembraneState(): No leak channels available");

  const STATS = {
    insideCharge: 0,
    outsideCharge: 0,
    chargeDifference: 0,
    vmProxy: 0,
    vm: 0,
    equilibriumPotential: EQUILIBRIUM_POTENTIAL,
    efieldForce: 0,
    normalizedEfieldForce: 0,
    kInside: 0,
    kOutside: 0,
    kGradient: 0,
  }

  Object.keys(STATS).forEach(key => STATS[key] = 0); // Reset stats to prevent accumulation over time

  let totalAbsoluteCharge = 0;
  for (const ion of ION_SPAWNER.ion_population) {
    const ionIsInside = channel.isInside(ion);

    totalAbsoluteCharge += Math.abs(ion.charge);
    if (ionIsInside) {
      STATS.insideCharge += ion.charge;
      if (ion.name === "K") STATS.kInside++;
    } else {
      STATS.outsideCharge += ion.charge;
      if (ion.name === "K") STATS.kOutside++;
    }
  }

  const totalK = STATS.kInside + STATS.kOutside;
  if (totalK > 0) {
    STATS.kGradient = (STATS.kOutside - STATS.kInside) / totalK;
  }

  STATS.chargeDifference = STATS.insideCharge - STATS.outsideCharge; // Simple proxy for Vm based on net charge difference

  if (totalAbsoluteCharge > 0) {
    // ELLECTRIC FIELD PROXY: -1 to +1 based on net charge distribution
    STATS.vmProxy = STATS.chargeDifference / totalAbsoluteCharge;
  }

  STATS.vm = _getMembranePotential(STATS.insideCharge, STATS.outsideCharge);
  STATS.equilibriumPotential = EQUILIBRIUM_POTENTIAL;
  STATS.efieldForce = STATS.vm - STATS.equilibriumPotential;
  const normalizedDF = STATS.efieldForce / (Math.abs(STATS.equilibriumPotential) || 1);
  const clampedDF = Math.max(-1, Math.min(1, normalizedDF));
  STATS.normalizedEfieldForce = clampedDF;

  return STATS;
};
