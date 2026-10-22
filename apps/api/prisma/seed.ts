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
    const booking = await prisma.booking.upsert({
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
    const notification = await prisma.customerNotification.findFirst({ where: { customerId: customer.id, bookingId: booking.id, title: "Actualização de demonstração" } });
    if (!notification) await prisma.customerNotification.create({ data: {
      customerId: customer.id,
      bookingId: booking.id,
      title: "Actualização de demonstração",
      message: `A marcação ${sample.code} está no estado ${sample.status}. Esta é uma notificação de exemplo.`,
    } });
  }

  const demoPlaces = [
    { name: "Mercearia do Bairro (exemplo)", category: "SHOPS" as const, description: "Exemplo de uma loja de conveniência para visitar enquanto aguarda.", estimatedMinutes: 8 },
    { name: "Loja de produtos locais (exemplo)", category: "SHOPS" as const, description: "Sugestão ilustrativa de comércio local na zona.", estimatedMinutes: 12 },
    { name: "Café da Matola (exemplo)", category: "FOOD" as const, description: "Exemplo de um café para fazer uma pausa durante a visita.", estimatedMinutes: 6 },
    { name: "Restaurante local (exemplo)", category: "FOOD" as const, description: "Sugestão ilustrativa para uma refeição nas proximidades.", estimatedMinutes: 15 },
    { name: "Espaço de lazer familiar (exemplo)", category: "ENTERTAINMENT" as const, description: "Exemplo de entretenimento para famílias; confirme opções e horários antes de se deslocar.", estimatedMinutes: 15 },
    { name: "Actividade cultural local (exemplo)", category: "ENTERTAINMENT" as const, description: "Sugestão fictícia que demonstra como actividades culturais poderiam ser descobertas.", estimatedMinutes: 20 },
  ];
  for (const place of demoPlaces) {
    await prisma.localPlace.upsert({ where: { name: place.name }, update: {}, create: { ...place, isDemo: true } });
  }

  let wallet = await prisma.demoWallet.findUnique({ where: { customerId: customer.id } });
  if (!wallet) {
    wallet = await prisma.demoWallet.create({
      data: { customerId: customer.id, loadedBalanceMzn: 1000, promoBalanceMzn: 500, pointsBalance: 500 },
    });
    await prisma.demoMovement.createMany({ data: [
      { walletId: wallet.id, customerId: customer.id, type: "LOAD", amount: 1000, loadedAmountMzn: 1000, description: "Saldo inicial carregado de demonstração", idempotencyKey: "seed-wallet-load-2026" },
      { walletId: wallet.id, customerId: customer.id, type: "PROMO_CREDIT", amount: 500, promoAmountMzn: 500, description: "Crédito promocional inicial demonstrativo", idempotencyKey: "seed-wallet-promo-2026" },
      { walletId: wallet.id, customerId: customer.id, type: "POINTS_EARNED", amount: 500, description: "Saldo inicial de pontos demonstrativos", idempotencyKey: "seed-wallet-points-2026" },
    ] });
  }

  console.info("Dados demo criados. Cliente: 84 123 4567; marcações: LAVA1001, LAVA1002, LAVA1003.");
  console.info("Guia local: 6 sugestões fictícias entre lojas, alimentação e entretenimento; nenhuma é afiliada.");
  console.info("Carteira demo: saldos carregado e promocional separados; saldos existentes preservados pelo seed.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
