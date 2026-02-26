import { Injectable } from '@nestjs/common';
import type { Dashboard } from '@prisma/client';
import type { CreateDashboardSchema, PaginationSchema } from '@smartboard/shared';
import type { PagedResult } from '@smartboard/shared';
import type { PrismaService } from '../prisma/prisma.service';

type CreateDashboardDto = ReturnType<typeof CreateDashboardSchema.parse>;
type PaginationDto = ReturnType<typeof PaginationSchema.parse>;

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

    const [total, items] = await this.prisma.$transaction([
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
}
