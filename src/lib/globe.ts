/**
 * ASCII globe renderer.
 *
 * Pure and deterministic, so the server and the browser produce the same frame
 * for the same options. That keeps the SSR markup and the first client frame equal.
 *
 * One frame is split into layers that share the same character grid. The layers
 * stack in CSS, each with its own colour, which gives depth that a single ramp
 * cannot reach. No cell holds a character in more than one layer.
 */

export const GLOBE_COLS = 112;
export const GLOBE_ROWS = 56;

/** Cell height divided by cell width. The CSS line-height must match this. */
const CELL_ASPECT = 2;

/** Tilt of the polar axis, like the Earth. */
export const AXIAL_TILT = (23.44 * Math.PI) / 180;

const MAP_COLS = 64;
const MAP_ROWS = 32;

/**
 * Coarse land mask, equirectangular, north to south.
 * Each row holds the [firstColumn, lastColumn] spans that contain land.
 */
const LAND_SPANS: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
	[],
	[[22, 26]],
	[
		[8, 18],
		[22, 28],
		[34, 35],
		[56, 62]
	],
	[
		[4, 20],
		[22, 28],
		[33, 63]
	],
	[
		[2, 21],
		[23, 27],
		[32, 63]
	],
	[
		[2, 21],
		[24, 26],
		[32, 63]
	],
	[
		[4, 21],
		[30, 31],
		[33, 60]
	],
	[
		[4, 22],
		[30, 31],
		[33, 60]
	],
	[
		[5, 22],
		[31, 58]
	],
	[
		[6, 22],
		[30, 57]
	],
	[
		[7, 22],
		[29, 56]
	],
	[
		[9, 22],
		[29, 53]
	],
	[
		[11, 23],
		[29, 53]
	],
	[
		[14, 19],
		[21, 24],
		[28, 52]
	],
	[
		[17, 26],
		[28, 42],
		[45, 47],
		[52, 55]
	],
	[
		[17, 27],
		[29, 43],
		[49, 53]
	],
	[
		[17, 27],
		[30, 43],
		[49, 56]
	],
	[
		[18, 27],
		[31, 42],
		[49, 58]
	],
	[
		[18, 27],
		[31, 41],
		[51, 58]
	],
	[
		[19, 26],
		[32, 40],
		[52, 59]
	],
	[
		[19, 26],
		[33, 40],
		[42, 43],
		[52, 60]
	],
	[
		[20, 25],
		[33, 39],
		[42, 43],
		[52, 60]
	],
	[
		[20, 25],
		[34, 39],
		[53, 59]
	],
	[
		[21, 24],
		[61, 63]
	],
	[
		[21, 23],
		[61, 63]
	],
	[[21, 23]],
	[[22, 23]],
	[],
	[
		[5, 20],
		[30, 63]
	],
	[[0, 63]],
	[[0, 63]],
	[[0, 63]]
];

const LAND = buildLandMask();

function buildLandMask(): Uint8Array {
	const mask = new Uint8Array(MAP_COLS * MAP_ROWS);
	LAND_SPANS.forEach((row, rowIndex) => {
		for (const [first, last] of row) {
			for (let col = first; col <= last; col++) mask[rowIndex * MAP_COLS + col] = 1;
		}
	});
	return mask;
}

// The surface ramps never share a character, so land stays readable against the ocean.
const OCEAN_RAMP = '.,-~:';
const LAND_RAMP = '=+*#@';
/** Meridians and parallels. Its own layer, so it may reuse characters. */
const GRID_RAMP = '.-+#';
/** Glow outside the disc. */
const HALO_RAMP = '.:';
const HALO_DEPTH = 0.1;

/** Characters used while a title changes. */
const MORPH_GLYPHS = '#@%*+=~-:.$&?/|<>';

/** Light direction, unit length, +y up and +z towards the viewer. */
const LIGHT_X = -0.5071;
const LIGHT_Y = 0.5071;
const LIGHT_Z = 0.6963;

