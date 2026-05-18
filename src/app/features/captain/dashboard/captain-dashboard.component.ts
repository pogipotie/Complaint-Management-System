import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ComplaintsService } from '../../../core/services/complaints.service';
import { firstValueFrom } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-captain-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, BaseChartDirective, RouterModule],
  template: `
    <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <!-- Header Area -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase" style="font-family: 'Arial Black', Impact, sans-serif;">
            Barangay Overview
          </h1>
          <p class="text-sm font-bold text-gray-600 uppercase tracking-widest mt-1">Manage local issues</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <!-- Total -->
        <div class="relative group">
          <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-2 translate-y-2 transition-transform group-hover:translate-x-2.5 group-hover:translate-y-2.5"></div>
          <mat-card class="relative !rounded-sm !border-2 !border-gray-900 !bg-white !shadow-none h-full transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
            <mat-card-content class="!p-6 flex items-center space-x-4">
              <div class="flex-shrink-0 bg-primary-100 p-3 rounded-full border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                <mat-icon class="text-primary-600 scale-150">folder_open</mat-icon>
              </div>
              <div>
                <p class="text-[11px] font-black text-gray-500 uppercase tracking-widest m-0">Total Complaints</p>
                <p class="text-3xl font-black text-gray-900 m-0 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ totalComplaints }}</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Pending -->
        <div class="relative group">
          <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-2 translate-y-2 transition-transform group-hover:translate-x-2.5 group-hover:translate-y-2.5"></div>
          <mat-card class="relative !rounded-sm !border-2 !border-gray-900 !bg-white !shadow-none h-full transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
            <mat-card-content class="!p-6 flex items-center space-x-4">
              <div class="flex-shrink-0 bg-yellow-100 p-3 rounded-full border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                <mat-icon class="text-yellow-600 scale-150">pending_actions</mat-icon>
              </div>
              <div>
                <p class="text-[11px] font-black text-gray-500 uppercase tracking-widest m-0">Pending Action</p>
                <p class="text-3xl font-black text-gray-900 m-0 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ pendingComplaints }}</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- In Progress -->
        <div class="relative group">
          <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-2 translate-y-2 transition-transform group-hover:translate-x-2.5 group-hover:translate-y-2.5"></div>
          <mat-card class="relative !rounded-sm !border-2 !border-gray-900 !bg-white !shadow-none h-full transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
            <mat-card-content class="!p-6 flex items-center space-x-4">
              <div class="flex-shrink-0 bg-blue-100 p-3 rounded-full border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                <mat-icon class="text-blue-600 scale-150">autorenew</mat-icon>
              </div>
              <div>
                <p class="text-[11px] font-black text-gray-500 uppercase tracking-widest m-0">In Progress</p>
                <p class="text-3xl font-black text-gray-900 m-0 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ inProgressComplaints }}</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Resolved -->
        <div class="relative group">
          <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-2 translate-y-2 transition-transform group-hover:translate-x-2.5 group-hover:translate-y-2.5"></div>
          <mat-card class="relative !rounded-sm !border-2 !border-gray-900 !bg-white !shadow-none h-full transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
            <mat-card-content class="!p-6 flex items-center space-x-4">
              <div class="flex-shrink-0 bg-green-100 p-3 rounded-full border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                <mat-icon class="text-green-600 scale-150">check_circle</mat-icon>
              </div>
              <div>
                <p class="text-[11px] font-black text-gray-500 uppercase tracking-widest m-0">Resolved</p>
                <p class="text-3xl font-black text-gray-900 m-0 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ resolvedComplaints }}</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <!-- Status Distribution Chart -->
        <div class="relative group">
          <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
          <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
            <div class="border-b-2 border-gray-900 bg-gray-50 p-4 flex justify-between items-center">   
              <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Status Distribution</h3>
            </div>
            <div class="p-6 h-[300px] flex items-center justify-center">
              <canvas baseChart *ngIf="totalComplaints > 0"
                [data]="statusChartData"
                [type]="'doughnut'"
                [options]="doughnutOptions">
              </canvas>
              <p *ngIf="totalComplaints === 0" class="text-gray-400 font-bold uppercase tracking-wider text-sm">No data available</p>
            </div>
          </div>
        </div>

        <!-- Complaints by Category Chart -->
        <div class="relative group">
          <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
          <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
            <div class="border-b-2 border-gray-900 bg-gray-50 p-4 flex justify-between items-center">   
              <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Complaints by Category</h3>
              <a mat-button color="primary" routerLink="/captain/complaints" class="!font-black uppercase tracking-wider text-xs">View All &rarr;</a>
            </div>
            <div class="p-6 h-[300px] flex items-center justify-center">
              <canvas baseChart *ngIf="totalComplaints > 0"
                [data]="categoryChartData"
                [type]="'bar'"
                [options]="categoryBarOptions">
              </canvas>
              <p *ngIf="totalComplaints === 0" class="text-gray-400 font-bold uppercase tracking-wider text-sm">No data available</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class CaptainDashboardComponent implements OnInit {
  private complaintsService = inject(ComplaintsService);

  totalComplaints = 0;
  pendingComplaints = 0;
  inProgressComplaints = 0;
  resolvedComplaints = 0;

  statusChartData: any = {
    labels: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0] }]
  };

  categoryChartData: any = {
    labels: [],
    datasets: [{ data: [], label: 'Complaints' }]
  };

  doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'right',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { family: "'Inter', 'Roboto', sans-serif", size: 12, weight: '500' },
          color: '#4b5563'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: { size: 13, family: "'Inter', 'Roboto', sans-serif" },
        bodyFont: { size: 13, family: "'Inter', 'Roboto', sans-serif" }
      }
    },
    cutout: '75%',
    layout: { padding: 10 },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#ffffff',
        borderRadius: 4
      }
    }
  };

  categoryBarOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        titleFont: { size: 13, family: "'Inter', 'Roboto', sans-serif" },
        bodyFont: { size: 13, family: "'Inter', 'Roboto', sans-serif" }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        border: { display: false },
        ticks: { 
          font: { family: "'Inter', 'Roboto', sans-serif", size: 10 }, 
          color: '#6b7280', 
          padding: 8,
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#f3f4f6', drawBorder: false, tickLength: 0 },
        ticks: { precision: 0, padding: 12, font: { family: "'Inter', 'Roboto', sans-serif", size: 12 }, color: '#9ca3af' }
      }
    },
    layout: { padding: { top: 20 } },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  async ngOnInit() {
    // Note: The RLS policies automatically filter these by the captain's barangay!
    const { data } = await firstValueFrom(this.complaintsService.getComplaints());
    if (data) {
      this.totalComplaints = data.length;
      this.pendingComplaints = data.filter((c: any) => c.status === 'pending').length;
      this.inProgressComplaints = data.filter((c: any) => c.status === 'in_progress' || c.status === 'assigned').length;
      this.resolvedComplaints = data.filter((c: any) => c.status === 'resolved' || c.status === 'closed').length;

      // Status Chart
      const statuses = ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'];
      const statusCounts = statuses.map(s => data.filter((c: any) => c.status === s).length);
      this.statusChartData = {
        labels: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
        datasets: [{ 
          data: statusCounts,
          backgroundColor: ['#fde047', '#93c5fd', '#4ade80', '#22c55e', '#16a34a', '#f87171'],
          hoverBackgroundColor: ['#facc15', '#60a5fa', '#22c55e', '#16a34a', '#15803d', '#ef4444'],
          borderWidth: 2,
          hoverOffset: 4
        }]
      };

      // Category Chart (Breakdown of issues in this barangay)
      const categoryCounts: { [key: string]: number } = {};
      data.forEach((c: any) => {
        if (c.category) {
          categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
        }
      });
      
      const sortedCategories = Object.keys(categoryCounts)
        .map(b => ({ name: b, count: categoryCounts[b] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 categories

      this.categoryChartData = {
        labels: sortedCategories.map(b => b.name),
        datasets: [{
          data: sortedCategories.map(b => b.count),
          backgroundColor: '#60a5fa', // Blue
          hoverBackgroundColor: '#3b82f6',
          borderRadius: 4,
          borderSkipped: false,
          barThickness: 24
        }]
      };
    }
  }
}
