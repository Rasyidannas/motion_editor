<script>
	import { onDestroy } from 'svelte';
	import { createCanvasView } from '../../../views/canvasView.js';
	let { data } = $props();

	// `data` is immutable server load data, so capturing it once here is safe.
	const view = createCanvasView(data);
	onDestroy(() => view.destroy());
	const {
		selectedId,
		code,
		elements,
		titleOverrides,
		typeOverrides,
		saving,
		saveError,
		justSaved,
		selectedElement,
		previewDoc,
		chatInput,
		chatMessages,
		chatLoading,
		lastBeforeAi
	} = view;

	let chatScroll = $state(/** @type {HTMLElement | null} */ (null));

	$effect(() => {
		$chatMessages;
		$chatLoading;
		chatScroll?.scrollTo({ top: chatScroll.scrollHeight });
	});
</script>

<div class="flex h-screen flex-col bg-black text-gray-100">
	<div class="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3">
		<div class="flex items-center gap-3">
			<h1 class="text-sm font-semibold text-white">Canvas | {view.frame.title}</h1>
		</div>
		<div class="flex items-center gap-3">
			<button class="btn-primary text-xs">Export</button>
		</div>
	</div>

	{#if $elements.length === 0}
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
					<div class="flex items-center gap-2">
						{#if $justSaved}
							<span class="font-mono text-[11px] text-emerald-400">Saved</span>
						{/if}
						<button type="button" onclick={view.saveElement} disabled={$saving || !$selectedElement} class="btn-primary shrink-0 px-3 py-1 text-xs">
							{$saving ? 'Saving…' : 'Save'}
						</button>
					</div>
				</div>
				{#if $saveError}
					<p class="shrink-0 border-b border-white/10 bg-gray-950 px-5 py-1.5 text-xs text-red-400">{$saveError}</p>
				{/if}
				<div class="flex flex-1">
					<textarea
						use:view.initTln
						bind:value={$code}
						wrap="off"
						spellcheck="false"
						class="flex-1 resize-none bg-black py-2 font-mono text-xs leading-relaxed text-gray-200 placeholder-gray-600 focus:outline-none whitespace-pre"
						placeholder="<svg>…</svg>"
					></textarea>
				</div>
			</section>

			<section class="flex min-w-0 flex-1 flex-col">
				<div class="flex shrink-0 items-center justify-between border-b border-white/10 bg-gray-950 px-5 py-2.5">
					<h2 class="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Preview</h2>
					<span class="font-mono text-[11px] text-gray-600">live</span>
				</div>
				<iframe title="Preview" srcdoc={$previewDoc} class="flex-1 bg-white"></iframe>
			</section>

			<aside class="flex w-80 shrink-0 flex-col border-l border-white/10 bg-gray-950">
				<div class="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-2.5">
					<h2 class="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">AI Assistant</h2>
					{#if $lastBeforeAi !== null}
						<button type="button" onclick={view.undoAi} class="font-mono text-[11px] text-gray-400 transition hover:text-white">
							Undo
						</button>
					{/if}
				</div>
					<div bind:this={chatScroll} class="flex-1 space-y-3 overflow-y-auto px-4 py-3">
						{#if $chatMessages.length === 0}
							<p class="text-xs leading-relaxed text-gray-500">
								Ask for an edit, e.g. “make the rect red” or “round the corners more”. The reply replaces the editor code and previews live.
							</p>
						{/if}
						{#each $chatMessages as message}
							{#if message.role === 'user'}
								<p class="ml-8 rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-2 text-xs text-white">{message.content}</p>
							{:else}
								<p class="mr-8 rounded-lg bg-gray-900 px-3 py-2 text-xs leading-relaxed text-gray-200">{message.content}</p>
							{/if}
						{/each}
						{#if $chatLoading}
							<p class="mr-8 animate-pulse rounded-lg bg-gray-900 px-3 py-2 text-xs text-gray-400">Thinking…</p>
						{/if}
					</div>
					<div class="shrink-0 border-t border-white/10 p-3">
						<textarea
							bind:value={$chatInput}
							rows="2"
							placeholder="Ask AI to edit the code… (Enter to send)"
							onkeydown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									view.sendChat();
								}
							}}
							class="w-full resize-none rounded-lg border border-white/10 bg-black px-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:border-white/25 focus:outline-none"
						></textarea>
						<button
							type="button"
							onclick={view.sendChat}
							disabled={$chatLoading || !$chatInput.trim()}
							class="btn-primary mt-2 w-full px-3 py-1.5 text-xs"
						>
							{$chatLoading ? 'Sending…' : 'Send'}
						</button>
					</div>
				</aside>
		</div>

		<section class="flex shrink-0 h-[240px] flex-col border-t border-white/10 bg-gray-950">
			<div class="flex items-center justify-between border-b border-white/10 px-5 py-2.5">
				<h2 class="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Layers</h2>
				<span class="font-mono text-[11px] text-gray-600">{$elements.length} element{$elements.length !== 1 ? 's' : ''}</span>
			</div>
			<div class="flex gap-2 overflow-x-auto px-5 py-3">
				{#each $elements as element, idx}
					<button
						type="button"
						onclick={() => view.selectElement(element)}
						class="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left transition {element.id === $selectedId
							? 'bg-gradient-to-r from-primary to-secondary text-white shadow-sm'
							: 'border border-white/10 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200'}"
					>
						<span class="flex h-5 w-5 items-center justify-center rounded bg-black/30 font-mono text-[10px] text-white">{idx + 1}</span>
						<div>
							<p class="text-xs font-medium">{$titleOverrides[element.id] ?? element.title}</p>
							<p class="font-mono text-[10px] opacity-60">{$typeOverrides[element.id] ?? element.type}</p>
						</div>
					</button>
				{/each}
			</div>
		</section>
	{/if}
</div>
