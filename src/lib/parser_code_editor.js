// @ts-nocheck
/**
 * Parser for code editor content (cheerio / DOM-based).
 *
 * Splits raw editor markup into typed blocks:
 * - Element nodes (svg, h1, div, …) → element records (value keyed by tag name)
 * - <script> nodes → animejs records (parsed anime({...}) calls)
 *
 * Scripts are NEVER returned as elements — they always go to `scripts`
 * so callers store them in the animejs table, never the elements table.
 *
 * @param {string} src  Raw code-editor content
 * @returns {{ elements: Array<ElementBlock>, scripts: Array<AnimeBlock> }}
 */

import * as cheerio from 'cheerio';

/**
 * @typedef {{ tag: string, markup: string, title: string, type: string, id: string | null, value: Record<string, string>, children: Array<ElementBlock> }} ElementBlock
 * @typedef {{ source: string, type: string, typeValue: Record<string, any>, util: string | null, utilValue: Record<string, any> | null }} AnimeBlock
 */

/** known tag → built-in type mapping */
const TAG_TYPE = {
	svg: 'svg',
	h1: 'heading',
	h2: 'heading',
	h3: 'heading',
	h4: 'heading',
	h5: 'heading',
	h6: 'heading',
	p: 'paragraph',
	div: 'container',
	section: 'container',
	article: 'container',
	main: 'container',
	aside: 'container',
	header: 'container',
	footer: 'container',
	nav: 'container',
	span: 'component',
	button: 'component',
	a: 'component',
	img: 'component',
	input: 'component',
	textarea: 'component',
	select: 'component',
	label: 'component',
	form: 'component',
	ul: 'component',
	ol: 'component',
	li: 'component'
};

// ---- anime.js detection -----------------------------------------------------

/**
 * Strip one pair of surrounding single/double quotes (JSON.parse can't
 * handle single-quoted JS strings).
 * @param {string} value
 */
const stripQuotes = (value) => {
	const v = value.trim();
	if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
		return v.slice(1, -1);
	}
	return v;
};

/**
 * Extract structured info from the raw object literal of one anime({...}) call.
 * @param {string} raw
 * @returns {{ type: string, typeValue: Record<string, any>, util: string | null, utilValue: Record<string, any> | null }}
 */
const parseAnimeObject = (raw) => {
	/** @type {Record<string, any>} */
	const obj = {};

	// extract targets
	const targetM = /targets\s*:\s*('[^']*'|"[^"]*"|[^,}]+)/.exec(raw);
	if (targetM) {
		let v = targetM[1].trim();
		if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
			v = v.slice(1, -1);
		}
		obj.targets = v;
	}

	// extract duration
	const durM = /duration\s*:\s*(\d+)/.exec(raw);
	if (durM) obj.duration = Number(durM[1]);

	// extract easing
	const easeM = /easing\s*:\s*('[^']*'|"[^"]*")/.exec(raw);
	if (easeM) obj.easing = stripQuotes(easeM[1]);

	// extract loop
	const loopM = /loop\s*:\s*(true|false|\d+)/.exec(raw);
	if (loopM) {
		obj.loop = loopM[1] === 'true' ? true : loopM[1] === 'false' ? false : Number(loopM[1]);
	}

	// extract direction
	const dirM = /direction\s*:\s*('[^']*'|"[^"]*")/.exec(raw);
	if (dirM) obj.direction = stripQuotes(dirM[1]);

	// detect type
	return { type: 'animate', typeValue: obj, util: null, utilValue: null };
};

/**
 * Detect ALL `anime({...})` calls in a script body.
 * @param {string} body
 * @returns {Array<{ type: string, typeValue: Record<string, any>, util: string | null, utilValue: Record<string, any> | null }>}
 */
const parseAnimeCalls = (body) => {
	const results = [];
	const callRe = /anime\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
	let m;
	while ((m = callRe.exec(body)) !== null) {
		results.push(parseAnimeObject(m[1]));
	}
	return results;
};

// ---- main parser ------------------------------------------------------------

/**
 * @param {string} src
 */
export function parseCodeEditor(src) {
	const $ = cheerio.load(`<body>${src ?? ''}</body>`);
	/** @type {ElementBlock[]} */
	const elements = [];
	/** @type {AnimeBlock[]} */
	const scripts = [];

	/** Collect anime calls from a <script> node (never an element). */
	const collectScript = (el) => {
		const body = $(el).html() ?? '';
		if (!body.trim()) return;
		for (const call of parseAnimeCalls(body)) {
			scripts.push({ source: body, ...call });
		}
	};

	/** Walk one element node (scripts excluded, collected separately). */
	const walkElement = (el) => {
		const $el = $(el);
		const tag = (el.tagName || '').toLowerCase();
		const title = ($el.attr('data-element-title') ?? '').trim();
		const type = ($el.attr('data-element-type') ?? '').trim() || TAG_TYPE[tag] || 'component';
		const id = $el.attr('data-element-id') ?? null;
		const markup = $.html(el);
		/** @type {ElementBlock[]} */
		const children = [];
		$el.children().each((_, child) => {
			if (child.type !== 'tag' && child.type !== 'script') return;
			if ((child.tagName || '').toLowerCase() === 'script') {
				collectScript(child);
				return;
			}
			children.push(walkElement(child));
		});
		return { tag, markup, title, type, id, value: { [tag]: markup }, children };
	};

	$('body')
		.children()
		.each((_, el) => {
			if (el.type !== 'tag' && el.type !== 'script') return;
			const tag = (el.tagName || '').toLowerCase();
			if (tag === 'script') {
				collectScript(el);
				return;
			}
			elements.push(walkElement(el));
		});

	return { elements, scripts };
}
