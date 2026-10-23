import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive() {
    const preferredOrder = ["Lavagem Simples", "Lavagem Completa", "Lavagem de Motor", "Aspiração", "Polimento", "Revisão"];
    const services = await this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return services.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.name);
      const bIndex = preferredOrder.indexOf(b.name);
      return (aIndex < 0 ? preferredOrder.length : aIndex) - (bIndex < 0 ? preferredOrder.length : bIndex) || a.name.localeCompare(b.name, "pt-MZ");
    });
  }

  listAll() {
    return this.prisma.service.findMany({ orderBy: { name: "asc" } });
  }

  async create(input: CreateServiceDto) {
    try {
      return await this.prisma.service.create({
        data: { ...input, isDemo: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Já existe um serviço com esse nome.");
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateServiceDto) {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Serviço não encontrado.");

    try {
      return await this.prisma.service.update({ where: { id }, data: input });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Já existe um serviço com esse nome.");
      }
      throw error;
    }
  }
}
