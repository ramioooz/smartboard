import { Injectable } from '@nestjs/common';
import type { Tenant, TenantMember } from '@prisma/client';
import type { CreateTenantSchema } from '@smartboard/shared';
import type { PagedResult } from '@smartboard/shared';
import { PrismaService } from '../prisma/prisma.service';

type CreateTenantDto = ReturnType<typeof CreateTenantSchema.parse>;
type TenantWithMembers = Tenant & { members: TenantMember[] };

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto, userId: string): Promise<TenantWithMembers> {
    const created = await this.prisma.tenant.create({
      data: { name: dto.name, slug: dto.slug },
    });
    await this.prisma.tenantMember.create({
      data: { tenantId: created.id, userId, role: 'OWNER' },
    });
    const tenant = created;

    return this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenant.id },
      include: { members: true },
    });
  }

  async listForUser(userId: string): Promise<PagedResult<TenantWithMembers>> {
    const [total, items] = await Promise.all([
      this.prisma.tenant.count({ where: { members: { some: { userId } } } }),
      this.prisma.tenant.findMany({
        where: { members: { some: { userId } } },
        include: { members: { where: { userId } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { items, total, page: 1, limit: 50, hasMore: total > 50 };
  }
}
