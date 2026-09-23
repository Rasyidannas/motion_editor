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

/**
 * Read `name="..."` from the first opening tag of any markup block.
 * @param {string} block
 * @param {string} name
 */
const parseFirstTagAttr = (block, name) => {
	const match = new RegExp(`<\\s*[a-zA-Z][^\\s/>]*[^>]*\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(
		block ?? ''
	);
	return match ? unescapeAttr(match[1]) : null;
};

/**
 * Split editor content into the leading <svg>...</svg> block (the current
 * element) and anything after it (new element content, if present).
 * @param {string} src
 */
const splitFirstSvg = (src) => {
	const match = /<svg\b[^>]*>[\s\S]*?<\/svg\s*>/i.exec(src ?? '');
	if (!match) {
		return { head: /** @type {string | null} */ (null), rest: (src ?? '').trim() };
	}
	const head = match[0];
	const rest = (src.slice(0, match.index) + src.slice(match.index + head.length)).trim();
	return { head, rest };
};

/** @param {string} tag */
const defaultTypeForTag = (tag) => {
	if (/^h[1-6]$/.test(tag)) return 'heading';
	if (tag === 'p') return 'paragraph';
	if (tag === 'svg') return 'svg';
	return 'container';
};

/**
 * Parse a markup fragment into a tree of element nodes (element children
 * only; whitespace text nodes are skipped, inline text stays in the parent).
 * @param {string} markup
 */
const parseFragment = (markup) => {
	const doc = new DOMParser().parseFromString(`<body>${markup ?? ''}</body>`, 'text/html');
	/**
	 * @param {Element} el
	 * @returns {{ tag: string, title: string, type: string, markup: string, children: Array<any> }}
	 */
	const walk = (el) => ({
		tag: el.tagName.toLowerCase(),
		title: (el.getAttribute('data-element-title') ?? '').trim(),
		type: (el.getAttribute('data-element-type') ?? '').trim(),
		markup: el.outerHTML,
		children: Array.from(el.children).map(walk)
	});
	return Array.from(doc.body.children).map(walk);
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
	const elements = writable(/** @type {Array<any>} */ ([...serverData.elements]));
	const titleOverrides = writable(/** @type {Record<string, string>} */ ({}));
	const typeOverrides = writable(/** @type {Record<string, string>} */ ({}));
	const saving = writable(false);
	const saveError = writable('');
	const justSaved = writable(false);

	const selectedElement = derived(
		[selectedId, elements],
		(/** @type {[string | null, Array<any>]} */ [$id, $list]) =>
			/** @type {any} */ ($list.find((/** @type {any} */ e) => e.id === $id) ?? null)
	);

	const previewDoc = derived(code, (/** @type {string} */ $code) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*,*::after,*::before{margin:0;padding:0;box-sizing:border-box}</style>
<script src="https://cdn.jsdelivr.net/npm/animejs@3/lib/anime.min.js"><\/script>
<script>
(function () {
  // v4-style animate() alias for the v3 global, so both APIs work.
  if (window.anime && !window.anime.animate) {
    window.anime.animate = function (targets, params) {
      return window.anime(Object.assign({ targets: targets }, params || {}));
    };
  }
  if (window.anime && !window.animate) { window.animate = window.anime.animate; }
  // Registry of every animation instance ever seen. anime.js drops paused
  // instances from anime.running, so pausing from that list would make a
  // later play a no-op — our own list never drops them.
  var registry = (window.__playedAnims = window.__playedAnims || []);
  function snapshot() {
    try {
      var running = window.anime && anime.running;
      if (!running) return;
      for (var i = 0; i < running.length; i++) {
        if (registry.indexOf(running[i]) === -1) registry.push(running[i]);
      }
    } catch (err) { /* ignore */ }
  }
  setInterval(snapshot, 250);
  snapshot();
  // Remote control from the parent editor: pause / resume every known instance.
  // Note: play() on a finished one-shot does nothing visible, so those restart.
  window.addEventListener('message', function (e) {
    try {
      var d = e.data || {};
      snapshot();
      if (d.type === 'anim-pause') registry.forEach(function (a) { if (a.pause) a.pause(); });
      if (d.type === 'anim-play') registry.forEach(function (a) {
        if (!a) return;
        if (a.paused && a.play) { a.play(); return; }
        if (a.completed && a.restart) { a.restart(); return; }
        if (a.play) a.play();
      });
    } catch (err) { /* ignore */ }
  });
})();
<\/script>
</head>
<body>${$code}</body>
</html>`);

	/** @param {any} element */
	const rawSvg = (element) => {
		const value = element?.value;
		if (!value || typeof value !== 'object') return '';
		const key = resolveType(element);
		if (typeof value[key] === 'string') return value[key];
		if (typeof value.svg === 'string') return value.svg;
		if (typeof value.html === 'string') return value.html;
		return '';
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

	/**
	 * Insert one parsed node plus its whole subtree depth-first, so every
	 * record exists before its children reference it. Returns the created id.
	 * @param {{ tag: string, title: string, type: string, markup: string, children: Array<any> }} node
	 * @param {Array<string>} ancestorIds
	 * @param {string} frameId
	 * @param {Array<string>} allowed
	 */
	const insertNode = async (node, ancestorIds, frameId, allowed) => {
		const title = node.title || `Untitled ${node.tag}`;
		let type = node.type;
		if (!type || (allowed.length > 0 && !allowed.includes(type))) {
			type = defaultTypeForTag(node.tag);
		}
		if (allowed.length > 0 && !allowed.includes(type)) {
			type = allowed.includes('container') ? 'container' : allowed[0];
		}
		const value = { [type]: node.markup };
		const res = await fetch('/api/elements', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ frameId, ancestorIds, title, type, value })
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(body?.error ?? `Failed to insert <${node.tag}> element`);
		}
		const created = await res.json();
		elements.update((/** @type {Array<any>} */ list) => [...list, created]);
		for (const child of node.children) {
			await insertNode(child, [...ancestorIds, created.id], frameId, allowed);
		}
		return created.id;
	};

	/** @param {any} element */
	const selectElement = (element) => {
		selectedId.set(element.id);
		code.set(getSvg(element));
		saveError.set('');
		justSaved.set(false);
	};

	const syncTln = async () => {
		await tick();
		const ta = document.getElementById('editor');
		const wrapper = ta?.previousSibling;
		if (ta && wrapper instanceof HTMLElement && wrapper.classList.contains('tln-wrapper')) {
			TLN.update_line_numbers(ta, wrapper);
		}
	};

	const chatInput = writable('');
	const chatMessages = writable(/** @type {Array<{ role: string, content: string }>} */ ([]));
	const chatLoading = writable(false);
	const lastBeforeAi = writable(/** @type {string | null} */ (null));

	const sendChat = async () => {
		const input = get(chatInput).trim();
		if (!input || get(chatLoading)) return;
		const $code = get(code);
		const $selectedElement = get(selectedElement);
		chatMessages.update((m) => [...m, { role: 'user', content: input }]);
		chatInput.set('');
		chatLoading.set(true);
		try {
			const res = await fetch('/api/ai/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: input,
					code: $code,
					title: $selectedElement ? resolveTitle($selectedElement) : '',
					type: $selectedElement ? resolveType($selectedElement) : ''
				})
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(body?.error ?? 'AI request failed');
			}
			if (!body?.code) {
				throw new Error('The AI returned no code.');
			}
			lastBeforeAi.set($code);
			code.set(String(body.code));
			await syncTln();
			chatMessages.update((m) => [...m, { role: 'assistant', content: body.note ?? 'Code updated.' }]);
		} catch (/** @type {any} */ err) {
			chatMessages.update((m) => [
				...m,
				{ role: 'assistant', content: `Error: ${err?.message ?? 'AI request failed'}` }
			]);
		} finally {
			chatLoading.set(false);
		}
	};

	const undoAi = () => {
		const prev = get(lastBeforeAi);
		if (prev === null) return;
		code.set(prev);
		lastBeforeAi.set(null);
		syncTln();
	};

	const saveElement = async () => {
		const $selectedId = get(selectedId);
		const $selectedElement = get(selectedElement);
		if (!$selectedId || !$selectedElement) return;
		saveError.set('');
		justSaved.set(false);
		try {
			const $code = get(code);
			const { head, rest } = splitFirstSvg($code);
			if (!head) {
				throw new Error('No <svg>...</svg> block found. Keep the element markup in the editor.');
			}
			const parsedTitle = parseSvgAttr(head, 'data-element-title');
			const parsedType = parseSvgAttr(head, 'data-element-type');
			const parsedId = parseSvgAttr(head, 'data-element-id');
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
			if (patch.title !== undefined || patch.type !== undefined) {
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
			}
			if (rest) {
				const nodes = parseFragment(rest);
				if (nodes.length === 0) {
					throw new Error('No HTML elements found after the <svg> block.');
				}
				saving.set(true);
				for (const node of nodes) {
					await insertNode(node, [$selectedId], $selectedElement.frameId, allowedTypes);
				}
				code.set(head);
				await syncTln();
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

	// Playback controls for the preview iframe. The iframe runs the user's
	// scripts (srcdoc without sandbox), plus a small runtime injected above
	// that pauses/resumes every running anime.js instance on postMessage.
	const playing = writable(true);
	/** @type {HTMLIFrameElement | null} */
	let previewNode = null;

	/** @param {HTMLIFrameElement} node */
	const attachPreview = (node) => {
		previewNode = node;
		return {
			destroy() {
				if (previewNode === node) previewNode = null;
			}
		};
	};

	/** @param {{ type: string }} msg */
	const postToPreview = (msg) => {
		try {
			previewNode?.contentWindow?.postMessage(msg, '*');
		} catch {
			/* iframe not ready yet */
		}
	};

	const togglePlay = () => {
		playing.update((v) => {
			const next = !v;
			postToPreview({ type: next ? 'anim-play' : 'anim-pause' });
			return next;
		});
	};

	// Editing code reloads the iframe, which restarts animations from scratch.
	code.subscribe(() => {
		playing.set(true);
	});

	// Keep TLN line numbers in sync after switching elements (post-render).
	let firstSelection = true;
	const unsubscribeSelection = selectedId.subscribe((/** @type {string | null} */ $id) => {
		if (!$id) return;
		if (firstSelection) {
			firstSelection = false;
			return;
		}
		syncTln();
	});

	return {
		frame: serverData.frame,
		elements,
		selectedId,
		code,
		titleOverrides,
		typeOverrides,
		saving,
		saveError,
		justSaved,
		selectedElement,
		previewDoc,
		playing,
		selectElement,
		saveElement,
		initTln,
		attachPreview,
		togglePlay,
		chatInput,
		chatMessages,
		chatLoading,
		lastBeforeAi,
		sendChat,
		undoAi,
		destroy() {
			unsubscribeSelection();
		}
	};
}
