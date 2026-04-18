const { Bodies, World, Body } = Matter;



// Bilayer

export function buildBilayerSegment(x = 0, y = 0, vertical_gap = 3) {
    const base_x = x || 0;
    const base_y = y || 0;

    const tail_width = 3;
    const tail_height = 30;
    const tail_chamfer = tail_width * 0.4;

    const head_radius = 10;
    const head_diameter = head_radius * 2;

    const gap = vertical_gap;



    const upperHead = Bodies.circle(
        base_x,
        base_y,
        head_radius,
        {
            isStatic: true,
            render: {
                fillStyle: "#ce3e3e"
            }
        }
    )

    const lowerHead = Bodies.circle(
        base_x,
        base_y + tail_height * 2 + gap,
        head_radius,
        {
            isStatic: true,
            render: {
                fillStyle: "#ce3e3e"
            }
        }
    )


    const upperLeftTail = Bodies.rectangle(
        base_x - head_radius * 0.4,
        base_y + tail_height / 2,
        tail_width,
        tail_height,
        {
            chamfer: { radius: [tail_chamfer, tail_chamfer, tail_chamfer, tail_chamfer] },
            angle: Math.PI * -0.01,
            isStatic: true,
            render: {
                fillStyle: "#bfad06"
            }
        }
    )

    const upperRightTail = Bodies.rectangle(
        base_x + head_radius * 0.4,
        base_y + tail_height / 2,
        tail_width,
        tail_height,
        {
            angle: Math.PI * 0.01,
            chamfer: { radius: [tail_chamfer, tail_chamfer, tail_chamfer, tail_chamfer] },
            isStatic: true,
            render: {
                fillStyle: "#bfad06"
            }
        }
    )

    const lowerLeftTail = Bodies.rectangle(
        base_x - head_radius * 0.4,
        base_y + tail_height * 2 + gap - tail_height / 2,
        tail_width,
        tail_height,
        {
            chamfer: { radius: [tail_chamfer, tail_chamfer, tail_chamfer, tail_chamfer] },
            angle: Math.PI * 1.01,
            isStatic: true,
            isSensor: true,
            render: {
                fillStyle: "#bfad06"
            }
        }
    )

    const lowerRightTail = Bodies.rectangle(
        base_x + head_radius * 0.4,
        base_y + tail_height * 2 + gap - tail_height / 2,
        tail_width,
        tail_height,
        {
            chamfer: { radius: [tail_chamfer, tail_chamfer, tail_chamfer, tail_chamfer] },
            angle: Math.PI * -1.01,
            isStatic: true,
            render: {
                fillStyle: "#bfad06"
            }
        }
    )

    const gapBody = Bodies.rectangle(
        base_x,
        base_y + tail_height + gap / 2,
        head_diameter,
        gap,
        {
            isStatic: true,
            render: {
                fillStyle: "#ff00d400" //invisible reference body in the gap between used to find a center of 2 phospolipids
            }
        }
    )
    const topMargin = Bodies.rectangle(
        base_x,
        base_y + tail_height + gap / 2 - head_diameter * 2.5,
        head_diameter,
        head_diameter,
        {
            isStatic: true,
            chamfer: { radius: head_radius / 2 },
            render: {
                fillStyle: "#ffffff00" //invisible reference body in the gap between used to find a center of 2 phospolipids
            }
        }
    )
    const bottomMargin = Bodies.rectangle(
        base_x,
        base_y + tail_height + gap / 2 + head_diameter * 2.5,
        head_diameter,
        head_diameter,
        {
            isStatic: true,
            chamfer: { radius: head_radius / 2 },
            render: {
                fillStyle: "#ffffff00" //invisible reference body in the gap between used to find a center of 2 phospolipids
            }
        }
    )




    const phospolipid = {
        bodies: [upperLeftTail, upperRightTail, lowerLeftTail, lowerRightTail, upperHead, lowerHead, gapBody, topMargin, bottomMargin],
        referenceBody: gapBody,
        setPosition(newX, newY) {
            const dx = newX - this.referenceBody.position.x;
            const dy = newY - this.referenceBody.position.y;
            this.bodies.forEach(b => Body.translate(b, { x: dx, y: dy }));
        },
        setAngle(angle) {
            const cx = this.x;
            const cy = this.y;

            this.bodies.forEach(b => {
                const dx = b.position.x - cx;
                const dy = b.position.y - cy;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                Body.setPosition(b, {
                    x: cx + dx * cos - dy * sin,
                    y: cy + dx * sin + dy * cos
                });
                Body.setAngle(b, angle);
            });

        },
        get x() {
            return this.referenceBody.position.x;
        },
        get y() {
            return this.referenceBody.position.y;
        },
        get width() {
            return head_diameter;
        },
        get height() {
            return (head_diameter * 2) + (tail_height * 2) + gap
        }
    }

    phospolipid.setPosition(x, y);


    return phospolipid;
}

