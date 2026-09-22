/**
 * Draws grids of ASCII characters with WebGL2 from a glyph atlas.
 *
 * The browser lays out and paints text again on every frame when a `<pre>` changes,
 * and five full screen layers of it cost more than a laptop in low power mode can
 * pay thirty times a second. Here each glyph is rasterised once into an atlas; a
 * frame then uploads one byte per cell and draws one quad per cell straight from
 * the atlas, which leaves nothing for the text machinery to do.
 */

/** Printable ASCII, the only characters the renderer produces. */
const FIRST_CODE = 32;
const LAST_CODE = 126;
const GLYPH_COUNT = LAST_CODE - FIRST_CODE + 1;
/** The atlas holds the glyphs in this many columns. */
const ATLAS_COLS = 10;
const ATLAS_ROWS = Math.ceil(GLYPH_COUNT / ATLAS_COLS);
/** Puts the drawn text off the canvas, so only its shadow lands in the glow atlas. */
const SHADOW_OFFSET = 4096;
/**
 * A window drag changes the cell size on every frame. The atlases are rebuilt only
 * once the size has held still this long; until then the old glyphs are drawn on
 * the new grid, which is close enough for the length of a drag.
 */
const ATLAS_SETTLE_MS = 120;
/**
 * Ink outside the advance box or the line box, as a fraction of the font size. A
 * glyph that overshoots its cell would otherwise land in the neighbouring atlas slot.
 */
const GUARD_EM = 0.15;

/** One `text-shadow`, drawn under the glyphs. */
export interface Glow {
	/** Blur radius in em of the layer font. */
	blurEm: number;
	/** Shadow opacity. */
	alpha: number;
}

export interface GlyphLayer {
	/** One character code per cell, row by row. */
	codes: Uint8Array;
	cols: number;
	rows: number;
	/** Font size and cell size, as a multiple of the base cell. */
	scale: number;
	/** Text colour, each channel in [0, 1]. */
	color: [number, number, number, number];
	glows?: Glow[];
}

export interface GlyphCell {
	/** Base cell in CSS pixels. */
	width: number;
	height: number;
	/** Base font size in CSS pixels. */
	fontPx: number;
	dpr: number;
}

export interface GlyphPainter {
	/** Fits the canvas to a grid and a cell size. */
	resize(cols: number, rows: number, cell: GlyphCell): void;
	/** Draws the layers in order, first at the bottom. */
	draw(layers: GlyphLayer[]): void;
	dispose(): void;
}

export interface GlyphFont {
	family: string;
}

interface Atlas {
	texture: WebGLTexture;
	/** Size of one atlas cell in device pixels, padding included. */
	cellWidth: number;
	cellHeight: number;
	/** Padding round each glyph in device pixels; the blur of a glow lives there. */
	pad: number;
	/** Size of one atlas cell in texture coordinates. */
	uvWidth: number;
	uvHeight: number;
}

