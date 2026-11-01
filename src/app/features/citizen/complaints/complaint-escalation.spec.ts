import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { ComplaintEscalationService, EscalationEligibility } from '../../../core/services/complaint-escalation.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ComplaintDetailDialogComponent, ConfirmDialogComponent } from './complaint-detail-dialog.component';

const initializeComplaintDialog = ComplaintDetailDialogComponent.prototype.ngOnInit;

describe('Complaint escalation controls', () => {
  let service: { eligibility: jasmine.Spy; escalate: jasmine.Spy };
  let eligibility: EscalationEligibility;

  beforeEach(async () => {
    eligibility = {
      can_escalate: true, eligible_at: '2026-11-01T00:00:00Z',
      server_now: '2026-11-01T01:00:00Z', status: 'pending', is_escalated: false,
      escalated_by: null, escalated_by_role: null, escalated_at: null, escalation_reason: null
    };
    service = {
      eligibility: jasmine.createSpy().and.callFake(async () => ({ ...eligibility })),
      escalate: jasmine.createSpy().and.resolveTo({
        is_escalated: true, escalated_by: 'citizen-id', escalated_by_role: 'citizen',
        escalated_at: '2026-11-01T01:00:00Z', escalation_reason: 'No action on my complaint.'
      })
    };
    await TestBed.configureTestingModule({
      imports: [ComplaintDetailDialogComponent, ConfirmDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: SupabaseService, useValue: { supabase: {
          auth: { getUser: async () => ({ data: { user: { id: 'citizen-id' } } }) },
          from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role: 'citizen' } }) }) }) }),
          removeChannel: jasmine.createSpy()
        } } },
        { provide: ComplaintEscalationService, useValue: service },
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {
          id: 'complaint-id', created_by: 'citizen-id', title: 'Test complaint',
          status: 'pending', priority: 'low', description: 'Report description',
          is_escalated: false, created_at: '2026-10-31T00:00:00Z'
        } }
      ]
    }).compileComponents();
    spyOn(ComplaintDetailDialogComponent.prototype, 'ngOnInit').and.resolveTo();
  });

  function create() {
    const fixture = TestBed.createComponent(ComplaintDetailDialogComponent);
    const component = fixture.componentInstance;
    component.currentUserId = 'citizen-id';
    component.currentRole = 'citizen';
    component.isCitizen = true;
    spyOn(component, 'loadComments').and.resolveTo();
    component.eligibility = { ...eligibility };
    fixture.detectChanges();
    return { fixture, component };
  }

  function escalationButton(element: HTMLElement) {
    return Array.from(element.querySelectorAll('button'))
      .find(button => button.textContent?.includes('Escalate to Admin'));
  }

  it('loads eligibility only after identifying the authenticated owner', async () => {
    const fixture = TestBed.createComponent(ComplaintDetailDialogComponent);
    const component = fixture.componentInstance;
    spyOn(component, 'loadComments').and.resolveTo();
    spyOn(component, 'subscribeToComments').and.stub();
    await initializeComplaintDialog.call(component);
    expect(service.eligibility).toHaveBeenCalledWith('complaint-id');
    expect(component.showEscalationAction).toBeTrue();
    fixture.destroy();
  });

  it('shows an eligible owner the escalation button', () => {
    const { fixture } = create();
    expect(escalationButton(fixture.nativeElement)?.disabled).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('No captain action in the last 24 hours');
    fixture.destroy();
  });

  it('shows resolution time in both the details and PDF template', () => {
    const { fixture, component } = create();
    component.data.status = 'resolved';
    component.data.resolved_at = '2026-11-02T07:45:12Z';
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text.match(/Nov 2, 2026, 3:45:12 PM \(PHT\)/g)?.length).toBe(2);
    component.data.resolved_at = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Resolution date unavailable');
    component.data.status = 'pending';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Resolved On');
    fixture.destroy();
  });

  it('disables escalation during the 24-hour waiting period and displays the date', async () => {
    eligibility.can_escalate = false;
    const { fixture, component } = create();
    const open = spyOn(fixture.debugElement.injector.get(MatDialog), 'open');
    await component.escalateComplaint();
    fixture.detectChanges();
    expect(escalationButton(fixture.nativeElement)?.disabled).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Available on');
    expect(open).not.toHaveBeenCalled();
    expect(service.escalate).not.toHaveBeenCalled();
    fixture.destroy();
  });

  for (const status of ['resolved', 'rejected']) {
    it(`hides escalation for a ${status} complaint`, async () => {
      const { fixture, component } = create();
      component.data.status = status;
      fixture.detectChanges();
      await component.escalateComplaint();
      expect(escalationButton(fixture.nativeElement)).toBeUndefined();
      expect(service.escalate).not.toHaveBeenCalled();
      fixture.destroy();
    });
  }

  it('hides escalation from other citizens and admins', () => {
    const { fixture, component } = create();
    component.currentUserId = 'other-citizen';
    fixture.detectChanges();
    expect(escalationButton(fixture.nativeElement)).toBeUndefined();
    component.currentRole = 'admin';
    fixture.detectChanges();
    expect(escalationButton(fixture.nativeElement)).toBeUndefined();
    fixture.destroy();
  });

  it('keeps captain escalation available without a citizen waiting period', async () => {
    const { fixture, component } = create();
    component.currentRole = 'brgy_captain';
    component.isCitizen = false;
    const open = spyOn(fixture.debugElement.injector.get(MatDialog), 'open').and.returnValue({
      afterClosed: () => of('Municipal resources are required.')
    } as any);
    await component.escalateComplaint();
    const dialogData = open.calls.mostRecent().args[1]?.data as { message: string };
    expect(dialogData.message).toContain('municipal assistance');
    expect(service.escalate).toHaveBeenCalledWith('complaint-id', 'Municipal resources are required.');
    fixture.destroy();
  });

  it('requires confirmation and sends the reason through the protected service', async () => {
    const { fixture, component } = create();
    spyOn(fixture.debugElement.injector.get(MatDialog), 'open').and.returnValue({
      afterClosed: () => of('No action on my complaint.')
    } as any);
    await component.escalateComplaint();
    fixture.detectChanges();
    expect(service.escalate).toHaveBeenCalledWith('complaint-id', 'No action on my complaint.');
    expect(component.data.escalated_by_role).toBe('citizen');
    expect(component.data.is_escalated).toBeTrue();
    expect(escalationButton(fixture.nativeElement)).toBeUndefined();
    expect(fixture.nativeElement.textContent).toContain('Escalation Record');
    expect(component.loadComments).toHaveBeenCalled();
    fixture.destroy();
  });

  it('does not escalate when confirmation is dismissed or the reason is blank', async () => {
    const { fixture, component } = create();
    const open = spyOn(fixture.debugElement.injector.get(MatDialog), 'open').and.returnValue({
      afterClosed: () => of(undefined)
    } as any);
    await component.escalateComplaint();
    open.and.returnValue({ afterClosed: () => of('   ') } as any);
    await component.escalateComplaint();
    expect(service.escalate).not.toHaveBeenCalled();
    expect(component.escalating).toBeFalse();
    fixture.destroy();
  });

  it('ignores repeated clicks while the confirmation is open', async () => {
    const { fixture, component } = create();
    const closed = new Subject<string | undefined>();
    const open = spyOn(fixture.debugElement.injector.get(MatDialog), 'open').and.returnValue({
      afterClosed: () => closed
    } as any);
    const first = component.escalateComplaint();
    await Promise.resolve();
    await Promise.resolve();
    await component.escalateComplaint();
    expect(open).toHaveBeenCalledTimes(1);
    closed.next(undefined);
    await first;
    fixture.destroy();
  });

  it('rechecks captain activity before opening confirmation', async () => {
    const { fixture, component } = create();
    eligibility.can_escalate = false;
    const open = spyOn(fixture.debugElement.injector.get(MatDialog), 'open');
    await component.escalateComplaint();
    expect(open).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('shows server rejection and reloads eligibility when action occurs during confirmation', async () => {
    const { fixture, component } = create();
    spyOn(fixture.debugElement.injector.get(MatDialog), 'open').and.returnValue({
      afterClosed: () => of('Still waiting for assistance.')
    } as any);
    service.escalate.and.callFake(async () => {
      eligibility.can_escalate = false;
      throw new Error('Escalation is available after 24 hours without captain action.');
    });
    await component.escalateComplaint();
    fixture.detectChanges();
    expect(component.data.is_escalated).toBeFalse();
    expect(component.eligibility?.can_escalate).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('24 hours');
    fixture.destroy();
  });

  it('fails closed if eligibility cannot be checked and supports a successful retry', async () => {
    const { fixture, component } = create();
    service.eligibility.and.rejectWith(new Error('Unavailable'));
    await component.refreshEscalationEligibility();
    fixture.detectChanges();
    expect(escalationButton(fixture.nativeElement)?.disabled).toBeTrue();
    service.eligibility.and.resolveTo({ ...eligibility });
    await component.refreshEscalationEligibility();
    expect(component.escalationError).toBe('');
    fixture.destroy();
  });

  it('does not escalate when the details dialog was destroyed during confirmation', async () => {
    const { fixture, component } = create();
    spyOn(fixture.debugElement.injector.get(MatDialog), 'open').and.returnValue({
      afterClosed: () => {
        fixture.destroy();
        return of('No action on my complaint.');
      }
    } as any);
    await component.escalateComplaint();
    expect(service.escalate).not.toHaveBeenCalled();
  });

  it('requires a trimmed reason of 10-2000 characters and has one Close control', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentInstance.data = {
      title: 'Escalate to Admin', message: 'Describe the reason.', confirmText: 'Escalate', requireReason: true
    };
    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const confirm = buttons.find(button => button.textContent?.trim() === 'Escalate')!;
    expect(confirm.disabled).toBeTrue();
    fixture.componentInstance.reason = '          ';
    fixture.detectChanges();
    expect(confirm.disabled).toBeTrue();
    fixture.componentInstance.reason = 'No action on my complaint.';
    fixture.detectChanges();
    expect(confirm.disabled).toBeFalse();
    fixture.componentInstance.reason = 'x'.repeat(2001);
    fixture.detectChanges();
    expect(confirm.disabled).toBeTrue();
    expect(buttons.filter(button => button.textContent?.trim() === 'Close').length).toBe(1);
    fixture.destroy();
  });
});

describe('Complaint escalation service', () => {
  it('uses RPC endpoints and trims the reason', async () => {
    const rpc = jasmine.createSpy().and.resolveTo({ data: { is_escalated: true }, error: null });
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { supabase: { rpc } } }]
    });
    const service = TestBed.inject(ComplaintEscalationService);
    await service.eligibility('complaint-id');
    await service.escalate('complaint-id', '  Please intervene.  ');
    expect(rpc).toHaveBeenCalledWith('get_complaint_escalation_eligibility', { cid: 'complaint-id' });
    expect(rpc).toHaveBeenCalledWith('escalate_complaint', { cid: 'complaint-id', reason: 'Please intervene.' });
  });

  it('propagates server eligibility and escalation errors', async () => {
    const error = new Error('Not eligible');
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: {
        supabase: { rpc: async () => ({ data: null, error }) }
      } }]
    });
    const service = TestBed.inject(ComplaintEscalationService);
    await expectAsync(service.eligibility('complaint-id')).toBeRejectedWith(error);
    await expectAsync(service.escalate('complaint-id', 'Please intervene.')).toBeRejectedWith(error);
  });
});