export function _isTouchingChannels(leak_channel_list, x, y) {
    for (const channel of leak_channel_list) {
        const dx = channel.position.x - x;
        const dy = channel.position.y - y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);
        if (distance < channel.width / 3) return true;
    }
    return false;

}
export function _spreadBilayer(start_x, start_y, end_x, end_y, sgment_gap = 3, leak_channel_list = [], world) {
    const dx = end_x - start_x;
    const dy = end_y - start_y;
    const total_distance = Math.sqrt(dx ** 2 + dy ** 2);
    const nx = dx / total_distance;
    const ny = dy / total_distance;
    const angle = Math.atan2(dy, dx);

    let seg = buildBilayerSegment(0, 0);

    let count = 0;
    while (true) {
        const x = (start_x + count * (seg.height + sgment_gap)) * nx;
        const y = (start_y + count * (seg.width + sgment_gap)) * ny;


        seg = buildBilayerSegment(x, y);
        seg.setAngle(angle);


        if (_isTouchingChannels(leak_channel_list, x, y)) {
            count++;
            continue;
        };

        World.add(world, seg.bodies);
        count++;


        const dx = start_x - x;
        const dy = start_y - y;
        const current_distance = Math.sqrt(dx ** 2 + dy ** 2);

        if (current_distance > total_distance) break;
    }
}




// Channels


/**
 * Base class for all ion channel types.
 * Provides common structure: bodies, positioning, open/close state, and dimension getters.
 */
class Channel {
    #bodies;
    #referenceBody;
    #isOpen;

    constructor(bodies, referenceBody, isOpen = true) {
        this.#bodies = bodies;
        this.#referenceBody = referenceBody;
        this.#isOpen = isOpen;
        this.normal = { x: 0, y: -1 }
    }

