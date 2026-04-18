import {
    calculateMembraneState,
    DEFAULT_TIME_SCALE,
    getMembraneCapacitance,
    getMembraneSurfaceArea,
    getMembraneVolume,
    PAUSED_TIME_SCALE,
    setSimulationTimeScale,
} from '../simulation/Simulation.js';
import { getCurrentPointerWorldPosition, getCurrentZoomScale } from '../simulation/Navigation.js';
import { BOX, ionConfig, physicsConfig, distributionConfig } from '../config/config.js';

const MEMBRANE_STATE_PANEL = document.getElementById('membrane-state-panel');
const SIMULATION_INFO_PANEL = document.querySelector('#simulation-info-panel .logs');

const startBtn = document.querySelector('#simulation-info-panel .controls .timescale .start-btn');
const pauseBtn = document.querySelector('#simulation-info-panel .controls .timescale .pause-btn');
const resetBtn = document.querySelector('#simulation-info-panel .controls .timescale .reset-btn');
const speedDisplay = document.querySelector('#simulation-info-panel .controls .speed .speed-display');
const speedSlider = document.querySelector('#simulation-info-panel .controls .speed .speed-slider');

function updateSpeedDisplay(value) {
    speedDisplay.textContent = Number(value).toFixed(1);
}

function syncPlaybackButtons(timeScale) {
    const isPaused = Number(timeScale) === PAUSED_TIME_SCALE;
    startBtn.disabled = !isPaused;
    pauseBtn.disabled = isPaused;
}

function applyTimeScale(value) {
    const appliedTimeScale = setSimulationTimeScale(value);
    updateSpeedDisplay(appliedTimeScale);
    syncPlaybackButtons(appliedTimeScale);
}

startBtn.addEventListener('click', () => {
    speedSlider.value = DEFAULT_TIME_SCALE.toFixed(1);
    applyTimeScale(DEFAULT_TIME_SCALE);
});

pauseBtn.addEventListener('click', () => {
    applyTimeScale(PAUSED_TIME_SCALE);
});

resetBtn.addEventListener('click', () => {
    window.location.reload();
});

speedSlider.addEventListener('input', (event) => {
    applyTimeScale(event.target.value);
});

updateSpeedDisplay(speedSlider.value);
syncPlaybackButtons(PAUSED_TIME_SCALE);

function addRowToPanel(line, panel) {
    if (!panel) {
        console.error('Panel element not found.');
        return;
    }
    let row = null;
    if (line === "BREAK") {
        row = document.createElement('br');
    } else if (line === "RULER") {
        row = document.createElement('hr');
    } else {
        row = document.createElement('div');
        row.className = 'membrane-row';
        row.textContent = line;
    }
    panel.appendChild(row);
}

function clearPanel(panel) {
    if (!panel) {
        console.error('Panel element not found.');
        return;
    }
    panel.innerHTML = '';
}


let STATS = {
    vm: "N/A",
    equilibriumPotential: "N/A",
    chargeDifference: "N/A",
    vmProxy: "N/A",

    kGradient: "N/A",
    efieldForce: "N/A",
    normalizedEfieldForce: "N/A",

    insideCharge: "N/A",
    outsideCharge: "N/A",
    kInside: "N/A",
    kOutside: "N/A",
}


