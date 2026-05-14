import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMap, MapMarker, MapInfoWindow } from '@angular/google-maps';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ComplaintsService } from '../../../core/services/complaints.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-community-map',
  standalone: true,
  imports: [
    CommonModule,
    GoogleMap,
    MapMarker,
    MapInfoWindow,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="h-[calc(100vh-140px)] flex flex-col sm:flex-row gap-4">
      
      <!-- Map Area -->
      <div class="flex-1 rounded-sm overflow-hidden border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] relative">
        <div *ngIf="!mapLoaded" class="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center z-10">
          <mat-icon class="animate-spin text-primary-500 mb-2">autorenew</mat-icon>
          <span class="text-gray-500 font-black uppercase tracking-wider text-sm" style="font-family: 'Arial Black', Impact, sans-serif;">Loading Community Map...</span>
        </div>
        
        <google-map 
          *ngIf="mapLoaded"
          height="100%" 
          width="100%" 
          [center]="mapCenter" 
          [zoom]="13"
          [options]="mapOptions">
          
          <map-marker 
            #marker="mapMarker"
            *ngFor="let complaint of communityComplaints"
            [position]="{lat: complaint.latitude, lng: complaint.longitude}"
            [options]="getMarkerOptions(complaint)"
            (mapClick)="openInfoWindow(marker, complaint)">
          </map-marker>

          <map-info-window #infoWindow>
            <div *ngIf="selectedComplaint" class="p-1 max-w-xs">
              <h3 class="font-black text-gray-900 text-sm mb-1 truncate uppercase" style="font-family: 'Arial Black', Impact, sans-serif;">{{ selectedComplaint.title }}</h3>
              <p class="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">{{ selectedComplaint.category_name }} • {{ selectedComplaint.barangay }}</p>
              
              <div class="flex gap-2 mb-3">
                <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border border-gray-900"
                      [ngClass]="{
                        'bg-yellow-200 text-yellow-900': selectedComplaint.status === 'pending',
                        'bg-blue-200 text-blue-900': selectedComplaint.status === 'assigned',
                        'bg-primary-200 text-primary-900': selectedComplaint.status === 'in_progress',
                        'bg-green-200 text-green-900': selectedComplaint.status === 'resolved',
                        'bg-gray-200 text-gray-900': selectedComplaint.status === 'closed'
                      }">
                  {{ selectedComplaint.status.replace('_', ' ') }}
                </span>
                <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border-2 border-gray-900"
                      [ngClass]="{
                        'bg-green-100 text-green-900': selectedComplaint.priority === 'low',
                        'bg-yellow-100 text-yellow-900': selectedComplaint.priority === 'medium',
                        'bg-orange-100 text-orange-900': selectedComplaint.priority === 'high',
                        'bg-red-100 text-red-900': selectedComplaint.priority === 'emergency'
                      }">
                  {{ selectedComplaint.priority }}
                </span>
              </div>

              <p class="text-xs font-medium text-gray-800 line-clamp-3 mb-3 leading-relaxed">
                {{ selectedComplaint.description }}
              </p>

              <button 
                mat-flat-button 
                class="w-full text-xs !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] font-black uppercase tracking-wider" 
                [color]="selectedComplaint.has_upvoted ? 'warn' : 'primary'"
                (click)="toggleUpvote(selectedComplaint)"
                [disabled]="upvotingId === selectedComplaint.id"
              >
                <mat-icon class="scale-75 -ml-1">{{ selectedComplaint.has_upvoted ? 'favorite' : 'favorite_border' }}</mat-icon>
                {{ selectedComplaint.has_upvoted ? 'Upvoted (' + selectedComplaint.upvote_count + ')' : 'I have this issue too (' + selectedComplaint.upvote_count + ')' }}
              </button>
            </div>
          </map-info-window>

        </google-map>
      </div>

      <!-- Sidebar List -->
      <div class="w-full sm:w-80 lg:w-96 bg-white border-2 border-gray-900 rounded-sm shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] flex flex-col h-[40vh] sm:h-auto overflow-hidden">
        <div class="p-4 border-b-2 border-gray-900 bg-gray-50 flex justify-between items-center shrink-0">
          <h2 class="font-black text-gray-900 flex items-center uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">
            <mat-icon class="text-primary-600 mr-2">public</mat-icon>
            Community Issues
          </h2>
          <span class="bg-primary-100 border border-gray-900 text-primary-900 text-xs font-black px-2 py-1 rounded-sm uppercase">{{ communityComplaints.length }}</span>
        </div>
        
        <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-gray-50">
          <div *ngIf="loading" class="flex justify-center py-8">
            <mat-icon class="animate-spin text-primary-500">autorenew</mat-icon>
          </div>

          <div *ngIf="!loading && communityComplaints.length === 0" class="text-center py-8 text-gray-500 font-bold uppercase tracking-wider text-xs px-4">
            No public issues found.
          </div>

          <div 
            *ngFor="let complaint of communityComplaints" 
            class="relative group cursor-pointer"
            (click)="focusOnMap(complaint)"
          >
            <!-- Retro offset shadow effect -->
            <div class="absolute inset-0 bg-gray-900 rounded-sm translate-x-1 translate-y-1 transition-transform group-hover:translate-x-1.5 group-hover:translate-y-1.5"
                 [class.translate-x-1.5]="selectedComplaint?.id === complaint.id"
                 [class.translate-y-1.5]="selectedComplaint?.id === complaint.id"></div>
            
            <!-- Main Card -->
            <div class="relative bg-white border-2 border-gray-900 rounded-sm overflow-hidden flex flex-col transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
                 [class.-translate-x-0.5]="selectedComplaint?.id === complaint.id"
                 [class.-translate-y-0.5]="selectedComplaint?.id === complaint.id"
                 [class.bg-primary-50]="selectedComplaint?.id === complaint.id">
              <div class="p-3">
                <div class="flex justify-between items-start mb-1">
                  <h3 class="font-black text-sm text-gray-900 line-clamp-1 flex-1 pr-2 uppercase tracking-tight" [title]="complaint.title" style="font-family: 'Arial Black', Impact, sans-serif;">{{ complaint.title }}</h3>
                  <span class="flex items-center text-xs font-black text-pink-600 shrink-0 border border-pink-200 bg-pink-50 px-1 rounded-sm">
                    <mat-icon class="scale-[0.6] -ml-1 -mr-0.5">favorite</mat-icon>
                    {{ complaint.upvote_count }}
                  </span>
                </div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center">
                  <mat-icon class="scale-[0.6] -ml-1.5 mr-0.5 text-gray-900">location_on</mat-icon>
                  <span class="truncate">{{ complaint.barangay }}</span>
                </p>
                <div class="flex gap-1.5">
                  <span class="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded-sm border border-gray-900"
                        [ngClass]="{
                          'bg-yellow-200 text-yellow-900': complaint.status === 'pending',
                          'bg-blue-200 text-blue-900': complaint.status === 'assigned',
                          'bg-primary-200 text-primary-900': complaint.status === 'in_progress',
                          'bg-green-200 text-green-900': complaint.status === 'resolved'
                        }">
                    {{ complaint.status.replace('_', ' ') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 4px;
    }
  `]
})
export class CommunityMapComponent implements OnInit {
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;

  private complaintsService = inject(ComplaintsService);
  private authService = inject(AuthService);

  communityComplaints: any[] = [];
  loading = true;
  mapLoaded = false;
  scriptElement: HTMLScriptElement | null = null;
  
  mapCenter: google.maps.LatLngLiteral = { lat: 18.258, lng: 121.995 }; // Gonzaga, Cagayan Default
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
    ]
  };

  selectedComplaint: any = null;
  currentUserId: string | null = null;
  upvotingId: string | null = null;

  ngOnInit() {
    this.currentUserId = this.authService.user?.id || null;
    this.loadGoogleMaps();
    this.loadComplaints();
  }

  loadComplaints() {
    this.loading = true;
    this.complaintsService.getCommunityComplaints().subscribe(({ data, error }) => {
      this.loading = false;
      if (!error && data) {
        // Filter out complaints without coordinates
        this.communityComplaints = data.filter((c: any) => c.latitude && c.longitude);
      }
    });
  }

  loadGoogleMaps() {
    if ((window as any).google?.maps) {
      this.mapLoaded = true;
      return;
    }

    if (document.getElementById('google-maps-script')) {
      const checkInterval = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(checkInterval);
          this.mapLoaded = true;
        }
      }, 100);
      return;
    }

    this.scriptElement = document.createElement('script');
    this.scriptElement.id = 'google-maps-script';
    this.scriptElement.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
    this.scriptElement.async = true;
    this.scriptElement.defer = true;
    this.scriptElement.onload = () => {
      this.mapLoaded = true;
    };
    document.head.appendChild(this.scriptElement);
  }

  getMarkerOptions(complaint: any): google.maps.marker.AdvancedMarkerElementOptions | google.maps.MarkerOptions {
    // Determine color based on status
    let color = '#16a34a'; // Primary Green (Default/In Progress)
    if (complaint.status === 'pending') color = '#eab308'; // Yellow
    if (complaint.status === 'resolved') color = '#22c55e'; // Green
    
    // In standard MarkerOptions (without Advanced Markers), we can use a custom icon SVG
    const svgMarker = {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: '#ffffff',
      rotation: 0,
      scale: 1.5,
      anchor: (window as any).google?.maps ? new google.maps.Point(12, 24) : null,
    };

    return {
      icon: svgMarker,
      title: complaint.title
    };
  }

  openInfoWindow(marker: MapMarker, complaint: any) {
    this.selectedComplaint = complaint;
    this.infoWindow.open(marker);
  }

  focusOnMap(complaint: any) {
    this.mapCenter = { lat: complaint.latitude, lng: complaint.longitude };
    this.selectedComplaint = complaint;
    // We would ideally open the infowindow here, but we need the specific MapMarker instance.
    // Setting mapCenter will pan the map to it.
  }

  async toggleUpvote(complaint: any) {
    if (!this.currentUserId) return;
    this.upvotingId = complaint.id;

    try {
      await this.complaintsService.toggleUpvote(complaint.id, this.currentUserId, complaint.has_upvoted);
      
      // Optimistic update
      if (complaint.has_upvoted) {
        complaint.has_upvoted = false;
        complaint.upvote_count--;
      } else {
        complaint.has_upvoted = true;
        complaint.upvote_count++;
      }
    } catch (err) {
      console.error('Failed to toggle upvote', err);
    } finally {
      this.upvotingId = null;
    }
  }
}
