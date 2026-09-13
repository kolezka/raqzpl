# raqz.pl / raqz.dev — base repository

## Task

Prepare a SvelteKit repository with SSR. The home page is black and shows a white
ASCII globe that turns, with `raqz.pl` changing to `raqz.dev` inside it and
`Mariusz Rakus` below.

## Steps

- [x] Scaffold SvelteKit (minimal template, TypeScript, pnpm)
- [x] Write the pure ASCII globe renderer `src/lib/globe.ts`
- [x] Write the `AsciiGlobe` component with the animation loop and title swap
- [x] Black page, white text, centred layout
- [x] Keep SSR on and explicit in `src/routes/+layout.ts`
- [x] `pnpm run check` — 0 errors, 0 warnings
- [x] `pnpm run build` — passes
- [x] Verify the SSR HTML holds the full globe frame and both texts
- [x] Verify the rotation and the title swap in a browser

## Review

The globe renderer is pure, so the server frame and the first client frame match.
One ray per character cell against a unit sphere; a 64x32 land mask gives the
continents. Water and land use separate character ramps, so the shapes stay
readable at any shading level.

Verified against the production build on http://localhost:4173:

- SSR HTML holds 48 lines of the globe, `raqz.pl` and `Mariusz Rakus`.
- In the browser the frame changes over time and the title swaps to `raqz.dev`.
- Background `rgb(0, 0, 0)`, text `rgb(255, 255, 255)`.
- Cell height divided by cell width is 2.0, which the renderer expects.

## Round two: a stronger 3D look

- [x] Split the frame into stacked layers: backdrop, ocean, graticule, land, label
- [x] Axial tilt of 23.44 degrees
- [x] Meridians and parallels, one cell wide and continuous
- [x] Specular highlight, limb darkening, halo outside the disc
- [x] Star field behind the globe, with a slow twinkle
- [x] Pointer parallax, eased
- [x] Title settles out of random glyphs
- [x] Grid raised from 96x48 to 112x56
- [x] `pnpm run check` — 0 errors, 0 warnings
- [x] Verified in the browser against the production build

### Notes

The first attempt marked a grid line by the distance from the exact angle. Lines
broke into dots, because the threshold could not follow the foreshortening near
the limb and the poles. The fix compares the grid index of neighbouring cells:
a cell is on a line when it and a neighbour straddle exactly one line. Lines are
now continuous and never wider than one cell.

Land and water fought for the same brightness range, so continents washed out.
They now sit in separate layers with different opacity, which separates them by
colour instead of by character density.

Small white glyphs picked up colour fringes from subpixel smoothing. The fix is
`transform: translateZ(0)` on each layer, which puts it on its own composited
layer and makes the browser fall back to grey smoothing.

Measured cost: about 1.05 ms per frame for 112x56 cells, against a 33 ms budget
at 30 frames per second.

## Round three: Docker and Coolify

- [x] Replace `adapter-auto` with `@sveltejs/adapter-node`
- [x] Pin `packageManager` to `pnpm@12.4.1`, so the image builds with the same pnpm
- [x] `Dockerfile`, three stages on `node:24-alpine`, runs as user `node`
- [x] `.dockerignore`
- [x] `docker-compose.yaml` with `SERVICE_FQDN_WEB_3000`, no published port
- [x] Health check on `/` with `wget`
- [x] `pnpm run build` passes with the new adapter
- [x] `docker build` passes, container answers `200` on port 3000

### Notes

The container needs no production dependencies today, because every package is
a devDependency and the adapter bundles those into `build/`. The `deps` stage
ends with `mkdir -p node_modules`, so the `COPY --from=deps` stays valid while
the directory is empty.

Coolify routes by domain, so the Compose file publishes no host port. Set the
domain on the `web` service as `https://raqz.pl:3000`; the port after the colon
only tells the proxy where to go inside the container.

Verified: image 161 MB, `curl http://127.0.0.1:3100/` returned `200`, the SSR
HTML held 5 `<pre>` layers, `raqz.pl`, `raqz.dev` and `Mariusz Rakus`.

## Round four: a grid that covers the window

- [x] `globe.ts` takes the grid size: `Layout` holds the centre, the radii and the
      scratch buffers, and is rebuilt only when the size changes
- [x] `renderBackdrop(cols, rows)` and `renderGlobe({ ..., cols, rows })`
- [x] Star rolls count from the middle of the grid, so the sky keeps its pattern
      when the window is resized
- [x] Row zero keeps its trailing spaces, so every layer is as wide as the grid
- [x] `AsciiGlobe` measures one character cell with a hidden probe line and fits
      the grid to the window, on mount and on every resize
- [x] Font size now only sets how fine the drawing is: `clamp(9px, 1.35vmin, 18px)`
- [x] `main` has a fixed `100dvh` height, so the extra part of the grid is cropped
- [ ] `pnpm run check` — 0 errors, 0 warnings
- [ ] Verified in the browser: wide window and a phone size

### Notes

The disc keeps nine tenths of the grid height, and the grid is as tall as the
window, so the globe is about 90 percent of the window height on every screen.
On a wide screen the grid is much wider than the disc, which is what puts stars
from edge to edge. On a phone the disc is wider than the grid, so the sides fall
outside it: that is the zoom, and it costs nothing because those cells are never
drawn.

## Next (not in scope)

- Add a domain switch, so `raqz.dev` can show a different default title.
