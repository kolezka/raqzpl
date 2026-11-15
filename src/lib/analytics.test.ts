import { describe, expect, it, vi } from 'vitest';
import {
	GA_MEASUREMENT_ID,
	SCROLL_MILESTONES,
	TIME_MILESTONES,
	applyConsent,
	classifyLink,
	contactResult,
	newMilestones,
	readConsent,
	readDeviceInfo,
	samsungFoldable,
	saveConsent,
	scrollPercent,
	trackDeviceModel,
	trackEvent
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

const hints = (values: { model?: string; platformVersion?: string }) => ({
	userAgentData: { getHighEntropyValues: async () => values }
});

describe('samsungFoldable', () => {
	it('tells Flips and Folds apart by model code', () => {
		expect(samsungFoldable('SM-F731B')).toBe('flip');
		expect(samsungFoldable('SM-F741U')).toBe('flip');
		expect(samsungFoldable('SM-F946B')).toBe('fold');
	});

	it('leaves other phones alone', () => {
		expect(samsungFoldable('SM-S911B')).toBeUndefined();
		expect(samsungFoldable('SM-A556B')).toBeUndefined();
		expect(samsungFoldable('Pixel 9')).toBeUndefined();
	});
});

describe('readDeviceInfo', () => {
	it('returns model, Android version and foldable type', async () => {
		expect(await readDeviceInfo(hints({ model: 'SM-F731B', platformVersion: '16.0.0' }))).toEqual({
			model: 'SM-F731B',
			android: '16.0.0',
			foldable: 'flip'
		});
	});

	it('omits fields the browser does not report', async () => {
		expect(await readDeviceInfo(hints({ model: 'Pixel 9' }))).toEqual({ model: 'Pixel 9' });
	});

	it('returns null for desktops and browsers without the API', async () => {
		expect(await readDeviceInfo(hints({ model: '', platformVersion: '15.0' }))).toBeNull();
		expect(await readDeviceInfo({})).toBeNull();
	});
});

describe('trackDeviceModel', () => {
	const flipNav = hints({ model: 'SM-F731B', platformVersion: '16.0.0' });
	const noWait = async () => {};
	const tracker = () => ({ track: vi.fn(), identify: vi.fn() });
	const flip = { model: 'SM-F731B', android: '16.0.0', foldable: 'flip' };

	it('attaches the device to the session and sends one event per session', async () => {
		const umami = tracker();
		const session = memoryStorage();

		expect(await trackDeviceModel({ umami }, flipNav, session, noWait)).toBe('sent');
		expect(await trackDeviceModel({ umami }, flipNav, session, noWait)).toBe('already-sent');
		expect(umami.identify).toHaveBeenCalledOnce();
		expect(umami.identify).toHaveBeenCalledWith(flip);
		expect(umami.track).toHaveBeenCalledOnce();
		expect(umami.track).toHaveBeenCalledWith('device-model', flip);
	});

	it('waits for Umami to finish loading', async () => {
		const umami = tracker();
		const win: { umami?: typeof umami } = {};
		let waits = 0;
		const wait = async () => {
			if (++waits === 3) win.umami = umami;
		};

		expect(await trackDeviceModel(win, flipNav, memoryStorage(), wait)).toBe('sent');
		expect(umami.identify).toHaveBeenCalledOnce();
	});

	it('sends nothing without a model or without Umami', async () => {
		const umami = tracker();

		expect(await trackDeviceModel({ umami }, hints({ model: '' }), memoryStorage(), noWait)).toBe('no-model');
		expect(await trackDeviceModel({}, flipNav, memoryStorage(), noWait)).toBe('no-umami');
		expect(umami.track).not.toHaveBeenCalled();
		expect(umami.identify).not.toHaveBeenCalled();
	});
});

describe('trackEvent', () => {
	it('sends when Umami is loaded and does nothing when it is blocked', () => {
		const track = vi.fn();
		trackEvent({ umami: { track, identify: vi.fn() } }, 'contact-submit', { result: 'sent' });
		expect(track).toHaveBeenCalledWith('contact-submit', { result: 'sent' });
		expect(() => trackEvent({}, 'contact-submit')).not.toThrow();
	});
});

describe('classifyLink', () => {
	it('reports outbound links by host and path, without the query string', () => {
		expect(classifyLink('https://github.com/kolezka/raqzpl?tab=readme#top', 'raqz.pl')).toEqual({
			kind: 'outbound',
			target: 'github.com/kolezka/raqzpl'
		});
		expect(classifyLink('https://www.linkedin.com/', 'raqz.pl')).toEqual({
			kind: 'outbound',
			target: 'www.linkedin.com'
		});
	});

	it('reports email links without the address', () => {
		expect(classifyLink('mailto:hello@raqz.pl', 'raqz.pl')).toEqual({ kind: 'email', target: 'email' });
	});

	it('ignores links inside the site and other schemes', () => {
		expect(classifyLink('/pl/projects', 'raqz.pl')).toBeNull();
		expect(classifyLink('https://raqz.pl/en/contact', 'raqz.pl')).toBeNull();
		expect(classifyLink('#section', 'raqz.pl')).toBeNull();
		expect(classifyLink('tel:+48123456789', 'raqz.pl')).toBeNull();
		expect(classifyLink('javascript:void(0)', 'raqz.pl')).toBeNull();
	});
});

describe('scrollPercent', () => {
	it('measures the bottom edge of the viewport against the page', () => {
		expect(scrollPercent(0, 1000, 4000)).toBe(25);
		expect(scrollPercent(1000, 1000, 4000)).toBe(50);
	});

	it('counts the last 2% and pages shorter than the screen as the end', () => {
		expect(scrollPercent(2930, 1000, 4000)).toBe(100);
		expect(scrollPercent(0, 1000, 800)).toBe(100);
	});
});

describe('newMilestones', () => {
	it('returns every milestone passed since the last report, once', () => {
		const reported = new Set<number>();
		const first = newMilestones(60, SCROLL_MILESTONES, reported);
		expect(first).toEqual([25, 50]);
		first.forEach((milestone) => reported.add(milestone));

		expect(newMilestones(60, SCROLL_MILESTONES, reported)).toEqual([]);
		expect(newMilestones(100, SCROLL_MILESTONES, reported)).toEqual([75, 100]);
	});

	it('works for time on page in seconds', () => {
		expect(newMilestones(45, TIME_MILESTONES, new Set([15]))).toEqual([30]);
	});
});

describe('contactResult', () => {
	it('maps form outcomes to a short label', () => {
		expect(contactResult({ type: 'success', status: 200 })).toBe('sent');
		expect(contactResult({ type: 'failure', status: 400 })).toBe('invalid');
		expect(contactResult({ type: 'failure', status: 502 })).toBe('mail-failed');
		expect(contactResult({ type: 'error', status: 500 })).toBe('error');
	});
});
