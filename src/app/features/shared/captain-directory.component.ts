import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CaptainDirectoryService, CaptainPublicProfile } from '../../core/services/captain-directory.service';
import { CaptainAvatarComponent } from '../../shared/components/captain-avatar.component';

@Component({
  selector: 'app-captain-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, CaptainAvatarComponent],
  template: `
    <div class="min-h-screen bg-gray-50 text-gray-900">
      <nav class="bg-white border-b-2 border-gray-900 px-6 py-4"><a routerLink="/" class="font-bold">Back to Home</a></nav>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <header class="border-b-4 border-gray-900 pb-8 mb-8">
          <p class="text-xs font-black uppercase tracking-widest text-primary-700 mb-3">Know Your Local Officials</p>
          <h1 class="text-3xl sm:text-5xl font-black uppercase tracking-tight">Barangay Captains</h1>
          <p class="mt-4 text-gray-600 max-w-2xl">Find your barangay captain and official office contacts. Only administrator-approved profiles are shown.</p>
        </header>
        <div class="flex flex-col sm:flex-row gap-4 mb-8">
          <div class="flex-1">
            <label for="captain-search" class="block text-sm font-bold mb-2">Search Name or Barangay</label>
            <input id="captain-search" [(ngModel)]="search" class="w-full border-2 border-gray-900 rounded-sm bg-white p-3">
          </div>
          <button mat-stroked-button (click)="load()" [disabled]="loading" class="self-end">Refresh</button>
        </div>
        <p *ngIf="loading" role="status" class="py-12 text-center">Loading approved profiles...</p>
        <p *ngIf="error" role="alert" class="bg-red-50 border-2 border-red-700 p-4 text-red-700">{{ error }}</p>
        <p *ngIf="!loading && !error && !filtered.length" class="py-12 text-center border-2 border-dashed border-gray-400">
          {{ profiles.length ? 'No profiles match your search.' : 'No approved captain profiles are available yet.' }}
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article *ngFor="let profile of filtered" class="bg-white border-2 border-gray-900 rounded-sm shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] overflow-hidden">
            <header class="p-6 bg-primary-50 border-b-2 border-gray-900 flex gap-4 items-center">
              <div class="h-20 w-20 shrink-0 border-2 border-gray-900 bg-white overflow-hidden text-2xl font-black">
                <app-captain-avatar [path]="profile.photo_path" [name]="profile.full_name"></app-captain-avatar>
              </div>
              <div class="min-w-0"><p class="text-xs uppercase tracking-widest font-bold text-primary-700">{{ profile.barangay }}</p>
                <h2 class="text-xl font-black break-words">{{ profile.full_name }}</h2>
                <p class="text-sm">{{ profile.official_title }}</p>
              </div>
            </header>
            <div class="p-6 space-y-4 text-sm">
              <p *ngIf="profile.term_start || profile.term_end"><strong>Term:</strong> {{ (profile.term_start | date:'mediumDate') || 'Not specified' }} to {{ (profile.term_end | date:'mediumDate') || 'Not specified' }}</p>
              <p *ngIf="profile.office_address"><strong>Office:</strong> {{ profile.office_address }}</p>
              <p *ngIf="profile.office_hours"><strong>Office Hours:</strong> {{ profile.office_hours }}</p>
              <p *ngIf="profile.official_phone"><strong>Office Phone:</strong> {{ profile.official_phone }}</p>
              <p *ngIf="profile.official_email" class="break-all"><strong>Office Email:</strong> {{ profile.official_email }}</p>
              <p *ngIf="profile.biography" class="whitespace-pre-wrap border-t-2 border-gray-200 pt-4">{{ profile.biography }}</p>
            </div>
          </article>
        </div>
      </main>
    </div>
  `
})
export class CaptainDirectoryComponent implements OnInit {
  private directory = inject(CaptainDirectoryService);
  profiles: CaptainPublicProfile[] = [];
  search = '';
  loading = true;
  error = '';
  get filtered() {
    const term = this.search.trim().toLowerCase();
    return this.profiles.filter(profile => `${profile.full_name} ${profile.barangay}`.toLowerCase().includes(term));
  }
  ngOnInit() { void this.load(); }
  async load() {
    this.loading = true;
    this.error = '';
    try { this.profiles = await this.directory.publicProfiles(); }
    catch (err: any) {
      this.profiles = [];
      this.error = 'Could not load the public directory. Please try again.';
    } finally { this.loading = false; }
  }
}
