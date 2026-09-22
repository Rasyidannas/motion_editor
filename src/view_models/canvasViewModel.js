import { db } from '$lib/server/db';
import { frames, elements } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function readCanvas(/** @type {string} */ frameId) {
	const found = await db.select().from(frames).where(eq(frames.id, frameId));

	if (found.length === 0) {
		throw error(404, 'Frame not found');
	}

	const frameElements = await db.select().from(elements).where(eq(elements.frameId, frameId));

	return {
		frame: found[0],
		elements: frameElements
	};
}
