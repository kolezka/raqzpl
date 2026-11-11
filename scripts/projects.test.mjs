import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Server } from '../.svelte-kit/output/server/index.js';
import { manifest } from '../.svelte-kit/output/server/manifest.js';

// Run after pnpm run build to exercise the actual Svelte SSR output.
const server = new Server(manifest);
await server.init({ env: process.env });

for (const lang of ['en', 'pl']) {
	test(`${lang} portfolio keeps private projects visible without source links`, async () => {
		const response = await server.respond(new Request(`http://localhost/${lang}/projects`), {
			getClientAddress: () => '127.0.0.1'
		});
		assert.equal(response.status, 200);
		const html = await response.text();
		const cards = [...html.matchAll(/<li\b[^>]*class="card(?: [^"]*)?"[^>]*>([\s\S]*?)<\/li>/g)].map(
			(match) => match[1]
		);
		assert.equal(cards.length, 19);
		for (const name of ['Docify', 'fleet-control', 'agent-fleet', 'tg-spy', 'kb']) {
			const card = cards.find((content) => content.includes(`> ${name}</span>`));
			assert.ok(card, `${name} must remain visible`);
			assert.doesNotMatch(card, /<a\b/, `${name} must not expose an unavailable source link`);
			assert.match(card, /<p class="tagline(?: [^"]*)?">[^<]+<\/p>/);
		}
		assert.match(html, /href="https:\/\/github.com\/kolezka\/renthunter"/);
		assert.match(html, /href="https:\/\/ghcards.raqz.link"/);
		const docify = cards.find((card) => card.includes('> Docify</span>'));
		for (const mechanism of [/FTS5\/BM25/, /API/, /embedding/i, /MCP/]) {
			assert.match(docify, mechanism, `Docify must explain ${mechanism} in ${lang}`);
		}
		assert.match(docify, lang === 'en' ? /rank fusion/ : /fuzję rankingów/);
		assert.match(docify, lang === 'en' ? /atomically activated/ : /atomowa aktywacja/);
		for (const card of cards) {
			const description = card.match(/<p class="tagline(?: [^"]*)?">([^<]+)<\/p>/)?.[1];
			assert.ok(description?.trim(), 'Every project must have a rendered description');
		}
		for (const name of ['docker-deepseek-harness', 'tmuxaxxing', 'cwelux', 'claude-agents-def', 'repo-intel']) {
			assert.ok(!cards.some((card) => card.includes(`> ${name}</span>`)), `${name} must stay removed`);
		}
	});
}
