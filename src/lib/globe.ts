/**
 * ASCII globe renderer.
 *
 * Pure and deterministic, so the server and the browser produce the same frame
 * for the same angle. That keeps the SSR markup and the first client frame equal.
 */

export const GLOBE_COLS = 96;
export const GLOBE_ROWS = 48;

/** Cell height divided by cell width. The CSS line-height must match this. */
const CELL_ASPECT = 2;

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
	LAND_SPANS.forEach((spans, row) => {
		for (const [first, last] of spans) {
			for (let col = first; col <= last; col++) mask[row * MAP_COLS + col] = 1;
		}
	});
	return mask;
}

// The two ramps never share a character, so land stays readable against the ocean.
const OCEAN_RAMP = '.,-~:';
const LAND_RAMP = '=+*#@';

/** Light direction, unit length, +y up and +z towards the viewer. */
const LIGHT_X = -0.5071;
const LIGHT_Y = 0.5071;
const LIGHT_Z = 0.6963;

/** Keeps the dark side of the globe faintly visible. */
const AMBIENT = 0.18;

function clamp(value: number, min: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

/** Writes text into one grid row, centred, and keeps one blank cell on each side. */
function stampText(grid: string[], row: number, text: string): void {
	const padded = ` ${text} `;
	const start = Math.round((GLOBE_COLS - padded.length) / 2);
	for (let i = 0; i < padded.length; i++) {
		const col = start + i;
		if (col < 0 || col >= GLOBE_COLS) continue;
		grid[row * GLOBE_COLS + col] = padded[i];
	}
}

/**
 * Renders one frame.
 *
 * @param angle Rotation around the polar axis, in radians.
 * @param title Text on the middle line.
 * @param subtitle Text below the title.
 */
export function renderGlobe(angle: number, title: string, subtitle: string): string {
	const centerX = (GLOBE_COLS - 1) / 2;
	const centerY = (GLOBE_ROWS - 1) / 2;
	const radiusY = centerY * 0.94;
	const radiusX = radiusY * CELL_ASPECT;

	const grid: string[] = new Array(GLOBE_COLS * GLOBE_ROWS).fill(' ');
	// Negated, so a growing angle turns the globe eastward like the Earth.
	const sin = Math.sin(-angle);
	const cos = Math.cos(-angle);

	for (let row = 0; row < GLOBE_ROWS; row++) {
		const y = (row - centerY) / radiusY;
		for (let col = 0; col < GLOBE_COLS; col++) {
			const x = (col - centerX) / radiusX;
			const distance = x * x + y * y;
			if (distance > 1) continue;

			// Front surface point of the unit sphere, +y up.
			const normalX = x;
			const normalY = -y;
			const normalZ = Math.sqrt(1 - distance);

			// Turn the point back by the rotation angle to get the map coordinates.
			const textureX = normalX * cos - normalZ * sin;
			const textureZ = normalX * sin + normalZ * cos;
			const longitude = Math.atan2(textureX, textureZ);
			const latitude = Math.asin(clamp(normalY, -1, 1));

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

			const ramp = LAND[mapRow * MAP_COLS + mapCol] ? LAND_RAMP : OCEAN_RAMP;
			const light = clamp(
				normalX * LIGHT_X + normalY * LIGHT_Y + normalZ * LIGHT_Z,
				0,
				1
			);
			const shade = AMBIENT + (1 - AMBIENT) * light;
			const index = clamp(Math.floor(shade * ramp.length), 0, ramp.length - 1);
			grid[row * GLOBE_COLS + col] = ramp[index];
		}
	}

	stampText(grid, Math.round(centerY) - 1, title);
	stampText(grid, Math.round(centerY) + 2, subtitle);

	const lines: string[] = new Array(GLOBE_ROWS);
	for (let row = 0; row < GLOBE_ROWS; row++) {
		lines[row] = grid.slice(row * GLOBE_COLS, (row + 1) * GLOBE_COLS).join('').replace(/\s+$/, '');
	}
	return lines.join('\n');
}
