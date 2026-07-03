import "dotenv/config";

import bcrypt from "bcrypt";
import { Role, SportType } from "@prisma/client";

import { createPrismaClient } from "../src/database/prisma";

const prisma = createPrismaClient();

async function seedAdmin(): Promise<void> {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@quadrafacil.com",
    },
    update: {
      name: "Administrador",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      name: "Administrador",
      email: "admin@quadrafacil.com",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });
}

async function seedCourt(data: {
  name: string;
  description?: string;
  sportType: SportType;
  location?: string;
  openingMinutes: number;
  closingMinutes: number;
}): Promise<void> {
  const existingCourt = await prisma.court.findFirst({
    where: {
      name: data.name,
    },
  });

  if (existingCourt) {
    await prisma.court.update({
      where: {
        id: existingCourt.id,
      },
      data: {
        ...data,
        isActive: true,
      },
    });

    return;
  }

  await prisma.court.create({
    data: {
      ...data,
      isActive: true,
    },
  });
}

async function seedCourts(): Promise<void> {
  await seedCourt({
    name: "Quadra Futsal",
    description: "Quadra coberta para futsal.",
    sportType: SportType.FUTSAL,
    location: "Ginasio",
    openingMinutes: 480,
    closingMinutes: 1320,
  });

  await seedCourt({
    name: "Quadra Society",
    description: "Campo society sintetico.",
    sportType: SportType.SOCIETY,
    location: "Area externa",
    openingMinutes: 480,
    closingMinutes: 1320,
  });

  await seedCourt({
    name: "Quadra Beach Tennis",
    description: "Quadra de areia para beach tennis.",
    sportType: SportType.BEACH_TENNIS,
    location: "Bloco B",
    openingMinutes: 540,
    closingMinutes: 1260,
  });
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedCourts();

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
