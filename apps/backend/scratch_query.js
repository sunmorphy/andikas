import { config } from 'dotenv';
config();
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './src/db/schema.js';
import { eq } from 'drizzle-orm';
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
async function run() {
    const project = await db.select({
        id: schema.projects.id,
        title: schema.projects.title,
        slug: schema.projects.slug,
        description: schema.projects.description,
        content: schema.projects.content
    }).from(schema.projects).where(eq(schema.projects.slug, 'kaku-portfolio'));
    console.log(JSON.stringify(project, null, 2));
    await pool.end();
}
run().catch(console.error);
//# sourceMappingURL=scratch_query.js.map