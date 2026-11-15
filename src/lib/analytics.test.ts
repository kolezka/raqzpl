import { describe, expect, it, vi } from 'vitest';
import {
	GA_MEASUREMENT_ID,
	applyConsent,
	readConsent,
	readDeviceModel,
	saveConsent,
	trackDeviceModel
} from './analytics';

function memoryStorage(initial: Record<string, string> = {}) {
	const data = new Map(Object.entries(initial));
	return {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => void data.set(key, value)
	};
}

const throwingStorage = {
	getItem: () => {
		throw new Error('blocked');
	},
	setItem: () => {
		throw new Error('blocked');
	}
};

function fakeDocument(cookie = '') {
	const appended: { id: string; async: boolean; src: string }[] = [];
	const cookieWrites: string[] = [];
	const doc = {
		getElementById: (id: string) => appended.find((node) => node.id === id) ?? null,
		createElement: () => ({ id: '', async: false, src: '' }),
		head: { appendChild: (node: unknown) => appended.push(node as (typeof appended)[number]) },
		location: { hostname: 'raqz.pl' },
		get cookie() {
			return cookie;
		},
		set cookie(value: string) {
			cookieWrites.push(value);
		}
	};
	return { doc, appended, cookieWrites };
}

/** dataLayer entries are `arguments` objects; turn them into plain arrays. */
function commands(dataLayer: unknown[] | undefined) {
	return (dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
}

describe('consent storage', () => {
	it('reads only the two known answers', () => {
		expect(readConsent(memoryStorage({ 'raqz-consent': 'granted' }))).toBe('granted');
		expect(readConsent(memoryStorage({ 'raqz-consent': 'denied' }))).toBe('denied');
		expect(readConsent(memoryStorage({ 'raqz-consent': 'yes' }))).toBeNull();
		expect(readConsent(memoryStorage())).toBeNull();
	});

	it('treats blocked storage as unanswered, so GA4 stays off', () => {
		expect(readConsent(throwingStorage)).toBeNull();
		expect(() => saveConsent(throwingStorage, 'granted')).not.toThrow();
	});

	it('round-trips a saved choice', () => {
		const storage = memoryStorage();
		saveConsent(storage, 'denied');
		expect(readConsent(storage)).toBe('denied');
	});
});

describe('applyConsent', () => {
	it('never loads the Google script without consent', () => {
		const win: { dataLayer?: unknown[] } = {};
		const { doc, appended } = fakeDocument();
		applyConsent(win, doc, 'denied');

		expect(appended).toHaveLength(0);
		expect(commands(win.dataLayer)).toEqual([
			['consent', 'default', expect.objectContaining({ analytics_storage: 'denied' })],
			['consent', 'update', expect.objectContaining({ analytics_storage: 'denied' })]
		]);
	});

	it('loads the script once after consent and configures the property', () => {
		const win: { dataLayer?: unknown[] } = {};
		const { doc, appended } = fakeDocument();
		applyConsent(win, doc, 'granted');
		applyConsent(win, doc, 'granted');

		expect(appended).toHaveLength(1);
		expect(appended[0].src).toBe(`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`);
		expect(appended[0].async).toBe(true);
		const pushed = commands(win.dataLayer);
		expect(pushed[0]).toEqual(['consent', 'default', expect.objectContaining({ ad_storage: 'denied' })]);
		expect(pushed).toContainEqual(['config', GA_MEASUREMENT_ID]);
		expect(pushed.filter((command) => command[0] === 'config')).toHaveLength(1);
	});

	it('pushes the arguments object gtag.js expects, not an array', () => {
		const win: { dataLayer?: unknown[] } = {};
		applyConsent(win, fakeDocument().doc, 'denied');
		expect(Array.isArray(win.dataLayer?.[0])).toBe(false);
	});

	it('removes GA cookies when consent is withdrawn', () => {
		const win: { dataLayer?: unknown[] } = {};
		const { doc, cookieWrites } = fakeDocument('_ga=GA1.1.1; theme=dark; _ga_CXYH9FJED4=GS1');
		applyConsent(win, doc, 'denied');

		const cleared = cookieWrites.map((write) => write.split('=')[0]);
		expect(new Set(cleared)).toEqual(new Set(['_ga', '_ga_CXYH9FJED4']));
		expect(cookieWrites.some((write) => write.includes('domain=.raqz.pl'))).toBe(true);
	});
});

describe('readDeviceModel', () => {
	const nav = (model: string) => ({
		userAgentData: { getHighEntropyValues: async () => ({ model }) }
	});

	it('returns the model a Chromium phone reports', async () => {
		expect(await readDeviceModel(nav('SM-F731B'))).toBe('SM-F731B');
	});

	it('returns null for desktops and browsers without the API', async () => {
		expect(await readDeviceModel(nav(''))).toBeNull();
		expect(await readDeviceModel({})).toBeNull();
	});
});

describe('trackDeviceModel', () => {
	const flipNav = { userAgentData: { getHighEntropyValues: async () => ({ model: 'SM-F731B' }) } };
	const noWait = async () => {};

	it('sends the model to Umami once per session', async () => {
		const track = vi.fn();
		const session = memoryStorage();

		expect(await trackDeviceModel({ umami: { track } }, flipNav, session, noWait)).toBe('sent');
		expect(await trackDeviceModel({ umami: { track } }, flipNav, session, noWait)).toBe('already-sent');
		expect(track).toHaveBeenCalledTimes(1);
		expect(track).toHaveBeenCalledWith('device-model', { model: 'SM-F731B' });
	});

	it('waits for Umami to finish loading', async () => {
		const track = vi.fn();
		const win: { umami?: { track: typeof track } } = {};
		let waits = 0;
		const wait = async () => {
			if (++waits === 3) win.umami = { track };
		};

		expect(await trackDeviceModel(win, flipNav, memoryStorage(), wait)).toBe('sent');
		expect(track).toHaveBeenCalledOnce();
	});

	it('sends nothing without a model or without Umami', async () => {
		const track = vi.fn();
		const desktop = { userAgentData: { getHighEntropyValues: async () => ({ model: '' }) } };

		expect(await trackDeviceModel({ umami: { track } }, desktop, memoryStorage(), noWait)).toBe('no-model');
		expect(await trackDeviceModel({}, flipNav, memoryStorage(), noWait)).toBe('no-umami');
		expect(track).not.toHaveBeenCalled();
	});
});
