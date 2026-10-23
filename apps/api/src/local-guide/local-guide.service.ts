import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLocalPlaceDto } from "./dto/create-local-place.dto";
import { UpdateLocalPlaceDto } from "./dto/update-local-place.dto";

@Injectable()
export class LocalGuideService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.localPlace.findMany({
      where: { isActive: true, isDemo: true },
      orderBy: [{ category: "asc" }, { estimatedMinutes: "asc" }],
      select: { id: true, name: true, category: true, description: true, estimatedMinutes: true, externalUrl: true, isDemo: true },
    });
  }

  listForManagement() {
    return this.prisma.localPlace.findMany({ orderBy: [{ isActive: "desc" }, { category: "asc" }, { name: "asc" }] });
  }

  async create(input: CreateLocalPlaceDto) {
    try {
      return await this.prisma.localPlace.create({ data: { ...input, isDemo: true } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Já existe uma sugestão com esse nome.");
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateLocalPlaceDto) {
    const existing = await this.prisma.localPlace.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Sugestão não encontrada.");
    try {
      return await this.prisma.localPlace.update({ where: { id }, data: input });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Já existe uma sugestão com esse nome.");
      }
      throw error;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.localPlace.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException("Sugestão não encontrada.");
    await this.prisma.localPlace.delete({ where: { id } });
    return { id: existing.id };
  }
}
