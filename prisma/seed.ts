import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const applications = [
  {
    company: "SAP",
    position: "Senior Software Engineer",
    country: "Germany",
    location: "Walldorf",
    source: "LinkedIn",
    status: "Technical_Round_2",
    applicationType: "Hybrid",
    visaSponsorship: true,
    relocation: true,
    referral: false,
    targetSalary: "85000",
    currency: "EUR",
    appliedDate: new Date("2026-03-15"),
    nextInterviewDate: new Date("2026-06-20"),
    recruiterName: "Anna Mueller",
    recruiterEmail: "anna.mueller@sap.com",
    notes: "## Position Notes\n\nStrong Java background required. Team works on enterprise cloud solutions.\n\n- HANA database knowledge a plus\n- Agile team, 2-week sprints",
    interviewFeedback: "First technical round went well. Asked about distributed systems and microservices patterns.",
  },
];

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      username: "demo",
      email: "demo@example.com",
      passwordHash,
    },
  });

  console.log(`Created user: ${user.email}`);

  // Delete existing applications for demo user
  await prisma.application.deleteMany({ where: { userId: user.id } });

  for (const appData of applications) {
    const app = await prisma.application.create({
      data: {
        ...appData,
        userId: user.id,
      },
    });

    await prisma.statusHistory.create({
      data: {
        applicationId: app.id,
        oldStatus: null,
        newStatus: "Applied",
      },
    });

    if (appData.status !== "Applied") {
      await prisma.statusHistory.create({
        data: {
          applicationId: app.id,
          oldStatus: "Applied",
          newStatus: appData.status,
        },
      });
    }
  }

  console.log(`Seeded ${applications.length} applications.`);
  console.log("\nDemo credentials:");
  console.log("  Email: demo@example.com");
  console.log("  Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
