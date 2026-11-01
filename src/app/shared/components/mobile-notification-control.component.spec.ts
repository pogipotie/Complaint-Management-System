import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MobileNotificationControlComponent } from './mobile-notification-control.component';
import { MobileNotificationsService } from '../../core/services/mobile-notifications.service';

describe('Mobile notification controls', () => {
  let mobile: { isEnabled: jasmine.Spy; enable: jasmine.Spy; disable: jasmine.Spy };
  beforeEach(() => {
    mobile = {
      isEnabled: jasmine.createSpy().and.resolveTo(false),
      enable: jasmine.createSpy().and.resolveTo(),
      disable: jasmine.createSpy().and.resolveTo()
    };
    TestBed.configureTestingModule({
      imports: [MobileNotificationControlComponent],
      providers: [provideNoopAnimations(), { provide: MobileNotificationsService, useValue: mobile }]
    });
  });
  it('does not request permission until the user opts in', async () => {
    const fixture = TestBed.createComponent(MobileNotificationControlComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(mobile.enable).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Enable Mobile Notifications');
    await fixture.componentInstance.toggle();
    fixture.detectChanges();
    expect(mobile.enable).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Disable on this device');
  });
  it('disables only after a successful request', async () => {
    const fixture = TestBed.createComponent(MobileNotificationControlComponent);
    fixture.componentInstance.enabled = true;
    await fixture.componentInstance.toggle();
    expect(mobile.disable).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.enabled).toBeFalse();
  });
  it('shows delivery configuration errors without claiming success', async () => {
    mobile.enable.and.rejectWith(new Error('Mobile notifications are not configured yet.'));
    const fixture = TestBed.createComponent(MobileNotificationControlComponent);
    await fixture.componentInstance.toggle();
    expect(fixture.componentInstance.enabled).toBeFalse();
    expect(fixture.componentInstance.message).toContain('not configured');
    expect(fixture.componentInstance.busy).toBeFalse();
  });
});
