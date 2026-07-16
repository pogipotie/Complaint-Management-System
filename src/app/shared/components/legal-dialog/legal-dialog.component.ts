import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-legal-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="bg-white rounded-sm border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] flex flex-col h-full max-h-[85vh]">
      
      <!-- Header -->
      <div mat-dialog-title class="pt-6 pb-4 px-6 sm:px-8 border-b-2 border-gray-900 m-0 bg-gray-50 flex justify-between items-center gap-4 shrink-0">
        <h2 class="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight m-0" style="font-family: 'Arial Black', Impact, sans-serif;">
          {{ data.type === 'privacy' ? 'Privacy Policy' : 'Terms of Service' }}
        </h2>
        <button mat-icon-button mat-dialog-close class="scale-90 text-gray-500 hover:text-gray-900 transition-colors">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content -->
      <mat-dialog-content class="!p-6 sm:!p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
        
        <!-- PRIVACY POLICY -->
        <div *ngIf="data.type === 'privacy'" class="space-y-6 text-gray-800 text-sm leading-relaxed font-medium">
          <p class="font-bold text-xs uppercase tracking-widest text-gray-500 mb-4">Last Updated: July 2026</p>
          
          <div>
            <h3 class="text-base font-black text-gray-900 uppercase tracking-tight mb-2">1. Introduction</h3>
            <p>Welcome to the Municipal Complaint Registration and Management System (CRMS). We value your privacy and are committed to protecting your personal data in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines.</p>
          </div>

          <div>
            <h3 class="text-base font-black text-gray-900 uppercase tracking-tight mb-2">2. Information We Collect</h3>
            <p class="mb-2">To provide you with effective services, we collect the following information during registration and complaint submission:</p>
            <ul class="list-disc pl-5 space-y-1 text-gray-700">
              <li><strong>Personal Details:</strong> Full name, Date of Birth, Gender, Civil Status, and Occupation.</li>
              <li><strong>Contact Information:</strong> Email address and Primary Phone Number.</li>
              <li><strong>Location Data:</strong> Barangay, Street Address, and exact GPS coordinates of reported issues.</li>
              <li><strong>Verification Data:</strong> Photographs of valid government-issued IDs to prove residency.</li>
            </ul>
          </div>

          <div>
            <h3 class="text-base font-black text-gray-900 uppercase tracking-tight mb-2">3. How We Use Your Information</h3>
            <p>Your data is used strictly for municipal operations, including:</p>
            <ul class="list-disc pl-5 space-y-1 text-gray-700 mt-2">
              <li>Verifying your identity and residency within the municipality.</li>
              <li>Locating and addressing the specific complaints or hazards you report.</li>
              <li>Communicating updates regarding your submitted complaints.</li>
              <li>Generating anonymized statistical reports for the Local Government Unit (LGU).</li>
            </ul>
          </div>

          <div>
            <h3 class="text-base font-black text-gray-900 uppercase tracking-tight mb-2">4. Data Sharing and Disclosure</h3>
            <p>We do not sell or rent your personal information. Your data is only accessible to authorized LGU personnel (Municipal Admins and Barangay Captains) who require it to resolve your complaint. We may disclose information if required by law or to protect public safety.</p>
          </div>

          <div>
            <h3 class="text-base font-black text-gray-900 uppercase tracking-tight mb-2">5. Data Retention and Security</h3>
            <p>We implement strict Row-Level Security (RLS) in our databases to ensure your data is secure. Unverified or rejected account data is automatically purged from our systems within 24 hours. Validated records are kept as long as necessary to fulfill official LGU record-keeping requirements.</p>
          </div>
        </div>


        <!-- TERMS OF SERVICE -->
        <div *ngIf="data.type === 'terms'" class="space-y-6 text-gray-800 text-sm leading-relaxed font-medium">
          <p class="font-bold text-xs uppercase tracking-widest text-gray-500 mb-4">Last Updated: July 2026</p>
          
          <div>
            <h3 class="text-base font-black text-gray-900 uppercase tracking-tight mb-2">1. Acceptance of Terms</h3>
            <p>By registering and using the Municipal Complaint Registration and Management System (CRMS), you agree to comply with and be bound by these Terms of Service. This platform is provided by the Local Government Unit (LGU) exclusively for its residents.</p>
          </div>

          <div>
            <h3 class="text-base font-black text-gray-900 uppercase tracking-tight mb-2">2. User Responsibilities and Conduct</h3>
            <p class="mb-2">As a registered citizen, you agree to:</p>
            <ul class="list-disc pl-5 space-y-1 text-gray-700">
              <li>Provide accurate, truthful, and current information during registration.</li>
              <li>Upload legitimate proof of residency (Valid IDs). Falsifying documents may result in a permanent ban and potential legal action.</li>
              <li>Report genuine community issues. Spamming, submitting false complaints, or using profane language in the discussion threads is strictly prohibited.</li>
            </ul>
          </div>

          <div>
            <h3 class="text-base font-black text-gray-900 uppercase tracking-tight mb-2">3. Complaint Resolution</h3>
            <p>While the LGU strives to address all complaints promptly, submission of a complaint does not guarantee an immediate resolution. Cases are prioritized based on severity (e.g., Emergencies vs. Low priority) and available municipal resources.</p>
          </div>

          <div>
            <h3 class="text-base font-black text-gray-900 uppercase tracking-tight mb-2">4. Account Suspension</h3>
            <p>The LGU reserves the right to suspend or permanently ban any account that violates these terms, submits fraudulent reports, or engages in abusive behavior toward municipal officials or other users.</p>
          </div>

          <div>
            <h3 class="text-base font-black text-gray-900 uppercase tracking-tight mb-2">5. Modifications to the Service</h3>
            <p>The LGU reserves the right to modify, suspend, or discontinue the CRMS platform (or any part thereof) at any time, with or without notice, to perform maintenance or upgrades.</p>
          </div>
        </div>

      </mat-dialog-content>

      <!-- Footer -->
      <mat-dialog-actions align="end" class="!px-6 sm:!px-8 !py-4 border-t-2 border-gray-900 m-0 bg-gray-50 shrink-0">
        <button mat-flat-button mat-dialog-close color="primary" class="!px-8 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider text-[11px]">I Understand</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      padding: 0 !important;
      border-radius: 4px !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f3f4f6;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #9ca3af;
      border-radius: 10px;
    }
  `]
})
export class LegalDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LegalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type: 'privacy' | 'terms' }
  ) {}
}