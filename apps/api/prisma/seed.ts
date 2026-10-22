import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error(
      "Define ADMIN_EMAIL e ADMIN_PASSWORD (mínimo 12 caracteres) no .env antes de executar o seed.",
    );
  }

  await prisma.staffUser.upsert({
    where: { email },
    update: { passwordHash: await hash(password, 12) },
    create: {
      email,
      passwordHash: await hash(password, 12),
      role: "ADMIN",
    },
  });

  const demoServices = [
    {
      name: "Lavagem exterior",
      description: "Pré-lavagem, lavagem exterior e secagem manual.",
      priceMzn: 350,
      durationMinutes: 30,
    },
    {
      name: "Lavagem completa",
      description: "Lavagem exterior, aspiração e limpeza do habitáculo.",
      priceMzn: 700,
      durationMinutes: 60,
    },
    {
      name: "Lavagem premium",
      description: "Lavagem completa com acabamento e tratamento de pneus.",
      priceMzn: 1200,
      durationMinutes: 90,
    },
  ];

  for (const service of demoServices) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: { ...service, isDemo: true },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
