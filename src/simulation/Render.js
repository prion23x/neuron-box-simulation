// const SHOW_ION_VECTORS = false;
// const FORCE_VECTOR_LENGTH = 40;
// const FORCE_VECTOR_WIDTH = 2;
// const FORCE_VECTOR_HEAD_SIZE = 8;
// const MIN_FORCE_VECTOR_MAGNITUDE = 1e-7;



// function resetForceVectors() {
//   for (const ion of ION_POPULATION) {
//     const body = ion.body;
//     if (!body.netForceVector) {
//       body.netForceVector = { x: 0, y: 0 };
//     } else {
//       body.netForceVector.x = 0;
//       body.netForceVector.y = 0;
//     }
//   }
// }

// function worldToScreen(x, y) {
//   const bounds = render.bounds;
//   const options = render.options;
//   return {
//     x: (x - bounds.min.x) / (bounds.max.x - bounds.min.x) * options.width,
//     y: (y - bounds.min.y) / (bounds.max.y - bounds.min.y) * options.height
//   };
// }

// function drawForceDirectionArrow(ctx, body) {
//   const vector = body.netForceVector;
//   if (!vector) return;

//   const _magnitude = Math.hypot(vector.x, vector.y);
//   if (_magnitude < MIN_FORCE_VECTOR_MAGNITUDE) return;

//   const ux = vector.x / _magnitude;
//   const uy = vector.y / _magnitude;

//   // Convert world origin to screen, then offset by arrow length in screen pixels
//   const origin = worldToScreen(body.position.x, body.position.y);
//   const startX = origin.x;
//   const startY = origin.y;
//   const endX = startX + ux * FORCE_VECTOR_LENGTH;
//   const endY = startY + uy * FORCE_VECTOR_LENGTH;

//   const perpX = -uy;
//   const perpY = ux;
//   const halfHeadWidth = FORCE_VECTOR_HEAD_SIZE * 0.5;
//   const headBaseX = endX - ux * FORCE_VECTOR_HEAD_SIZE;
//   const headBaseY = endY - uy * FORCE_VECTOR_HEAD_SIZE;

//   ctx.strokeStyle = "white";
//   ctx.fillStyle = "white";
//   ctx.lineWidth = FORCE_VECTOR_WIDTH;

//   ctx.beginPath();
//   ctx.moveTo(startX, startY);
//   ctx.lineTo(endX, endY);
//   ctx.stroke();

//   ctx.beginPath();
//   ctx.moveTo(endX, endY);
//   ctx.lineTo(headBaseX + perpX * halfHeadWidth, headBaseY + perpY * halfHeadWidth);
//   ctx.lineTo(headBaseX - perpX * halfHeadWidth, headBaseY - perpY * halfHeadWidth);
//   ctx.closePath();
//   ctx.fill();
// }
// // -----------------------------------------------------------------------


// Events.on(render, "afterRender", () => {
//   const ctx = render.context;

//   ctx.save();

//   if (SHOW_ION_VECTORS == true) {
//     for (const ion of ION_POPULATION) {
//       drawForceDirectionArrow(ctx, ion.body);
//     }
//   }

//   for (const leakChannel of LEAK_CHANNELS) {
//     // Draw leak channel normal
//     const origin = worldToScreen(leakChannel.position.x, leakChannel.position.y);
//     const nx = leakChannel.normal.x;
//     const ny = leakChannel.normal.y;
//     const len = 40;
//     const endX = origin.x + nx * len;
//     const endY = origin.y + ny * len;

//     ctx.strokeStyle = "#ffffff5f";
//     ctx.fillStyle = "#ffffff5f";
//     ctx.lineWidth = 2;
//     ctx.beginPath();
//     ctx.moveTo(origin.x, origin.y);
//     ctx.lineTo(endX, endY);
//     ctx.stroke();


//     // dot
//     ctx.beginPath();
//     ctx.arc(origin.x, origin.y, 5, 0, Math.PI * 2);
//     ctx.fill();

//     // arrowhead
//     const perpX = -ny, perpY = nx;
//     const hx = endX - nx * 8, hy = endY - ny * 8;
//     ctx.beginPath();
//     ctx.moveTo(endX, endY);
//     ctx.lineTo(hx + perpX * 4, hy + perpY * 4);
//     ctx.lineTo(hx - perpX * 4, hy - perpY * 4);
//     ctx.closePath();
//     ctx.fill();
//   }


//   ctx.restore();
// });