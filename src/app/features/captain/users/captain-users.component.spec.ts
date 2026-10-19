import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { CaptainUsersComponent } from './captain-users.component';
import { SupabaseService } from '../../../core/services/supabase.service';

describe('Captain registration notification target', () => {
  let component: CaptainUsersComponent;
  let navigate: jasmine.Spy;
  let loadUsers: jasmine.Spy;
  let viewDetails: jasmine.Spy;

  beforeEach(() => {
    navigate = jasmine.createSpy().and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({ citizen: 'target-id' })) } },
        { provide: Router, useValue: { navigate } },
        { provide: MatDialog, useValue: {} },
        { provide: SupabaseService, useValue: {} }
      ]
    });
    component = TestBed.runInInjectionContext(() => new CaptainUsersComponent());
    loadUsers = spyOn(component, 'loadUsers').and.resolveTo();
    viewDetails = spyOn(component, 'viewUserDetails');
    component.ngOnInit();
  });

  afterEach(() => component.ngOnDestroy());

  it('opens the existing verification dialog and selects the target page', () => {
    component.users = Array.from({ length: 8 }, (_, index) => ({
      id: index === 7 ? 'target-id' : `citizen-${index}`, verification_status: 'pending'
    }));
    component.statusFilter = 'verified';
    component.openNotificationCitizen();
    expect(component.statusFilter).toBe('all');
    expect(component.currentPage).toBe(1);
    expect(viewDetails).toHaveBeenCalledWith(component.users[7]);
    expect(navigate).toHaveBeenCalled();
  });

  it('does not open a citizen outside the fetched barangay records', () => {
    component.users = [{ id: 'other-id' }];
    component.openNotificationCitizen();
    expect(viewDetails).not.toHaveBeenCalled();
    expect(component.notificationError).toContain('no longer available');
  });

  it('consumes the target so later refreshes do not reopen the dialog', () => {
    component.users = [{ id: 'target-id', verification_status: 'pending' }];
    component.openNotificationCitizen();
    component.openNotificationCitizen();
    expect(viewDetails).toHaveBeenCalledTimes(1);
    expect(loadUsers).toHaveBeenCalledTimes(1);
  });
});
