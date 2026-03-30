import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function seedSubscriptionRequests() {
  console.log("Start seeding subscription requests...");

  const student = await prisma.student.findFirst({
    where: { email: "john.doe@lms.com" },
    include: { user: true }
  });

  const plan = await prisma.plans.findFirst({
    where: { name_en: "Monthly Pro" }
  });

  if (!student || !student.user_id) {
    console.warn("Student or associated user not found. Skipping subscription requests.");
    return;
  }

  if (!plan) {
    console.warn("Plan 'Monthly Pro' not found. Skipping subscription requests.");
    return;
  }

  await prisma.subscription_requests.upsert({
    where: { user_id: student.user_id },
    update: {
      planId: plan.id,
      status: "pending",
    },
    create: {
      user_id: student.user_id,
      planId: plan.id,
      status: "pending",
    },
  });

  console.log("Seeded subscription requests.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedSubscriptionRequests()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
    });
}
