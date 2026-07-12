import fs from 'fs'
import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { eq } from 'drizzle-orm'
import { assets } from '../database/schema'
import { useDb } from './db'

ffmpeg.setFfmpegPath('C:\\Users\\Sean\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin\\ffmpeg.exe')
ffmpeg.setFfprobePath('C:\\Users\\Sean\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin\\ffprobe.exe')

export async function processAndUploadVideo(assetId: string, inputPath: string, originalFilename: string) {
    const db = useDb()
    const config = useRuntimeConfig()

    // 1. Mark asset status as processing
    await db.update(assets).set({ status: 'processing' }).where(eq(assets.id, assetId))

    const outputFilename = `optimized-${assetId}.mp4`
    const outputPath = path.join(path.dirname(inputPath), outputFilename)

    console.log(`🎬 Starting transcode for Asset: ${assetId}`)

    // 2. Fire up the FFmpeg engine
    ffmpeg(inputPath)
        .videoCodec('libx264')     // Universally compatible web video codec
        .audioCodec('aac')         // High quality web standard audio codec
        .outputOptions([
            '-crf 23',               // Balanced quality vs file size ratio
            '-preset medium',        // Processing speed baseline preset
            '-movflags +faststart'   // Moves the Moov Atom to the front for instant web streaming!
        ])
        .videoFilters('scale=trunc(iw/2)*2:trunc(ih/2)*2')
        .format('mp4')
        .on('start', (commandLine) => {
            console.log('Spawned FFmpeg with command: ' + commandLine)
        })
        .on('error', async (err) => {
            console.error('❌ FFmpeg Processing Failure:', err.message)
            await db.update(assets).set({ status: 'failed' }).where(eq(assets.id, assetId))
            cleanupFiles([inputPath, outputPath])
        })
        .on('end', async () => {
            console.log('✅ Transcoding complete! Preparing Cloudflare R2 deployment payload...')

            try {
                const s3 = new S3Client({
                    region: 'auto',
                    endpoint: config.r2EndpointUrl,
                    credentials: {
                        accessKeyId: config.r2AccessKeyId,
                        secretAccessKey: config.r2SecretAccessKey,
                    },
                })

                const fileStream = fs.createReadStream(outputPath)
                const storageKey = `videos/${assetId}/${outputFilename}`

                const stats = fs.statSync(outputPath)
                const actualSizeBytes = stats.size

                // 3. Multi-part upload stream straight into R2
                const parallelUploads3 = new Upload({
                    client: s3,
                    params: {
                        Bucket: config.r2BucketName,
                        Key: storageKey,
                        Body: fileStream,
                        ContentType: 'video/mp4',
                    },
                })

                await parallelUploads3.done()
                console.log(`🚀 Successfully deployed optimized stream asset to R2: ${storageKey}`)

                // 4. Update database status to ready and save the actual key path
                await db.update(assets).set({
                    storageKey: storageKey,
                    mimeType: 'video/mp4',
                    fileSize: actualSizeBytes,
                    status: 'ready',
                    updatedAt: new Date(),
                }).where(eq(assets.id, assetId))

            } catch (uploadError) {
                console.error('❌ Cloudflare R2 Upload Sync Failure:', uploadError)
                await db.update(assets).set({ status: 'failed' }).where(eq(assets.id, assetId))
            } finally {
                // Always sweep temporary files clean from the server machine
                cleanupFiles([inputPath, outputPath])
            }
        })
        .save(outputPath)
}

function cleanupFiles(paths: string[]) {
    paths.forEach(p => {
        if (fs.existsSync(p)) {
            fs.unlinkSync(p)
        }
    })
}