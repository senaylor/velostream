// velostream/server/api/assets/[id].ts
import { eq } from 'drizzle-orm'
import { assets } from '../../database/schema'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    //Catch non-well formed id value
    if (!id || id === 'undefined') {
        throw createError({
                statusCode: 400,
                statusMessage: 'No such Route ID found',
                message: 'Valid ID required',
            })
        }

    const db = useDb()

    const result = await db.select()
        .from(assets)
        .where(eq(assets.id, id))
        .limit(1)

    const asset = result[0]

    if (!asset) {
        throw createError({
            statusCode: 404,
            message: 'Asset catalog entry missing'
        })
    }

    return asset
})