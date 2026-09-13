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

## Next (not in scope)

- Choose the production adapter instead of `adapter-auto`.
- Add a domain switch, so `raqz.dev` can show a different default title.
