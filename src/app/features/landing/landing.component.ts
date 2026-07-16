import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { SupabaseService } from '../../core/services/supabase.service';
import { LoginComponent } from '../auth/login/login.component';
import { LegalDialogComponent } from '../../shared/components/legal-dialog/legal-dialog.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatToolbarModule, MatCardModule, MatDialogModule],
  template: `
    <div class="min-h-screen bg-white flex flex-col font-sans">
      
      <!-- Navigation Bar -->
      <mat-toolbar class="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 px-4 sm:px-6 lg:px-8 h-20">
        <div class="max-w-7xl mx-auto w-full flex items-center justify-between">
          
          <!-- Logo -->
          <div class="flex items-center gap-2 cursor-pointer" routerLink="/">
            <div class="bg-primary-600 p-2 rounded-lg text-white flex items-center justify-center">
              <mat-icon>domain</mat-icon>
            </div>
            <span class="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">Complaint Management System</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <button mat-button (click)="openLoginModal()" class="text-gray-600 font-medium">Log in</button>
            <a mat-flat-button color="primary" routerLink="/auth/register" class="!rounded-full px-6 py-1 font-semibold">Sign up</a>
          </div>

        </div>
      </mat-toolbar>

      <!-- Hero Section -->
      <main class="flex-grow relative">
        <!-- The Background Image -->
        <div class="absolute inset-0 z-0">
          <img src="Hero.png" alt="Hero Background" class="w-full h-full object-cover opacity-15">
        </div>
        
        <div class="relative overflow-hidden pt-16 pb-32 space-y-24 z-10">
          
          <!-- Background decoration -->
          <div class="absolute top-0 left-1/2 w-full -translate-x-1/2 -z-10 opacity-70">
            <svg viewBox="0 0 1024 1024" class="absolute top-1/2 left-1/2 h-[64rem] w-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0" aria-hidden="true">
              <circle cx="512" cy="512" r="512" fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fill-opacity="0.7" />
              <defs>
                <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                  <stop stop-color="#22c55e" />
                  <stop offset="1" stop-color="#86efac" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col lg:flex-row items-center gap-12">
              
              <!-- Text Content -->
              <div class="lg:w-1/2 text-center lg:text-left pt-10 lg:pt-0">
                <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
                  Empowering our <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-green-400">Community</span> <br class="hidden sm:block"> Together
                </h1>
                
                <p class="mt-4 text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0">
                  A modern, transparent, and highly responsive platform for citizens to report local issues, track municipality progress, and ensure a better living environment for everyone.
                </p>
                
                <div class="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                  <a mat-flat-button color="primary" routerLink="/auth/register" class="!h-14 !px-8 !text-lg !rounded-full shadow-lg hover:shadow-xl transition-all">
                    Report an Issue
                    <mat-icon iconPositionEnd>arrow_forward</mat-icon>
                  </a>
                  <button mat-stroked-button (click)="openLoginModal()" class="!h-14 !px-8 !text-lg !rounded-full bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                    Track Existing Complaint
                  </button>
                </div>
              </div>

              <!-- Hero Image Area -->
              <div class="lg:w-1/2 relative z-10 hidden sm:block">
                <!-- Decorative background blob -->
                <div class="absolute -inset-4 bg-gradient-to-tr from-primary-200 to-green-100 rounded-[3rem] blur-3xl opacity-60 -z-10"></div>
                
                <div class="relative rounded-2xl border border-gray-100 shadow-2xl overflow-hidden floating">
                  <img src="Hero.png" alt="Complaint Management Dashboard" class="w-full h-auto object-cover">
                </div>
              </div>

            </div>
          </div>

          <!-- Public Announcements Section -->
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
            <div class="flex items-center justify-between mb-8">
              <div>
                <h2 class="text-3xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
                  <mat-icon class="text-primary-600 scale-125">campaign</mat-icon>
                  Municipality Announcements
                </h2>
                <p class="text-gray-500 mt-2 text-base">Stay updated with the latest alerts and notices from the local government.</p>
              </div>
            </div>
            
            <div *ngIf="loadingAnnouncements" class="flex justify-center py-12">
              <mat-icon class="animate-spin text-primary-500 scale-150">autorenew</mat-icon>
            </div>

            <!-- Empty State -->
            <div *ngIf="!loadingAnnouncements && announcements.length === 0" class="bg-white border border-gray-100 shadow-sm rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[250px]">
              <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <mat-icon class="text-gray-400 scale-125">check_circle</mat-icon>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">No Active Announcements</h3>
              <p class="text-base text-gray-500 max-w-md">There are currently no active alerts, road closures, or emergencies reported by the municipality.</p>
            </div>

            <!-- Active Announcements Grid / Carousel -->
              <div *ngIf="!loadingAnnouncements && announcements.length > 0" class="flex overflow-x-auto snap-x snap-mandatory pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 hide-scrollbar">
                <div *ngFor="let ann of announcements" class="relative min-w-full sm:min-w-0 snap-center shrink-0">
                  
                  <!-- Retro offset shadow effect -->
                  <div class="absolute inset-0 bg-gray-900 rounded-xl translate-x-2 translate-y-2"></div>
                  
                  <!-- Main Card -->
                  <div class="relative bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden h-full flex flex-col"
                       [ngClass]="{
                          'bg-red-50': ann.type === 'Emergency',
                          'bg-orange-50': ann.type === 'Road Closure',
                          'bg-blue-50': ann.type === 'Water Interruption',
                          'bg-yellow-50': ann.type === 'Power Outage',
                          'bg-primary-50': ann.type === 'General Info'
                       }">
                  
                  <!-- Retro Window Header -->
                  <div class="h-10 border-b-[3px] border-gray-900 flex items-center justify-between px-4 shrink-0"
                       [ngClass]="{
                          'bg-red-200': ann.type === 'Emergency',
                          'bg-orange-200': ann.type === 'Road Closure',
                          'bg-blue-200': ann.type === 'Water Interruption',
                          'bg-yellow-200': ann.type === 'Power Outage',
                          'bg-primary-200': ann.type === 'General Info'
                       }">
                    <span class="font-black text-[10px] sm:text-xs tracking-widest text-gray-900">
                      {{ ann.created_at | date:'MM.dd.yyyy' }}
                    </span>
                    <div class="flex gap-1.5">
                      <div class="w-3 h-3 rounded-full border-2 border-gray-900 bg-white"></div>
                      <div class="w-3 h-3 rounded-full border-2 border-gray-900 bg-white"></div>
                      <div class="w-3 h-3 rounded-full border-2 border-gray-900 bg-white"></div>
                    </div>
                  </div>

                  <!-- Content Body -->
                  <div class="p-6 flex-1 flex flex-col justify-center text-center">
                    <h3 class="font-black text-2xl sm:text-3xl text-gray-900 uppercase tracking-tight mb-2" style="font-family: 'Arial Black', Impact, sans-serif;">
                      {{ ann.type }}
                    </h3>
                    
                    <p class="font-bold text-sm sm:text-base text-gray-800 uppercase tracking-widest mb-6">
                      {{ ann.created_at | date:'shortTime' }}
                    </p>

                    <p class="font-bold text-sm sm:text-base text-gray-900 leading-snug">
                      {{ ann.body }}
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <!-- Feature Highlights -->
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
            <div class="flex items-center justify-between mb-8">
              <div>
                <h2 class="text-3xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
                  <mat-icon class="text-primary-600 scale-125">stars</mat-icon>
                  Core Features
                </h2>
                <p class="text-gray-500 mt-2 text-base">Everything you need to report and track issues effectively.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <!-- Feature 1 -->
              <div class="relative group">
                <!-- Retro offset shadow effect -->
                <div class="absolute inset-0 bg-gray-900 rounded-xl translate-x-2 translate-y-2 transition-transform group-hover:translate-x-3 group-hover:translate-y-3"></div>
                <!-- Main Card -->
                <div class="relative bg-primary-50 border-[3px] border-gray-900 rounded-xl overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1">
                  <!-- Retro Window Header -->
                  <div class="h-10 border-b-[3px] border-gray-900 flex items-center justify-between px-4 shrink-0 bg-primary-200">
                    <span class="font-black text-[10px] sm:text-xs tracking-widest text-gray-900 uppercase">Feature 01</span>
                    <div class="flex gap-1.5">
                      <div class="w-3 h-3 rounded-full border-2 border-gray-900 bg-white"></div>
                      <div class="w-3 h-3 rounded-full border-2 border-gray-900 bg-white"></div>
                      <div class="w-3 h-3 rounded-full border-2 border-gray-900 bg-white"></div>
                    </div>
                  </div>
                  <!-- Content Body -->
                  <div class="p-6 flex-1 flex flex-col justify-center text-center">
                    <div class="w-16 h-16 bg-primary-200 rounded-full flex items-center justify-center mb-6 mx-auto border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                      <mat-icon class="text-primary-900 scale-125">location_on</mat-icon>
                    </div>
                    <h3 class="font-black text-xl sm:text-2xl text-gray-900 uppercase tracking-tight mb-4" style="font-family: 'Arial Black', Impact, sans-serif;">
                      Precise Location Pinning
                    </h3>
                    <p class="font-bold text-sm sm:text-base text-gray-800 leading-snug">
                      Use built-in GPS and interactive maps to pinpoint the exact location of potholes, broken streetlights, or hazards so our team can find them instantly.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Feature 2 -->
              <div class="relative group">
                <!-- Retro offset shadow effect -->
                <div class="absolute inset-0 bg-gray-900 rounded-xl translate-x-2 translate-y-2 transition-transform group-hover:translate-x-3 group-hover:translate-y-3"></div>
                <!-- Main Card -->
                <div class="relative bg-green-50 border-[3px] border-gray-900 rounded-xl overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1">
                  <!-- Retro Window Header -->
                  <div class="h-10 border-b-[3px] border-gray-900 flex items-center justify-between px-4 shrink-0 bg-green-200">
                    <span class="font-black text-[10px] sm:text-xs tracking-widest text-gray-900 uppercase">Feature 02</span>
                    <div class="flex gap-1.5">
                      <div class="w-3 h-3 rounded-full border-2 border-gray-900 bg-white"></div>
                      <div class="w-3 h-3 rounded-full border-2 border-gray-900 bg-white"></div>
                      <div class="w-3 h-3 rounded-full border-2 border-gray-900 bg-white"></div>
                    </div>
                  </div>
                  <!-- Content Body -->
                  <div class="p-6 flex-1 flex flex-col justify-center text-center">
                    <div class="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mb-6 mx-auto border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                      <mat-icon class="text-green-900 scale-125">notifications_active</mat-icon>
                    </div>
                    <h3 class="font-black text-xl sm:text-2xl text-gray-900 uppercase tracking-tight mb-4" style="font-family: 'Arial Black', Impact, sans-serif;">
                      Real-time Updates
                    </h3>
                    <p class="font-bold text-sm sm:text-base text-gray-800 leading-snug">
                      Receive instant notifications as soon as a Barangay Captain or Municipal Admin assigns, reviews, or resolves your reported issue.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Feature 3 -->
              <div class="relative group">
                <!-- Retro offset shadow effect -->
                <div class="absolute inset-0 bg-gray-900 rounded-xl translate-x-2 translate-y-2 transition-transform group-hover:translate-x-3 group-hover:translate-y-3"></div>
                <!-- Main Card -->
                <div class="relative bg-primary-50 border-[3px] border-gray-900 rounded-xl overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1">
                  <!-- Retro Window Header -->
                  <div class="h-10 border-b-[3px] border-gray-900 flex items-center justify-between px-4 shrink-0 bg-primary-200">
                    <span class="font-black text-[10px] sm:text-xs tracking-widest text-gray-900 uppercase">Feature 03</span>
                    <div class="flex gap-1.5">
                      <div class="w-3 h-3 rounded-full border-2 border-gray-900 bg-white"></div>
                      <div class="w-3 h-3 rounded-full border-2 border-gray-900 bg-white"></div>
                      <div class="w-3 h-3 rounded-full border-2 border-gray-900 bg-white"></div>
                    </div>
                  </div>
                  <!-- Content Body -->
                  <div class="p-6 flex-1 flex flex-col justify-center text-center">
                    <div class="w-16 h-16 bg-primary-200 rounded-full flex items-center justify-center mb-6 mx-auto border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                      <mat-icon class="text-primary-900 scale-125">verified_user</mat-icon>
                    </div>
                    <h3 class="font-black text-xl sm:text-2xl text-gray-900 uppercase tracking-tight mb-4" style="font-family: 'Arial Black', Impact, sans-serif;">
                      Verified Community
                    </h3>
                    <p class="font-bold text-sm sm:text-base text-gray-800 leading-snug">
                      A strictly moderated platform ensuring that real citizens connect directly with the local government for authentic problem resolution.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-gray-900 text-white py-12 mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="flex items-center gap-2">
            <mat-icon>domain</mat-icon>
            <span class="text-xl font-bold tracking-tight">Complaint Management System</span>
          </div>
          <p class="text-gray-400 text-sm">
            © 2026 Local Government Unit. All rights reserved.
          </p>
          <div class="flex gap-4 text-sm text-gray-400">
            <button (click)="openLegal('privacy')" class="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer">Privacy Policy</button>
            <button (click)="openLegal('terms')" class="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer">Terms of Service</button>
            <a href="mailto:support@municipality.gov.ph" class="hover:text-white transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>

    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    mat-toolbar {
      background-color: rgba(255, 255, 255, 0.9) !important;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in-up {
      opacity: 0;
      animation: fadeInUp 0.8s ease-out forwards;
    }

    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }

    .floating {
      animation: float 4s ease-in-out infinite;
    }

    /* Hide scrollbar for carousel but keep functionality */
    .hide-scrollbar {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
    .hide-scrollbar::-webkit-scrollbar {
      display: none; /* Chrome, Safari and Opera */
    }
  `]
})
export class LandingComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  announcements: any[] = [];
  loadingAnnouncements = true;

  async ngOnInit() {
    // Check if we need to auto-open the login modal (e.g. returning from registration)
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'login') {
        // Use setTimeout to ensure the view is initialized before opening dialog
        setTimeout(() => {
          this.openLoginModal();
          // Clear the query parameter so it doesn't re-open on refresh
          this.router.navigate([], {
            queryParams: { action: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        }, 100);
      }
    });

    this.loadingAnnouncements = true;
    // Fetch latest 3 announcements for the public landing page
    const { data, error } = await this.supabaseService.supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
      
    if (!error && data) {
      this.announcements = data;
    }
    this.loadingAnnouncements = false;
  }

  openLoginModal() {
    this.dialog.open(LoginComponent, {
      width: '95vw',
      maxWidth: '900px',
      panelClass: 'modern-dialog',
      autoFocus: false
    });
  }

  openLegal(type: 'privacy' | 'terms') {
    this.dialog.open(LegalDialogComponent, {
      width: '95vw',
      maxWidth: '700px',
      panelClass: 'modern-dialog',
      autoFocus: false,
      data: { type }
    });
  }
}
