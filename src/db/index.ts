import { drizzle } from 'drizzle-orm/libsql';

export const db = drizzle({
    connection: {
        url: import.meta.env.VITE_TURSO_DATABASE_URL,
        authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN
    }
});
