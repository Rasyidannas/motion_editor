<script>
	let { data } = $props();
</script>

<h1>Dashboard</h1>

<h2>Frames</h2>
{#each data.frames as frame}
	<div>
		<strong>{frame.title}</strong> ({frame.id})
	</div>
{/each}

<h2>Elements</h2>
{#each data.elements as element}
	{@const value = /** @type {any} */ (element.value)}
	<div>
		<strong>{element.title}</strong> — type: {element.type}
		{#if value && value.svg}
			{@html value.svg}
		{/if}
	</div>
{/each}

{#if data.frames.length === 0 && data.elements.length === 0}
	<p>No data yet. Run <code>npm run db:seed</code> to populate.</p>
{/if}
