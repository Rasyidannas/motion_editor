<script>
	let { data } = $props();

	/** @param {any} value */
	const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');
	/** @param {any} id */
	const shortId = (id) => (id ? String(id).slice(0, 8) : '—');
</script>

<div class="min-h-screen bg-black text-gray-100">
	<div class="mx-auto max-w-5xl px-6 py-10">
		<header class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Motion Editor</p>
				<h1 class="mt-1 text-3xl font-bold tracking-tight text-white">Frames</h1>
				<p class="mt-1 text-sm text-gray-400">
					{data.totalFrames} {data.totalFrames === 1 ? 'frame' : 'frames'}
				</p>
			</div>
		</header>

		{#if data.frames.length === 0}
			<div class="mt-10 rounded-2xl border border-white/10 bg-gray-950 p-10 text-center">
				<p class="text-lg font-medium text-gray-200">No frames yet</p>
				<p class="mt-1 text-sm text-gray-500">
					Run <code class="rounded bg-gray-900 px-1.5 py-0.5 text-gray-300">npm run db:seed</code> to populate demo data.
				</p>
			</div>
		{:else}
			<div class="mt-8 space-y-4">
				{#each data.frames as frame}
					<a
						href={`/canvas/${frame.id}`}
						class="block overflow-hidden rounded-2xl border border-white/10 bg-gray-950 transition hover:border-white/25"
					>
						<div class="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-primary to-secondary px-5 py-4">
							<div>
								<h2 class="text-lg font-semibold text-white">{frame.title}</h2>
								<p class="mt-0.5 font-mono text-xs text-gray-400">
									{shortId(frame.id)} · updated {formatDate(frame.updatedAt)}
								</p>
							</div>
						</div>
						<p class="px-5 py-4 font-mono text-[11px] text-gray-500">
							created {formatDate(frame.createdAt)}
						</p>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
