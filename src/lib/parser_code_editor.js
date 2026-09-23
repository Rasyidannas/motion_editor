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

/** Generate a v4 UUID (safe in both Node and browser). */
const generateId = () =>
	'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
	});

/**
 * Convert a JS literal value (from a parsed object literal) into a JSON-safe value.
 * Handles strings, numbers, booleans, null, arrays, and plain nested objects.
 * @param {string} raw
 * @returns {any}
 */
const convertJsValue = (raw) => {
	const v = raw.trim();
	if (!v) return undefined;
	// quoted string
	if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
		return v.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
	}
	// booleans / null
	if (v === 'true') return true;
	if (v === 'false') return false;
	if (v === 'null' || v === 'undefined') return null;
	// number (also handles `.5` / `-.5` without leading digit)
	if (/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(v)) return Number(v);
	// array literal (may contain nested)
	if (v.startsWith('[') && v.endsWith(']')) {
		const inner = v.slice(1, -1);
		if (!inner.trim()) return [];
		const items = splitTopLevel(inner, ',');
		return items.map((item) => convertJsValue(item));
	}
	// object literal (nested)
	if (v.startsWith('{') && v.endsWith('}')) {
		return parseRawObject(v);
	}
	// fallback — wrap as raw JS expression so fmtJsValue outputs it unquoted
	return { __expr: v };
};

/**
 * Split a string at a delimiter that is not inside braces, brackets, or quotes.
 * @param {string} str
 * @param {string} delim
 * @returns {string[]}
 */
const splitTopLevel = (str, delim) => {
	const parts = [];
	let depth = 0;
	let start = 0;
	let inStr = null; // ' or " or null
	for (let i = 0; i < str.length; i++) {
		const ch = str[i];
		const prev = i > 0 ? str[i - 1] : '';
		if (inStr) {
			if (ch === inStr && prev !== '\\') inStr = null;
			continue;
		}
		if (ch === "'" || ch === '"') { inStr = ch; continue; }
		if (ch === '{' || ch === '[') { depth++; continue; }
		if (ch === '}' || ch === ']') { depth--; continue; }
		if (depth === 0 && ch === delim) {
			parts.push(str.slice(start, i));
			start = i + 1;
		}
	}
	parts.push(str.slice(start));
	return parts;
};

/**
 * Parse a raw JS object literal string (including outer braces) into a plain object.
 * @param {string} raw
 * @returns {Record<string, any>}
 */
const parseRawObject = (raw) => {
	/** @type {Record<string, any>} */
	const obj = {};
	// strip surrounding braces
	const inner = raw.replace(/^\s*\{\s*/, '').replace(/\s*\}\s*$/, '').trim();
	if (!inner) return obj;
	const pairs = splitTopLevel(inner, ',');
	for (const pair of pairs) {
		const colonIdx = pair.indexOf(':');
		if (colonIdx === -1) continue;
		const key = pair.slice(0, colonIdx).trim().replace(/^['"]|['"]$/g, '');
		const valStr = pair.slice(colonIdx + 1);
		obj[key] = convertJsValue(valStr);
	}
	return obj;
};

/**
 * Extract structured info from the raw object literal of one anime({...}) call.
 * @param {string} raw  Content INSIDE the outer {} of anime({...})
 * @returns {{ type: string, typeValue: Record<string, any>, util: string | null, utilValue: Record<string, any> | null }}
 */
const parseAnimeObject = (raw) => {
	const typeValue = parseRawObject(`{${raw}}`);
	return { type: 'animate', typeValue, util: null, utilValue: null };
};

/**
 * Detect ALL `anime({...})` AND `animate(targets, {...})` calls in a script body.
 * @param {string} body
 * @returns {Array<{ type: string, typeValue: Record<string, any>, util: string | null, utilValue: Record<string, any> | null }>}
 */
const parseAnimeCalls = (body) => {
	const results = [];
	// detect anime({...})
	const animeRe = /anime\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
	let m;
	while ((m = animeRe.exec(body)) !== null) {
		results.push(parseAnimeObject(m[1]));
	}
	// detect animate(targets, {params})
	const animateRe = /animate\s*\(\s*([\s\S]*?)\s*,\s*\{([\s\S]*?)\}\s*\)/g;
	while ((m = animateRe.exec(body)) !== null) {
		const targetsRaw = m[1].trim();
		const paramsRaw = m[2];
		const typeValue = parseRawObject(`{${paramsRaw}}`);
		if (targetsRaw) {
			typeValue.targets = convertJsValue(targetsRaw);
		}
		typeValue._callStyle = 'animate';
		results.push({ type: 'animate', typeValue, util: null, utilValue: null });
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

	/** Walk one element node (scripts excluded, collected separately).
	 *  Nested child elements (e.g. <rect> inside <svg>) are NOT returned as
	 *  separate ElementBlocks — they stay embedded in the parent's markup
	 *  with their data-element-id already injected into the DOM so anime.js
	 *  can target them by ID.
	 */
	const walkElement = (el) => {
		const $el = $(el);
		const tag = (el.tagName || '').toLowerCase();
		const title = ($el.attr('data-element-title') ?? '').trim();
		const type = ($el.attr('data-element-type') ?? '').trim() || TAG_TYPE[tag] || 'component';
		const id = $el.attr('data-element-id') || generateId();
		$el.attr('data-element-id', id);

		// Inject data-element-id into all descendant DOM nodes (for anime
		// targeting) and collect <script> blocks — but do NOT create separate
		// child ElementBlocks since they stay inside the parent's markup.
		const injectDescendantIds = (parent) => {
			$(parent)
				.children()
				.each((_, child) => {
					if (child.type !== 'tag' && child.type !== 'script') return;
					if ((child.tagName || '').toLowerCase() === 'script') {
						collectScript(child);
						return;
					}
					const $child = $(child);
					if (!$child.attr('data-element-id')) {
						$child.attr('data-element-id', generateId());
					}
					injectDescendantIds(child);
				});
		};
		injectDescendantIds(el);

		const markup = $.html(el);
		return { tag, markup, title, type, id, value: { [tag]: markup }, children: [] };
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
