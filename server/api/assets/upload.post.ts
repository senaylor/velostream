import fs from 'fs'
import path from 'path'
import os from 'os'
import { randomUUID } from 'crypto'
import { assets } from '../../database/schema'
import { useDb } from '../../utils/db'
import {
    processAndUploadVideo
} from '../../utils/transcoder'

export default defineEventHandler(async (event) => {
    const db = useDb()

    // Parse the incoming multi-part form data
    const formFiles = await readMultipartFormData(event)

    if (!formFiles || formFiles.length === 0) {
        throw createError({
            statusCode: 400,
            message: 'No upload payload detected.'
        })
    }

    // Pull out the file field, title, and description
    const fileData = formFiles.find(
        (item) => item.name === 'video'
    )
    const titleData = formFiles.find(
        (item) => item.name === 'title'
    )
    const descData = formFiles.find(
        (item) => item.name === 'description'
    )

    if (!fileData || !fileData.data) {
        throw createError({
            statusCode: 400,
            message: 'Video binary data is missing.'
        })
    }

    const title = titleData?.data.toString() || 'Untitled'
    const description = descData?.data.toString() || ''
    const filename = fileData.filename || 'movie.mp4'

    // 2. Provision a clean UUID for the database record
    const newAssetId = randomUUID()

    // 3. Drop the binary buffer onto the local disk temp space
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(
        tempDir,
        `${newAssetId}-${filename}`
    )

    fs.writeFileSync(tempFilePath, fileData.data)

    await db.insert(assets).values({
        id: newAssetId,
        title: title,
        description: description,
        type: 'video',
        storageKey: `pending/${newAssetId}`,
        fileSize: 0,
        mimeType: fileData.type || 'video/mp4',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    // 5. CRITICAL STEP: Fire the background worker WITHOUT using "await"!
    // By omitting "await", Node.js spawns this process on a separate thread loop.
    // The API will instantly skip to the next line and return to the browser,
    // while FFmpeg safely processes the video in the background.
    processAndUploadVideo(
        newAssetId,
        tempFilePath,
        filename
    )

    return {
        success: true,
        assetId: newAssetId,
        message: 'Upload successful. Transcoding initiated.'
    }

})