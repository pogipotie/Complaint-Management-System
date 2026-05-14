import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ComplaintsService } from '../../../core/services/complaints.service';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="space-y-6">
      
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <!-- Total -->
        <div class="relative group">
          <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
          <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 p-6">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0 bg-primary-100 p-3 rounded-full border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                <mat-icon class="text-primary-600 scale-150">folder_open</mat-icon>
              </div>
              <div>
                <p class="text-[11px] font-black text-gray-500 uppercase tracking-widest m-0">Total Complaints</p>
                <p class="text-3xl font-black text-gray-900 m-0 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ totalComplaints }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending -->
        <div class="relative group">
          <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
          <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 p-6">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0 bg-yellow-100 p-3 rounded-full border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                <mat-icon class="text-yellow-600 scale-150">pending_actions</mat-icon>
              </div>
              <div>
                <p class="text-[11px] font-black text-gray-500 uppercase tracking-widest m-0">Pending Action</p>
                <p class="text-3xl font-black text-gray-900 m-0 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ pendingComplaints }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- In Progress -->
        <div class="relative group">
          <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
          <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 p-6">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0 bg-blue-100 p-3 rounded-full border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                <mat-icon class="text-blue-600 scale-150">autorenew</mat-icon>
              </div>
              <div>
                <p class="text-[11px] font-black text-gray-500 uppercase tracking-widest m-0">In Progress</p>
                <p class="text-3xl font-black text-gray-900 m-0 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ inProgressComplaints }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Resolved -->
        <div class="relative group">
          <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
          <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 p-6">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0 bg-green-100 p-3 rounded-full border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                <mat-icon class="text-green-600 scale-150">check_circle</mat-icon>
              </div>
              <div>
                <p class="text-[11px] font-black text-gray-500 uppercase tracking-widest m-0">Resolved</p>
                <p class="text-3xl font-black text-gray-900 m-0 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ resolvedComplaints }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="relative group">
          <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
          <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
            <div class="border-b-2 border-gray-900 bg-gray-50 p-4 flex justify-between items-center">   
              <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Status Distribution</h3>
              <button mat-button color="primary" routerLink="/admin/complaints" class="!font-black uppercase tracking-wider text-xs border-2 border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">Export CSV</button>
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

        <div class="relative group">
          <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
          <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
            <div class="border-b-2 border-gray-900 bg-gray-50 p-4 flex justify-between items-center">   
              <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Complaints by Barangay</h3>
              <a mat-button color="primary" routerLink="/admin/complaints" class="!font-black uppercase tracking-wider text-xs">View All &rarr;</a>
            </div>
            <div class="p-6 h-[300px] flex items-center justify-center">
              <canvas baseChart *ngIf="totalComplaints > 0"
                [data]="barangayChartData"
                [type]="'bar'"
                [options]="barangayBarOptions">
              </canvas>
              <p *ngIf="totalComplaints === 0" class="text-gray-400 font-bold uppercase tracking-wider text-sm">No data available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private complaintsService = inject(ComplaintsService);

  totalComplaints = 0;
  pendingComplaints = 0;
  inProgressComplaints = 0;
  resolvedComplaints = 0;

  statusChartData: any = {
    labels: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0] }]
  };

  barangayChartData: any = {
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

  barangayBarOptions: any = {
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

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.complaintsService.getComplaints().subscribe(({ data, error }) => {
      if (data && !error) {
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

        // Barangay Chart (Get top 10 barangays by complaint count)
        const barangayCounts: { [key: string]: number } = {};
        data.forEach((c: any) => {
          if (c.barangay) {
            barangayCounts[c.barangay] = (barangayCounts[c.barangay] || 0) + 1;
          }
        });
        
        const sortedBarangays = Object.keys(barangayCounts)
          .map(b => ({ name: b, count: barangayCounts[b] }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10

        this.barangayChartData = {
          labels: sortedBarangays.map(b => b.name),
          datasets: [{
            data: sortedBarangays.map(b => b.count),
            backgroundColor: '#60a5fa', // Blue
            hoverBackgroundColor: '#3b82f6',
            borderRadius: 4,
            borderSkipped: false,
            barThickness: 24
          }]
        };
      }
    });
  }
}
