import { createParticle } from "./particles_script.js";
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    MEMBRANE,
} from "./config.js";
import { world } from "./init_script.js";
const { World } = Matter;

const MAX_X = CANVAS_WIDTH;
const MAX_Y = CANVAS_HEIGHT;

const ion_buttons = document.querySelectorAll(".ion-button");
const addButton = document.getElementById("add-button");
const countInput = document.getElementById("particle-count");
const locationRadios = document.querySelectorAll('input[name="location"]');
const customCoordsDiv = document.getElementById("custom-coords");
const coordXInput = document.getElementById("coord-x");
const coordYInput = document.getElementById("coord-y");
const errorMsg = document.getElementById("coord-error");

let activeIon = "Na"; // default selected ion type.

// Select Ion logic
ion_buttons.forEach(button => {
    button.addEventListener("click", () => {
        ion_buttons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        activeIon = button.textContent.trim();
    });
});

// Toggle location type logic
locationRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
        if (e.target.value === "custom") {
            customCoordsDiv.style.display = "flex";
        } else {
            customCoordsDiv.style.display = "none";
            errorMsg.textContent = "";
        }
    });
});

// Add Particles adding logic.
addButton.addEventListener("click", () => {
    if (!activeIon) {
        alert("Please select an ion first.");
        return;
    }

    const count = parseInt(countInput.value, 10);
    if (isNaN(count) || count <= 0) return;

    let spawnX = 400; // Default center X
    let spawnY = 400; // Default center Y

    const locationType = document.querySelector('input[name="location"]:checked').value;

    if (locationType === "top") {
        spawnY = 50;
    } else if (locationType === "bottom") {
        spawnY = MAX_Y - 50;
    } else if (locationType === "left") {
        spawnX = 50;
    } else if (locationType === "right") {
        spawnX = MAX_X - 50;
    }

    if (locationType === "custom") {
        const x = parseFloat(coordXInput.value);
        const y = parseFloat(coordYInput.value);

        if (isNaN(x) || x < 0 || x > MAX_X || isNaN(y) || y < 0 || y > MAX_Y) {
            errorMsg.textContent = `Error: X must be between 0 and ${MAX_X}, Y between 0 and ${MAX_Y}.`;
            return;
        }
        errorMsg.textContent = "";
        spawnX = x;
        spawnY = y;
    }

    
    for (let i = 0; i < count; i++) {
        // Apply slight random jitter to spawn location so particles don't overlap perfectly
        const jitterX = spawnX + (Math.random() - 0.5) * 40;
        const jitterY = spawnY + (Math.random() - 0.5) * 40;

        const newParticle = createParticle(activeIon, jitterX, jitterY);
        // World.add(world, newParticle);
    }

});


const channelOpenButton = document.getElementById("channel-open-button");
const channelCloseButton = document.getElementById("channel-close-button");


// channelOpenButton.addEventListener("click", () => {
//     const channelSegmentIndices = [0, 1, 2, 14, 15, 16, 28, 29, 30, 43, 44];
//     for (const idx of channelSegmentIndices) {
//         if (idx < MEMBRANE.segments.length) {
//             MEMBRANE.segments[idx].render.fillStyle = "#fbbf24"; // Highlight channel segments
//             MEMBRANE.segments[idx].isSensor = true; // Make channel segments dynamic
//         }
//     }
// });

// channelCloseButton.addEventListener("click", () => {
//     const channelSegmentIndices = [0, 1, 2, 14, 15, 16, 28, 29, 30, 43, 44];
//     for (const idx of channelSegmentIndices) {
//         if (idx < MEMBRANE.segments.length) {
//             MEMBRANE.segments[idx].render.fillStyle = "#64748b"; // Reset channel segments to default color
//             MEMBRANE.segments[idx].isSensor = false; // Make channel segments static
//         }
//     }
// });