/** Halfway vector between the light and the viewer, for the specular highlight. */
const HALF_X = -0.3204;
const HALF_Y = 0.3204;
const HALF_Z = 0.8912;

/** Keeps the night side faintly visible. */
const AMBIENT = 0.15;

/** Meridians and parallels every 30 degrees. */
const GRID_STEP = Math.PI / 6;

const CENTER_X = (GLOBE_COLS - 1) / 2;
const CENTER_Y = (GLOBE_ROWS - 1) / 2;
const RADIUS_Y = CENTER_Y * 0.9;
const RADIUS_X = RADIUS_Y * CELL_ASPECT;

export interface GlobeOptions {
	/** Rotation around the polar axis, in radians. */
	angle: number;
	/** Tilt towards or away from the viewer, in radians. */
	pitch?: number;
	/** Tilt of the polar axis to the side, in radians. */
	roll?: number;
	/** Text on the middle line. */
	title: string;
	/** Text below the title. */
	subtitle: string;
	/** 0 scrambles the title, 1 shows it complete. */
	titleProgress?: number;
	/** Changes the scrambled characters between one title and the next. */
	seed?: number;
}

export interface GlobeFrame {
	/** Water shading. Drawn dimmer than the land, which separates the two. */
	ocean: string;
	/** Land shading. */
	land: string;
	/** Meridians and parallels, cut out of the surface. */
	graticule: string;
	/** Title and subtitle, cut out of every other layer. */
	label: string;
}

