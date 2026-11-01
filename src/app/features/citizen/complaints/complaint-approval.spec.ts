import { ComplaintCreateComponent } from './complaint-create.component';

describe('Complaint approval submission gate', () => {
  it('rechecks approval before validating or uploading evidence', async () => {
    const upload = jasmine.createSpy();
    const context = {
      isVerified: false,
      checkVerificationStatus: jasmine.createSpy().and.resolveTo(),
      supabaseService: { uploadFile: upload }
    };
    await ComplaintCreateComponent.prototype.onSubmit.call(context as any);
    expect(context.checkVerificationStatus).toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect((context as any).errorMsg).toContain('approved by your Barangay Captain');
  });
  it('fails closed if approval cannot be checked', async () => {
    const context = {
      isVerified: true,
      checkVerificationStatus: jasmine.createSpy().and.rejectWith(new Error('offline'))
    };
    await ComplaintCreateComponent.prototype.onSubmit.call(context as any);
    expect((context as any).errorMsg).toContain('Unable to verify');
  });
});
