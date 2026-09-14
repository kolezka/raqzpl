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

import { LAND_MASK, MAP_COLS, MAP_ROWS } from './coastlines.ts';

/**
 * Grid used for the server frame, before the browser knows the viewport. The client
 * swaps it for a grid that covers the whole window.
 */
export const DEFAULT_COLS = 112;
export const DEFAULT_ROWS = 56;

/** Keeps an unusual font size from asking for a grid with millions of cells. */
const MAX_COLS = 640;
const MAX_ROWS = 240;

/** Cell height divided by cell width. The CSS line-height must match this. */
const CELL_ASPECT = 2;

/** Tilt of the polar axis, like the Earth. */
export const AXIAL_TILT = (23.44 * Math.PI) / 180;

// The surface ramps never share a character, so land stays readable against the ocean.
const OCEAN_RAMP = '.,-~:;';
const LAND_RAMP = '=+*%#@';
/** Meridians and parallels. Its own layer, so it may reuse characters. */
const GRID_RAMP = '.-+#';
/** Glow outside the disc. */
const HALO_RAMP = '.:';
const HALO_DEPTH = 0.1;

/** Faint stars, drawn in their own dim layer. */
const DIM_STARS = '.,';
/** Bright stars, drawn in their own layer with a glow. */
const BRIGHT_STARS = '+*x';
/**
 * Star density is set per cell up to this many rows. Above it the chance per cell
 * drops with the cell area, so a finer grid does not fill the sky with more stars.
 */
const STAR_REFERENCE_ROWS = 64;

/**
 * The label is drawn at this multiple of the cell size, in its own coarser grid. One
 * label cell covers a square block of grid cells, which are cleared beneath it. The
 * CSS font size of the label layer must match this.
 */
export const LABEL_SCALE = 2;

/** Satellite bodies, then the trail behind them, brightest first. */
const SATELLITE_GLYPHS = 'oO';
const SATELLITE_TRAIL = ',.';
/** Gap between one trail mark and the next, in radians of the orbit. */
const TRAIL_GAP = 0.05;

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

/**
 * Size of one patch of relief, in land mask cells. The mask is finer than a
 * character, so the noise is tied to a patch of about four degrees instead of a
 * cell. That keeps the texture as coarse as the globe itself.
 */
const RELIEF_PATCH = Math.max(1, Math.round(4 / (360 / MAP_COLS)));

/**
 * One grid size, with the disc placed in it and the scratch buffers it needs.
 *
 * The disc always keeps nine tenths of the grid height, so the globe follows the
 * window height on every screen. On a narrow screen the disc is wider than the grid
 * and the sides simply fall outside it, which is what the zoom on a phone looks like.
 */
interface Layout {
	cols: number;
	rows: number;
	cellCount: number;
	centerX: number;
	centerY: number;
	radiusX: number;
	radiusY: number;
	/** Size of the label grid, LABEL_SCALE times coarser than the cell grid. */
	labelCols: number;
	labelRows: number;
	/** Scratch buffers, reused between frames. */
	onDisc: Uint8Array;
	meridianIndex: Int16Array;
	parallelIndex: Int16Array;
	nearPole: Uint8Array;
	shade: Float32Array;
}

function createLayout(cols: number, rows: number): Layout {
	const cellCount = cols * rows;
	const centerY = (rows - 1) / 2;
	const radiusY = centerY * 0.9;
	return {
		cols,
		rows,
		cellCount,
		centerX: (cols - 1) / 2,
		centerY,
		radiusX: radiusY * CELL_ASPECT,
		radiusY,
		labelCols: Math.ceil(cols / LABEL_SCALE),
		labelRows: Math.ceil(rows / LABEL_SCALE),
		onDisc: new Uint8Array(cellCount),
		meridianIndex: new Int16Array(cellCount),
		parallelIndex: new Int16Array(cellCount),
		nearPole: new Uint8Array(cellCount),
		shade: new Float32Array(cellCount)
	};
}

let layout = createLayout(DEFAULT_COLS, DEFAULT_ROWS);

