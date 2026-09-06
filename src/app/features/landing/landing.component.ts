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
      <mat-toolbar class="bg-white sticky top-0 z-50 border-b border-gray-100 px-4 sm:px-6 lg:px-8 h-20 shadow-sm">
        <div class="max-w-7xl mx-auto w-full flex items-center justify-between">

          <!-- Logo -->
          <div class="flex items-center gap-3 cursor-pointer" routerLink="/">
            <img src="homapage/logo.png" alt="Municipality Logo" class="h-12 w-12 object-contain">
            <span class="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">Complaint Management System</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <button mat-button (click)="openLoginModal()" class="text-gray-900 font-semibold text-base">Log in</button>
            <a mat-flat-button color="primary" routerLink="/auth/register" class="!rounded-full !px-7 !py-1 !font-semibold !text-base !bg-primary-600">Sign up</a>
          </div>

        </div>
      </mat-toolbar>

      <main class="flex-grow">

        <!-- Hero Section with Municipality Background -->
        <section class="relative overflow-hidden">
          <!-- Background image of municipality -->
          <div class="absolute inset-0 z-0">
            <img src="homapage/municipality.png" alt="Municipality Building" class="w-full h-full object-cover">
            <!-- Soft overlay only at edges for text readability -->
            <div class="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent"></div>
          </div>

          <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
            <div class="flex flex-col lg:flex-row items-center gap-8">

              <!-- Text Content -->
              <div class="lg:w-1/2 text-center lg:text-left">
                <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
                  Empowering our <span class="text-primary-600">Community</span><br>
                  Together
                </h1>

                <p class="mt-4 text-base sm:text-lg text-gray-700 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  A modern, transparent, and highly responsive platform for citizens to report local issues, track municipality progress, and ensure a better living environment for everyone.
                </p>

                <div class="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                  <a mat-flat-button color="primary" routerLink="/auth/register" class="!h-14 !px-8 !text-base !rounded-full !bg-primary-600 !font-semibold shadow-lg hover:shadow-xl transition-all">
                    Report an Issue
                    <mat-icon iconPositionEnd class="ml-1">arrow_forward</mat-icon>
                  </a>
                  <button mat-stroked-button (click)="openLoginModal()" class="!h-14 !px-8 !text-base !rounded-full bg-white text-gray-800 !border-gray-300 hover:bg-gray-50 !font-semibold">
                    Track Existing Complaint
                  </button>
                </div>
              </div>

              <!-- Official Seal / Logo -->
              <div class="lg:w-1/2 flex justify-center lg:justify-end lg:items-start pt-0 lg:-mt-8">
                <div class="relative">
                  <img src="homapage/logo.png" alt="Bayan ng Gonzaga Seal" class="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 object-contain drop-shadow-xl">
                </div>
              </div>

            </div>
          </div>
        </section>

        <!-- Hero Image Section -->
        <section class="relative z-20 pb-16">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
              <img src="Hero.png" alt="Complaint Management System" class="w-full h-auto object-cover">
            </div>
          </div>
        </section>

        <!-- Public Announcements Section -->
        <section class="bg-white py-12">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between mb-8">
              <div>
                <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
                  <mat-icon class="text-primary-600">campaign</mat-icon>
                  Municipality Announcements
                </h2>
                <p class="text-gray-500 mt-2 text-sm sm:text-base">Stay updated with the latest alerts and notices from the local government.</p>
              </div>
            </div>

            <div *ngIf="loadingAnnouncements" class="flex justify-center py-12">
              <mat-icon class="animate-spin text-primary-500 scale-150">autorenew</mat-icon>
            </div>

            <!-- Empty State -->
            <div *ngIf="!loadingAnnouncements && announcements.length === 0" class="bg-white border border-gray-200 shadow-sm rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[220px]">
              <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <mat-icon class="text-gray-400 scale-110">check_circle</mat-icon>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">No Active Announcements</h3>
              <p class="text-sm sm:text-base text-gray-500 max-w-md">There are currently no active alerts, road closures, or emergencies reported by the municipality.</p>
            </div>

            <!-- Active Announcements Grid -->
            <div *ngIf="!loadingAnnouncements && announcements.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div *ngFor="let ann of announcements" class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-3">
                  <mat-icon class="text-sm">schedule</mat-icon>
                  {{ ann.created_at | date:'MMM d, yyyy • h:mm a' }}
                </div>
                <h3 class="font-bold text-lg text-gray-900 mb-2">{{ ann.type }}</h3>
                <p class="text-sm text-gray-600 leading-relaxed">{{ ann.body }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Feature Highlights -->
        <section class="bg-white pb-16">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between mb-8">
              <div>
                <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
                  <mat-icon class="text-primary-600">star</mat-icon>
                  Core Features
                </h2>
                <p class="text-gray-500 mt-2 text-sm sm:text-base">Everything you need to report and track issues effectively.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

              <!-- Feature 1: Easy Complaint Submission -->
              <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                  <mat-icon class="scale-110">edit_square</mat-icon>
                </div>
                <h3 class="text-lg font-extrabold text-gray-900 mb-2">Easy Complaint Submission</h3>
                <p class="text-sm text-gray-500 leading-relaxed">Report issues in just a few steps with attachments and location.</p>
              </div>

              <!-- Feature 2: Real-time Tracking -->
              <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div class="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-5">
                  <mat-icon class="scale-110">pin_drop</mat-icon>
                </div>
                <h3 class="text-lg font-extrabold text-gray-900 mb-2">Real-time Tracking</h3>
                <p class="text-sm text-gray-500 leading-relaxed">Track the status of your complaint in real-time.</p>
              </div>

              <!-- Feature 3: Transparent Updates -->
              <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div class="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                  <mat-icon class="scale-110">visibility</mat-icon>
                </div>
                <h3 class="text-lg font-extrabold text-gray-900 mb-2">Transparent Updates</h3>
                <p class="text-sm text-gray-500 leading-relaxed">Stay informed with updates and municipality actions.</p>
              </div>

            </div>
          </div>
        </section>

      </main>

      <!-- Footer -->
      <footer class="bg-gray-900 text-white py-10 mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="flex items-center gap-2">
            <img src="homapage/logo.png" alt="Logo" class="h-8 w-8 object-contain">
            <span class="text-lg font-bold tracking-tight">Complaint Management System</span>
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
      background-color: #ffffff !important;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in-up {
      opacity: 0;
      animation: fadeInUp 0.8s ease-out forwards;
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
        setTimeout(() => {
          this.openLoginModal();
          this.router.navigate([], {
            queryParams: { action: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        }, 100);
      }
    });

    this.loadingAnnouncements = true;
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
