<script>
	import TLN from '$lib/utils/tln.js';
	import '$lib/utils/tln.css';
	let { data } = $props();

	const getSvg = (/** @type {any} */ element) => {
		const value = element?.value;
		return value && value.svg ? String(value.svg) : '';
	};

	const shortId = (/** @type {string} */ id) => (id ? id.slice(0, 8) : '—');

	let selectedId = $state(/** @type {string|null} */ (null));
	let code = $state('');

	/** @param {HTMLTextAreaElement} element */
	const initTln = (element) => {
		element.id = 'editor';
		TLN.append_line_numbers('editor');
		return {
			destroy() { try { TLN.remove_line_numbers('editor'); } catch { /* ok */ } }
		};
	};

	$effect(() => {
		if (selectedId === null && data.elements.length > 0) {
			selectedId = data.elements[0].id;
			code = getSvg(data.elements[0]);
		}
	});

	$effect(function refreshTln() {
		if (selectedId) {
			TLN.remove_line_numbers('editor');
			TLN.append_line_numbers('editor');
		}
	});

	const selectElement = (/** @type {any} */ element) => {
		selectedId = element.id;
		code = getSvg(element);
	};

	const selectedElement = $derived(
		/** @type {any} */ (data.elements.find((/** @type {any} */ e) => e.id === selectedId) ?? null)
	);

	const previewDoc = $derived(
		`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*,*::after,*::before{margin:0;padding:0;box-sizing:border-box}</style>
<script src="https://cdn.jsdelivr.net/npm/animejs@3/lib/anime.min.js"><\/script>
<script>const{animate}=anime<\/script>
</head>
<body>${code}</body>
</html>`
	);
</script>

<div class="flex h-screen flex-col bg-black text-gray-100">
	<div class="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3">
		<div class="flex items-center gap-3">
			<h1 class="text-sm font-semibold text-white">Canvas | {data.frame.title}</h1>
		</div>
		<div class="flex items-center gap-3">
			<button class="btn-primary text-xs">Export</button>
		</div>
	</div>

	{#if data.elements.length === 0}
		<div class="flex flex-1 items-center justify-center">
			<div class="rounded-2xl border border-white/10 bg-gray-950 p-10 text-center">
				<p class="text-lg font-medium text-gray-200">No elements on this canvas yet</p>
				<p class="mt-1 text-sm text-gray-500">
					Run <code class="rounded bg-gray-900 px-1.5 py-0.5 text-gray-300">npm run db:seed</code> to populate.
				</p>
			</div>
		</div>
	{:else}
		<div class="flex flex-1 overflow-hidden">
			<section class="flex w-1/3 flex-col border-r border-white/10">
				<div class="flex shrink-0 items-center justify-between border-b border-white/10 bg-gray-950 px-5 py-2.5">
					<h2 class="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Code editor</h2>
				</div>
				<div class="flex flex-1">
					<textarea
						use:initTln
						bind:value={code}
						wrap="off"
						spellcheck="false"
						class="flex-1 resize-none bg-black py-2 font-mono text-xs leading-relaxed text-gray-200 placeholder-gray-600 focus:outline-none whitespace-pre"
						placeholder="<svg>…</svg>"
					></textarea>
				</div>
			</section>

			<section class="flex w-2/3 flex-col">
				<div class="flex shrink-0 items-center justify-between border-b border-white/10 bg-gray-950 px-5 py-2.5">
					<h2 class="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Preview</h2>
					<span class="font-mono text-[11px] text-gray-600">live</span>
				</div>
				<iframe title="Preview" srcdoc={previewDoc} class="flex-1 bg-white"></iframe>
			</section>
		</div>
	{/if}
</div>
