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
  SHOW_CHANNEL_IMPACT_RADIUS
} from "./config.js";
import { LEAK_INDICES, getIonConcentrationGradient } from "./particles_script.js";



Events.on(engine, "beforeUpdate", () => {

  // Vibration, immitation themal motion of particles. 
  const magnitude = RANDOM_JITTER_FORCE * (1 + GLOBAL_TEMPERATURE / 100); // Higher temperature = more jitter
  for (let bee of ION_POPULATION) {
    Body.applyForce(bee, bee.position, {
      x: (Math.random() - 0.5) * magnitude,
      y: (Math.random() - 0.5) * magnitude
    });
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
        Body.applyForce(a, a.position, { x: -dx * force, y: -dy * force });
        Body.applyForce(b, b.position, { x: dx * force, y: dy * force });
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

        Body.applyForce(ion, ion.position, {
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

