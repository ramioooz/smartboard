import { Injectable, NotFoundException } from '@nestjs/common';
import type { Dashboard } from '@prisma/client';
import type { CreateDashboardSchema, PaginationSchema, SaveLayoutSchema } from '@smartboard/shared';
import type { PagedResult } from '@smartboard/shared';
import { PrismaService } from '../prisma/prisma.service';

type CreateDashboardDto = ReturnType<typeof CreateDashboardSchema.parse>;
type PaginationDto = ReturnType<typeof PaginationSchema.parse>;
type SaveLayoutDto = ReturnType<typeof SaveLayoutSchema.parse>;
type UpdateDashboardDto = { name?: string; description?: string };

@Injectable()
export class DashboardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDashboardDto, tenantId: string): Promise<Dashboard> {
    return this.prisma.dashboard.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        panels: [],
      },
    });
  }

  async listForTenant(tenantId: string, pagination: PaginationDto): Promise<PagedResult<Dashboard>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.dashboard.count({ where: { tenantId } }),
      this.prisma.dashboard.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { items, total, page, limit, hasMore: skip + items.length < total };
  }

  async findOne(id: string, tenantId: string): Promise<Dashboard> {
    const dashboard = await this.prisma.dashboard.findFirst({
      where: { id, tenantId },
    });
    if (!dashboard) throw new NotFoundException(`Dashboard ${id} not found`);
    return dashboard;
  }

  async saveLayout(id: string, tenantId: string, dto: SaveLayoutDto): Promise<Dashboard> {
    const existing = await this.prisma.dashboard.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException(`Dashboard ${id} not found`);
    return this.prisma.dashboard.update({
      where: { id },
      data: { panels: dto.panels as object[] },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateDashboardDto): Promise<Dashboard> {
    const existing = await this.prisma.dashboard.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException(`Dashboard ${id} not found`);
    return this.prisma.dashboard.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }
}
