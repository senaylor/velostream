import { eq, desc } from 'drizzle-orm'
import { assets } from '../../database/schema'
import { useDb } from '../../utils/db'
import * as events from "node:events";

export default defineEventHandler(async (event) => {
    const db = useDb()

    //Grab the latest release asset where status is 'ready'
    const record = await db
        .select()
        .from(assets)
        .where(eq(assets.status, 'ready'))
        .orderBy(desc(assets.createdAt))
        .limit(1)
        .then(res => res[0])

    if (!record) {
        //if no videos are ready yet return an explicit marker or empty object
        return { noAssets: true }
    }

    return record
})