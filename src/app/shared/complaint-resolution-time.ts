import { formatDate } from '@angular/common';

export function formatResolutionTime(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) {
    return 'Resolution date unavailable';
  }
  return `${formatDate(value, 'MMM d, y, h:mm:ss a', 'en-US', '+0800')} (PHT)`;
}

export function resolutionCsvValue(complaint: { status?: string; resolved_at?: string | null }): string {
  return complaint.status === 'resolved' ? formatResolutionTime(complaint.resolved_at) : '';
}
