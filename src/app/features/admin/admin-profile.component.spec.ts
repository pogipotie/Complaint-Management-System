import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AdminProfileComponent } from './admin-profile.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { ADMIN_ROUTES } from './admin.routes';

describe('AdminProfileComponent', () => {
  let component: AdminProfileComponent;
  let single: jasmine.Spy;
  let update: jasmine.Spy;
  let eq: jasmine.Spy;
  let updateUser: jasmine.Spy;
  let getUser: jasmine.Spy;

  beforeEach(async () => {
    single = jasmine.createSpy().and.resolveTo({ data: {
      id: 'admin-id', role: 'admin', full_name: 'Municipal Admin',
      phone: '123', verification_status: 'verified', is_active: true
    }, error: null });
    const query = { select: jasmine.createSpy(), eq: jasmine.createSpy(), single };
    query.select.and.returnValue(query);
    eq = query.eq.and.returnValue(query);
    update = jasmine.createSpy().and.returnValue(query);
    updateUser = jasmine.createSpy().and.resolveTo({ error: null });
    getUser = jasmine.createSpy().and.resolveTo({ data: { user: { id: 'admin-id', email: 'admin@example.test' } }, error: null });
    await TestBed.configureTestingModule({
      imports: [AdminProfileComponent],
      providers: [provideNoopAnimations(), { provide: SupabaseService, useValue: { supabase: {
        auth: { getUser, updateUser }, from: () => ({ ...query, update })
      } } }]
    }).compileComponents();
    component = TestBed.createComponent(AdminProfileComponent).componentInstance;
    await component.loadProfile();
  });

  it('provides a profile route under the admin role guard', async () => {
    expect(ADMIN_ROUTES[0].data?.['roles']).toEqual(['admin']);
    const route = ADMIN_ROUTES[0].children?.find(route => route.path === 'profile');
    expect(route?.loadComponent).toBeDefined();
  });

  it('loads the current admin and email', () => {
    expect(component.userId).toBe('admin-id');
    expect(component.email).toBe('admin@example.test');
    expect(component.profileForm.controls.full_name.value).toBe('Municipal Admin');
    expect(component.loading).toBeFalse();
  });

  it('renders account details and separate profile and password forms', async () => {
    const fixture = TestBed.createComponent(AdminProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('admin@example.test');
    expect(page.querySelectorAll('form').length).toBe(2);
    expect(page.textContent).toContain('Save Changes');
    expect(page.textContent).toContain('Update Password');
    expect(page.querySelector('input[formControlName="role"]')).toBeNull();
  });

  it('updates only editable fields on the current admin account', async () => {
    component.profileForm.controls.full_name.setValue(' Updated Name ');
    await component.saveProfile();
    expect(update.calls.mostRecent().args[0]).toEqual({
      full_name: 'Updated Name', phone: '123', occupation: '', street_address: '',
      emergency_contact_name: '', emergency_contact_number: ''
    });
    expect(eq).toHaveBeenCalledWith('id', 'admin-id');
    expect(eq).toHaveBeenCalledWith('role', 'admin');
    expect(component.profileSuccess).toContain('successfully');
  });

  it('rejects empty names and mismatched or short passwords', async () => {
    component.profileForm.controls.full_name.setValue('   ');
    await component.saveProfile();
    expect(update).not.toHaveBeenCalled();
    component.passwordForm.setValue({ password: 'short', confirmPassword: 'short' });
    expect(component.passwordForm.invalid).toBeTrue();
    component.passwordForm.setValue({ password: 'LongPassword123!', confirmPassword: 'DifferentPassword123!' });
    await component.changePassword();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('changes the password through Auth and clears the fields', async () => {
    component.passwordForm.setValue({ password: 'LongPassword123!', confirmPassword: 'LongPassword123!' });
    await component.changePassword();
    expect(updateUser).toHaveBeenCalledWith({ password: 'LongPassword123!' });
    expect(component.passwordForm.controls.password.value).toBe('');
    expect(component.passwordSuccess).toContain('successfully');
    expect(update).not.toHaveBeenCalled();
  });

  it('shows save errors without reporting success', async () => {
    single.and.resolveTo({ data: null, error: new Error('Save failed') });
    await component.saveProfile();
    expect(component.profileError).toBe('Save failed');
    expect(component.profileSuccess).toBe('');
    expect(component.savingProfile).toBeFalse();
  });

  it('does not expose the form to missing sessions or non-admin profiles', async () => {
    single.and.resolveTo({ data: { role: 'brgy_captain' }, error: null });
    await component.loadProfile();
    expect(component.userId).toBeNull();
    getUser.and.resolveTo({ data: { user: null }, error: null });
    await component.loadProfile();
    expect(component.loadError).toContain('Sign in again');
    expect(component.loading).toBeFalse();
  });
});