setInterval(() => {
    STATS = calculateMembraneState();
    clearPanel(MEMBRANE_STATE_PANEL);
    clearPanel(SIMULATION_INFO_PANEL);

    console.log(STATS.vm, STATS.equilibriumPotential);
    const vm = parseFloat(STATS.vm)?.toFixed(2) || 0;
    const equilibriumPotential = parseFloat(STATS.equilibriumPotential)?.toFixed(2) || 'N/A';
    const kGradient = Math.round(parseFloat(STATS.kGradient) * 100) || 0;
    const normalizedEfieldForce = Math.round(parseFloat(STATS.normalizedEfieldForce) * 100) || 0;
    const insideCharge = parseFloat(STATS.insideCharge)?.toFixed(2) || 0;
    const outsideCharge = parseFloat(STATS.outsideCharge)?.toFixed(2) || 0;
    const chargeDifference = parseFloat(STATS.chargeDifference)?.toFixed(2) || 0;
    const vmProxy = Math.round(parseFloat(STATS.vmProxy) * 100) || 0;
    const kInside = parseFloat(STATS.kInside)?.toFixed(2) || 0;
    const kOutside = parseFloat(STATS.kOutside)?.toFixed(2) || 0;
    const pointerPosition = getCurrentPointerWorldPosition();
    const pointerX = pointerPosition ? pointerPosition.x.toFixed(1) : 'N/A';
    const pointerY = pointerPosition ? pointerPosition.y.toFixed(1) : 'N/A';

    const FLUX = Math.round(100 * (STATS.kGradient * STATS.normalizedEfieldForce)) || 0;

    addRowToPanel(`K+ Flux: ${FLUX}%`, MEMBRANE_STATE_PANEL);
    addRowToPanel("RULER", MEMBRANE_STATE_PANEL);
    addRowToPanel(`Membrane Voltage: ${vm} mV`, MEMBRANE_STATE_PANEL);
    addRowToPanel(`Equilibrium Potential: ${equilibriumPotential} mV`, MEMBRANE_STATE_PANEL);
    addRowToPanel(`Potassium Gradient: ${kGradient}%`, MEMBRANE_STATE_PANEL);
    addRowToPanel(`Electric Field Force: ${normalizedEfieldForce}%`, MEMBRANE_STATE_PANEL);
    addRowToPanel("RULER", MEMBRANE_STATE_PANEL);
    addRowToPanel(`Vm Proxy: ${vmProxy}%`, MEMBRANE_STATE_PANEL);
    addRowToPanel(`Charge Difference: ${chargeDifference} C`, MEMBRANE_STATE_PANEL);
    addRowToPanel(`Inside Charge: ${insideCharge} C`, MEMBRANE_STATE_PANEL);
    addRowToPanel(`Outside Charge: ${outsideCharge} C`, MEMBRANE_STATE_PANEL);
    addRowToPanel("RULER", MEMBRANE_STATE_PANEL);
    addRowToPanel(`K+ Inside: ${kInside} mM`, MEMBRANE_STATE_PANEL);
    addRowToPanel(`K+ Outside: ${kOutside} mM`, MEMBRANE_STATE_PANEL);



    const pxToNm = 0.03; // 1 px = 0.03 nm
    const boxW = BOX.width;
    const boxH = BOX.height;
    const boxD = BOX.depth;
    const kRadius = ionConfig.K.radius;
    const aRadius = ionConfig.A.radius;
    const membraneArea = getMembraneSurfaceArea();
    const membraneVolume = getMembraneVolume();
    const membraneCapacitance = getMembraneCapacitance();

    const temperatureC = physicsConfig.GLOBAL_TEMPERATURE_CELCIUS;
    const temperatureK = physicsConfig.GLOBAL_TEMPERATURE_KELVIN;

    const intialDistribution_multiplier = distributionConfig.multiplier || 1;
    const initialDistribution_KInside = distributionConfig.K.inside * intialDistribution_multiplier;
    const initialDistribution_KOutside = distributionConfig.K.outside * intialDistribution_multiplier;
    const initialDistribution_AInside = distributionConfig.A.inside * intialDistribution_multiplier;
    const initialDistribution_AOutside = distributionConfig.A.outside * intialDistribution_multiplier;

    // addRowToPanel("RULER", SIMULATION_INFO_PANEL);
    // addRowToPanel("⎯⎯⎯[ SIMULATION ]⎯⎯⎯", SIMULATION_INFO_PANEL);
    // addRowToPanel(`K+ Inside: ${initialDistribution_KInside} mM`, SIMULATION_INFO_PANEL);
    // addRowToPanel(`K+ Outside: ${initialDistribution_KOutside} mM`, SIMULATION_INFO_PANEL);
    // addRowToPanel(`A- Inside: ${initialDistribution_AInside} mM`, SIMULATION_INFO_PANEL);
    // addRowToPanel(`A- Outside: ${initialDistribution_AOutside} mM`, SIMULATION_INFO_PANEL);
    // addRowToPanel("BREAK", SIMULATION_INFO_PANEL);

    addRowToPanel("⎯⎯⎯⎯⎯[ SCALE ]⎯⎯⎯⎯⎯", SIMULATION_INFO_PANEL);
    addRowToPanel("BREAK", SIMULATION_INFO_PANEL);
    addRowToPanel(`1 px = 0.03 nm`, SIMULATION_INFO_PANEL);
    addRowToPanel(`1000 px = 30 nm`, SIMULATION_INFO_PANEL);
    addRowToPanel(`X: ${pointerX}`, SIMULATION_INFO_PANEL);
    addRowToPanel(`Y: ${pointerY}`, SIMULATION_INFO_PANEL);
    addRowToPanel(`Zoom: ${getCurrentZoomScale()}x`, SIMULATION_INFO_PANEL);
    addRowToPanel("BREAK", SIMULATION_INFO_PANEL);

    
    addRowToPanel("⎯⎯⎯⎯⎯[ BOX ]⎯⎯⎯⎯⎯", SIMULATION_INFO_PANEL);
    addRowToPanel("BREAK", SIMULATION_INFO_PANEL);
    addRowToPanel(`Width: ${boxW}px / ${boxW * pxToNm}nm`, SIMULATION_INFO_PANEL);
    addRowToPanel(`Height: ${boxH}px / ${boxH * pxToNm}nm`, SIMULATION_INFO_PANEL);
    addRowToPanel(`Depth: ${boxD}px / ${boxD * pxToNm}nm`, SIMULATION_INFO_PANEL);
    addRowToPanel(`Area: ${membraneArea.toExponential(2)} cm^2`, SIMULATION_INFO_PANEL);
    addRowToPanel(`Volume: ${membraneVolume.toExponential(2)} cm^3`, SIMULATION_INFO_PANEL);
    addRowToPanel(`Capacitance: ${membraneCapacitance.toExponential(2)} F`, SIMULATION_INFO_PANEL);
    // VOLUME
    addRowToPanel("BREAK", SIMULATION_INFO_PANEL);

    
    addRowToPanel("⎯⎯⎯⎯⎯[ IONS ]⎯⎯⎯⎯⎯", SIMULATION_INFO_PANEL);
    addRowToPanel("BREAK", SIMULATION_INFO_PANEL);
    addRowToPanel(`K+ Radius: ${kRadius}px / ${kRadius * pxToNm}nm`, SIMULATION_INFO_PANEL);
    addRowToPanel(`A- Radius: ${aRadius}px / ${aRadius * pxToNm}nm`, SIMULATION_INFO_PANEL);
    addRowToPanel("BREAK", SIMULATION_INFO_PANEL);

    addRowToPanel("⎯⎯⎯⎯[ PHYSICS ]⎯⎯⎯⎯", SIMULATION_INFO_PANEL);
    addRowToPanel("BREAK", SIMULATION_INFO_PANEL);
    addRowToPanel(`Temp°: ${temperatureC}°C / ${temperatureK}K`, SIMULATION_INFO_PANEL);
    addRowToPanel("BREAK", SIMULATION_INFO_PANEL);

}, 100); // Update every 100 ms
