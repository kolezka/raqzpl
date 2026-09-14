# raqz.pl / raqz.dev

Base repository for the personal site of Mariusz Rakus.

Stack: SvelteKit 2 (Svelte 5, runes), TypeScript, Vite, server side rendering.

The home page shows a black screen with a white ASCII globe that turns. The title
inside the globe steps through the domains, with `Mariusz Rakus` below it:
`raqz.pl`, `raqz.dev`, `raqz.link`, `raqz.app`, `raqz.contact`. Each one stays
for 3.6 seconds, so the full round takes 18 seconds.

To change the list, pass the `titles` property to `AsciiGlobe` in
`src/routes/+page.svelte`.

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
| `src/lib/coastlines.ts`                | Coastline rings and the land mask built from them |
| `src/lib/components/AsciiGlobe.svelte` | Animation loop, title swap, styling            |
| `src/routes/+page.svelte`              | Home page                                      |
| `src/routes/+layout.svelte`            | Global colours and font                        |
| `src/routes/+layout.ts`                | SSR flags                                      |
| `vite.config.ts`                       | SvelteKit plugin and adapter                   |
| `Dockerfile`                           | Three stage build of the Node server image     |
| `docker-compose.yaml`                  | Coolify deployment                             |

## Rendering

`renderGlobe(options)` is pure and deterministic. The server and the browser
produce the same frame for the same options, so the SSR markup matches the first
client frame. The server sends the frame for angle `0`; the browser then turns
the globe with `requestAnimationFrame` at 30 frames per second, about 1 ms per
frame for the server grid of 112 by 56 cells and about 4 ms for the 330 by 92
cells of a Full HD window.

The browser fits the grid to the window. The cell size is `0.9vmin`, clamped
between 9 px and 14 px, which gives about 90 rows from Full HD up and caps the
cell count on a 4K screen. The globe keeps nine tenths of the grid height.

The renderer casts one ray per character cell against a unit sphere. It shades
the point with a diffuse term, a specular highlight and limb darkening, then
samples the land mask for the character ramp: `.,-~:;` for water and `=+*%#@`
for land. The mask is 512 by 256 cells, about 0.7 degrees each, filled from
hand traced coastline rings in `src/lib/coastlines.ts` by a scanline fill when
the module loads.

### Layers

One frame returns four character grids of the same size. They stack in CSS, each
with its own colour, and no cell holds a character in more than one grid. Colour
carries the separation that a single ramp cannot.

| Layer       | Content                        | Opacity |
| ----------- | ------------------------------ | ------- |
| `backdrop`  | Stars and the glow of the limb | 0.30    |
| `ocean`     | Water shading                  | 0.48    |
| `graticule` | Meridians and parallels        | 0.30    |
| `land`      | Continents                     | 0.95    |
| `label`     | Title and subtitle             | 1.00    |

The backdrop never moves, so it renders once. Its star density is fixed per cell
up to 64 rows and per area above that, so a finer grid does not fill the sky.

The `label` layer is drawn on a grid twice as coarse as the others, at twice the
font size (`LABEL_SCALE`), so the title stays readable when the cells are small.
Each label character clears the block of cells under it in the other layers.

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

The project uses `@sveltejs/adapter-node`, so the build is a Node server that
starts with `node build` and listens on `PORT` (3000 by default).

### Docker

```bash
docker build -t raqzpl .
docker run --rm -p 3000:3000 raqzpl     # http://localhost:3000
```

The image builds in three stages on `node:24-alpine`: one stage builds the site,
one installs the production dependencies, and the last one holds only `build/`,
`node_modules/` and `package.json`. It runs as the `node` user. The result is
about 161 MB.

The adapter bundles the `devDependencies` into `build/`. Only packages under
`dependencies` go into the image, and there are none today.

### Coolify

`docker-compose.yaml` is written for Coolify.

1. Create a new resource, source **Git repository**, build pack **Docker
   Compose**.
2. Base Directory `/`, Docker Compose Location `/docker-compose.yaml`.
3. Open the `web` service and set the domain, for example
   `https://raqz.pl:3000`. The `:3000` tells the proxy which port inside the
   container to use. Visitors still use port 443.
4. Deploy.

Coolify writes the domain into `SERVICE_FQDN_WEB_3000`, and the Compose file
passes it to SvelteKit as `ORIGIN`. Add `raqz.dev`, `raqz.link`, `raqz.app` and
`raqz.contact` as further domains on the same service.

The Compose file publishes no host port, because Coolify routes by domain
through its proxy. The health check calls `/` every 30 seconds with `wget`.

| Variable          | Default              | Purpose                          |
| ----------------- | -------------------- | -------------------------------- |
| `PORT`            | `3000`               | Port inside the container        |
| `HOST`            | `0.0.0.0`            | Listening interface              |
| `ORIGIN`          | from Coolify         | Public URL, used for form checks |
| `BODY_SIZE_LIMIT` | `512K`               | Largest request body             |
