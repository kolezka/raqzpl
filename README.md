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

`renderGlobe(angle, title, subtitle)` is pure and deterministic. The server and
the browser produce the same frame for the same angle, so the SSR markup matches
the first client frame. The server sends the frame for angle `0`; the browser
then turns the globe with `requestAnimationFrame` at 24 frames per second.

The renderer casts one ray per character cell against a unit sphere, samples a
coarse land mask, and picks a character from one of two ramps: `.,-~:` for water
and `=+*#@` for land. The two ramps share no character, so the continents stay
readable.

`prefers-reduced-motion: reduce` stops the rotation. The title still changes.

## Deployment

The project uses `@sveltejs/adapter-auto`. Replace it with the adapter of the
target host (`adapter-node`, `adapter-vercel`, `adapter-cloudflare`) in
`vite.config.ts`.
