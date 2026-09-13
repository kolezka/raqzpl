# raqz.pl / raqz.dev

Base repository for the personal site of Mariusz Rakus.

Stack: SvelteKit 2 (Svelte 5, runes), TypeScript, Vite, server side rendering.

The home page shows a black screen with a white ASCII globe that turns. The title
inside the globe changes between `raqz.pl` and `raqz.dev`, with `Mariusz Rakus`
below it.

## Commands

```bash
pnpm install
pnpm run dev       # development server on http://localhost:5173
pnpm run build     # production build
pnpm run preview   # serve the production build
pnpm run check     # svelte-check and TypeScript
```

## Structure

| Path                                   | Purpose                                       |
| -------------------------------------- | --------------------------------------------- |
| `src/lib/globe.ts`                     | Pure ASCII globe renderer, one frame per call  |
| `src/lib/components/AsciiGlobe.svelte` | Animation loop, title swap, styling            |
| `src/routes/+page.svelte`              | Home page                                      |
| `src/routes/+layout.svelte`            | Global colours and font                        |
| `src/routes/+layout.ts`                | SSR flags                                      |
| `vite.config.ts`                       | SvelteKit plugin and adapter                   |

## Rendering

`renderGlobe(options)` is pure and deterministic. The server and the browser
produce the same frame for the same options, so the SSR markup matches the first
client frame. The server sends the frame for angle `0`; the browser then turns
the globe with `requestAnimationFrame` at 30 frames per second, about 1 ms per
frame for a grid of 112 by 56 cells.

The renderer casts one ray per character cell against a unit sphere. It shades
the point with a diffuse term, a specular highlight and limb darkening, then
samples a coarse land mask for the character ramp: `.,-~:` for water and `=+*#@`
for land.

### Layers

One frame returns four character grids of the same size. They stack in CSS, each
with its own colour, and no cell holds a character in more than one grid. Colour
carries the separation that a single ramp cannot.

| Layer       | Content                        | Opacity |
| ----------- | ------------------------------ | ------- |
| `backdrop`  | Stars and the glow of the limb | 0.30    |
| `ocean`     | Water shading                  | 0.38    |
| `graticule` | Meridians and parallels        | 0.22    |
| `land`      | Continents                     | 0.95    |
| `label`     | Title and subtitle             | 1.00    |

The backdrop never moves, so it renders once.

### Depth cues

- The polar axis carries the 23.44 degree tilt of the Earth.
- Meridians and parallels every 30 degrees. A cell joins the wireframe when it
  and a neighbour sit on opposite sides of exactly one grid line, which keeps the
  lines continuous and one cell wide. A wider gap means the line is finer than a
  cell, so it drops out instead of smearing into a band near the limb.
- Limb darkening and a halo outside the disc round the edge off.
- The pointer tips the globe up to 0.3 radians, eased over about ten frames.
- The title settles out of random glyphs, left to right, over 900 ms.

`prefers-reduced-motion: reduce` stops the rotation, the pointer tilt, the star
twinkle and the scramble. The title still changes.

## Deployment

The project uses `@sveltejs/adapter-auto`. Replace it with the adapter of the
target host (`adapter-node`, `adapter-vercel`, `adapter-cloudflare`) in
`vite.config.ts`.
