import { z } from 'zod';

// ─── Common ─────────────────────────────────────────────────────────────────

export const UuidSchema = z.string().uuid();
// Opaque ID schema — accepts cuid2, UUID, or any non-empty alphanumeric ID
export const IdSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type Pagination = z.infer<typeof PaginationSchema>;

// ─── Auth ────────────────────────────────────────────────────────────────────

export const DevLoginSchema = z.object({
  email: z.string().email().optional().default('dev@local'),
});

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).default('light'),
  scheme: z.enum(['mint', 'warm', 'neon', 'ember']).default('mint'),
  language: z.string().default('en'),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// ─── Tenants ─────────────────────────────────────────────────────────────────

export const CreateTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
});

export type CreateTenant = z.infer<typeof CreateTenantSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'VIEWER']).default('VIEWER'),
});
export type InviteMember = z.infer<typeof InviteMemberSchema>;

// ─── Datasets ────────────────────────────────────────────────────────────────

export const CreateDatasetSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  fileType: z.enum(['csv', 'json']).default('csv'),
});

export const DatasetStatusSchema = z.enum([
  'created',
  'uploaded',
  'processing',
  'ready',
  'error',
]);

export type DatasetStatus = z.infer<typeof DatasetStatusSchema>;
export type CreateDataset = z.infer<typeof CreateDatasetSchema>;

// ─── Dashboards ──────────────────────────────────────────────────────────────

export const PanelTypeSchema = z.enum(['kpi', 'timeseries', 'table', 'text']);
export type PanelType = z.infer<typeof PanelTypeSchema>;

export const PanelLayoutSchema = z.object({
  i: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export const PanelSchema = z.object({
  id: z.string().uuid(),
  type: PanelTypeSchema,
  title: z.string().max(200),
  datasetId: z.string().uuid().optional(),
  config: z.record(z.unknown()).default({}),
  layout: PanelLayoutSchema,
});

export const SaveLayoutSchema = z.object({
  panels: z.array(PanelSchema),
});

export const CreateDashboardSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});
export type CreateDashboard = z.infer<typeof CreateDashboardSchema>;

export const PatchDashboardSchema = CreateDashboardSchema.partial();
export type PatchDashboard = z.infer<typeof PatchDashboardSchema>;

export type SaveLayout = z.infer<typeof SaveLayoutSchema>;

// ─── Analytics ───────────────────────────────────────────────────────────────

export const TimeseriesQuerySchema = z.object({
  datasetId: IdSchema,
  metric: z.string().min(1),
  from: z.coerce.date(),
  to: z.coerce.date(),
  bucket: z.enum(['minute', 'hour', 'day', 'week', 'month']).default('hour'),
});
export type TimeseriesQuery = z.infer<typeof TimeseriesQuerySchema>;
