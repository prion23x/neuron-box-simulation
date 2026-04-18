const { Bodies, World, Body, Events } = Matter;
import { engine } from "../simulation/Navigation.js"
import { ION_SPAWNER, LEAK_CHANNELS } from "./Scene.js"
import { BOX } from "../config/config.js"

import { calculateMembraneState } from "./Simulation.js"
import { physicsConfig } from "../config/config.js";


// -------------------------------------------------------------------

const GLOBAL_TEMPERATURE_CELCIUS = physicsConfig.GLOBAL_TEMPERATURE_CELCIUS;

const ACTIVATE_THERMAL_JITTER = physicsConfig.ACTIVATE_THERMAL_JITTER;
const THERMAL_JITTER_MAGNITUDE = physicsConfig.THERMAL_JITTER_MAGNITUDE;
const ACTIVATE_COULOMB_FORCE = physicsConfig.ACTIVATE_COULOMB_FORCE;
const COULOMB_FORCE_MAGNITUDE = physicsConfig.COULOMB_FORCE_MAGNITUDE;
const COULOMB_MIN_DISTANCE_SCALAR = physicsConfig.COULOMB_MIN_DISTANCE_SCALAR;

const FLUX_FORCE_MAGNITUDE = physicsConfig.FLUX_FORCE_MAGNITUDE; // Attraction force towards the channel for permeable ions.
const FLUX_LINEAR_PUSH_SCALAR = physicsConfig.FLUX_LINEAR_PUSH_SCALAR; // Exponentially increases the push force as ions get closer to the channel

// -------------------------------------------------------------------


// function getMembranePotential(charge_inside, charge_outside, width_px = BOX.width / 2, height_px = BOX.height, depth_px = BOX.depth) {
//     const e = 1.602e-19;          // charge (C)
//     const Cm = 1e-6;              // F/cm^2
//     const px_to_cm = 0.03e-7;     // 1 px = 0.03 nm = 3e-9 cm

//     // convert to cm
//     const w = width_px * px_to_cm;
//     const h = height_px * px_to_cm;
//     const d = depth_px * px_to_cm;

//     const Q = (charge_inside - charge_outside) * e;
//     const A = 2 * (w * h + w * d + h * d);
//     const C = Cm * A;

//     return (Q / C) * 1000; // Return voltage in mV
// }

// export function calculateMembraneState(base_x = BOX.base_x) {
//     const state = {
//         insideCharge: 0,
//         outsideCharge: 0,
//         kInside: 0,
//         kOutside: 0,
//         kGradient: 0,
//         vmProxy: 0,
//         vm: 0,
//         equilibriumPotential: 0,
//         efieldForce: 0,
//         normalizedEfieldForce: 0

//     };

//     let totalAbsoluteCharge = 0;

//     for (const ion of ION_SPAWNER.ion_population) {
//         const isInside = ion.body.position.x < base_x;

//         totalAbsoluteCharge += Math.abs(ion.charge);
//         if (isInside) {
//             state.insideCharge += ion.charge;
//             if (ion.name === "K") state.kInside++;
//         } else {
//             state.outsideCharge += ion.charge;
//             if (ion.name === "K") state.kOutside++;
//         }
//     }

//     const totalK = state.kInside + state.kOutside;
//     if (totalK > 0) {
//         state.kGradient = (state.kOutside - state.kInside) / totalK;
//     }

//     state.chargeDifference = state.insideCharge - state.outsideCharge; // Simple proxy for Vm based on net charge difference

//     if (totalAbsoluteCharge > 0) {
//         // ELLECTRIC FIELD PROXY: -1 to +1 based on net charge distribution
//         state.vmProxy = state.chargeDifference / totalAbsoluteCharge;
//     }

