import { Injectable } from '@nestjs/common';
import type { DatasetMetricsQuerySchema, TimeseriesQuerySchema } from '@smartboard/shared';
import { PrismaService } from '../prisma/prisma.service';

type TimeseriesQueryDto = ReturnType<typeof TimeseriesQuerySchema.parse>;
type DatasetMetricsQueryDto = ReturnType<typeof DatasetMetricsQuerySchema.parse>;

interface TimeseriesRow {
  bucket: Date;
  avg: number;
  min: number;
  max: number;
  count: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async metrics(query: DatasetMetricsQueryDto, tenantId: string): Promise<string[]> {
    const rows = await this.prisma.event.findMany({
      where: {
        tenantId,
        datasetId: query.datasetId,
      },
      distinct: ['metric'],
      select: { metric: true },
      orderBy: { metric: 'asc' },
    });

    return rows.map((row) => row.metric);
  }

  async timeseries(query: TimeseriesQueryDto, tenantId: string): Promise<TimeseriesRow[]> {
    const rows = await this.prisma.$queryRaw<
      { bucket: Date; avg: number; min: number; max: number; count: bigint }[]
    >`
      SELECT
        DATE_TRUNC(${query.bucket}, timestamp)  AS bucket,
        AVG(value)::float                        AS avg,
        MIN(value)::float                        AS min,
        MAX(value)::float                        AS max,
        COUNT(*)                                 AS count
      FROM analytics.events
      WHERE "tenantId"  = ${tenantId}
        AND "datasetId" = ${query.datasetId}
        AND metric      = ${query.metric}
        AND timestamp  >= ${new Date(query.from)}
        AND timestamp  <  ${new Date(query.to)}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    // COUNT(*) returns BigInt — convert to number before JSON serialisation
    return rows.map((r) => ({ ...r, count: Number(r.count) }));
  }
}
