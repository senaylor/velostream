import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../database/schema'

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function useDb() {
    if (!dbInstance) {
        const pool = new pg.Pool({
            connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/velostream'
        })

        dbInstance = drizzle(pool, { schema });
    }

    return dbInstance;
}