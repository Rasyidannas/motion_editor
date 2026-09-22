import { db } from '$lib/server/db';
import { frames, elements } from '$lib/server/db/schema';

export async function load() {
	const allFrames = await db.select().from(frames);
	const allElements = await db.select().from(elements);
	return { frames: allFrames, elements: allElements };
}
