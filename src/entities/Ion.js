
const { Bodies } = Matter;
import { WORLD_WIDTH, WORLD_HEIGHT, ionConfig } from "../config/config.js";


export class Ion {
    constructor(name, x = null, y = null, radius = null, color = null) {

        // Load config for specific ion
        const cfg = ionConfig[name];
        if (!cfg) throw new Error(`Unknown ion: ${name}`);

        // If spawn coordinates are not given, we randomize them
        const _x = x ?? (Math.random() * 2 - 1) * (WORLD_WIDTH * 0.8);
        const _y = y ?? (Math.random() * 2 - 1) * (WORLD_HEIGHT * 0.8);

        this.name = name;
        this.charge = cfg.charge;
        this.color = color ?? cfg.color;
        this.radius = radius ?? cfg.radius;

        // The actual Matter.js body
        this.body = Bodies.circle(_x, _y, this.radius, {
            restitution: 0.9,
            friction: 0,
            frictionAir: 0.01,
            isStatic: false,
            isSensor: false,
            render: { fillStyle: this.color }
        });

    }
    get position() { return this.body.position; }
    get velocity() { return this.body.velocity; }
    get angle() { return this.body.angle; }



}
