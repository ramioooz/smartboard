import { CreateDashboardSchema, SaveLayoutSchema, PanelSchema } from '@smartboard/shared';

describe('svc-dashboards — schema validation', () => {
  describe('CreateDashboardSchema', () => {
    it('accepts valid dashboard', () => {
      const result = CreateDashboardSchema.safeParse({ name: 'Q1 Sales' });
      expect(result.success).toBe(true);
    });

    it('accepts optional description', () => {
      const result = CreateDashboardSchema.safeParse({ name: 'Overview', description: 'Main view' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.description).toBe('Main view');
    });

    it('rejects missing name', () => {
      const result = CreateDashboardSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const result = CreateDashboardSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('PanelSchema', () => {
    // PanelSchema.id must be a valid UUID
    const validPanel = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      type: 'kpi',
      title: 'Revenue',
      config: { value: 1000, unit: '$' },
      layout: { i: 'panel-1', x: 0, y: 0, w: 4, h: 3 },
    };

    it('accepts a valid KPI panel', () => {
      const result = PanelSchema.safeParse(validPanel);
      expect(result.success).toBe(true);
    });

    it('accepts timeseries panel type', () => {
      const result = PanelSchema.safeParse({ ...validPanel, type: 'timeseries' });
      expect(result.success).toBe(true);
    });

    it('accepts table and text panel types', () => {
      for (const type of ['table', 'text']) {
        const result = PanelSchema.safeParse({ ...validPanel, type });
        expect(result.success).toBe(true);
      }
    });

    it('rejects unknown panel type', () => {
      const result = PanelSchema.safeParse({ ...validPanel, type: 'gauge' });
      expect(result.success).toBe(false);
    });

    it('rejects non-UUID panel id', () => {
      const result = PanelSchema.safeParse({ ...validPanel, id: 'panel-1' });
      expect(result.success).toBe(false);
    });

    it('defaults config to empty object when omitted', () => {
      const { config: _, ...rest } = validPanel;
      const result = PanelSchema.safeParse(rest);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.config).toEqual({});
    });
  });

  describe('SaveLayoutSchema', () => {
    it('accepts empty panels array', () => {
      const result = SaveLayoutSchema.safeParse({ panels: [] });
      expect(result.success).toBe(true);
    });

    it('rejects missing panels', () => {
      const result = SaveLayoutSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts panels array with valid panels', () => {
      const result = SaveLayoutSchema.safeParse({
        panels: [{
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          type: 'kpi',
          title: 'Total Users',
          config: {},
          layout: { i: 'p1', x: 0, y: 0, w: 6, h: 3 },
        }],
      });
      expect(result.success).toBe(true);
    });
  });
});
