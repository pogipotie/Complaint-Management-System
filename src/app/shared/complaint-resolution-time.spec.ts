import { formatResolutionTime, resolutionCsvValue } from './complaint-resolution-time';
import { AdminComplaintsComponent } from '../features/admin/complaints/admin-complaints.component';
import { CaptainComplaintsComponent } from '../features/captain/complaints/captain-complaints.component';
import { of } from 'rxjs';

describe('Complaint resolution timestamp', () => {
  it('formats UTC in Philippine time including seconds and timezone', () => {
    expect(formatResolutionTime('2026-11-02T07:45:12Z')).toBe('Nov 2, 2026, 3:45:12 PM (PHT)');
  });

  it('handles date rollover and offset timestamps consistently', () => {
    expect(formatResolutionTime('2026-11-02T20:00:00Z')).toBe('Nov 3, 2026, 4:00:00 AM (PHT)');
    expect(formatResolutionTime('2026-11-02T15:45:12+08:00')).toBe('Nov 2, 2026, 3:45:12 PM (PHT)');
  });

  it('does not invent unavailable dates', () => {
    for (const value of [null, undefined, '', 'invalid']) {
      expect(formatResolutionTime(value)).toBe('Resolution date unavailable');
    }
  });

  it('leaves unresolved CSV dates blank and labels unknown resolved dates', () => {
    expect(resolutionCsvValue({ status: 'pending' })).toBe('');
    expect(resolutionCsvValue({ status: 'rejected' })).toBe('');
    expect(resolutionCsvValue({ status: 'resolved' })).toBe('Resolution date unavailable');
    expect(resolutionCsvValue({ status: 'resolved', resolved_at: '2026-11-02T07:45:12Z' }))
      .toBe('Nov 2, 2026, 3:45:12 PM (PHT)');
  });

  for (const [role, component] of [
    ['admin', AdminComplaintsComponent], ['captain', CaptainComplaintsComponent]
  ] as const) {
    it(`uses the database timestamp immediately after ${role} resolution`, async () => {
      const complaint: { id: string; status: string; resolved_at: string | null } = {
        id: 'test', status: 'assigned', resolved_at: null
      };
      const select = jasmine.createSpy().and.returnValue({
        single: async () => ({ data: { resolved_at: '2026-11-02T07:45:12Z' }, error: null })
      });
      const update = jasmine.createSpy().and.returnValue({ eq: () => ({ select }) });
      const context = {
        dialog: { open: () => ({ afterClosed: () => of({ proceed: true, note: '' }) }) },
        supabaseService: { supabase: { from: () => ({ update }) } }
      };
      const dropdown = document.createElement('select');
      await component.prototype.updateStatus.call(context as any, complaint, 'resolved', dropdown);
      await Promise.resolve();
      await Promise.resolve();
      expect(update).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'resolved' }));
      expect(update.calls.mostRecent().args[0].resolved_at).toBeUndefined();
      expect(select).toHaveBeenCalledWith('resolved_at');
      expect(complaint.resolved_at).toBe('2026-11-02T07:45:12Z');
    });
  }
});
