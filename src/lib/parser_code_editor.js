// @ts-nocheck
/**
 * Parser for code editor content.
 *
 * Splits raw editor markup into typed blocks:
 * - Blocks with a single root tag → element records  (value keyed by tag name)
 * - <script> blocks → animejs records
 *
 * @param {string} src  Raw code-editor content
 * @returns {{ elements: Array<ElementBlock>, scripts: Array<AnimeBlock> }}
 */

/**
 * @typedef {{ tag: string, markup: string, title: string, type: string, id: string | null, value: Record<string, string> }} ElementBlock
 * @typedef {{ source: string, type: string, typeValue: Record<string, any>, util: string | null, utilValue: Record<string, any> | null }} AnimeBlock
 */

// ---- helpers ----------------------------------------------------------------

/**
 * @param {string} value
 */
const escapeAttr = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * @param {string} value
 */
const unescapeAttr = (value) => value.replace(/&quot;/g, '"').replace(/&amp;/g, '&');

/**
 * @param {string} markup
 * @param {string} name
 */
const getAttr = (markup, name) => {
	const re = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i');
	const m = re.exec(markup);
	return m ? unescapeAttr(m[1].trim()) : null;
};

/** known tag → built-in type mapping */
const TAG_TYPE = /** @type {Record<string, string>} */ ({
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
});

// ---- split top-level blocks -------------------------------------------------

/**
 * Extract top-level blocks (elements and script tags) from raw markup.
 * Uses a flat regex: each top-level tag (svg, h1-6, div, etc. or script) is
 * captured with its full content up to its matching closing tag.
 * @param {string} src
 */
const splitBlocks = (src) => {
	const blocks = [];
	/** @type {RegExp} */
	const blockRe = /<(\/?)([a-zA-Z][^\s/>]*)([\s\S]*?)>/g;
	/** @type {RegExp} */
	const closeRe = /<\/(script|svg|h[1-6]|div|p|span|section|article|main|aside|header|footer|nav|button|a|img|input|textarea|select|label|form|ul|ol|li|component)\s*>/gi;

	const openTagRe = /<([a-zA-Z][^\s/>]*)([\s\S]*?)>/;

	let copy = src;

	while (copy.length > 0) {
		// Try to match a script block
		const scriptMatch = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/i.exec(copy);
		let scriptPos = scriptMatch ? scriptMatch.index : -1;

		// Try to match the first top-level opening tag
		const topLevelRe = /<(svg|h[1-6]|div|p|span|section|article|main|aside|header|footer|nav|button|a|img|input|textarea|select|label|form|ul|ol|li)\b([^>]*)>/i;
		const elemMatch = topLevelRe.exec(copy);
		let elemPos = elemMatch ? elemMatch.index : -1;

		// If nothing found, stop
		if (scriptPos === -1 && elemPos === -1) break;

		// Pick the earliest match
		if (scriptPos !== -1 && (scriptPos < elemPos || elemPos === -1)) {
			// Loose text before the script
			const before = copy.slice(0, scriptPos).trim();
			if (before) { /* ignore loose text */ }
			const tag = scriptMatch[0];
			blocks.push({ type: 'script', raw: tag, content: scriptMatch[2].trim() });
			copy = copy.slice(scriptPos + tag.length);
			continue;
		}

		// Loose text before the element
		const before = copy.slice(0, elemPos).trim();
		if (before) { /* ignore loose text */ }

		const tagName = elemMatch[1].toLowerCase();
		const openingMatch = copy.slice(elemPos);
		const startTagMatch = openingMatch.match(openTagRe);
		if (!startTagMatch) { copy = copy.slice(elemPos + 1); continue; }
		const fullStart = startTagMatch[0];

		// Check if self-closing (<tag ... />)
		if (/\/\s*>$/.test(fullStart.trim())) {
			blocks.push({ type: 'element', raw: fullStart });
			copy = copy.slice(elemPos + fullStart.length);
			continue;
		}

		// Find the matching closing tag
		const endRe = new RegExp(`<\\/${tagName}\\s*>`, 'i');
		const rest = openingMatch.slice(fullStart.length);
		const endMatch = rest.match(endRe);
		if (endMatch) {
			const block = openingMatch.slice(0, fullStart.length + endMatch.index + endMatch[0].length);
			blocks.push({ type: 'element', raw: block });
			copy = copy.slice(elemPos + block.length);
		} else {
			// No closing tag — push the opening tag as-is
			blocks.push({ type: 'element', raw: fullStart });
			copy = copy.slice(elemPos + fullStart.length);
		}
	}

	return blocks;
};

// ---- anime.js detection -----------------------------------------------------

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
	if (easeM) obj.easing = JSON.parse(easeM[1]);

	// extract loop
	const loopM = /loop\s*:\s*(true|false|\d+)/.exec(raw);
	if (loopM) {
		obj.loop = loopM[1] === 'true' ? true : loopM[1] === 'false' ? false : Number(loopM[1]);
	}

	// extract direction
	const dirM = /direction\s*:\s*('[^']*'|"[^"]*")/.exec(raw);
	if (dirM) obj.direction = JSON.parse(dirM[1]);

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
	const blocks = splitBlocks(src);
	/** @type {ElementBlock[]} */
	const elements = [];
	/** @type {AnimeBlock[]} */
	const scripts = [];

	for (const block of blocks) {
		if (block.type === 'script') {
			const body = block.content;

			// detect anime call(s)
			const animeCalls = parseAnimeCalls(body);
			for (const call of animeCalls) {
				scripts.push({ source: body, ...call });
			}
			continue;
		}

		// element block
		const m = /<([a-zA-Z][^\s/>]*)/.exec(block.raw);
		if (!m) continue;
		const tag = m[1].toLowerCase();
		const title = getAttr(block.raw, 'data-element-title') ?? '';
		const type = getAttr(block.raw, 'data-element-type') ?? TAG_TYPE[tag] ?? 'component';
		const id = getAttr(block.raw, 'data-element-id');
		const value = { [tag]: block.raw };

		elements.push({ tag, markup: block.raw, title, type, id, value });
	}

	// If no anime calls were found in <script> blocks but a script still
	// exists, push it as a raw script block
	if (scripts.length === 0) {
		for (const block of blocks) {
			if (block.type === 'script' && block.content.trim()) {
				scripts.push({
					source: block.content,
					type: 'animate',
					typeValue: {},
					util: null,
					utilValue: null
				});
			}
		}
	}

	return { elements, scripts };
}