function clamp(value: number, min: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

const CELL_COUNT = GLOBE_COLS * GLOBE_ROWS;

/** Number of meridians. The index of a cell wraps from this value back to 0. */
const MERIDIAN_COUNT = Math.round((2 * Math.PI) / GRID_STEP);

/** Scratch buffers, reused between frames. The output stays a pure function of the input. */
const scratch = {
	onDisc: new Uint8Array(CELL_COUNT),
	meridianIndex: new Int16Array(CELL_COUNT),
	parallelIndex: new Int16Array(CELL_COUNT),
	nearPole: new Uint8Array(CELL_COUNT),
	shade: new Float32Array(CELL_COUNT)
};

/**
 * True when two neighbouring cells sit on opposite sides of exactly one grid line.
 * A larger gap means the line is finer than one cell, so it is left out instead of
 * smearing into a band near the limb.
 */
function crossesOneLine(a: number, b: number, wrapAt: number): boolean {
	const diff = Math.abs(a - b);
	return diff === 1 || diff === wrapAt - 1;
}

/** Stable pseudo random number in [0, 1) for a pair of integers. */
function hash2(a: number, b: number): number {
	let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Replaces a title with random glyphs and then settles it, left to right.
 * Deterministic, so the server and the browser agree on every step.
 */
export function morphText(text: string, progress: number, seed: number): string {
	if (progress >= 1) return text;
	const step = Math.floor(progress * 14);
	let out = '';
	for (let i = 0; i < text.length; i++) {
		const settleAt = (i + hash2(seed, i) * 2.5) / (text.length + 2.5);
		if (progress > settleAt) {
			out += text[i];
		} else {
			out += MORPH_GLYPHS[Math.floor(hash2(seed + step * 977, i) * MORPH_GLYPHS.length)];
		}
	}
	return out;
}

function gridToString(grid: string[]): string {
	const lines: string[] = new Array(GLOBE_ROWS);
	for (let row = 0; row < GLOBE_ROWS; row++) {
		lines[row] = grid
			.slice(row * GLOBE_COLS, (row + 1) * GLOBE_COLS)
			.join('')
			.replace(/\s+$/, '');
	}
	return lines.join('\n');
}

/**
 * Writes one centred line into the label layer and clears the same cells in the
 * layers below, so the text always sits on empty space.
 */
function stampLabel(label: string[], below: string[][], row: number, text: string): void {
	const padded = `  ${text}  `;
	const start = Math.round((GLOBE_COLS - padded.length) / 2);
	for (let i = 0; i < padded.length; i++) {
		const col = start + i;
		if (col < 0 || col >= GLOBE_COLS) continue;
		const cell = row * GLOBE_COLS + col;
		label[cell] = padded[i];
		for (const layer of below) layer[cell] = ' ';
	}
}

/**
 * Renders the still backdrop: stars and the glow around the disc. Neither depends
 * on the rotation, so this runs once.
 */
export function renderBackdrop(): string {
	const grid: string[] = new Array(GLOBE_COLS * GLOBE_ROWS).fill(' ');
	const haloOuter = (1 + HALO_DEPTH) * (1 + HALO_DEPTH);

	for (let row = 0; row < GLOBE_ROWS; row++) {
		const y = (row - CENTER_Y) / RADIUS_Y;
		for (let col = 0; col < GLOBE_COLS; col++) {
			const x = (col - CENTER_X) / RADIUS_X;
			const distance = x * x + y * y;
			if (distance <= 1) continue;

			if (distance <= haloOuter) {
				const rim = Math.sqrt(distance);
				const fade = 1 - (rim - 1) / HALO_DEPTH;
				const lit = Math.max(0, (x * LIGHT_X - y * LIGHT_Y) / rim);
				const glow = fade * (0.3 + 0.7 * lit);
				if (glow >= 0.18) grid[row * GLOBE_COLS + col] = glow > 0.55 ? HALO_RAMP[1] : HALO_RAMP[0];
				continue;
			}

			const roll = hash2(col, row);
			if (roll > 0.026) continue;
			grid[row * GLOBE_COLS + col] = roll < 0.002 ? '*' : roll < 0.009 ? '+' : '.';
		}
	}
	return gridToString(grid);
}

/** Renders one globe frame as stacked layers. */
export function renderGlobe(options: GlobeOptions): GlobeFrame {
	const {
		angle,
		pitch = 0,
		roll = AXIAL_TILT,
		title,
		subtitle,
		titleProgress = 1,
		seed = 0
	} = options;

	const ocean: string[] = new Array(CELL_COUNT).fill(' ');
	const land: string[] = new Array(CELL_COUNT).fill(' ');
	const graticule: string[] = new Array(CELL_COUNT).fill(' ');
	const label: string[] = new Array(CELL_COUNT).fill(' ');

	const { onDisc, meridianIndex, parallelIndex, nearPole, shade: shadeBuffer } = scratch;
	onDisc.fill(0);

	// Negated, so a growing angle turns the globe eastward like the Earth.
	const sinSpin = Math.sin(-angle);
	const cosSpin = Math.cos(-angle);
	const sinPitch = Math.sin(pitch);
	const cosPitch = Math.cos(pitch);
	const sinRoll = Math.sin(roll);
	const cosRoll = Math.cos(roll);

	// Pass one: shade the surface and record which grid cell each point falls in.
	for (let row = 0; row < GLOBE_ROWS; row++) {
		const y = (row - CENTER_Y) / RADIUS_Y;
		for (let col = 0; col < GLOBE_COLS; col++) {
			const x = (col - CENTER_X) / RADIUS_X;
			const distance = x * x + y * y;
			if (distance > 1) continue;

			// Front surface point of the unit sphere, +y up.
			const normalX = x;
			const normalY = -y;
			const normalZ = Math.sqrt(1 - distance);

			// Undo the globe transform to reach the map coordinates.
			const afterPitchY = normalY * cosPitch + normalZ * sinPitch;
			const afterPitchZ = -normalY * sinPitch + normalZ * cosPitch;
			const afterRollX = normalX * cosRoll + afterPitchY * sinRoll;
			const afterRollY = -normalX * sinRoll + afterPitchY * cosRoll;
			const textureX = afterRollX * cosSpin - afterPitchZ * sinSpin;
			const textureZ = afterRollX * sinSpin + afterPitchZ * cosSpin;

			const longitude = Math.atan2(textureX, textureZ);
			const latitude = Math.asin(clamp(afterRollY, -1, 1));
			const cosLatitude = Math.sqrt(Math.max(0, 1 - afterRollY * afterRollY));

			const diffuse = Math.max(0, normalX * LIGHT_X + normalY * LIGHT_Y + normalZ * LIGHT_Z);
			const highlight = Math.max(0, normalX * HALF_X + normalY * HALF_Y + normalZ * HALF_Z);
			// Limb darkening rounds the edge off, the way a lit sphere really looks.
			const curve = 0.5 + 0.5 * normalZ;
			const shade = clamp(
				AMBIENT + (1 - AMBIENT) * Math.pow(diffuse * curve, 1.25) + Math.pow(highlight, 30) * 0.5,
				0,
				1
			);

			const cell = row * GLOBE_COLS + col;
			onDisc[cell] = 1;
			shadeBuffer[cell] = shade;
			nearPole[cell] = cosLatitude < 0.18 ? 1 : 0;
			meridianIndex[cell] = Math.floor((longitude + Math.PI) / GRID_STEP);
			parallelIndex[cell] = Math.floor((latitude + Math.PI / 2) / GRID_STEP);

			const mapCol = clamp(
				Math.floor(((longitude + Math.PI) / (2 * Math.PI)) * MAP_COLS),
				0,
				MAP_COLS - 1
			);
			const mapRow = clamp(
				Math.floor(((Math.PI / 2 - latitude) / Math.PI) * MAP_ROWS),
				0,
				MAP_ROWS - 1
			);
			const isLand = LAND[mapRow * MAP_COLS + mapCol] === 1;
			const ramp = isLand ? LAND_RAMP : OCEAN_RAMP;

			// Breaks up the flat look of a large continent. Tied to the map cell, so the
			// pattern turns with the globe instead of crawling across the screen.
			const relief = isLand ? (hash2(mapCol, mapRow) - 0.5) * 0.12 : 0;
			const index = clamp(
				Math.floor(clamp(shade + relief, 0, 1) * ramp.length),
				0,
				ramp.length - 1
			);
			(isLand ? land : ocean)[cell] = ramp[index];
		}
	}

	// Pass two: a cell belongs to the wireframe when it and a neighbour sit on
	// opposite sides of one grid line. That gives lines exactly one cell wide.
	for (let row = 0; row < GLOBE_ROWS; row++) {
		for (let col = 0; col < GLOBE_COLS; col++) {
			const cell = row * GLOBE_COLS + col;
			if (!onDisc[cell]) continue;

			const right = col + 1 < GLOBE_COLS ? cell + 1 : -1;
			const under = row + 1 < GLOBE_ROWS ? cell + GLOBE_COLS : -1;
			let onLine = false;

			if (!nearPole[cell]) {
				if (right >= 0 && onDisc[right] && !nearPole[right]) {
					onLine = crossesOneLine(meridianIndex[cell], meridianIndex[right], MERIDIAN_COUNT);
				}
				if (!onLine && under >= 0 && onDisc[under] && !nearPole[under]) {
					onLine = crossesOneLine(meridianIndex[cell], meridianIndex[under], MERIDIAN_COUNT);
				}
			}
			if (!onLine && right >= 0 && onDisc[right]) {
				onLine = Math.abs(parallelIndex[cell] - parallelIndex[right]) === 1;
			}
			if (!onLine && under >= 0 && onDisc[under]) {
				onLine = Math.abs(parallelIndex[cell] - parallelIndex[under]) === 1;
			}
			if (!onLine) continue;

			const index = clamp(
				Math.floor(shadeBuffer[cell] * GRID_RAMP.length),
				0,
				GRID_RAMP.length - 1
			);
			graticule[cell] = GRID_RAMP[index];
			ocean[cell] = ' ';
			land[cell] = ' ';
		}
	}

	const below = [ocean, land, graticule];
	stampLabel(label, below, Math.round(CENTER_Y) - 1, morphText(title, titleProgress, seed));
	stampLabel(label, below, Math.round(CENTER_Y) + 2, subtitle);

	return {
		ocean: gridToString(ocean),
		land: gridToString(land),
		graticule: gridToString(graticule),
		label: gridToString(label)
	};
}