/** Returns the layout for a grid size, building it only when the size changes. */
function useLayout(cols: number, rows: number): Layout {
	const wantCols = clamp(Math.round(cols), 8, MAX_COLS);
	const wantRows = clamp(Math.round(rows), 8, MAX_ROWS);
	if (layout.cols !== wantCols || layout.rows !== wantRows) {
		layout = createLayout(wantCols, wantRows);
	}
	return layout;
}

/** One satellite on a circular orbit. */
interface Orbit {
	/** Orbit radius, in globe radii. */
	radius: number;
	/** Tilt of the orbit plane, in radians. */
	inclination: number;
	/** Turn of the orbit plane around the vertical axis, in radians. */
	node: number;
	/** Time for one turn, in milliseconds. A negative value runs the orbit backwards. */
	periodMs: number;
	/** Start position on the circle, as a fraction of one turn. */
	phase: number;
	/** Index into SATELLITE_GLYPHS. */
	body: number;
	/** Number of trail marks behind the body. */
	trail: number;
}

/**
 * The grid leaves about a tenth of a radius above and below the disc, so an orbit
 * wider than that leaves the frame at the top. These all stay inside it. On a narrow
 * screen the sides of an orbit go off the grid, together with the sides of the globe.
 */
const SATELLITES: readonly Orbit[] = [
	{ radius: 1.06, inclination: 0.3, node: 0.35, periodMs: 8200, phase: 0.0, body: 0, trail: 2 },
	{ radius: 1.1, inclination: -0.55, node: 1.25, periodMs: 13500, phase: 0.4, body: 1, trail: 2 },
	{ radius: 1.08, inclination: 0.7, node: 2.6, periodMs: -10400, phase: 0.72, body: 0, trail: 1 },
	{ radius: 1.04, inclination: -0.2, node: -0.9, periodMs: 17800, phase: 0.15, body: 0, trail: 2 }
];

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
	/** Time since the animation started, in milliseconds. Moves the satellites. */
	time?: number;
	/** Grid width in characters. Defaults to the server grid. */
	cols?: number;
	/** Grid height in characters. Defaults to the server grid. */
	rows?: number;
}

export interface GlobeFrame {
	/** Water shading. Drawn dimmer than the land, which separates the two. */
	ocean: string;
	/** Land shading. */
	land: string;
	/** Meridians and parallels, cut out of the surface. */
	graticule: string;
	/** Satellites in orbit, hidden while they pass behind the globe. */
	satellites: string;
	/**
	 * Title and subtitle, cut out of every other layer. This grid is LABEL_SCALE
	 * times coarser than the others and is drawn at LABEL_SCALE times the font size.
	 */
	label: string;
}

/** Stars and the glow round the disc. Split so each layer gets its own brightness. */
export interface Backdrop {
	/** Glow just outside the disc. */
	haze: string;
	/** Faint stars. */
	dimStars: string;
	/** Bright stars. */
	brightStars: string;
}

