// velostream/server/utils/r2.ts
import { S3Client } from '@aws-sdk/client-s3';

let r2Instance: S3Client | null = null;

export function useR2() {
    if (!r2Instance) {
        r2Instance = new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT, // e.g., https://<account-id>.r2.cloudflarestorage.com
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            },
        });
    }

    return r2Instance;
}