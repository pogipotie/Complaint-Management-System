import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { ComplaintsService } from '../../../core/services/complaints.service';

@Component({
  selector: 'app-transparency-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, BaseChartDirective],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Header Section -->
      <div class="flex flex-col gap-2 mb-8">
        <h2 class="text-3xl font-black leading-7 text-gray-900 sm:truncate sm:tracking-tight flex items-center gap-3 uppercase" style="font-family: 'Arial Black', Impact, sans-serif;">
          <mat-icon class="text-primary-600 scale-150 mr-2">insights</mat-icon>
          Public Transparency Dashboard
        </h2>
        <p class="mt-2 text-sm font-bold text-gray-600 uppercase tracking-widest">
          Live statistics on how our municipality is performing in resolving community issues.
        </p>
      </div>
      
      <div *ngIf="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <ng-container *ngIf="!loading">
        <!-- Top Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="relative group">
            <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
            <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 p-6">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full border-2 border-gray-900 bg-blue-100 text-blue-800 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                  <mat-icon>receipt_long</mat-icon>
                </div>
                <div>
                  <p class="text-[11px] font-black text-gray-500 uppercase tracking-widest">Total Reports</p>
                  <p class="text-3xl font-black text-gray-900 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ totalComplaints }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="relative group">
            <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
            <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 p-6">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full border-2 border-gray-900 bg-green-100 text-green-800 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                  <mat-icon>verified</mat-icon>
                </div>
                <div>
                  <p class="text-[11px] font-black text-gray-500 uppercase tracking-widest">Issues Resolved</p>
                  <p class="text-3xl font-black text-gray-900 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ resolvedComplaints }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="relative group">
            <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
            <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 p-6">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full border-2 border-gray-900 bg-primary-100 text-primary-800 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                  <mat-icon>timer</mat-icon>
                </div>
                <div>
                  <p class="text-[11px] font-black text-gray-500 uppercase tracking-widest">Resolution Rate</p>
                  <p class="text-3xl font-black text-gray-900 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ resolutionRate }}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div class="relative group">
            <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
            <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
              <div class="border-b-2 border-gray-900 bg-gray-50 p-4">
                <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Status Overview</h3>
              </div>
              <div class="p-6 h-[300px] flex items-center justify-center">
                <canvas baseChart *ngIf="totalComplaints > 0"
                  [data]="statusChartData"
                  [type]="'doughnut'"
                  [options]="doughnutOptions">
                </canvas>
                <p *ngIf="totalComplaints === 0" class="text-gray-400 font-bold uppercase text-sm">No data available</p>
              </div>
            </div>
          </div>
          
          <div class="relative group">
            <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
            <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
              <div class="border-b-2 border-gray-900 bg-gray-50 p-4">
                <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Top 5 Most Active Barangays</h3>
              </div>
              <div class="p-6 h-[300px] flex items-center justify-center">
                <canvas baseChart *ngIf="totalComplaints > 0"
                  [data]="barangayChartData"
                  [type]="'bar'"
                  [options]="barOptions">
                </canvas>
                <p *ngIf="totalComplaints === 0" class="text-gray-400 font-bold uppercase text-sm">No data available</p>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class TransparencyDashboardComponent implements OnInit {
  private complaintsService = inject(ComplaintsService);

  loading = true;
  totalComplaints = 0;
  resolvedComplaints = 0;
  resolutionRate = 0;

  statusChartData: any = null;
  barangayChartData: any = null;

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
        usePointStyle: true
      }
    },
    cutout: '75%',
    elements: {
      arc: { borderWidth: 2, borderColor: '#ffffff', borderRadius: 4 }
    }
  };

  barOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // horizontal bar chart
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { display: true, color: '#f3f4f6', drawBorder: false },
        border: { display: false },
        ticks: { font: { family: "'Inter', 'Roboto', sans-serif", size: 12 }, color: '#9ca3af' }
      },
      y: {
        grid: { display: false, drawBorder: false },
        border: { display: false },
        ticks: { font: { family: "'Inter', 'Roboto', sans-serif", size: 12 }, color: '#4b5563', padding: 8 }
      }
    },
    animation: { duration: 1000, easing: 'easeOutQuart' }
  };

  ngOnInit() {
    // Re-use getCommunityComplaints to fetch all public data (anonymized)
    this.complaintsService.getCommunityComplaints().subscribe(({ data, error }) => {
      this.loading = false;
      if (!error && data) {
        this.processData(data);
      }
    });
  }

  processData(data: any[]) {
    this.totalComplaints = data.length;
    
    const statuses = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];
    const counts: Record<string, number> = { pending: 0, assigned: 0, in_progress: 0, resolved: 0, closed: 0 };
    const barangayCounts: Record<string, number> = {};

    data.forEach(c => {
      if (counts[c.status] !== undefined) counts[c.status]++;
      
      const brgy = c.barangay || 'Unknown';
      barangayCounts[brgy] = (barangayCounts[brgy] || 0) + 1;
    });

    this.resolvedComplaints = counts['resolved'] + counts['closed'];
    this.resolutionRate = this.totalComplaints > 0 
      ? Math.round((this.resolvedComplaints / this.totalComplaints) * 100) 
      : 0;

    // Status Chart
    this.statusChartData = {
      labels: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
      datasets: [{ 
        data: [counts['pending'], counts['assigned'], counts['in_progress'], counts['resolved'], counts['closed']],
        backgroundColor: ['#facc15', '#93c5fd', '#4ade80', '#22c55e', '#16a34a'],
        hoverBackgroundColor: ['#eab308', '#60a5fa', '#22c55e', '#16a34a', '#15803d'],
        borderWidth: 2,
        hoverOffset: 4
      }]
    };

    // Top 5 Barangays Chart
    const sortedBarangays = Object.entries(barangayCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    this.barangayChartData = {
      labels: sortedBarangays.map(b => b[0]),
      datasets: [{ 
        data: sortedBarangays.map(b => b[1]),
        backgroundColor: '#4ade80',
        hoverBackgroundColor: '#22c55e',
        borderRadius: 4,
        barThickness: 24
      }]
    };
  }
}