//     state.vm = getMembranePotential(state.insideCharge, state.outsideCharge);
//     state.equilibriumPotential = EQUILIBRIUM_POTENTIAL;
//     state.efieldForce = state.vm - state.equilibriumPotential;
//     const normalizedDF = state.efieldForce / (Math.abs(state.equilibriumPotential) || 1);
//     const clampedDF = Math.max(-1, Math.min(1, normalizedDF));
//     state.normalizedEfieldForce = clampedDF;

//     return state;
// }

// Temporary test logging
// setInterval(() => {

//     const membraneState = calculateMembraneState();

//     const vm = membraneState.vm;
//     const vmProxy = membraneState.vmProxy;
//     const kGradient = membraneState.kGradient;
//     const kInside = membraneState.kInside;
//     const kOutside = membraneState.kOutside;
//     const equilibriumPotential = membraneState.equilibriumPotential;
//     const efieldForce = membraneState.efieldForce;



//     console.log(
//         "FLUX:", (membraneState.kGradient * membraneState.normalizedEfieldForce).toFixed(4),
//         `vm: ${vm.toFixed(2)}/${equilibriumPotential.toFixed(2)} mV`,
//         "efieldForce:", efieldForce.toFixed(2), "mV",
//         "normalizedEfieldForce:", membraneState.normalizedEfieldForce.toFixed(2),
//         // "vmProxy:", vmProxy.toFixed(2),
//         // "kGrad:", kGradient.toFixed(2),
//         // "kInside:", kInside,
//         // "kOutside:", kOutside,
//         // "modifiedKGrad:", modifiedKGradient.toFixed(2)
//     );
// }, 500);


function resetForceVectors() {
    for (const ion of ION_SPAWNER.ion_population) {
        const body = ion.body;
        if (!body.netForceVector) {
            body.netForceVector = { x: 0, y: 0 };
        } else {
            body.netForceVector.x = 0;
            body.netForceVector.y = 0;
        }
    }
}

function applyTrackedForce(body, force, trackDirection = true) {
    Body.applyForce(body, body.position, force);

    // Jitter / non-directional forces can opt out of tracking
    if (!trackDirection) return;

    body.netForceVector.x += force.x;
    body.netForceVector.y += force.y;
}


