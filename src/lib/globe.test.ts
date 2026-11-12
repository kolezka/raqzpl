import { describe, expect, it } from 'vitest';
import { AXIAL_TILT, fitGrid, LABEL_SCALE, renderBackdrop, renderGlobe, renderSkyRows } from './globe.ts';

/** Same strings the globe component shows. */
const TITLES = ['raqz.pl', 'raqz.dev', 'raqz.link', 'raqz.app', 'raqz.contact'];
const SUBTITLE = 'Mariusz Rakus';

/**
 * Smallest cell the CSS allows: `clamp(7px, 0.65vmin, 11px)` hits the 7px floor on
 * every phone. The advance of a monospace glyph is about 0.6 of the font size and the
 * line box is 1.2 of it.
 */
const PHONE_CELL_WIDTH = 7 * 0.6;
const PHONE_CELL_HEIGHT = 7 * 1.2;

/** CSS pixel sizes of the phones the site has to hold, smallest first. */
const PHONES: [string, number, number][] = [
	['iPhone SE', 320, 568],
	['iPhone 13 mini', 375, 812],
	['iPhone 15', 393, 852],
	['iPhone 14 Pro Max', 430, 932],
	['iPhone 17 Pro Max', 440, 956]
];

/**
 * The label layer cuts a black band out of every other layer, one block of cells per
 * label character. Text that runs past that band reads as falling off the background,
 * which is what iOS Safari produced while it inflated the grid font.
 */
function labelLines(cols: number, rows: number, title: string) {
	const frame = renderGlobe({
		angle: 0,
		pitch: 0,
		roll: AXIAL_TILT,
		title,
		subtitle: SUBTITLE,
		cols,
		rows
	});
	const labelRows = Math.ceil(rows / LABEL_SCALE);
	const lines = frame.label.split('\n');
	const titleRow = Math.floor(labelRows / 2) - 1;
	return {
		labelCols: Math.ceil(cols / LABEL_SCALE),
		title: lines[titleRow],
		subtitle: lines[titleRow + 2]
	};
}

/** Text is whole and keeps the two blank label cells `stampLabel` pads it with. */
function expectInsideBand(line: string, text: string, labelCols: number) {
	const start = line.indexOf(text);
	expect(start, `"${text}" is cut out of "${line}"`).toBeGreaterThanOrEqual(2);
	expect(start + text.length + 2, `"${text}" runs past ${labelCols} label columns`).toBeLessThanOrEqual(
		labelCols
	);
}

describe('label fits the grid', () => {
	for (const [name, width, height] of PHONES) {
		it(`keeps every title inside the band on ${name}`, () => {
			const { cols, rows } = fitGrid(width, height, PHONE_CELL_WIDTH, PHONE_CELL_HEIGHT);
			for (const title of TITLES) {
				const line = labelLines(cols, rows, title);
				expectInsideBand(line.title, title, line.labelCols);
				expectInsideBand(line.subtitle, SUBTITLE, line.labelCols);
			}
		});
	}

	/**
	 * iOS Safari drew the 7px grid at about 14px, so a 428px screen produced 51 columns
	 * instead of 102 and the subtitle took the full width. The CSS now turns that
	 * inflation off, and the renderer still has to survive a grid that coarse.
	 */
	it('survives a grid half as wide as the one the CSS asks for', () => {
		const { cols, rows } = fitGrid(430, 932, PHONE_CELL_WIDTH * 2, PHONE_CELL_HEIGHT * 2);
		for (const title of TITLES) {
			const line = labelLines(cols, rows, title);
			expectInsideBand(line.title, title, line.labelCols);
			expectInsideBand(line.subtitle, SUBTITLE, line.labelCols);
		}
	});
});

describe('globe without a label', () => {
	// The home page hides the title. An empty label must not cut a blank box out of the disc.
	it('leaves the middle of the disc drawn when title and subtitle are empty', () => {
		const cols = 120;
		const rows = 60;
		const frame = renderGlobe({ angle: 0, pitch: 0, roll: AXIAL_TILT, title: '', subtitle: '', cols, rows });
		const labelRows = Math.ceil(rows / LABEL_SCALE);
		const titleRow = Math.floor(labelRows / 2) - 1;
		const ocean = frame.ocean.split('\n');
		const land = frame.land.split('\n');
		const graticule = frame.graticule.split('\n');
		let drawn = 0;
		for (let dy = 0; dy < LABEL_SCALE; dy++) {
			const row = titleRow * LABEL_SCALE + dy;
			for (let col = cols / 2 - 3; col < cols / 2 + 3; col++) {
				if (ocean[row][col] !== ' ' || land[row][col] !== ' ' || graticule[row][col] !== ' ') drawn++;
			}
		}
		expect(drawn).toBe(LABEL_SCALE * 6);
		expect(frame.label.trim()).toBe('');
	});
});

/** Rows as the grid sees them: layer strings drop trailing spaces after the first row. */
const gridLines = (text: string, cols: number) => text.split('\n').map((line) => line.padEnd(cols, ' '));

describe('sky below the globe', () => {
	// The star field under the hero continues the backdrop, so the two must agree cell by cell.
	it('repeats the backdrop stars on rows the backdrop also draws', () => {
		const cols = 150;
		const rows = 72;
		const backdrop = renderBackdrop(cols, rows);
		const sky = renderSkyRows(cols, rows, 0, rows);
		const haze = gridLines(backdrop.haze, cols);
		const backdropDim = gridLines(backdrop.dimStars, cols);
		const backdropBright = gridLines(backdrop.brightStars, cols);
		const skyDim = gridLines(sky.dimStars, cols);
		const skyBright = gridLines(sky.brightStars, cols);
		let compared = 0;
		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				// The backdrop leaves the disc and its halo empty; compare only open sky.
				if (haze[row][col] !== ' ') continue;
				const open = backdropDim[row][col] !== ' ' || backdropBright[row][col] !== ' ';
				if (!open) continue;
				expect(skyDim[row][col]).toBe(backdropDim[row][col]);
				expect(skyBright[row][col]).toBe(backdropBright[row][col]);
				compared++;
			}
		}
		expect(compared).toBeGreaterThan(50);
	});

	it('starts at the requested row and fills every requested row', () => {
		const sky = renderSkyRows(150, 72, 72, 40);
		const lines = sky.dimStars.split('\n');
		expect(lines).toHaveLength(40);
		expect(lines[0]).toHaveLength(150);
		const dim = gridLines(sky.dimStars, 150);
		const shifted = gridLines(renderSkyRows(150, 72, 73, 39).dimStars, 150);
		expect(shifted[0]).toBe(dim[1]);
	});
});
