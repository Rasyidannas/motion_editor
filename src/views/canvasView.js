import { writable, derived, get } from 'svelte/store';
import { tick } from 'svelte';
import TLN from '$lib/utils/tln.js';
import '$lib/utils/tln.css';
import { parseCodeEditor } from '$lib/parser_code_editor.js';
import { mergeCodeEditor } from '$lib/utils/merge_code_editor.js';

/** @param {string} tag */
const defaultTypeForTag = (tag) => {
	if (/^h[1-6]$/.test(tag)) return 'heading';
	if (tag === 'p') return 'paragraph';
	if (tag === 'svg') return 'svg';
	return 'container';
};

/** @param {string} id */
export const shortId = (id) => (id ? String(id).slice(0, 8) : '—');

/** @param {any} value */
export const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');

/**
 * @param {{ frame: any, elements: any[], animejs?: Array<any>, elementTypes?: string[] }} serverData
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

	const previewDoc = derived(code, (/** @type {string} */ $code) => {
		// Split user code into element markup and script blocks so the
		// script content can be placed inside a <script type="module">
		// that imports animejs v4 before running.
		/** @type {string[]} */
		const scriptBodies = [];
		const bodyHtml = ($code ?? '').replace(
			/<script>([\s\S]*?)<\/script>/g,
			(/** @type {string} */ _, /** @type {string} */ inner) => {
				scriptBodies.push(inner);
				return '';
			}
		);

		return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*,*::after,*::before{margin:0;padding:0;box-sizing:border-box}</style>
<script type="module">
import {
  animate, createTimeline, createScope, createTimer, createDraggable,
  createSpring, createMotionPath, createDrawable,
  morphTo, onScroll, splitText,
  stagger, random, utils, globals, engine
} from '/animejs.esm.min.js';

// Expose every v4 export as a global so both module and non-module
// scripts in the editor can reference them directly.
window.animate         = animate;
window.createTimeline  = createTimeline;
window.createScope     = createScope;
window.createTimer     = createTimer;
window.createDraggable = createDraggable;
window.createSpring    = createSpring;
window.createMotionPath = createMotionPath;
window.createDrawable  = createDrawable;
window.morphTo         = morphTo;
window.onScroll        = onScroll;
window.splitText       = splitText;
window.stagger         = stagger;
window.random          = random;
window.utils           = utils;
window.globals         = globals;
window.__engine        = engine;

// Registry of every animation instance ever seen. The engine drops
// paused instances from its linked list, so pausing from that list
// would make a later play a no-op — our own list never drops them.
var registry = (window.__playedAnims = []);
function snapshot() {
  try {
    var child = engine._head;
    while (child) {
      if (registry.indexOf(child) === -1) registry.push(child);
      child = child._next;
    }
  } catch (err) { /* ignore */ }
}
setInterval(snapshot, 250);
snapshot();

// Direct control API — called by the parent via contentWindow.__animControl
window.__animControl = function (action) {
  try {
    snapshot();
    if (action === 'pause') registry.forEach(function (a) { if (a.pause) a.pause(); });
    if (action === 'play') registry.forEach(function (a) {
      if (!a) return;
      if (a.paused && a.play) { a.play(); return; }
      if (a.completed && a.restart) { a.restart(); return; }
      if (a.play) a.play();
    });
  } catch (err) { /* ignore */ }
};

// Forward script errors to the parent editor.
window.addEventListener('error', function (e) {
  try {
    var msg = (e.message || 'Script error') + (e.lineno ? ' (line ' + e.lineno + ')' : '');
    window.parent.postMessage({ type: 'preview-error', message: String(msg).slice(0, 300) }, '*');
  } catch (err) { /* ignore */ }
});
window.addEventListener('unhandledrejection', function (e) {
  try {
    var reason = (e.reason && (e.reason.message || e.reason)) || 'Unhandled rejection';
    window.parent.postMessage({ type: 'preview-error', message: String(reason).slice(0, 300) }, '*');
  } catch (err) { /* ignore */ }
});

// --- user anime code (extracted from the editor) ---
${scriptBodies.join('\n')}
<\/script>
</head>
<body>${bodyHtml}</body>
</html>`;
	});

	/** @param {any} element */
	const resolveTitle = (element) => get(titleOverrides)[element.id] ?? element.title;

	/** @param {any} element */
	const resolveType = (element) => get(typeOverrides)[element.id] ?? element.type;

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
	 * record exists before its children reference it.
	 * Returns the created id together with its markup (for anime targeting).
	 * @param {{ id?: string | null, tag: string, title: string, type: string, markup: string, children: Array<any> }} node
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
			body: JSON.stringify({ id: node.id, frameId, ancestorIds, title, type, value })
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(body?.error ?? `Failed to insert <${node.tag}> element`);
		}
		const created = await res.json();
		elements.update((/** @type {Array<any>} */ list) => [...list, created]);
		for (const child of node.children) {
			await insertNode(child, [...ancestorIds, /** @type {string} */ (node.id)], frameId, allowed);
		}
		return { id: created.id, markup: node.markup };
	};

	/**
	 * Store one parsed anime call in the animejs table (never elements).
	 * @param {{ type: string, typeValue: Record<string, any>, util: string | null, utilValue: any }} script
	 * @param {string} elementId
	 */
	const postAnimeScript = async (script, elementId) => {
		const res = await fetch('/api/animejs', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				elementId,
				type: script.type,
				typeValue: script.typeValue,
				util: script.util,
				utilValue: script.utilValue
			})
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(body?.error ?? 'Failed to save animation');
		}
		return res.json();
	};

	/** @param {any} element */
	const selectElement = (element) => {
		selectedId.set(element.id);
		saveError.set('');
		justSaved.set(false);
		scrollEditorTo(element.id);
	};

	/** Scroll the code editor so the block with this element id is visible. */
	const scrollEditorTo = (/** @type {string} */ id) => {
		const ta = document.getElementById('editor');
		if (!ta || !(ta instanceof HTMLTextAreaElement)) return;
		const idx = ta.value.indexOf(`data-element-id="${id}"`);
		if (idx === -1) return;
		const lines = ta.value.slice(0, idx).split('\n').length - 1;
		const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 19;
		ta.scrollTop = lines * lineHeight;
		ta.focus({ preventScroll: true });
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
		const $selectedElement = get(selectedElement);
		if (!$selectedElement) return;
		saveError.set('');
		justSaved.set(false);
		try {
			const $code = get(code);
			const allowedTypes = Array.isArray(serverData.elementTypes) ? serverData.elementTypes : [];
			const parsed = parseCodeEditor($code);
			if (parsed.elements.length === 0 && parsed.scripts.length === 0) {
				throw new Error('No elements found in the editor.');
			}
			saving.set(true);
			const frameId = $selectedElement.frameId ?? serverData.frame.id;
			const knownById = new Map(
				get(elements).map((/** @type {any} */ e) => [e.id, e])
			);
			// synced records (id + current markup) for anime target resolution
			/** @type {Array<{ id: string, markup: string }>} */
			const synced = [];
			for (const node of parsed.elements) {
				await syncNode(node, [], frameId, allowedTypes, knownById, synced);
			}
			// scripts go to the animejs table — never the elements table.
			// Refresh per targeted element so the code stays the source of truth.
			const touchedIds = new Set();
			for (const script of parsed.scripts) {
				touchedIds.add(resolveAnimeTarget(script, synced, $selectedElement.id));
			}
			for (const id of touchedIds) {
				await deleteAnimeRows(id);
			}
			for (const script of parsed.scripts) {
				await postAnimeScript(script, resolveAnimeTarget(script, synced, $selectedElement.id));
			}
			// Delete any existing DB elements that were NOT present in the editor
			// (the user removed them from the code).
			const syncedIds = new Set(synced.map((e) => e.id));
			const toDelete = get(elements).filter(
				(el) => !syncedIds.has(el.id) && el.frameId === frameId
			);
			for (const el of toDelete) {
				await fetch(`/api/elements/${el.id}`, { method: 'DELETE' });
			}
			if (toDelete.length > 0) {
				elements.update((/** @type {Array<any>} */ list) =>
					list.filter((e) => syncedIds.has(e.id) || e.frameId !== frameId)
				);
			}

			justSaved.set(true);
			setTimeout(() => justSaved.set(false), 2000);
		} catch (/** @type {any} */ err) {
			saveError.set(err?.message ?? 'Failed to save element');
		} finally {
			saving.set(false);
		}
	};

	/**
	 * Resolve an anime call to an element id via `targets: "#some-id"`,
	 * matched against synced markups. Falls back to the given element.
	 * @param {{ typeValue: Record<string, any> }} script
	 * @param {Array<{ id: string, markup: string }>} synced
	 * @param {string} fallbackId
	 */
	const resolveAnimeTarget = (script, synced, fallbackId) => {
		const rawTargets = String(script.typeValue?.targets ?? '').trim();
		const targetId = rawTargets.startsWith('#') ? rawTargets.slice(1) : null;
		if (!targetId) return fallbackId;
		const hit = synced.find(
			(entry) => entry.markup.includes(`id="${targetId}"`) || entry.markup.includes(`id='${targetId}'`)
		);
		return hit ? hit.id : fallbackId;
	};

	/**
	 * Sync one parsed node (and its subtree): update the record when its
	 * data-element-id matches a frame element, otherwise insert it.
	 * Returns the record id together with its markup.
	 * @param {{ tag: string, title: string, type: string, id: string | null, markup: string, children: Array<any> }} node
	 * @param {Array<string>} ancestorIds
	 * @param {string} frameId
	 * @param {Array<string>} allowed
	 * @param {Map<string, any>} knownById
	 * @param {Array<{ id: string, markup: string }>} synced
	 */
	const syncNode = async (node, ancestorIds, frameId, allowed, knownById, synced) => {
		const parsedId = node.id && knownById.has(node.id) ? node.id : null;
		if (parsedId) {
			const record = knownById.get(parsedId);
			const title = node.title?.trim() || resolveTitle(record);
			let type = (node.type || '').trim() || resolveType(record);
			if (allowed.length > 0 && !allowed.includes(type)) {
				throw new Error(
					`Invalid type "${type}". Must be one of: ${allowed.join(', ')}.`
				);
			}
			const value = { [type]: node.markup };
			/** @type {{ title?: string, type?: string, value?: any }} */
			const patch = {};
			if (title !== resolveTitle(record)) patch.title = title;
			if (type !== resolveType(record)) patch.type = type;
			if (JSON.stringify(value) !== JSON.stringify(storedMarkup(record))) {
				patch.value = value;
			}
			if (patch.title !== undefined || patch.type !== undefined || patch.value !== undefined) {
				await patchElement(record.id, patch);
			}
			synced.push({ id: record.id, markup: node.markup });
			for (const child of node.children) {
				await syncNode(child, [...ancestorIds, record.id], frameId, allowed, knownById, synced);
			}
			return { id: record.id, markup: node.markup };
		}
		// Unknown data-element-id — insert as new element (parser-generated
		// IDs are passed to the API so the stored markup stays consistent).
		const created = await insertNode(node, ancestorIds, frameId, allowed);
		synced.push(created);
		for (const child of node.children) {
			await syncNode(child, [...ancestorIds, created.id], frameId, allowed, knownById, synced);
		}
		return created;
	};

	/**
	 * PATCH one element record.
	 * @param {string} id
	 * @param {{ title?: string, type?: string, value?: any }} patch
	 */
	const patchElement = async (id, patch) => {
		const res = await fetch(`/api/elements/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(patch)
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(body?.error ?? 'Failed to save element');
		}
		const updated = await res.json();
		if (patch.title !== undefined) {
			const nextTitle = patch.title;
			titleOverrides.update((/** @type {Record<string, string>} */ o) => ({ ...o, [id]: nextTitle }));
		}
		if (patch.type !== undefined) {
			const nextType = patch.type;
			typeOverrides.update((/** @type {Record<string, string>} */ o) => ({ ...o, [id]: nextType }));
		}
		elements.update((/** @type {Array<any>} */ list) =>
			list.map((/** @type {any} */ e) => (e.id === id ? { ...e, ...updated } : e))
		);
		return updated;
	};

	/**
	 * Stored markup of a record (value keyed by type, legacy svg/html fallback).
	 * @param {any} record
	 */
	const storedMarkup = (record) => {
		const value = record?.value;
		if (!value || typeof value !== 'object') return '';
		for (const key of [record?.type, 'svg', 'html']) {
			if (typeof key === 'string' && typeof value[key] === 'string') return value[key];
		}
		const first = Object.values(value).find((v) => typeof v === 'string');
		return typeof first === 'string' ? first : '';
	};

	/**
	 * DELETE every animejs row linked to one element.
	 * @param {string} elementId
	 */
	const deleteAnimeRows = async (elementId) => {
		const res = await fetch('/api/animejs', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ elementId })
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(body?.error ?? 'Failed to refresh animations');
		}
	};

	// Initial selection + merged editor content (all elements + animejs script).
	if (serverData.elements.length > 0) {
		selectedId.set(serverData.elements[0].id);
	}
	code.set(mergeCodeEditor(serverData.elements, serverData.animejs ?? []));

	// Playback controls for the preview iframe. The iframe runs the user's
	// scripts (srcdoc without sandbox), plus a small runtime injected above
	// that pauses/resumes every running anime.js instance on postMessage.
	const playing = writable(true);
	const previewError = writable('');
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

	const togglePlay = () => {
		playing.update((v) => {
			const next = !v;
			try {
				const cw = /** @type {any} */ (previewNode?.contentWindow);
				if (cw && typeof cw.__animControl === 'function') {
					cw.__animControl(next ? 'play' : 'pause');
				}
			} catch {
				/* iframe not ready */
			}
			return next;
		});
	};

	// Editing code reloads the iframe, which restarts animations from scratch.
	code.subscribe(() => {
		playing.set(true);
		previewError.set('');
	});

	// Script errors inside the preview are forwarded here so silent
	// failures (a script that dies before animating anything) become visible.
	// Guarded for SSR: only registers in the browser.
	/** @param {MessageEvent} event */
	const onPreviewMessage = (event) => {
		try {
			if (event.source !== previewNode?.contentWindow) return;
			const data = event.data;
			if (data && data.type === 'preview-error' && data.message) {
				previewError.set(String(data.message));
			}
		} catch {
			/* ignore */
		}
	};
	if (typeof window !== 'undefined') {
		window.addEventListener('message', onPreviewMessage);
	}

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
		previewError,
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
			if (typeof window !== 'undefined') {
				window.removeEventListener('message', onPreviewMessage);
			}
		}
	};
}
