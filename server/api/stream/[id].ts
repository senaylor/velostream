// velostream/server/api/stream/[id].ts
import { eq } from 'drizzle-orm'
import { assets } from '../../database/schema'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id || id === 'undefined') {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Invalid or missing Asset UUID parameter.'
        })
    }

    const db = useDb()
    const [asset] = await db.select().from(assets).where(eq(assets.id, id)).limit(1)

    if (!asset) {
        throw createError({ statusCode: 404, message: 'Asset not found in catalog' })
    }

    // Right now, this throws a 404 because we aren't streaming a real file yet.
    // Let's return a structural confirmation to verify the route works!
    return {
        status: "Pipeline route active",
        message: "Ready to stream binary chunks from storage layer.",
        targetKey: asset.storageKey
    }
})