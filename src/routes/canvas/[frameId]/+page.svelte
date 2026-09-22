<script>
	let { data } = $props();

	/** @param {any} value */
	const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');
	/** @param {any} id */
	const shortId = (id) => (id ? String(id).slice(0, 8) : '—');
</script>

<div class="min-h-screen bg-black text-gray-100">
	<div class="mx-auto max-w-6xl px-6 py-10">
		<a href="/dashboard" class="text-sm text-gray-400 transition hover:text-white">← Back to frames</a>

		<header class="mt-3 flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Canvas</p>
				<h1 class="mt-1 text-3xl font-bold tracking-tight text-white">{data.frame.title}</h1>
				<p class="mt-1 font-mono text-xs text-gray-500">
					{shortId(data.frame.id)} · updated {formatDate(data.frame.updatedAt)}
				</p>
			</div>
			<span class="rounded-full border border-white/20 bg-gray-950 px-3 py-1 text-xs font-medium text-gray-200">
				{data.elements.length} {data.elements.length === 1 ? 'element' : 'elements'}
			</span>
		</header>

		<div class="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
			<section class="overflow-hidden rounded-2xl border border-white/10 bg-gray-950">
				<div class="border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
					Stage
				</div>
				{#if data.elements.length === 0}
					<p class="px-5 py-10 text-center text-sm text-gray-500">No elements on this canvas yet.</p>
				{:else}
					<div class="flex min-h-96 flex-wrap content-start items-start gap-4 p-5">
						{#each data.elements as element}
							{@const value = /** @type {any} */ (element.value)}
							{#if value && value.svg}
								<div class="flex items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black p-2 [&>svg]:max-h-40 [&>svg]:w-auto">
									{@html value.svg}
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</section>

			<aside class="h-fit rounded-2xl border border-white/10 bg-gray-950 p-5">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400">Layers</h2>
				{#if data.elements.length === 0}
					<p class="mt-3 text-sm text-gray-500">Nothing here yet.</p>
				{:else}
					<ul class="mt-3 space-y-2">
						{#each data.elements as element}
							<li class="flex items-center justify-between gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm">
								<span class="truncate text-gray-200">{element.title}</span>
								<span class="shrink-0 rounded-full bg-secondary/30 px-2 py-0.5 font-mono text-[11px] text-gray-300">
									{element.type}
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</aside>
		</div>
	</div>
</div>
