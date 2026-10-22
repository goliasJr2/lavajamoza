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

  const customer = await prisma.customer.upsert({
    where: { phone: "841234567" },
    update: { name: "Cliente de Demonstração" },
    create: { name: "Cliente de Demonstração", phone: "841234567" },
  });
  const vehicle = await prisma.vehicle.upsert({
    where: { plate: "ABC123MC" },
    update: { customerId: customer.id },
    create: { plate: "ABC123MC", customerId: customer.id },
  });

  const serviceByName = Object.fromEntries(
    (await prisma.service.findMany({ where: { name: { in: demoServices.map(({ name }) => name) } } })).map((service) => [service.name, service]),
  );
  const maputoTime = (daysFromToday: number, time: string) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + daysFromToday);
    return new Date(`${date.toISOString().slice(0, 10)}T${time}:00+02:00`);
  };
  const demoBookings = [
    { code: "LAVA1001", service: "Lavagem exterior", status: "REQUESTED" as const, date: maputoTime(1, "10:00") },
    { code: "LAVA1002", service: "Lavagem completa", status: "ACCEPTED" as const, date: maputoTime(2, "13:00") },
    { code: "LAVA1003", service: "Lavagem premium", status: "COMPLETED" as const, date: maputoTime(-1, "09:00") },
  ];
  for (const sample of demoBookings) {
    const service = serviceByName[sample.service];
    if (!service) throw new Error(`Serviço de demonstração não encontrado: ${sample.service}`);
    await prisma.booking.upsert({
      where: { publicCode: sample.code },
      update: {
        customerId: customer.id, vehicleId: vehicle.id, serviceId: service.id,
        startsAt: sample.date,
        endsAt: new Date(sample.date.getTime() + service.durationMinutes * 60_000),
        priceMznAtBooking: service.priceMzn, durationAtBooking: service.durationMinutes,
      },
      create: {
        publicCode: sample.code, customerId: customer.id, vehicleId: vehicle.id, serviceId: service.id,
        status: sample.status, startsAt: sample.date,
        endsAt: new Date(sample.date.getTime() + service.durationMinutes * 60_000),
        priceMznAtBooking: service.priceMzn, durationAtBooking: service.durationMinutes,
      },
    });
  }

  const wallet = await prisma.demoWallet.upsert({
    where: { customerId: customer.id },
    update: {},
    create: { customerId: customer.id, balanceMzn: 1500, pointsBalance: 500 },
  });
  await prisma.demoMovement.upsert({
    where: { idempotencyKey: "seed-wallet-load-2026" },
    update: {},
    create: { walletId: wallet.id, customerId: customer.id, type: "LOAD", amount: 1500, description: "Saldo inicial de demonstração", idempotencyKey: "seed-wallet-load-2026" },
  });
  await prisma.demoMovement.upsert({
    where: { idempotencyKey: "seed-wallet-points-2026" },
    update: {},
    create: { walletId: wallet.id, customerId: customer.id, type: "POINTS_EARNED", amount: 500, description: "Saldo inicial de pontos demonstrativos", idempotencyKey: "seed-wallet-points-2026" },
  });

  console.info("Dados demo criados. Cliente: 84 123 4567; marcações: LAVA1001, LAVA1002, LAVA1003.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