const VERTEX_SHADER = `#version 300 es
uniform ivec2 uGrid;
uniform vec2 uAdvance;
uniform vec2 uQuad;
uniform float uPad;
uniform vec2 uCanvas;
uniform vec2 uAtlasCell;
uniform highp usampler2D uCodes;
out vec2 vUv;

void main() {
	int cell = gl_VertexID / 6;
	int corner = gl_VertexID - cell * 6;
	int col = cell % uGrid.x;
	int row = cell / uGrid.x;
	int code = int(texelFetch(uCodes, ivec2(col, row), 0).r);
	// A blank cell collapses to a point outside the clip volume, so it costs nothing.
	if (code <= ${FIRST_CODE} || code > ${LAST_CODE}) {
		gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
		vUv = vec2(0.0);
		return;
	}
	vec2 unit = vec2(
		(corner == 1 || corner == 4 || corner == 5) ? 1.0 : 0.0,
		(corner == 2 || corner == 3 || corner == 5) ? 1.0 : 0.0
	);
	// The cell origin lands on a whole device pixel, so each atlas texel maps to one
	// pixel and the glyph stays as crisp as the text layer. The column pitch varies
	// by up to one pixel, which does not show.
	vec2 origin = floor(vec2(float(col), float(row)) * uAdvance + 0.5) - uPad;
	vec2 px = origin + unit * uQuad;
	vec2 ndc = px / uCanvas * 2.0 - 1.0;
	gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
	int glyph = code - ${FIRST_CODE};
	vec2 slot = vec2(float(glyph % ${ATLAS_COLS}), float(glyph / ${ATLAS_COLS}));
	vUv = (slot + unit) * uAtlasCell;
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uAtlas;
uniform vec4 uColor;
in vec2 vUv;
out vec4 outColor;

void main() {
	float alpha = texture(uAtlas, vUv).a * uColor.a;
	outColor = vec4(uColor.rgb * alpha, alpha);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
	const shader = gl.createShader(type);
	if (!shader) throw new Error('WebGL shader allocation failed');
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`WebGL shader failed to compile: ${log}`);
	}
	return shader;
}

function linkProgram(gl: WebGL2RenderingContext): WebGLProgram {
	const program = gl.createProgram();
	if (!program) throw new Error('WebGL program allocation failed');
	gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
	gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(`WebGL program failed to link: ${log}`);
	}
	return program;
}

/**
 * Returns a painter for the canvas, or null when the browser has no WebGL2. The
 * caller keeps its `<pre>` layers in that case.
 */
export function createGlyphPainter(canvas: HTMLCanvasElement, font: GlyphFont): GlyphPainter | null {
	const gl = canvas.getContext('webgl2', {
		alpha: true,
		premultipliedAlpha: true,
		antialias: false,
		depth: false,
		stencil: false,
		powerPreference: 'low-power'
	});
	if (!gl) return null;

	const program = linkProgram(gl);
	gl.useProgram(program);
	const uniform = (name: string) => gl.getUniformLocation(program, name);
	const uGrid = uniform('uGrid');
	const uAdvance = uniform('uAdvance');
	const uQuad = uniform('uQuad');
	const uPad = uniform('uPad');
	const uCanvas = uniform('uCanvas');
	const uAtlasCell = uniform('uAtlasCell');
	const uColor = uniform('uColor');
	gl.uniform1i(uniform('uCodes'), 0);
	gl.uniform1i(uniform('uAtlas'), 1);
	// Premultiplied colour over what is already there, like the stacked `<pre>` layers.
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.clearColor(0, 0, 0, 0);
	// Rows of any width, one byte per cell.
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

	/** Base cell in device pixels. Fractional: the CSS cell rarely lands on a pixel. */
	let cellWidth = 0;
	let cellHeight = 0;
	let fontPx = 0;
	let dpr = 1;
	/** Atlases by scale and glow, rebuilt when the cell size changes. */
	let atlases = new Map<string, Atlas>();
	/** When the cell size last changed, or 0 once the atlases match it. */
	let atlasStaleSince = 0;
	/** Code textures by grid size, so a frame only uploads into them. */
	let codeTextures = new Map<string, WebGLTexture>();

	const dropAtlases = () => {
		for (const atlas of atlases.values()) gl.deleteTexture(atlas.texture);
		atlases = new Map();
	};

	const dropCodeTextures = () => {
		for (const texture of codeTextures.values()) gl.deleteTexture(texture);
		codeTextures = new Map();
	};

	/**
	 * Rasterises every glyph once, in a grid of cells with `pad` device pixels of
	 * room on each side. With glows the text itself is drawn off the canvas and only
	 * its shadows land in the cell, which is what `text-shadow` puts under a glyph.
	 */
	const buildAtlas = (scale: number, glows: Glow[]): Atlas => {
		const glyphPx = fontPx * scale;
		const lineHeight = cellHeight * scale;
		let pad = Math.ceil(glyphPx * GUARD_EM) + 1;
		for (const glow of glows) pad = Math.max(pad, Math.ceil(glow.blurEm * glyphPx) + 1);
		const slotWidth = Math.ceil(cellWidth * scale) + 2 * pad;
		const slotHeight = Math.ceil(lineHeight) + 2 * pad;

		const sheet = document.createElement('canvas');
		sheet.width = slotWidth * ATLAS_COLS;
		sheet.height = slotHeight * ATLAS_ROWS;
		const ctx = sheet.getContext('2d');
		if (!ctx) throw new Error('2D canvas context unavailable for the glyph atlas');
		ctx.font = `${glyphPx}px ${font.family}`;
		ctx.textBaseline = 'alphabetic';
		ctx.fillStyle = '#ffffff';
		// A line box centres the font's content area, so the baseline sits half the
		// leading plus the ascent below the top of the cell, as in the `<pre>`.
		const metrics = ctx.measureText('M');
		const ascent = metrics.fontBoundingBoxAscent ?? glyphPx * 0.8;
		const descent = metrics.fontBoundingBoxDescent ?? glyphPx * 0.2;
		const baseline = pad + (lineHeight - ascent - descent) / 2 + ascent;

		for (let glyph = 0; glyph < GLYPH_COUNT; glyph++) {
			const text = String.fromCharCode(FIRST_CODE + glyph);
			const x = (glyph % ATLAS_COLS) * slotWidth + pad;
			const y = Math.floor(glyph / ATLAS_COLS) * slotHeight + baseline;
			if (glows.length === 0) {
				ctx.fillText(text, x, y);
				continue;
			}
			ctx.shadowOffsetX = SHADOW_OFFSET;
			for (const glow of glows) {
				ctx.shadowBlur = glow.blurEm * glyphPx;
				ctx.shadowColor = `rgba(255, 255, 255, ${glow.alpha})`;
				ctx.fillText(text, x - SHADOW_OFFSET, y);
			}
			ctx.shadowOffsetX = 0;
			ctx.shadowBlur = 0;
			ctx.shadowColor = 'transparent';
		}

		const texture = gl.createTexture();
		if (!texture) throw new Error('WebGL texture allocation failed');
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sheet);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		return {
			texture,
			cellWidth: slotWidth,
			cellHeight: slotHeight,
			pad,
			uvWidth: slotWidth / sheet.width,
			uvHeight: slotHeight / sheet.height
		};
	};

	const useAtlas = (scale: number, glows: Glow[]): Atlas => {
		const key = `${scale}:${glows.map((glow) => `${glow.blurEm}/${glow.alpha}`).join(',')}`;
		let atlas = atlases.get(key);
		if (!atlas) {
			atlas = buildAtlas(scale, glows);
			atlases.set(key, atlas);
		}
		return atlas;
	};

	const useCodeTexture = (cols: number, rows: number): WebGLTexture => {
		const key = `${cols}x${rows}`;
		let texture = codeTextures.get(key);
		if (texture) return texture;
		texture = gl.createTexture();
		if (!texture) throw new Error('WebGL texture allocation failed');
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8UI, cols, rows, 0, gl.RED_INTEGER, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		codeTextures.set(key, texture);
		return texture;
	};

	const drawPass = (layer: GlyphLayer, atlas: Atlas, color: GlyphLayer['color']) => {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, atlas.texture);
		gl.uniform2f(uQuad, atlas.cellWidth, atlas.cellHeight);
		gl.uniform1f(uPad, atlas.pad);
		gl.uniform2f(uAtlasCell, atlas.uvWidth, atlas.uvHeight);
		gl.uniform4f(uColor, color[0], color[1], color[2], color[3]);
		gl.drawArrays(gl.TRIANGLES, 0, layer.cols * layer.rows * 6);
	};

	return {
		resize(cols, rows, cell) {
			const nextWidth = cell.width * cell.dpr;
			const nextHeight = cell.height * cell.dpr;
			const nextFontPx = cell.fontPx * cell.dpr;
			if (nextWidth !== cellWidth || nextHeight !== cellHeight || nextFontPx !== fontPx) {
				cellWidth = nextWidth;
				cellHeight = nextHeight;
				fontPx = nextFontPx;
				dpr = cell.dpr;
				// The first atlases are built on demand; later ones wait for the size to settle.
				if (atlases.size > 0) atlasStaleSince = performance.now();
			}
			const width = Math.round(cols * cellWidth);
			const height = Math.round(rows * cellHeight);
			// Setting the size clears the canvas even when it does not change.
			if (width !== canvas.width || height !== canvas.height) {
				canvas.width = width;
				canvas.height = height;
				gl.viewport(0, 0, width, height);
				gl.uniform2f(uCanvas, width, height);
				dropCodeTextures();
			}
			canvas.style.width = `${cols * cell.width}px`;
			canvas.style.height = `${rows * cell.height}px`;
		},

		draw(layers) {
			if (atlasStaleSince && performance.now() - atlasStaleSince >= ATLAS_SETTLE_MS) {
				atlasStaleSince = 0;
				dropAtlases();
			}
			gl.clear(gl.COLOR_BUFFER_BIT);
			for (const layer of layers) {
				const texture = useCodeTexture(layer.cols, layer.rows);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texSubImage2D(
					gl.TEXTURE_2D,
					0,
					0,
					0,
					layer.cols,
					layer.rows,
					gl.RED_INTEGER,
					gl.UNSIGNED_BYTE,
					layer.codes
				);
				gl.uniform2i(uGrid, layer.cols, layer.rows);
				gl.uniform2f(uAdvance, cellWidth * layer.scale, cellHeight * layer.scale);
				if (layer.glows && layer.glows.length > 0) {
					drawPass(layer, useAtlas(layer.scale, layer.glows), [1, 1, 1, 1]);
				}
				drawPass(layer, useAtlas(layer.scale, []), layer.color);
			}
		},

		dispose() {
			dropAtlases();
			dropCodeTextures();
			gl.deleteProgram(program);
			gl.getExtension('WEBGL_lose_context')?.loseContext();
		}
	};
}
