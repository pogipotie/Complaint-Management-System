import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { AdminLayoutComponent } from './admin-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { Notification, NotificationsService } from '../../core/services/notifications.service';

describe('Admin notification navigation', () => {
  let component: AdminLayoutComponent;
  let navigate: jasmine.Spy;
  let markAsRead: jasmine.Spy;

  function note(overrides: Partial<Notification> = {}): Notification {
    return {
      id: 'notification-id', user_id: 'admin-id', complaint_id: '',
      type: 'system', title: 'Complaint Escalated', body: 'Escalated by a captain.',
      is_read: false, created_at: '2026-10-19T00:00:00Z', ...overrides
    };
  }

  beforeEach(() => {
    navigate = jasmine.createSpy('navigate');
    markAsRead = jasmine.createSpy('markAsRead');
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate } },
        { provide: AuthService, useValue: {} },
        { provide: BreakpointObserver, useValue: {} },
        { provide: NotificationsService, useValue: {
          notifications$: of([]), unreadCount$: of(0), markAsRead
        } }
      ]
    });
    component = TestBed.runInInjectionContext(() => new AdminLayoutComponent());
  });

  it('routes system escalations to complaints and marks them read', () => {
    component.handleNotificationClick(note({ complaint_id: 'complaint-id' }));
    expect(navigate).toHaveBeenCalledWith(['/admin/complaints']);
    expect(markAsRead).toHaveBeenCalledWith('notification-id');
  });

  it('routes system resolution ratings to complaints', () => {
    component.handleNotificationClick(note({ complaint_id: 'complaint-id', title: 'Resolution Rating Submitted' }));
    expect(navigate).toHaveBeenCalledWith(['/admin/complaints']);
  });

  it('uses joined complaint details when the complaint ID is missing', () => {
    component.handleNotificationClick(note({ complaint: { id: 'complaint-id' } }));
    expect(navigate).toHaveBeenCalledWith(['/admin/complaints']);
  });

  it('keeps registration resubmissions directed to users', () => {
    component.handleNotificationClick(note({ title: 'Registration Resubmitted' }));
    expect(navigate).toHaveBeenCalledWith(['/admin/users']);
  });

  it('keeps other unlinked system notifications directed to users', () => {
    component.handleNotificationClick(note({ title: 'Account Banned' }));
    expect(navigate).toHaveBeenCalledWith(['/admin/users']);
  });

  it('routes complaint notifications to complaints without marking read again', () => {
    component.handleNotificationClick(note({ type: 'status_changed', is_read: true }));
    expect(navigate).toHaveBeenCalledWith(['/admin/complaints']);
    expect(markAsRead).not.toHaveBeenCalled();
  });
});
