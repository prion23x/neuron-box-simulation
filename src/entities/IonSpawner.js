// import { world, cell } from "./init.js"; // our current world
import { Ion } from "../entities/Ion.js"
import {
    WORLD_WIDTH, WORLD_HEIGHT,
    ionConfig,
} from "../config/config.js";

const { Bodies, World } = Matter;

export class IonSpawner {
    #isAddedToWorld;

    constructor(ionConfig, world = null) {
        this.ionConfig = ionConfig
        this.world = world; // Will be overwritten in this.addToWorld(_world)
        this.ion_population = [];
        this.#isAddedToWorld = false;
    }


    addToWorld(_world) {
        if (this.#isAddedToWorld == true) {
            console.warn("IonSpawnder object has already been added to the world. Ignoring...")
            return this
        };
        this.world = _world || this.world;
        World.add(this.world, this.ion_population);
        this.#isAddedToWorld = true;
        return this;
    }

    // Adds already created ion to the world.
    addIon(ion) {
        if (!this.world) throw new Error("IonSpawner must be added to world before adding ions.");
        this.ion_population.push(ion);
        World.add(this.world, ion.body);
    }

    _isIonExist(name) {
        const exists = this.ionConfig[name] ? true : false;
        return exists
    }

    spawnInCircle(name, count, center_x, center_y, radius) {
        if (!this._isIonExist(name)) throw new Error(`Unknown ion: ${name}`);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.sqrt(Math.random()) * radius; // sqrt for uniform distribution in circle
            const x = center_x + Math.cos(angle) * dist;
            const y = center_y + Math.sin(angle) * dist;

            const ion = new Ion(name, x, y);
            this.addIon(ion);

        }
    }
    spawnInRectangle(name, count, center_x, center_y, width, height = null) {
        if (!this._isIonExist(name)) throw new Error(`Unknown ion: ${name}`);
        height = height ?? width;
        for (let i = 0; i < count; i++) {
            const x = center_x - width / 2 + Math.random() * width;
            const y = center_y - height / 2 + Math.random() * height;

            const ion = new Ion(name, x, y);
            this.addIon(ion);
        }
    }

}
