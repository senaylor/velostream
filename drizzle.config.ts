// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    // Stripping the leading dot or matching all TS files in that directory
    schema: 'server/database/schema.ts',
    out: 'server/database/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});