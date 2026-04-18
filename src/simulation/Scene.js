import { IonSpawner } from "../entities/IonSpawner.js";
import { world } from "./Navigation.js"
import { ionConfig, BOX } from "../config/config.js";
const { Bodies, World, Body, Events } = Matter;

export const ION_SPAWNER = new IonSpawner(ionConfig).addToWorld(world)
export const LEAK_CHANNELS = [];

export const INSIDE_CX = BOX.base_x - BOX.width / 4;
export const INSIDE_CY = BOX.base_y;
export const OUTSIDE_CX = BOX.base_x + BOX.width / 4;
export const OUTSIDE_CY = BOX.base_y


const topWall = Bodies.rectangle(
    BOX.base_x, BOX.base_y - BOX.height / 2 - BOX.thickness / 2, BOX.width, BOX.thickness,
    {
        isStatic: true,
        isSensor: false,
        render: { fillStyle: BOX.color }
    }
)
const bottomWall = Bodies.rectangle(
    BOX.base_x, BOX.base_y + BOX.height / 2 + BOX.thickness / 2, BOX.width, BOX.thickness,
    {
        isStatic: true,
        isSensor: false,
        render: { fillStyle: BOX.color }
    }
)
const leftWall = Bodies.rectangle(
    BOX.base_x - BOX.width / 2 - BOX.thickness / 2, BOX.base_y, BOX.thickness, BOX.height,
    {
        isStatic: true,
        isSensor: false,
        render: { fillStyle: BOX.color }
    }
)
const rightWall = Bodies.rectangle(
    BOX.base_x + BOX.width / 2 + BOX.thickness / 2, BOX.base_y, BOX.thickness, BOX.height,
    {
        isStatic: true,
        isSensor: false,
        render: { fillStyle: BOX.color }
    }
)

World.add(world, [topWall, bottomWall, leftWall, rightWall]);


