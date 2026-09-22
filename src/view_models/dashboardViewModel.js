import { db } from '$lib/server/db';
import { frames } from '$lib/server/db/schema';

export async function readDashboard() {
	const allFrames = await db.select().from(frames);

	return {
		frames: allFrames,
		totalFrames: allFrames.length
	};
}
