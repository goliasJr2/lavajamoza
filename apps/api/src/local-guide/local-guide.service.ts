import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LocalGuideService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.localPlace.findMany({
      where: { isActive: true, isDemo: true },
      orderBy: [{ category: "asc" }, { estimatedMinutes: "asc" }],
      select: { id: true, name: true, category: true, description: true, estimatedMinutes: true, isDemo: true },
    });
  }
}
