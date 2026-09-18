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

## Round five: navigation, project and contact views

- [x] `NavMenu` component, fixed top left, links home / projects / contact, active state
- [x] `AsciiTransition` overlay: full screen scramble that covers on navigate then
      dissolves after the new page mounts; driven by `onNavigate` / `afterNavigate`
- [x] `/projects` route: ASCII themed project cards (placeholder content)
- [x] `/contact` route: contact channel list (placeholder content)
- [x] Shared view styling in `+layout.svelte` (global helpers)
- [x] Respect `prefers-reduced-motion`: instant swap, no scramble
- [x] `pnpm run check` — 0 errors, 0 warnings
- [ ] Verify in the browser: nav links, both views, the transition both ways

### Notes

The transition uses SvelteKit `onNavigate`, which returns a promise that holds the
DOM swap until the screen is fully covered by the scramble, so no page flashes
through. `afterNavigate` then dissolves the cover. `onNavigate` does not fire on
the first load, so the globe still appears with no transition.

Placeholder content in the two views is marked with a comment and must be replaced
with the real projects and contact handles.

## Review (round five)

Implemented on branch `brisk-crab`.

- `src/lib/components/NavMenu.svelte` — fixed top-left menu, active route from
  `$app/state` `page.url.pathname`, blinking cursor after the `raqz` brand.
- `src/lib/components/AsciiTransition.svelte` — full-screen `<pre>` scramble.
  `cover()` returns a promise resolved when fully opaque; `reveal()` dissolves it.
  Per-cell threshold gives an organic dissolve; black background alpha tracks the
  fill so the outgoing page is fully hidden at the swap. `prefers-reduced-motion`
  makes both instant.
- `src/routes/+layout.svelte` — wires `onNavigate` (cover, holds the DOM swap) and
  `afterNavigate` (reveal); renders `NavMenu` and `AsciiTransition` on every page.
  Global helper classes `.view` / `.view-inner` / `.link` / `.muted`.
- `src/routes/projects/+page.svelte`, `src/routes/contact/+page.svelte` — the two
  views, placeholder content.

`pnpm run check`: 0 errors, 0 warnings, 177 files.

## Next (not in scope)

- Add a domain switch, so `raqz.dev` can show a different default title.

## Round five: a finer globe on Full HD

- [x] Cell size down from `clamp(9px, 0.9vmin, 14px)` to `clamp(7px, 0.65vmin, 11px)`,
      so a Full HD screen draws 129 rows instead of 93
- [x] `LABEL_SCALE` 2 -> 3, so the title keeps about the size it had on the coarse grid
- [x] `gridToString` trims trailing blanks by hand instead of `/\s+$/`
- [x] `MAX_COLS` 640 -> 960 and `MAX_ROWS` 240 -> 320, so a wide 1x screen is not cropped
- [x] `pnpm run check` — 0 errors, 0 warnings
- [x] `pnpm run build` — passes
- [x] Verified in Chrome at 390x844, 1366x768, 1920x1080, 3440x1440 and 3840x2160

### Notes

The globe read as blocky on Full HD, and at 50 percent browser zoom it read well.
That zoom level is simply a finer grid: the same window becomes 128 rows instead of
93. The cell size now aims at that density, so a Full HD screen gets what the zoomed
page showed, and the title is no longer tied to the smaller cell because it is drawn
at three times the cell size.

The trailing blank trim was the whole frame budget. A CPU profile of 200 frames at
459x129 put 1691 ms in `RegExp: \s+$` against 521 ms in `renderGlobe` itself: the
rows outside the disc are blank over their full width, which is the worst input that
regex can get. Counting the blanks back by hand cut a frame at that size from
12.07 ms to 3.30 ms, measured in node, so the finer grid costs less than the coarse
grid did before. Old and new renderers were compared over 252 layer strings across
four grid sizes: identical output.

In Chrome at 1920x1080 the main thread went from 14.1 to 20.3 percent of wall time,
with no dropped animation frame in either build.