function clamp(value: number, min: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

/** Number of meridians. The index of a cell wraps from this value back to 0. */
const MERIDIAN_COUNT = Math.round((2 * Math.PI) / GRID_STEP);

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

function gridToString(grid: string[], { cols, rows }: { cols: number; rows: number }): string {
	const lines: string[] = new Array(rows);
	for (let row = 0; row < rows; row++) {
		const line = grid.slice(row * cols, (row + 1) * cols).join('');
		// Row zero keeps its trailing spaces. That makes every layer exactly as wide as
		// the grid, so the layers stay lined up and the block stays centred.
		lines[row] = row === 0 ? line : line.replace(/\s+$/, '');
	}
	return lines.join('\n');
}

/**
 * Writes one centred line into the label grid and clears the block of cells under
 * each label character in the layers below, so the text always sits on empty space.
 * The row is a label grid row.
 */
function stampLabel(
	label: string[],
	below: string[][],
	labelRow: number,
	text: string,
	{ cols, rows, labelCols }: Layout
): void {
	const padded = `  ${text}  `;
	const start = Math.round((labelCols - padded.length) / 2);
	for (let i = 0; i < padded.length; i++) {
		const labelCol = start + i;
		if (labelCol < 0 || labelCol >= labelCols) continue;
		label[labelRow * labelCols + labelCol] = padded[i];

		for (let dy = 0; dy < LABEL_SCALE; dy++) {
			const row = labelRow * LABEL_SCALE + dy;
			if (row >= rows) break;
			for (let dx = 0; dx < LABEL_SCALE; dx++) {
				const col = labelCol * LABEL_SCALE + dx;
				if (col >= cols) break;
				const cell = row * cols + col;
				for (const layer of below) layer[cell] = ' ';
			}
		}
	}
}

/**
 * Renders the still backdrop: stars and the glow around the disc. Neither depends on
 * the rotation, so this only runs again when the grid size changes.
 */
export function renderBackdrop(cols = DEFAULT_COLS, rows = DEFAULT_ROWS): Backdrop {
	const grid = useLayout(cols, rows);
	const { centerX, centerY, radiusX, radiusY, cellCount } = grid;
	const haze: string[] = new Array(cellCount).fill(' ');
	const dimStars: string[] = new Array(cellCount).fill(' ');
	const brightStars: string[] = new Array(cellCount).fill(' ');
	const haloOuter = (1 + HALO_DEPTH) * (1 + HALO_DEPTH);
	// Star rolls count from the middle of the grid, so the sky keeps the same pattern
	// around the globe when the window changes size.
	const originX = Math.round(centerX);
	const originY = Math.round(centerY);
	const starDensity = Math.min(1, (STAR_REFERENCE_ROWS / grid.rows) ** 2);

	for (let row = 0; row < grid.rows; row++) {
		const y = (row - centerY) / radiusY;
		for (let col = 0; col < grid.cols; col++) {
			const x = (col - centerX) / radiusX;
			const distance = x * x + y * y;
			if (distance <= 1) continue;
			const cell = row * grid.cols + col;

			if (distance <= haloOuter) {
				const rim = Math.sqrt(distance);
				const fade = 1 - (rim - 1) / HALO_DEPTH;
				const lit = Math.max(0, (x * LIGHT_X - y * LIGHT_Y) / rim);
				const glow = fade * (0.3 + 0.7 * lit);
				if (glow >= 0.18) haze[cell] = glow > 0.55 ? HALO_RAMP[1] : HALO_RAMP[0];
				continue;
			}

			// One roll per cell picks both the star and its brightness, so the sky
			// keeps the same pattern on the server and in the browser.
			const roll = hash2(col - originX, row - originY) / starDensity;
			if (roll < 0.0036) brightStars[cell] = BRIGHT_STARS[1];
			else if (roll < 0.0085) brightStars[cell] = BRIGHT_STARS[0];
			else if (roll < 0.0125) brightStars[cell] = BRIGHT_STARS[2];
			else if (roll < 0.0455) dimStars[cell] = DIM_STARS[0];
			else if (roll < 0.065) dimStars[cell] = DIM_STARS[1];
		}
	}

	return {
		haze: gridToString(haze, grid),
		dimStars: gridToString(dimStars, grid),
		brightStars: gridToString(brightStars, grid)
	};
}

/**
 * Draws the satellites and clears the same cells in the layers below. A satellite
 * that passes behind the disc is left out, so it looks like it goes round the globe.
 */
function stampSatellites(
	layer: string[],
	below: string[][],
	time: number,
	pitch: number,
	grid: Layout
): void {
	const { cols, rows, centerX, centerY, radiusX, radiusY } = grid;
	const sinPitch = Math.sin(pitch);
	const cosPitch = Math.cos(pitch);

	for (const orbit of SATELLITES) {
		const lead = (time / orbit.periodMs + orbit.phase) * 2 * Math.PI;
		const sinNode = Math.sin(orbit.node);
		const cosNode = Math.cos(orbit.node);
		const sinTilt = Math.sin(orbit.inclination);
		const cosTilt = Math.cos(orbit.inclination);

		// The body first, then the trail, so a trail mark never overwrites the body.
		for (let step = 0; step <= orbit.trail; step++) {
			const travel = lead - step * TRAIL_GAP;
			const flatX = Math.cos(travel) * orbit.radius;
			const flatZ = Math.sin(travel) * orbit.radius;

			// Tilt the orbit plane, turn it, then tip the whole scene with the pointer.
			const tiltedY = -flatZ * sinTilt;
			const tiltedZ = flatZ * cosTilt;
			const worldX = flatX * cosNode + tiltedZ * sinNode;
			const worldZ = -flatX * sinNode + tiltedZ * cosNode;
			const viewY = tiltedY * cosPitch - worldZ * sinPitch;
			const viewZ = tiltedY * sinPitch + worldZ * cosPitch;

			// Behind the globe and inside its outline, so the globe hides it.
			if (viewZ < 0 && worldX * worldX + viewY * viewY <= 1) continue;

			const col = Math.round(centerX + worldX * radiusX);
			const row = Math.round(centerY - viewY * radiusY);
			if (col < 0 || col >= cols || row < 0 || row >= rows) continue;

			const cell = row * cols + col;
			if (layer[cell] !== ' ') continue;
			layer[cell] = step === 0 ? SATELLITE_GLYPHS[orbit.body] : SATELLITE_TRAIL[step - 1];
			for (const other of below) other[cell] = ' ';
		}
	}
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
		seed = 0,
		time = 0,
		cols = DEFAULT_COLS,
		rows = DEFAULT_ROWS
	} = options;

	const grid = useLayout(cols, rows);
	const { cellCount, centerX, centerY, radiusX, radiusY } = grid;

	const ocean: string[] = new Array(cellCount).fill(' ');
	const land: string[] = new Array(cellCount).fill(' ');
	const graticule: string[] = new Array(cellCount).fill(' ');
	const satellites: string[] = new Array(cellCount).fill(' ');
	const label: string[] = new Array(grid.labelCols * grid.labelRows).fill(' ');

	const { onDisc, meridianIndex, parallelIndex, nearPole, shade: shadeBuffer } = grid;
	onDisc.fill(0);

	// Negated, so a growing angle turns the globe eastward like the Earth.
	const sinSpin = Math.sin(-angle);
	const cosSpin = Math.cos(-angle);
	const sinPitch = Math.sin(pitch);
	const cosPitch = Math.cos(pitch);
	const sinRoll = Math.sin(roll);
	const cosRoll = Math.cos(roll);

	// Pass one: shade the surface and record which grid cell each point falls in.
	for (let row = 0; row < grid.rows; row++) {
		const y = (row - centerY) / radiusY;
		for (let col = 0; col < grid.cols; col++) {
			const x = (col - centerX) / radiusX;
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

			const cell = row * grid.cols + col;
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
			const isLand = LAND_MASK[mapRow * MAP_COLS + mapCol] === 1;
			const ramp = isLand ? LAND_RAMP : OCEAN_RAMP;

			// Breaks up the flat look of a large continent. Tied to the map patch, so the
			// pattern turns with the globe instead of crawling across the screen.
			const relief = isLand
				? (hash2(Math.floor(mapCol / RELIEF_PATCH), Math.floor(mapRow / RELIEF_PATCH)) - 0.5) * 0.12
				: 0;
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
	for (let row = 0; row < grid.rows; row++) {
		for (let col = 0; col < grid.cols; col++) {
			const cell = row * grid.cols + col;
			if (!onDisc[cell]) continue;

			const right = col + 1 < grid.cols ? cell + 1 : -1;
			const under = row + 1 < grid.rows ? cell + grid.cols : -1;
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

	stampSatellites(satellites, [ocean, land, graticule], time, pitch, grid);

	// The title sits just above the middle of the disc and the subtitle one label row
	// below it, so the pair stays centred on the globe.
	const below = [ocean, land, graticule, satellites];
	const titleRow = Math.floor(grid.labelRows / 2) - 1;
	stampLabel(label, below, titleRow, morphText(title, titleProgress, seed), grid);
	stampLabel(label, below, titleRow + 2, subtitle, grid);

	return {
		ocean: gridToString(ocean, grid),
		land: gridToString(land, grid),
		graticule: gridToString(graticule, grid),
		satellites: gridToString(satellites, grid),
		label: gridToString(label, { cols: grid.labelCols, rows: grid.labelRows })
	};
}
