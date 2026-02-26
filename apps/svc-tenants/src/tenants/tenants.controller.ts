import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import type { ApiOk, PagedResult } from '@smartboard/shared';
import { CreateTenantSchema } from '@smartboard/shared';
import type { Tenant, TenantMember } from '@prisma/client';
import type { TenantsService } from './tenants.service';

type TenantWithMembers = Tenant & { members: TenantMember[] };

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: unknown,
    @Headers('x-user-id') userId: string,
  ): Promise<ApiOk<TenantWithMembers>> {
    if (!userId) throw new BadRequestException('Missing x-user-id header');
    const parsed = CreateTenantSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten().fieldErrors);
    const tenant = await this.tenantsService.create(parsed.data, userId);
    return { ok: true, data: tenant };
  }

  @Get()
  async list(
    @Headers('x-user-id') userId: string,
  ): Promise<ApiOk<PagedResult<TenantWithMembers>>> {
    if (!userId) throw new BadRequestException('Missing x-user-id header');
    const result = await this.tenantsService.listForUser(userId);
    return { ok: true, data: result };
  }
}