    get bodies() { return this.#bodies; }
    get referenceBody() { return this.#referenceBody; }
    get isOpen() { return this.#isOpen; }
    set isOpen(v) { this.#isOpen = v; }
    get position() { return { x: this.x, y: this.y }; }
    get x() { return this.#referenceBody.position.x; }
    get y() { return this.#referenceBody.position.y; }

    setFlux(gradient) {
        this.normal.y = gradient <= 0 ? -1 : 1;
    }

    isInside(body) {
        const dx = body.position.x - this.position.x;
        const dy = body.position.y - this.position.y;
        // dot product with normal — positive means same side as normal (above)
        return (dx * this.normal.x + dy * this.normal.y) < 0;
    }

    setPosition(newX, newY) {
        const dx = newX - this.x;
        const dy = newY - this.y;
        this.#bodies.forEach(b => Body.translate(b, { x: dx, y: dy }));
    }

    setAngle(angle) {
        const cx = this.x;
        const cy = this.y;

        this.#bodies.forEach(b => {
            const dx = b.position.x - cx;
            const dy = b.position.y - cy;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            Body.setPosition(b, {
                x: cx + dx * cos - dy * sin,
                y: cy + dx * sin + dy * cos
            });
            Body.setAngle(b, angle);
        });

        this.normal = {
            x: Math.sin(angle),
            y: -Math.cos(angle)
        };
    }
    open() { throw new Error(`${this.constructor.name} must implement open()`); }
    close() { throw new Error(`${this.constructor.name} must implement close()`); }
}


/**
 * A passive leak channel that allows a specific ion size to diffuse through.
 * Can be mechanically opened or closed by scaling and repositioning its walls.
 *
 * @param {number} ion_radius        - Radius of the ion this channel is sized for.
 * @param {number} x                 - World x position of the channel center.
 * @param {number} y                 - World y position of the channel center.
 * @param {number} wall_width        - Width of each wall body. Defaults to 50.
 * @param {number} wall_aspect_ratio - Wall height as a multiplier of wall_width. Defaults to 2.5.
 * @param {number} gap_multiplier    - Inner gap size relative to ion diameter. 1.0 = exact fit. Defaults to 1.02.
 * @param {number} chamfer_ratio     - Corner roundness as a fraction of wall_width. Defaults to 0.4.
 * @param {string} wall_color        - Fill color of the walls.
 * @param {string} back_color        - Fill color of the sensor back body.
 */
export class LeakChannel extends Channel {
    #left;
    #right;
    #back;

    #left_origin;
    #right_origin;
    #translate_offset;
    #close_scale_x = 1.25;

    #channel_wall_height;
    #channel_wall_width;
    #channel_inner_gap;

    constructor(
        permeable_ion,
        x = 0,
        y = 0,
        ion_radius = 20,
        wall_width = 50,
        wall_aspect_ratio = 2.5,
        gap_multiplier = 1.02,
        chamfer_ratio = 0.4,
        wall_color = "#c9a84c",
        // wall_color = "#fbbf24",
        // back_color = "#1b2c55"
        back_color = "#825e04"
    ) {
        const ion_diameter = ion_radius * 2;
        const channel_wall_width = wall_width;
        const channel_wall_height = wall_width * wall_aspect_ratio;
        const channel_inner_gap = ion_diameter * gap_multiplier;
        const chamfer = wall_width * chamfer_ratio;

        const body_left = Bodies.rectangle(x, y, channel_wall_width, channel_wall_height, {
            isStatic: true,
            chamfer: { radius: chamfer },
            render: { fillStyle: wall_color }
        });

        const body_right = Bodies.rectangle(
            x + channel_inner_gap + channel_wall_width, y,
            channel_wall_width, channel_wall_height,
            {
                isStatic: true,
                chamfer: { radius: chamfer },
                render: { fillStyle: wall_color }
            }
        );

        const body_back = Bodies.rectangle(
            x + channel_wall_width / 2 + channel_inner_gap / 2, y,
            channel_inner_gap + channel_wall_width * 2, channel_wall_height,
            {
                isStatic: true,
                isSensor: true,
                chamfer: { radius: chamfer * 0.8 },
                render: { fillStyle: back_color }
            }
        );

        super([body_back, body_left, body_right], body_back, true);

        this.radius = ion_radius;
        this.permeable_ion = permeable_ion;
        this.#left = body_left;
        this.#right = body_right;
        this.#back = body_back;
        this.#channel_wall_width = channel_wall_width;
        this.#channel_wall_height = channel_wall_height;
        this.#channel_inner_gap = channel_inner_gap;
        this.#translate_offset = channel_inner_gap / 3.5;
        this.wall_color = wall_color;
        this.back_color = back_color;

        // Snapshot origins after construction, before setPosition
        this.setPosition(x, y);
        this.#left_origin = { ...body_left.position };
        this.#right_origin = { ...body_right.position };
    }

    get height() { return this.#channel_wall_height; }
    get width() { return this.#channel_wall_width * 2 + this.#channel_inner_gap; }

    setPosition(newX, newY) {
        const dx = newX - this.x;
        const dy = newY - this.y;
        super.setPosition(newX, newY);
        if (this.#left_origin) {
            this.#left_origin.x += dx;
            this.#left_origin.y += dy;
            this.#right_origin.x += dx;
            this.#right_origin.y += dy;
        }
    }

    open() {
        if (!this.isOpen) {
            // Body.setPosition(this.#left, { ...this.#left_origin });
            // Body.setPosition(this.#right, { ...this.#right_origin });
            // Body.scale(this.#left, 1 / this.#close_scale_x, 1);
            // Body.scale(this.#right, 1 / this.#close_scale_x, 1);
            this.#back.render.fillStyle = this.back_color;
            this.isOpen = true;
            this.#back.isSensor = true;
        }
    }

    close() {
        if (this.isOpen) {

            // Body.scale(this.#left, this.#close_scale_x, 1);
            // Body.scale(this.#right, this.#close_scale_x, 1);
            // Body.setPosition(this.#left, {
            //     x: this.#left_origin.x + this.#translate_offset,
            //     y: this.#left_origin.y
            // });
            // Body.setPosition(this.#right, {
            //     x: this.#right_origin.x - this.#translate_offset,
            //     y: this.#right_origin.y
            // });
            this.#back.render.fillStyle = "#000000";
            this.isOpen = false;
            this.#back.isSensor = false;
        }
    }
}