import { writable, derived, get } from 'svelte/store';
import { tick } from 'svelte';
import TLN from '$lib/utils/tln.js';
import '$lib/utils/tln.css';

/** @param {string} value */
const escapeAttr = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** @param {string} value */
const unescapeAttr = (value) => value.replace(/&quot;/g, '"').replace(/&amp;/g, '&');

/**
 * @param {string} svg
 * @param {string} name
 * @param {string} value
 */
const ensureSvgAttr = (svg, name, value) => {
	if (!svg) return svg;
	const safe = escapeAttr(value);
	const present = new RegExp(`\\b${name}\\s*=\\s*"`);
	if (present.test(svg)) {
		return svg.replace(new RegExp(`(\\b${name}\\s*=\\s*")[^"]*(")`), `$1${safe}$2`);
	}
	return svg.replace(/<svg\b/i, `<svg ${name}="${safe}"`);
};

/**
 * @param {string} svg
 * @param {string} name
 */
const parseSvgAttr = (svg, name) => {
	const match = new RegExp(`<svg\\b[^>]*\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(svg ?? '');
	return match ? unescapeAttr(match[1]) : null;
};

/** @param {string} id */
export const shortId = (id) => (id ? String(id).slice(0, 8) : '—');

/** @param {any} value */
export const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');

/**
 * @param {{ frame: any, elements: any[], elementTypes?: string[] }} serverData
 */
export function createCanvasView(serverData) {
	const selectedId = writable(/** @type {string | null} */ (null));
	const code = writable('');
	const titleOverrides = writable(/** @type {Record<string, string>} */ ({}));
	const typeOverrides = writable(/** @type {Record<string, string>} */ ({}));
	const saving = writable(false);
	const saveError = writable('');
	const justSaved = writable(false);

	const selectedElement = derived(selectedId, (/** @type {string | null} */ $id) =>
		/** @type {any} */ (serverData.elements.find((/** @type {any} */ e) => e.id === $id) ?? null)
	);

	const previewDoc = derived(code, (/** @type {string} */ $code) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*,*::after,*::before{margin:0;padding:0;box-sizing:border-box}</style>
<script src="https://cdn.jsdelivr.net/npm/animejs@3/lib/anime.min.js"><\/script>
<script>const{animate}=anime<\/script>
</head>
<body>${$code}</body>
</html>`);

	/** @param {any} element */
	const rawSvg = (element) => {
		const value = element?.value;
		return value && value.svg ? String(value.svg) : '';
	};

	/** @param {any} element */
	const resolveTitle = (element) => get(titleOverrides)[element.id] ?? element.title;

	/** @param {any} element */
	const resolveType = (element) => get(typeOverrides)[element.id] ?? element.type;

	/** @param {any} element */
	const getSvg = (element) =>
		ensureSvgAttr(
			ensureSvgAttr(
				ensureSvgAttr(rawSvg(element), 'data-element-title', resolveTitle(element)),
				'data-element-type',
				resolveType(element)
			),
			'data-element-id',
			element.id
		);

	/** @param {HTMLTextAreaElement} node */
	const initTln = (node) => {
		node.id = 'editor';
		TLN.append_line_numbers('editor');
		return {
			destroy() {
				try {
					TLN.remove_line_numbers('editor');
				} catch {
					/* ok */
				}
			}
		};
	};

	/** @param {any} element */
	const selectElement = (element) => {
		selectedId.set(element.id);
		code.set(getSvg(element));
		saveError.set('');
		justSaved.set(false);
	};

	const saveElement = async () => {
		const $selectedId = get(selectedId);
		const $selectedElement = get(selectedElement);
		if (!$selectedId || !$selectedElement) return;
		saveError.set('');
		justSaved.set(false);
		try {
			const $code = get(code);
			const parsedTitle = parseSvgAttr($code, 'data-element-title');
			const parsedType = parseSvgAttr($code, 'data-element-type');
			const parsedId = parseSvgAttr($code, 'data-element-id');
			if (parsedId !== null && parsedId !== $selectedId) {
				throw new Error('Changing data-element-id is not allowed. It identifies this element in the database.');
			}
			if (parsedTitle === null) {
				throw new Error('Add data-element-title="..." to the <svg> tag to rename this element.');
			}
			if (!parsedTitle.trim()) {
				throw new Error('Title must not be empty.');
			}
			const allowedTypes = Array.isArray(serverData.elementTypes) ? serverData.elementTypes : [];
			if (
				parsedType !== null &&
				allowedTypes.length > 0 &&
				!/** @type {readonly string[]} */ (allowedTypes).includes(parsedType.trim())
			) {
				throw new Error(`Invalid type. Must be one of: ${allowedTypes.join(', ')}.`);
			}
			/** @type {{ title?: string, type?: string }} */
			const patch = {};
			if (parsedTitle.trim() !== resolveTitle($selectedElement)) {
				patch.title = parsedTitle.trim();
			}
			if (parsedType !== null && parsedType.trim() !== resolveType($selectedElement)) {
				patch.type = parsedType.trim();
			}
			if (patch.title === undefined && patch.type === undefined) {
				justSaved.set(true);
				setTimeout(() => justSaved.set(false), 2000);
				return;
			}
			saving.set(true);
			const res = await fetch(`/api/elements/${$selectedId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(patch)
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body?.error ?? 'Failed to save element');
			}
			if (patch.title !== undefined) {
				const nextTitle = patch.title;
				titleOverrides.update((/** @type {Record<string, string>} */ o) => ({ ...o, [$selectedId]: nextTitle }));
			}
			if (patch.type !== undefined) {
				const nextType = patch.type;
				typeOverrides.update((/** @type {Record<string, string>} */ o) => ({ ...o, [$selectedId]: nextType }));
			}
			justSaved.set(true);
			setTimeout(() => justSaved.set(false), 2000);
		} catch (/** @type {any} */ err) {
			saveError.set(err?.message ?? 'Failed to save element');
		} finally {
			saving.set(false);
		}
	};

	// Initial selection from server data.
	if (serverData.elements.length > 0) {
		selectedId.set(serverData.elements[0].id);
		code.set(getSvg(serverData.elements[0]));
	}

	// Keep TLN line numbers in sync after switching elements (post-render).
	let firstSelection = true;
	const unsubscribeSelection = selectedId.subscribe((/** @type {string | null} */ $id) => {
		if (!$id) return;
		if (firstSelection) {
			firstSelection = false;
			return;
		}
		tick().then(() => {
			const ta = document.getElementById('editor');
			const wrapper = ta?.previousSibling;
			if (ta && wrapper instanceof HTMLElement && wrapper.classList.contains('tln-wrapper')) {
				TLN.update_line_numbers(ta, wrapper);
			}
		});
	});

	return {
		frame: serverData.frame,
		elements: serverData.elements,
		selectedId,
		code,
		titleOverrides,
		typeOverrides,
		saving,
		saveError,
		justSaved,
		selectedElement,
		previewDoc,
		selectElement,
		saveElement,
		initTln,
		destroy() {
			unsubscribeSelection();
		}
	};
}
