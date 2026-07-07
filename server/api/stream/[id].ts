import { eq } from 'drizzle-orm'
import { assets } from '../../database/schema'
import { useDb } from '../../utils/db'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id || id === 'undefined') {
        throw createError({ statusCode: 400, message: 'Invalid Asset ID' })
    }

    const db = useDb()
    const [asset] = await db.select().from(assets).where(eq(assets.id, id)).limit(1)

    if (!asset) {
        throw createError({ statusCode: 404, message: 'Asset not found' })
    }

    const { storageKey, mimeType } = asset

    // 1. Grab the exact range the browser wants
    const rangeHeader = getHeader(event, 'range') || 'bytes=0-'

    const config = useRuntimeConfig()
    const s3 = new S3Client({
        region: 'auto',
        endpoint: config.r2EndpointUrl,
        credentials: {
            accessKeyId: config.r2AccessKeyId,
            secretAccessKey: config.r2SecretAccessKey,
        },
    })

    try {
        // 2. Request the exact range directly from Cloudflare R2
        const command = new GetObjectCommand({
            Bucket: config.r2BucketName,
            Key: storageKey,
            Range: rangeHeader, // Pass the browser's request straight through
        })

        const r2Response = await s3.send(command)

        // 3. Extract the REAL metrics directly from Cloudflare's storage layer
        const actualContentRange = r2Response.ContentRange // e.g., "bytes 0-5494537/5494538"
        const actualContentLength = r2Response.ContentLength // Real chunk size

        // 4. Set headers using Cloudflare's real-time file truths
        setResponseStatus(event, 206)
        setResponseHeader(event, 'Accept-Ranges', 'bytes')
        if (actualContentRange) setResponseHeader(event, 'Content-Range', actualContentRange)
        if (actualContentLength) setResponseHeader(event, 'Content-Length', actualContentLength)
        setResponseHeader(event, 'Content-Type', mimeType || 'video/mp4')

        if (r2Response.Body) {
            return sendStream(event, (r2Response.Body as any).transformToWebStream())
        }
    } catch (error: any) {
        // Catch-all for any formatting or range slip-ups
        if (error.name === 'InvalidRange' || error.$metadata?.httpStatusCode === 416) {
            setResponseStatus(event, 416)
            return { message: 'Requested range out of bounds' }
        }
        throw error
    }

    throw createError({ statusCode: 500, message: 'Stream initialization failed' })
})