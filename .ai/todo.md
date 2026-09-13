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

## Next (not in scope)

- Choose the production adapter instead of `adapter-auto`.
- Add a domain switch, so `raqz.dev` can show a different default title.
