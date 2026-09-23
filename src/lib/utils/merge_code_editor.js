/**
 * Merge all elements of a canvas plus its animejs records into ONE code
 * editor document: each element's markup in `order`, then a single
 * <script> block rebuilt from the animejs rows.
 *
 * Every emitted element block carries data-element-id / data-element-title /
 * data-element-type so saving can match blocks back to their records.
 *
 * @param {Array<any>} elements  Element rows ({ id, title, type, value, order })
 * @param {Array<any>} animeRecords  Animejs rows ({ typeValue })
 * @returns {string} Merged editor content
 */
export function mergeCodeEditor(elements, animeRecords) {
	const sorted = [...(elements ?? [])].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
	const blocks = [];

	for (const el of sorted) {
		const markup = markupOf(el);
		if (!markup.trim()) continue;
		blocks.push(
			withDataAttrs(markup, {
				'data-element-id': el.id,
				'data-element-title': el.title ?? '',
				'data-element-type': el.type ?? ''
			})
		);
	}

	const calls = (animeRecords ?? [])
		.map((row) => {
			let tv = row?.typeValue;
			if (typeof tv === 'string') {
				try { tv = JSON.parse(tv); } catch { tv = null; }
			}
			return stringifyAnimeCall(tv);
		})
		.filter(Boolean);
	if (calls.length > 0) {
		blocks.push(`<script>\n${calls.join('\n')}\n</script>`);
	}

	return blocks.join('\n\n');
}

/**
 * @param {any} element
 * @returns {string}
 */
const markupOf = (element) => {
	const value = element?.value;
	if (!value || typeof value !== 'object') return '';
	for (const key of [element?.type, 'svg', 'html']) {
		if (typeof key === 'string' && typeof value[key] === 'string' && value[key].trim()) {
			return value[key];
		}
	}
	const first = Object.values(value).find((v) => typeof v === 'string' && v.trim());
	return typeof first === 'string' ? first : '';
};

/** @param {string} value */
const escapeAttr = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * @param {string} markup
 * @param {Record<string, string>} attrs
 */
const withDataAttrs = (markup, attrs) => {
	const tagMatch = /<[a-zA-Z][^\s/>]*[^>]*>/.exec(markup ?? '');
	if (!tagMatch) return markup;
	let tag = tagMatch[0];
	for (const [name, raw] of Object.entries(attrs)) {
		const safe = escapeAttr(String(raw ?? ''));
		const attrRe = new RegExp(`(\\b${name}\\s*=\\s*")[^"]*(")`);
		tag = attrRe.test(tag)
			? tag.replace(attrRe, `$1${safe}$2`)
			: tag.replace(/<([a-zA-Z][^\s/>]*)/, `<$1 ${name}="${safe}"`);
	}
	return markup.replace(tagMatch[0], tag);
};

/** @param {any} value @returns {string} */
const fmtJsValue = (value) => {
	// Raw JS expression (e.g. utils.round(0)) — output unquoted
	if (value && typeof value === 'object' && '__expr' in value) {
		return String(value.__expr);
	}
	if (typeof value === 'string') {
		return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
	}
	if (Array.isArray(value)) {
		return `[${value.map(fmtJsValue).join(', ')}]`;
	}
	if (value && typeof value === 'object') {
		return `{ ${Object.entries(value)
			.map(([k, v]) => `${k}: ${fmtJsValue(v)}`)
			.join(', ')} }`;
	}
	return String(value);
};

/** @param {any} typeValue */
const stringifyAnimeCall = (typeValue) => {
	if (!typeValue || typeof typeValue !== 'object') return '';

	// Preserve animate(targets, {params}) syntax
	if (typeValue._callStyle === 'animate') {
		const targets = typeValue.targets;
		const rest = { ...typeValue };
		delete rest.targets;
		delete rest._callStyle;
		const body = Object.entries(rest)
			.map(([key, value]) => `    ${key}: ${fmtJsValue(value)}`)
			.join(',\n');
		if (!body) return '';
		return `  animate(${fmtJsValue(targets)}, {\n${body}\n  });`;
	}

	// Default anime({...}) format
	const body = Object.entries(typeValue)
		.map(([key, value]) => `    ${key}: ${fmtJsValue(value)}`)
		.join(',\n');
	if (!body) return '';
	return `  anime({\n${body}\n  });`;
};
