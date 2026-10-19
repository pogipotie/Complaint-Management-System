import { Component, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CaptainPhotosService } from '../../core/services/captain-photos.service';

@Component({
  selector: 'app-captain-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img *ngIf="url; else initials" [src]="url" [alt]="name ? name + ' profile picture' : 'Captain profile picture'"
         (error)="url = null" class="w-full h-full object-cover">
    <ng-template #initials><span aria-hidden="true">{{ (name || 'Captain').charAt(0).toUpperCase() }}</span></ng-template>
  `,
  styles: [`
    :host { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; overflow: hidden; }
  `]
})
export class CaptainAvatarComponent implements OnChanges, OnDestroy {
  @Input() path: string | null = null;
  @Input() userId: string | null = null;
  @Input() name = '';
  url: string | null = null;
  private photos = inject(CaptainPhotosService);
  private version = 0;
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private changes: Subscription = this.photos.changed$.subscribe(change => {
    if (change.userId === this.userId) {
      this.path = change.path;
      void this.refresh();
    }
  });

  ngOnChanges() { void this.refresh(); }

  private async refresh() {
    clearTimeout(this.refreshTimer);
    const version = ++this.version;
    this.url = null;
    const url = await this.photos.resolve(this.path);
    if (version !== this.version) return;
    this.url = url;
    if (url) this.refreshTimer = setTimeout(() => void this.refresh(), 3300000);
  }

  ngOnDestroy() {
    ++this.version;
    clearTimeout(this.refreshTimer);
    this.changes.unsubscribe();
  }
}