Events.on(engine, "beforeUpdate", () => {
    resetForceVectors();

    const ms = calculateMembraneState();
    const FLUX = ms.kGradient * ms.normalizedEfieldForce;

    if (ACTIVATE_COULOMB_FORCE) {
        // Repulsion & Attraction between ions based on charge
        for (let i = 0; i < ION_SPAWNER.ion_population.length; i++) {
            for (let j = i + 1; j < ION_SPAWNER.ion_population.length; j++) {

                const a = ION_SPAWNER.ion_population[i];
                const b = ION_SPAWNER.ion_population[j];

                const dx = b.body.position.x - a.body.position.x;
                const dy = b.body.position.y - a.body.position.y;
                const dist = Math.hypot(dx, dy);
                const nx = dx / dist;
                const ny = dy / dist;

                if (dist < COULOMB_MIN_DISTANCE_SCALAR * (a.radius * 2)) {
                    // Scale force with distance
                    const forceMagnitude = COULOMB_FORCE_MAGNITUDE * (a.charge * b.charge) / (dist * dist);
                    applyTrackedForce(a.body, { x: -nx * forceMagnitude, y: -ny * forceMagnitude });
                    applyTrackedForce(b.body, { x: nx * forceMagnitude, y: ny * forceMagnitude });


                }
            }
        }
    }
    if (ACTIVATE_THERMAL_JITTER) {

        const magnitude = THERMAL_JITTER_MAGNITUDE * (1 + GLOBAL_TEMPERATURE_CELCIUS / 100); // Higher temperature = more jitter
        for (let ion of ION_SPAWNER.ion_population) {
            applyTrackedForce(ion.body, {
                x: (Math.random() - 0.5) * magnitude,
                y: (Math.random() - 0.5) * magnitude
            });
        }
    }

    // Gradient + Leak channel propulsion
    for (const ion of ION_SPAWNER.ion_population) {

        // Find closest channel for this ion
        const leakChannel = LEAK_CHANNELS.reduce((best, ch) => {
            const d = Math.hypot(ch.position.x - ion.position.x, ch.position.y - ion.position.y);
            return d < best.dist ? { ch, dist: d } : best;
        }, { ch: null, dist: Infinity }).ch;
        if (!leakChannel) continue;

        // If leak channels exist and is open
        if (!leakChannel || !leakChannel.isOpen) continue;

        const distToMembrane = Math.abs(ion.body.position.x - leakChannel.position.x);
        // If inward flux, affect only outside ions. If outward flux, affect only inside ions.
        // BUT don't reverse mid-crossing
        const inChannelZone = distToMembrane < leakChannel.height * 0.5;
        if (inChannelZone && (leakChannel.isInside(ion) && FLUX > 0) || (!leakChannel.isInside(ion) && FLUX < 0)) continue;

        // Calculate distance and direction from ion to channel center
        const dx = leakChannel.position.x - ion.position.x;
        const dy = leakChannel.position.y - ion.position.y;
        const dist = Math.sqrt(dx ** 2 + dy ** 2);
        const nx = dx / dist;
        const ny = dy / dist;
        const perpX = -leakChannel.normal.y;
        const perpY = leakChannel.normal.x;
        const lateralDist = Math.abs(dx * perpX + dy * perpY);
        const alongNormal = Math.abs(dx * leakChannel.normal.x + dy * leakChannel.normal.y);
        const isIonAlongChannel = lateralDist < ion.radius * 3 && alongNormal < leakChannel.height * 1;

        // Push away the undesired ion
        if (ion.name != leakChannel.permeable_ion) {
            const isIonAlongChannel = lateralDist < ion.radius * 2 && alongNormal < leakChannel.height;

            if (!isIonAlongChannel) continue;
            //  Push non-permeable ions away from channel opening (opposite to flux direction
            // const forceMagnitude = FLUX_FORCE_MAGNITUDE * (Math.abs(dist * 1.5) ** FLUX_LINEAR_PUSH_SCALAR);
            const forceMagnitude = FLUX_FORCE_MAGNITUDE * (Math.abs(dist * 2) ** (FLUX_LINEAR_PUSH_SCALAR / 2));
            const fluxDirection = FLUX >= 0 ? 1 : -1; // +1 for outward, -1 for inward
            const xDirection = forceMagnitude * fluxDirection * leakChannel.normal.x;
            const yDirection = forceMagnitude * fluxDirection * leakChannel.normal.y;

            applyTrackedForce(
                ion.body,
                {
                    x: xDirection,
                    y: yDirection
                })
            continue;

        }

        // Push the permeable ions through the channel (in flux direction)
        else {
            // The direction is alway towards the center membrane
            const forceMagnitude = FLUX_FORCE_MAGNITUDE
            // Here abs(FLUX) is used to ensure that the force is affected by FLUX, but not its direction
            const xDirection = forceMagnitude * nx * Math.abs(FLUX);
            const yDirection = forceMagnitude * ny * Math.abs(FLUX);

            applyTrackedForce(
                ion.body,
                {
                    x: xDirection,
                    y: yDirection
                }
            )
            if (isIonAlongChannel) {

                const forceMagnitude = FLUX_FORCE_MAGNITUDE * (Math.abs(dist * 2));
                // const forceMagnitude = FLUX_FORCE_MAGNITUDE * 30;
                const fluxDirection = FLUX > 0 ? 1 : -1; // +1 for outward, -1 for inward
                const xDirection = forceMagnitude * FLUX * -leakChannel.normal.x;
                const yDirection = forceMagnitude * FLUX * -leakChannel.normal.y;

                applyTrackedForce(
                    ion.body,
                    {
                        x: xDirection,
                        y: yDirection
                    }
                )
            }


        }

    }




});
