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
            <img src="homapage/logo.webp" alt="Municipality Logo" class="h-12 w-12 object-contain">
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
            <!-- Soft white overlay for readability -->
            <div class="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/30"></div>
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
              <div class="lg:w-1/2 flex justify-center lg:justify-end">
                <div class="relative">
                  <img src="homapage/logo.webp" alt="Bayan ng Gonzaga Seal" class="h-56 w-56 sm:h-64 sm:w-64 lg:h-80 lg:w-80 object-contain drop-shadow-2xl">
                </div>
              </div>

            </div>
          </div>
        </section>

        <!-- Dashboard Preview Section -->
        <section class="relative -mt-16 z-20 pb-12">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden p-6 sm:p-8 lg:p-10">
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

                <!-- Left text block -->
                <div class="lg:col-span-4">
                  <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-700 mb-4">
                    <mat-icon>verified_user</mat-icon>
                  </div>
                  <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-3">
                    Complaint<br>
                    Registration &amp;<br>
                    Management System
                  </h2>
                  <p class="text-primary-600 font-bold text-lg mb-6">Submit. Track. Resolve.</p>
                  <div class="flex items-center gap-3 text-sm text-gray-500">
                    <mat-icon class="text-primary-500">support_agent</mat-icon>
                    <span>24/7 citizen support</span>
                  </div>
                </div>

                <!-- Mock dashboard panel -->
                <div class="lg:col-span-8">
                  <div class="bg-slate-50 rounded-xl border border-gray-200 p-4 sm:p-5 shadow-inner">
                    <!-- Dashboard header -->
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-md bg-primary-600 flex items-center justify-center text-white">
                          <mat-icon class="text-base">dashboard</mat-icon>
                        </div>
                        <span class="font-semibold text-gray-800 text-sm sm:text-base">Dashboard</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-bold">3</div>
                        <div class="w-7 h-7 rounded-full bg-gray-200"></div>
                      </div>
                    </div>

                    <!-- Stat cards -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div class="bg-white rounded-lg p-3 border border-gray-100">
                        <div class="flex items-center gap-2 mb-1">
                          <div class="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                            <mat-icon class="text-blue-600 text-sm">inventory_2</mat-icon>
                          </div>
                          <span class="text-xs text-gray-500">Total</span>
                        </div>
                        <p class="text-xl font-extrabold text-gray-900">128</p>
                      </div>
                      <div class="bg-white rounded-lg p-3 border border-gray-100">
                        <div class="flex items-center gap-2 mb-1">
                          <div class="w-6 h-6 rounded bg-orange-100 flex items-center justify-center">
                            <mat-icon class="text-orange-600 text-sm">schedule</mat-icon>
                          </div>
                          <span class="text-xs text-gray-500">In Progress</span>
                        </div>
                        <p class="text-xl font-extrabold text-gray-900">45</p>
                      </div>
                      <div class="bg-white rounded-lg p-3 border border-gray-100">
                        <div class="flex items-center gap-2 mb-1">
                          <div class="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                            <mat-icon class="text-green-600 text-sm">check_circle</mat-icon>
                          </div>
                          <span class="text-xs text-gray-500">Resolved</span>
                        </div>
                        <p class="text-xl font-extrabold text-gray-900">67</p>
                      </div>
                      <div class="bg-white rounded-lg p-3 border border-gray-100">
                        <div class="flex items-center gap-2 mb-1">
                          <div class="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                            <mat-icon class="text-purple-600 text-sm">flag</mat-icon>
                          </div>
                          <span class="text-xs text-gray-500">Closed</span>
                        </div>
                        <p class="text-xl font-extrabold text-gray-900">16</p>
                      </div>
                    </div>

                    <!-- Status overview + workflow -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <!-- Status Overview -->
                      <div class="bg-white rounded-lg p-3 border border-gray-100">
                        <p class="text-xs font-semibold text-gray-700 mb-2">Status Overview</p>
                        <div class="flex items-center gap-3">
                          <!-- Donut chart -->
                          <div class="relative w-20 h-20 shrink-0">
                            <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" stroke-width="4"></circle>
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" stroke-width="4" stroke-dasharray="67 100" stroke-dashoffset="0"></circle>
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" stroke-width="4" stroke-dasharray="45 100" stroke-dashoffset="-67"></circle>
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#8b5cf6" stroke-width="4" stroke-dasharray="16 100" stroke-dashoffset="-112"></circle>
                            </svg>
                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                              <span class="text-sm font-extrabold text-gray-900">128</span>
                              <span class="text-[9px] text-gray-500">Total</span>
                            </div>
                          </div>
                          <div class="text-[10px] space-y-1">
                            <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-green-500"></span><span class="text-gray-600">Resolved 67</span></div>
                            <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-orange-500"></span><span class="text-gray-600">In Progress 45</span></div>
                            <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-purple-500"></span><span class="text-gray-600">Closed 16</span></div>
                          </div>
                        </div>
                      </div>

                      <!-- Workflow pipeline -->
                      <div class="bg-white rounded-lg p-3 border border-gray-100">
                        <p class="text-xs font-semibold text-gray-700 mb-3">Workflow</p>
                        <div class="flex items-center justify-between gap-1">
                          <div class="flex flex-col items-center">
                            <div class="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                              <mat-icon class="text-sm">edit_note</mat-icon>
                            </div>
                            <span class="text-[8px] text-gray-500 mt-1">Submit</span>
                          </div>
                          <div class="flex-1 h-0.5 bg-primary-200"></div>
                          <div class="flex flex-col items-center">
                            <div class="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                              <mat-icon class="text-sm">thumb_up</mat-icon>
                            </div>
                            <span class="text-[8px] text-gray-500 mt-1">Acknowledge</span>
                          </div>
                          <div class="flex-1 h-0.5 bg-primary-200"></div>
                          <div class="flex flex-col items-center">
                            <div class="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                              <mat-icon class="text-sm">autorenew</mat-icon>
                            </div>
                            <span class="text-[8px] text-gray-500 mt-1">In Progress</span>
                          </div>
                          <div class="flex-1 h-0.5 bg-primary-200"></div>
                          <div class="flex flex-col items-center">
                            <div class="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                              <mat-icon class="text-sm">check</mat-icon>
                            </div>
                            <span class="text-[8px] text-gray-500 mt-1">Resolved</span>
                          </div>
                          <div class="flex-1 h-0.5 bg-primary-200"></div>
                          <div class="flex flex-col items-center">
                            <div class="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                              <mat-icon class="text-sm">rate_review</mat-icon>
                            </div>
                            <span class="text-[8px] text-gray-500 mt-1">Feedback</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
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
            <img src="homapage/logo.webp" alt="Logo" class="h-8 w-8 object-contain">
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
