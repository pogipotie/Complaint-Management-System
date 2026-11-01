import { TestBed } from '@angular/core/testing';
import { NotificationsService, Notification } from './notifications.service';
import { SupabaseService } from './supabase.service';

describe('NotificationsService ordering', () => {
  let service: NotificationsService;
  let notifications: Notification[];
  let unreadCount: number;
  let onInsert: (payload: { new: Notification }) => Promise<void>;
  let loadResult: Promise<{ data: Notification[]; error: null }>;
  let details: Map<string, Promise<{ data: Notification | null }>>;
  let order: jasmine.Spy;

  function note(id: string, created_at: string): Notification {
    return {
      id, created_at, user_id: 'user-1', complaint_id: 'complaint-1',
      type: 'system', title: id, body: '', is_read: false
    };
  }

  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return { promise, resolve };
  }

  beforeEach(() => {
    details = new Map();
    loadResult = Promise.resolve({ data: [], error: null });
    order = jasmine.createSpy('order');
    const channel = {
      on: (_event: string, _filter: unknown, callback: typeof onInsert) => {
        onInsert = callback;
        return channel;
      },
      subscribe: () => channel
    };
    const supabase = {
      channel: () => channel,
      removeChannel: () => Promise.resolve('ok'),
      from: () => {
        let id = '';
        const query = {
          select: () => query,
          eq: (column: string, value: string) => {
            if (column === 'id') id = value;
            return query;
          },
          order: (column: string, options: unknown) => {
            order(column, options);
            return query;
          },
          limit: () => loadResult,
          single: () => details.get(id) ?? Promise.resolve({ data: null })
        };
        return query;
      }
    };
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { supabase } }]
    });
    service = TestBed.inject(NotificationsService);
    service.notifications$.subscribe(value => { notifications = value; });
    service.unreadCount$.subscribe(value => { unreadCount = value; });
    service.subscribeToNotifications('user-1');
  });

  it('loads newest first using notification timestamps, not complaint timestamps', async () => {
    const older = note('older', '2026-10-18T10:00:00Z');
    const latest = {
      ...note('latest', '2026-10-19T10:00:00Z'),
      complaint: { created_at: '2026-01-01T00:00:00Z' }
    };
    loadResult = Promise.resolve({ data: [older, latest], error: null });

    await service.loadNotifications('user-1');

    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(notifications.map(item => item.id)).toEqual(['latest', 'older']);
  });

  it('keeps the latest on top when an older detail request finishes last', async () => {
    const older = note('older', '2026-10-19T09:00:00Z');
    const latest = note('latest', '2026-10-19T10:00:00Z');
    const slow = deferred<{ data: Notification | null }>();
    details.set(older.id, slow.promise);

    const pending = onInsert({ new: older });
    await onInsert({ new: latest });
    slow.resolve({ data: older });
    await pending;

    expect(notifications.map(item => item.id)).toEqual(['latest', 'older']);
  });

  it('preserves and deduplicates live inserts during the initial load', async () => {
    const older = note('older', '2026-10-19T09:00:00Z');
    const latest = note('latest', '2026-10-19T10:00:00Z');
    const pending = deferred<{ data: Notification[]; error: null }>();
    loadResult = pending.promise;

    const loading = service.loadNotifications('user-1');
    await onInsert({ new: latest });
    pending.resolve({ data: [older], error: null });
    await loading;
    await onInsert({ new: latest });

    expect(notifications.map(item => item.id)).toEqual(['latest', 'older']);
    expect(unreadCount).toBe(2);
  });

  it('retains the newest 20 when an older event arrives late', async () => {
    const data = Array.from({ length: 20 }, (_, index) =>
      note(`note-${index}`, `2026-10-19T10:${String(index).padStart(2, '0')}:00Z`)
    );
    loadResult = Promise.resolve({ data, error: null });
    await service.loadNotifications('user-1');

    await onInsert({ new: note('old-event', '2026-10-18T00:00:00Z') });

    expect(notifications.length).toBe(20);
    expect(notifications[0].id).toBe('note-19');
    expect(notifications.some(item => item.id === 'old-event')).toBeFalse();
    expect(unreadCount).toBe(20);
  });

  it('clears notices on logout and ignores late detail requests from the previous account', async () => {
    const older = note('previous-account', '2026-10-19T09:00:00Z');
    const slow = deferred<{ data: Notification | null }>();
    details.set(older.id, slow.promise);
    const pending = onInsert({ new: older });
    service.unsubscribe();
    service.subscribeToNotifications('user-2');
    slow.resolve({ data: older });
    await pending;
    expect(notifications).toEqual([]);
    expect(unreadCount).toBe(0);
  });
});
