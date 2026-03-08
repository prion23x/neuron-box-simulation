import { render, engine } from "./init_script.js";
const { Body, Events } = Matter;
import {
  cx,
  cy,
  MEMBRANE,
  ION_POPULATION,
  SHOW_LABELS,
  SHOW_FORCE_RADIUS,
  ION_FIELD_RADIUS,
  ION_FORCE_SCALE,
  RANDOM_JITTER_FORCE,
  GLOBAL_TEMPERATURE,
  CHANNEL_PROXIMITY,
  CHANNEL_IMPACT_COLOR,
  SHOW_CHANNEL_IMPACT_RADIUS,
  SHOW_FORCE_DIRECTION,
  FORCE_VECTOR_LENGTH,
  FORCE_VECTOR_WIDTH,
  FORCE_VECTOR_HEAD_SIZE
} from "./config.js";
import { LEAK_INDICES, getIonConcentrationGradient } from "./particles_script.js";


const MIN_FORCE_VECTOR_MAGNITUDE = 1e-12;

function resetForceVectors() {
  for (const ion of ION_POPULATION) {
    if (!ion.netForceVector) {
      ion.netForceVector = { x: 0, y: 0 };
    } else {
      ion.netForceVector.x = 0;
      ion.netForceVector.y = 0;
    }
  }
}

function applyTrackedForce(ion, force, trackDirection = true) {
  Body.applyForce(ion, ion.position, force);

  // Jitter force is intentionally ignored for direction rendering to reduce visual noise.
  if (!trackDirection) return;

  ion.netForceVector.x += force.x;
  ion.netForceVector.y += force.y;
}

function drawForceDirectionArrow(ctx, ion) {
  const vector = ion.netForceVector;
  if (!vector) return;

  const magnitude = Math.hypot(vector.x, vector.y);
  if (magnitude < MIN_FORCE_VECTOR_MAGNITUDE) return;

  // normalizin to unit vectors
  const ux = vector.x / magnitude;
  const uy = vector.y / magnitude; 

  const startX = ion.position.x;
  const startY = ion.position.y;
  const endX = startX + ux * FORCE_VECTOR_LENGTH;
  const endY = startY + uy * FORCE_VECTOR_LENGTH;

  const perpX = -uy;
  const perpY = ux;
  const halfHeadWidth = FORCE_VECTOR_HEAD_SIZE * 0.5;
  const headBaseX = endX - ux * FORCE_VECTOR_HEAD_SIZE;
  const headBaseY = endY - uy * FORCE_VECTOR_HEAD_SIZE;

  ctx.strokeStyle = ion.color;
  ctx.fillStyle = ion.color;
  ctx.lineWidth = FORCE_VECTOR_WIDTH;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(headBaseX + perpX * halfHeadWidth, headBaseY + perpY * halfHeadWidth);
  ctx.lineTo(headBaseX - perpX * halfHeadWidth, headBaseY - perpY * halfHeadWidth);
  ctx.closePath();
  ctx.fill();
}


Events.on(engine, "beforeUpdate", () => {
  resetForceVectors();

  // Vibration, immitation themal motion of particles. 
  const magnitude = RANDOM_JITTER_FORCE * (1 + GLOBAL_TEMPERATURE / 100); // Higher temperature = more jitter
  for (let bee of ION_POPULATION) {
    applyTrackedForce(bee, {
      x: (Math.random() - 0.5) * magnitude,
      y: (Math.random() - 0.5) * magnitude
    }, false);
  }


  // Repulsion & Attraction management
  for (let i = 0; i < ION_POPULATION.length; i++) {
    for (let j = i + 1; j < ION_POPULATION.length; j++) {
      const a = ION_POPULATION[i];
      const b = ION_POPULATION[j];
      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ION_FIELD_RADIUS && dist > 0.5) {
        let force = ION_FORCE_SCALE * (a.charge * b.charge) / (dist * dist); // a*b automatically adjusts the magnitude and direction of the force
        applyTrackedForce(a, { x: -dx * force, y: -dy * force });
        applyTrackedForce(b, { x: dx * force, y: dy * force });
      }
    }
  }



  // 3. REPLACE the entire force block with this (uses shared constant)
  const gradient = getIonConcentrationGradient("Na");
  const deviation = gradient - 0.5;
  const FORCE_SCALE = 0.00125;

  for (const idx of LEAK_INDICES) {
    const channel = MEMBRANE.segments[idx];

    if (!channel?.isSensor) continue;

    for (const ion of ION_POPULATION) {
      if (ion.name !== "Na") continue;
      
      // calculate distance from a particle to the channel
      const dx = ion.position.x - channel.position.x;
      const dy = ion.position.y - channel.position.y;
      const dist = Math.hypot(dx, dy);

      if (dist < CHANNEL_PROXIMITY && dist > 2) {
        const rdx = ion.position.x - cx;
        const rdy = ion.position.y - cy;
        const rdist = Math.hypot(rdx, rdy) || 1;

        applyTrackedForce(ion, {
          x: (rdx / rdist) * deviation * FORCE_SCALE,
          y: (rdy / rdist) * deviation * FORCE_SCALE
        });
      }
    }
  }
});




Events.on(render, "afterRender", () => {
  const ctx = render.context;

  // Draw labels
  if (SHOW_LABELS) {
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let bee of ION_POPULATION) {
      ctx.fillText(bee.name, bee.position.x, bee.position.y);
    }
  }

  // Draw force radius (visual only, no physics)
  if (SHOW_FORCE_RADIUS) {
    ctx.lineWidth = 5;
    for (let bee of ION_POPULATION) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
      ctx.strokeStyle = bee.color + "1E";
      ctx.beginPath();
      ctx.arc(bee.position.x, bee.position.y, ION_FIELD_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  if (SHOW_FORCE_DIRECTION) {
    ctx.save();
    for (const bee of ION_POPULATION) {
      drawForceDirectionArrow(ctx, bee);
    }
    ctx.restore();
  }

  if (SHOW_CHANNEL_IMPACT_RADIUS) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = CHANNEL_IMPACT_COLOR;

    for (const idx of LEAK_INDICES) {
      const channel = MEMBRANE.segments[idx];
      if (channel?.isSensor) {
        ctx.beginPath();
        ctx.arc(
          channel.position.x,
          channel.position.y,
          CHANNEL_PROXIMITY,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
    }
  }
})
