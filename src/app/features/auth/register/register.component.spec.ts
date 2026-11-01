import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { RegisterComponent } from './register.component';

describe('Citizen registration policy acceptance', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let checkEmailExists: jasmine.Spy;
  let auth: {
    signUp: jasmine.Spy;
    signInWithPassword: jasmine.Spy;
    verifyOtp: jasmine.Spy;
    resend: jasmine.Spy;
  };
  let upload: jasmine.Spy;
  let insert: jasmine.Spy;

  beforeEach(async () => {
    checkEmailExists = jasmine.createSpy('checkEmailExists').and.resolveTo(false);
    auth = {
      signUp: jasmine.createSpy('signUp').and.resolveTo({ data: { session: null }, error: null }),
      signInWithPassword: jasmine.createSpy('signInWithPassword').and.resolveTo({
        error: { message: 'Email not confirmed' }
      }),
      verifyOtp: jasmine.createSpy('verifyOtp').and.resolveTo({
        data: { user: { id: 'citizen-id' } }, error: null
      }),
      resend: jasmine.createSpy('resend').and.resolveTo({ error: null })
    };
    upload = jasmine.createSpy('upload').and.resolveTo({ error: null });
    insert = jasmine.createSpy('insert').and.resolveTo({ error: null });

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: AuthService, useValue: { checkEmailExists } },
        { provide: SupabaseService, useValue: {
          supabase: {
            auth,
            storage: { from: () => ({ upload }) },
            from: () => ({ insert })
          }
        } }
      ]
    }).compileComponents();

    // Registration tests must not load Google Maps or contact external services.
    spyOn(RegisterComponent.prototype, 'loadGoogleMaps').and.stub();
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
    fixture.destroy();
  });

  function acceptPolicies() {
    component.registerForm.get('accepted_policies')!.setValue(true);
  }

  function fillRegistration() {
    component.registerForm.patchValue({
      email: 'citizen@example.test',
      password: 'password123',
      full_name: 'Test Citizen',
      date_of_birth: '1990-01-01',
      gender: 'Male',
      civil_status: 'Single',
      phone: '09123456789',
      barangay: 'Test Barangay',
      street_address: '123 Test Street',
      latitude: 18.26,
      longitude: 121.99,
      otp: '123456'
    });
    component.selectedFile = new File(['test'], 'id.jpeg', { type: 'image/jpeg' });
  }

  function nextButton(): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Next Step'))!;
  }

  it('starts unchecked and disables Next Step until explicitly checked', () => {
    expect(component.registerForm.get('accepted_policies')!.value).toBeFalse();
    expect(component.registerForm.get('accepted_policies')!.invalid).toBeTrue();
    expect(nextButton().disabled).toBeTrue();
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    expect(component.hasAcceptedPolicies).toBeTrue();
    expect(nextButton().disabled).toBeFalse();
    checkbox.click();
    fixture.detectChanges();
    expect(nextButton().disabled).toBeTrue();
  });

  it('blocks step navigation and email lookup without acceptance', async () => {
    fillRegistration();
    await component.nextStep();
    fixture.detectChanges();
    expect(component.currentStep).toBe(1);
    expect(checkEmailExists).not.toHaveBeenCalled();
    expect(component.registerForm.get('accepted_policies')!.touched).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Please agree');
  });

  it('still validates email and password after acceptance', async () => {
    acceptPolicies();
    await component.nextStep();
    expect(component.currentStep).toBe(1);
    expect(checkEmailExists).not.toHaveBeenCalled();
  });

  it('allows progression with valid account details and acceptance', async () => {
    fillRegistration();
    acceptPolicies();
    await component.nextStep();
    expect(component.currentStep).toBe(2);
    expect(checkEmailExists).toHaveBeenCalledWith('citizen@example.test');
  });

  for (const type of ['terms', 'privacy'] as const) {
    it(`opens ${type} without submitting, clearing data, or accepting automatically`, async () => {
      fillRegistration();
      const label = type === 'terms' ? 'User Agreement' : 'Privacy Policy';
      const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(candidate => candidate.textContent?.trim() === label)!;
      button.click();
      fixture.detectChanges();
      await fixture.whenStable();
      const overlay = TestBed.inject(OverlayContainer).getContainerElement();
      expect(overlay.textContent).toContain(label);
      const close = Array.from(overlay.querySelectorAll('button'))
        .find(candidate => candidate.textContent?.trim() === 'Close')!;
      close.click();
      expect(component.hasAcceptedPolicies).toBeFalse();
      expect(component.registerForm.get('email')!.value).toBe('citizen@example.test');
      expect(component.selectedFile).not.toBeNull();
      expect(auth.signUp).not.toHaveBeenCalled();
    });
  }

  it('preserves acceptance on Back and blocks progression if subsequently unchecked', async () => {
    fillRegistration();
    acceptPolicies();
    component.currentStep = 2;
    component.prevStep();
    expect(component.hasAcceptedPolicies).toBeTrue();
    component.registerForm.get('accepted_policies')!.setValue(false);
    await component.nextStep();
    expect(component.currentStep).toBe(1);
    expect(checkEmailExists).not.toHaveBeenCalled();
  });

  for (const step of [1, 3, 4]) {
    it(`blocks submission from step ${step} without acceptance`, async () => {
      fillRegistration();
      component.currentStep = step;
      await component.onSubmit();
      expect(component.currentStep).toBe(1);
      expect(auth.signUp).not.toHaveBeenCalled();
      expect(auth.verifyOtp).not.toHaveBeenCalled();
      expect(auth.resend).not.toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
      expect(insert).not.toHaveBeenCalled();
    });
  }

  it('routes an early Enter submission through step validation rather than signup', async () => {
    fillRegistration();
    acceptPolicies();
    await component.onSubmit();
    expect(component.currentStep).toBe(2);
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it('rechecks acceptance after an asynchronous email lookup', async () => {
    fillRegistration();
    acceptPolicies();
    component.currentStep = 3;
    checkEmailExists.and.callFake(async () => {
      component.registerForm.get('accepted_policies')!.setValue(false);
      return false;
    });
    await component.onSubmit();
    expect(auth.signUp).not.toHaveBeenCalled();
    expect(component.currentStep).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('sends the signup code with acceptance and retains it through the OTP step', async () => {
    fillRegistration();
    acceptPolicies();
    component.currentStep = 3;
    await component.onSubmit();
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'citizen@example.test', password: 'password123'
    });
    expect(component.currentStep).toBe(4);
    expect(component.hasAcceptedPolicies).toBeTrue();
    expect(upload).not.toHaveBeenCalled();
  });

  it('supports an existing unverified account after acceptance', async () => {
    fillRegistration();
    acceptPolicies();
    component.currentStep = 3;
    checkEmailExists.and.resolveTo(true);
    await component.onSubmit();
    expect(auth.resend).toHaveBeenCalledWith({ type: 'signup', email: 'citizen@example.test' });
    expect(auth.signUp).not.toHaveBeenCalled();
    expect(component.currentStep).toBe(4);
  });

  it('guards direct OTP verification and resend calls without acceptance', async () => {
    fillRegistration();
    component.currentStep = 4;
    component.resendTimer = 0;
    await component.verifyOtpAndComplete();
    await component.resendOtp();
    expect(auth.verifyOtp).not.toHaveBeenCalled();
    expect(auth.resend).not.toHaveBeenCalled();
  });

  it('allows code resending after acceptance', async () => {
    fillRegistration();
    acceptPolicies();
    component.currentStep = 4;
    component.resendTimer = 0;
    await component.resendOtp();
    expect(auth.resend).toHaveBeenCalled();
    expect(component.hasAcceptedPolicies).toBeTrue();
  });

  it('completes OTP registration and resets acceptance for the next registration', async () => {
    fillRegistration();
    acceptPolicies();
    component.currentStep = 4;
    await component.onSubmit();
    expect(auth.verifyOtp).toHaveBeenCalled();
    expect(upload).toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'citizen-id', role: 'citizen' }));
    expect(component.currentStep).toBe(1);
    expect(component.registerForm.get('accepted_policies')!.value).toBeFalse();
  });

  it('supports signup when email confirmation is disabled', async () => {
    fillRegistration();
    acceptPolicies();
    component.currentStep = 3;
    auth.signUp.and.resolveTo({ data: { session: {}, user: { id: 'citizen-id' } }, error: null });
    await component.onSubmit();
    expect(insert).toHaveBeenCalled();
    expect(component.hasAcceptedPolicies).toBeFalse();
  });

  it('blocks profile creation if acceptance changes during OTP verification', async () => {
    fillRegistration();
    acceptPolicies();
    component.currentStep = 4;
    auth.verifyOtp.and.callFake(async () => {
      component.registerForm.get('accepted_policies')!.setValue(false);
      return { data: { user: { id: 'citizen-id' } }, error: null };
    });
    await component.onSubmit();
    expect(upload).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });
});
