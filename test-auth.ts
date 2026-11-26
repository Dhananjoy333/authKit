import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaAdapter } from "./adapters/PrismaAdapter.ts";
import { AuthEngine } from "./authKit.ts";

// async function testPrisma() {
//     if (!process.env.DATABASE_URL) {
//         throw new Error("DATABASE_URL is not defined! Make sure .env exists in authKit.");
//     }
//     const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
//     const prisma = new PrismaClient({ adapter });
//     const auth = new AuthEngine(new PrismaAdapter(prisma));

//     // const res = await auth.register("aarav.sharma@example.com", "P@ssw0rd123!", { name: "Aarav", image: "aaa" });
//     // console.log("Registered user:", res);

//     const res = await auth.login('aarav.sharma@example.com', 'P@ssw0rd123!');
//     console.log('logged in user :', res);
// }
// testPrisma();

// import { Pool } from "pg";
// import { PostgresAdapter } from "./adapters/PostgresAdapter.ts";

// async function testPostgres() {
//     // 1. Create a raw PostgreSQL connection pool using the same connection string
//     const pool = new Pool({
//         connectionString: process.env.DATABASE_URL,
//     });
//     // 2. Pass the pool into PostgresAdapter
//     const adapter = new PostgresAdapter(pool);
//     // 3. Initialize AuthEngine with the adapter
//     const auth = new AuthEngine(adapter);
//     console.log("--- Testing PostgresAdapter ---");
//     // 4. Register a new user
//     const newUser = await auth.register(
//         "priya.patel@example.com",
//         "SecurePass123!",
//         { name: "Priya", image: "https://example.com/priya.png" }
//     );
//     console.log("Registered via PG:", newUser);
//     // 5. Test Login
//     const loginRes = await auth.login("priya.patel@example.com", "SecurePass123!");
//     console.log("Logged in via PG. Session token:", loginRes.sessionToken);
//     // 6. Close the connection pool so the Node process exits cleanly
//     await pool.end();
// }
// testPostgres();


import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, sessions } from "./drizzle/schema.ts";
import { DrizzleAdapter } from "./adapters/DrizzleAdapter.ts";

async function testDrizzle() {
    // 1. Connect to PostgreSQL
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    // 2. Initialize Drizzle with that connection
    const db = drizzle(pool);

    // 3. Pass `db` and your schema tables into DrizzleAdapter
    const auth = new AuthEngine(new DrizzleAdapter(db, users, sessions));

    console.log("--- Testing DrizzleAdapter ---");
    // 4. Register a new user
    const newUser = await auth.register(
        "AshishBarman@example.com",
        "Password123@",
        { name: "Ashish", image: "https://example.com/Ashish.png" }
    );
    console.log("Registered via PG:", newUser);


    // 4. Close the pool when the script finishes
    await pool.end();
}

testDrizzle()