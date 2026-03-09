import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import { seedCurrencies } from "./seeders/currency.seeder.js";
import { seedPlans } from "./seeders/plans.seeder.js";
import { seedSubjects } from "./seeders/subjects.seeder.js";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("--- Starting Global Seeding ---");

  await seedCurrencies();
  await seedPlans();
  await seedSubjects();

  console.log("--- Seeding Finished Successfully ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
