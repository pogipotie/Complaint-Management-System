import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MobileNotificationsService } from '../../core/services/mobile-notifications.service';

@Component({
  selector: 'app-mobile-notification-control',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <section class="mx-4 my-3 p-3 border-2 border-gray-900 bg-primary-50 rounded-sm"
      (click)="$event.stopPropagation()" aria-label="Mobile notification settings">
      <p class="text-xs font-black uppercase tracking-wider mb-1">Mobile Alerts</p>
      <p class="text-xs text-gray-700 mb-2">
        Registration and complaint alerts on this device, even when the app is closed.
        On iPhone, add this app to your Home Screen first.
      </p>
      <button mat-stroked-button class="!rounded-sm !border-gray-900 w-full"
        [disabled]="busy" (click)="toggle()">
        <mat-icon>{{ enabled ? 'notifications_off' : 'notifications_active' }}</mat-icon>
        {{ busy ? 'Please wait...' : enabled ? 'Disable on this device' : 'Enable Mobile Notifications' }}
      </button>
      <p *ngIf="message" class="text-xs mt-2 text-gray-900" role="status" aria-live="polite">{{ message }}</p>
    </section>
  `
})
export class MobileNotificationControlComponent implements OnInit {
  private readonly mobile = inject(MobileNotificationsService);
  enabled = false;
  busy = false;
  message = '';

  async ngOnInit() {
    try {
      this.enabled = await this.mobile.isEnabled();
    } catch {
      this.message = 'Mobile notifications are not configured yet.';
    }
  }

  async toggle() {
    this.busy = true;
    this.message = '';
    try {
      if (this.enabled) await this.mobile.disable();
      else await this.mobile.enable();
      this.enabled = !this.enabled;
      this.message = this.enabled ? 'Mobile notifications enabled on this device.' : 'Mobile notifications disabled.';
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Unable to update mobile notifications.';
    } finally {
      this.busy = false;
    }
  }
}
