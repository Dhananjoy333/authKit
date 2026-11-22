import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaAdapter } from "./adapters/PrismaAdapter.ts";
import { AuthEngine } from "./authKit.ts";

async function addUserPrisma() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    const prisma = new PrismaClient({ adapter });
    const auth = new AuthEngine(new PrismaAdapter(prisma));

    const res = await auth.register("aarav.sharma@example.com", "P@ssw0rd123!", { name: "Aarav", image: "aaa" });
    console.log("Registered user:", res);
}
addUserPrisma();



// function test() {

// }