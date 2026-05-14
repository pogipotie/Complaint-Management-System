import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { environment } from '../../../../environments/environment';
import { SupabaseService } from '../../../core/services/supabase.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-complaint-detail-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    GoogleMap,
    MapMarker
  ],
  template: `
    <div class="relative bg-white rounded-sm border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]">
      
      <!-- Header -->
      <div mat-dialog-title class="pt-8 pb-5 px-6 sm:px-8 border-b-2 border-gray-900 m-0 bg-gray-50 sticky top-0 z-20 flex justify-between items-start gap-4 rounded-t-sm">
        <div>
          <h2 class="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight leading-tight mb-3" style="font-family: 'Arial Black', Impact, sans-serif;">{{ data.title }}</h2>
          
          <div class="flex flex-wrap gap-2 items-center">
            <!-- Status Badge -->
            <span class="inline-flex px-2 py-0.5 rounded-sm border-2 border-gray-900 text-[10px] font-black tracking-widest uppercase shadow-[1px_1px_0px_0px_rgba(17,24,39,1)]"
                  [ngClass]="{
                    'bg-yellow-200 text-yellow-900': data.status === 'pending',
                    'bg-blue-200 text-blue-900': data.status === 'assigned',
                    'bg-primary-200 text-primary-900': data.status === 'in_progress',
                    'bg-green-200 text-green-900': data.status === 'resolved',
                    'bg-gray-200 text-gray-900': data.status === 'closed',
                    'bg-red-200 text-red-900': data.status === 'rejected'
                  }">
              {{ data.status.replace('_', ' ') }}
            </span>
            
            <!-- Priority Badge -->
            <span class="inline-flex px-2 py-0.5 rounded-sm text-[10px] font-black tracking-widest uppercase border-2 border-gray-900 shadow-[1px_1px_0px_0px_rgba(17,24,39,1)]"
                  [ngClass]="{
                    'bg-green-100 text-green-900': data.priority === 'low',
                    'bg-yellow-100 text-yellow-900': data.priority === 'medium',
                    'bg-orange-100 text-orange-900': data.priority === 'high',
                    'bg-red-100 text-red-900': data.priority === 'emergency'
                  }">
              {{ data.priority }} Priority
            </span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <mat-dialog-content class="mat-typography !p-6 sm:!p-8 custom-scrollbar max-h-[70vh]">
        <div class="space-y-6" id="pdf-content">
          
          <!-- Image Section -->
          <div *ngIf="data.evidence_paths && data.evidence_paths.length > 0" class="rounded-sm overflow-hidden border-2 border-gray-900 bg-gray-100 flex justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] relative">
            <div class="w-full relative">
              <span class="absolute top-2 left-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] z-20 border border-gray-700">Before (Citizen Report)</span>
              <img [src]="data.evidence_paths[0]" alt="Complaint Photo" class="max-h-72 object-contain w-full relative z-10 hover:scale-105 transition-transform duration-500 cursor-pointer">
            </div>
          </div>

          <!-- Resolution Image Section (Before & After Proof) -->
          <div *ngIf="data.resolution_images && data.resolution_images.length > 0" class="rounded-sm overflow-hidden border-2 border-green-600 bg-green-50 flex justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] relative mt-4">
            <div class="w-full relative">
              <span class="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] z-20 flex items-center gap-1 border border-green-500"><mat-icon class="scale-[0.6] h-4 w-4 -ml-1">verified</mat-icon> After (Resolution Proof)</span>
              <img [src]="data.resolution_images[0]" alt="Resolution Photo" class="max-h-72 object-contain w-full relative z-10 hover:scale-105 transition-transform duration-500 cursor-pointer">
            </div>
          </div>

          <!-- Metadata Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-sm border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
            <div>
              <p class="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Date Reported</p>
              <p class="text-xs font-bold text-gray-900 flex items-center uppercase tracking-wider">
                <mat-icon class="scale-75 text-gray-400 -ml-1 mr-1 shrink-0">calendar_today</mat-icon>
                {{ data.created_at | date:'medium' }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Category</p>
              <p class="text-xs font-bold text-gray-900 flex items-center uppercase tracking-wider">
                <mat-icon class="scale-75 text-primary-500 -ml-1 mr-1 shrink-0">folder</mat-icon>
                {{ data.complaint_categories?.name || 'Uncategorized' }}
              </p>
            </div>
            <div class="sm:col-span-2">
              <p class="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Location / Barangay</p>
              <p class="text-xs font-bold text-gray-900 flex items-start mt-1 uppercase tracking-wider">
                <mat-icon class="scale-75 text-red-500 mr-1 -ml-1 shrink-0">location_on</mat-icon>
                <span class="mt-0.5">{{ data.barangay }}</span>
              </p>
            </div>
          </div>

          <!-- Map View (if coordinates exist) -->
          <div *ngIf="mapCenter" class="space-y-3">
            <div class="flex justify-between items-end">
              <h4 class="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center" style="font-family: 'Arial Black', Impact, sans-serif;">
                <mat-icon class="scale-75 text-gray-400 mr-1 -ml-1">map</mat-icon>
                Map View
              </h4>
              <a 
                mat-button 
                color="primary" 
                class="h-8 !text-[10px] !font-black uppercase tracking-widest !rounded-sm !border-2 !border-gray-900 !shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-none transition-all" 
                [href]="'https://www.google.com/maps?q=' + mapCenter.lat + ',' + mapCenter.lng" 
                target="_blank"
              >
                <mat-icon class="text-base h-4 w-4 mr-1">open_in_new</mat-icon>
                Open in Maps
              </a>
            </div>
            
            <div *ngIf="mapLoaded" class="h-64 w-full rounded-sm overflow-hidden border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
              <google-map height="100%" width="100%" [center]="mapCenter" [zoom]="15" [options]="{ disableDefaultUI: true, zoomControl: true }">
                <map-marker [position]="mapCenter"></map-marker>
              </google-map>
            </div>
            
            <div *ngIf="!mapLoaded" class="h-64 w-full rounded-sm border-2 border-gray-900 border-dashed bg-gray-50 flex flex-col items-center justify-center gap-3">
              <mat-icon class="animate-spin text-primary-500">autorenew</mat-icon>
              <span class="text-xs font-black text-gray-500 uppercase tracking-widest">Loading Map...</span>
            </div>
          </div>

          <!-- Description Section -->
          <div>
            <h4 class="text-sm font-black text-gray-900 mb-3 uppercase tracking-tight flex items-center" style="font-family: 'Arial Black', Impact, sans-serif;">
              <mat-icon class="scale-75 text-gray-400 mr-1 -ml-1">description</mat-icon>
              Description
            </h4>
            <p class="text-xs font-bold text-gray-700 whitespace-pre-wrap leading-relaxed bg-white border-2 border-gray-900 p-5 rounded-sm shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] uppercase tracking-wider">
              {{ data.description }}
            </p>
          </div>

          <!-- Admin Resolution Notes (if any) -->
          <div *ngIf="data.resolution_notes" class="bg-green-50 border-2 border-green-600 p-5 rounded-sm shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
            <h4 class="text-sm font-black text-green-900 mb-2 uppercase tracking-tight flex items-center" style="font-family: 'Arial Black', Impact, sans-serif;">
              <mat-icon class="scale-75 mr-1 -ml-1 text-green-600">check_circle</mat-icon>
              Resolution Notes
            </h4>
            <p class="text-xs font-bold text-green-800 whitespace-pre-wrap leading-relaxed uppercase tracking-wider">
              {{ data.resolution_notes }}
            </p>
          </div>

          <!-- Rating & Feedback Section (Only shown if resolved/closed and viewed by Citizen) -->
          <div *ngIf="(data.status === 'resolved' || data.status === 'closed')" class="bg-primary-50 border-2 border-primary-600 p-5 rounded-sm shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
            <h4 class="text-sm font-black text-primary-900 mb-3 uppercase tracking-tight flex items-center" style="font-family: 'Arial Black', Impact, sans-serif;">
              <mat-icon class="scale-75 mr-1 -ml-1 text-primary-600">star</mat-icon>
              Resolution Rating
            </h4>
            
            <div *ngIf="data.rating" class="space-y-3">
              <div class="flex gap-1">
                <mat-icon *ngFor="let star of [1,2,3,4,5]" 
                          [class.text-yellow-400]="star <= data.rating" 
                          [class.text-gray-300]="star > data.rating"
                          class="scale-110 drop-shadow-sm">
                  star
                </mat-icon>
              </div>
              <p *ngIf="data.feedback_text" class="text-xs font-bold text-primary-800 italic border-l-4 border-primary-600 pl-3 py-1 uppercase tracking-wider">
                "{{ data.feedback_text }}"
              </p>
            </div>

            <div *ngIf="!data.rating && isCitizen" class="space-y-4">
              <p class="text-[10px] font-black uppercase tracking-widest text-primary-800">How satisfied are you with the resolution of this issue?</p>
              <div class="flex gap-2">
                <button mat-icon-button *ngFor="let star of [1,2,3,4,5]" 
                        (mouseenter)="hoverRating = star" 
                        (mouseleave)="hoverRating = 0"
                        (click)="setRating(star)">
                  <mat-icon [class.text-yellow-400]="star <= (hoverRating || currentRating)" 
                            [class.text-gray-300]="star > (hoverRating || currentRating)"
                            class="scale-125 transition-colors drop-shadow-sm">
                    star
                  </mat-icon>
                </button>
              </div>
              <div *ngIf="currentRating > 0" class="flex flex-col gap-3 items-end">
                <div class="w-full relative">
                  <textarea [(ngModel)]="feedbackText" rows="2" placeholder="Tell us how we did..." class="w-full bg-white rounded-sm border-2 border-primary-600 p-3 text-xs font-bold uppercase tracking-wider text-primary-900 focus:outline-none focus:ring-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] placeholder-primary-300"></textarea>
                </div>
                <button mat-flat-button color="primary" (click)="submitRating()" [disabled]="submittingRating" class="!rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider text-[11px]">
                  Submit Feedback
                </button>
              </div>
            </div>
            <div *ngIf="!data.rating && !isCitizen" class="text-[10px] font-black uppercase tracking-widest text-primary-500 italic">
              Citizen has not provided a rating yet.
            </div>
          </div>

          <!-- Two-way Comments / Chat -->
          <div class="border-2 border-gray-900 rounded-sm overflow-hidden flex flex-col mt-6 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] flex-shrink-0">
            <div class="bg-gray-50 border-b-2 border-gray-900 px-5 py-3 flex justify-between items-center">
              <h4 class="text-sm font-black text-gray-900 flex items-center uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">
                <mat-icon class="scale-75 text-gray-400 mr-1 -ml-1">forum</mat-icon>
                Discussion Thread
              </h4>
            </div>
            
            <div class="p-5 bg-white space-y-4 h-[300px] overflow-y-auto custom-scrollbar flex flex-col" #commentsContainer>
              <div *ngIf="loadingComments" class="flex justify-center py-4 my-auto">
                <mat-icon class="animate-spin text-primary-500">autorenew</mat-icon>
              </div>
              
              <div *ngIf="!loadingComments && comments.length === 0" class="text-center py-6 text-gray-400 font-bold text-[10px] uppercase tracking-widest italic my-auto">
                No comments yet. Start the conversation!
              </div>

              <div *ngFor="let comment of comments" class="flex gap-3" [class.flex-row-reverse]="comment.user_id === currentUserId">
                <div class="w-8 h-8 rounded-sm border-2 border-gray-900 flex-shrink-0 flex items-center justify-center text-gray-900 text-xs font-black shadow-[1px_1px_0px_0px_rgba(17,24,39,1)]"
                     [ngClass]="comment.user_role === 'citizen' ? 'bg-primary-200' : 'bg-green-400'">
                  {{ comment.user_full_name ? comment.user_full_name.charAt(0).toUpperCase() : 'U' }}
                </div>
                <div class="flex flex-col max-w-[80%]" [class.items-end]="comment.user_id === currentUserId">
                  <div class="flex items-baseline gap-2 mb-1" [class.flex-row-reverse]="comment.user_id === currentUserId">
                    <span class="text-[10px] font-black uppercase tracking-widest text-gray-700">{{ comment.user_full_name || 'User' }}</span>
                    <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{{ comment.created_at | date:'short' }}</span>
                    <span *ngIf="comment.user_role !== 'citizen'" class="text-[9px] border-2 border-green-600 bg-green-100 text-green-800 px-1 rounded-sm uppercase font-black">Staff</span>
                  </div>
                  <div class="p-3 border-2 border-gray-900 text-xs font-bold uppercase tracking-wider leading-relaxed shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]"
                       [ngClass]="comment.user_id === currentUserId ? 'bg-primary-100 text-primary-900 rounded-l-sm rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-r-sm rounded-bl-sm'">
                    {{ comment.body }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Comment Input (Hidden if complaint is rejected or closed) -->
            <div *ngIf="!(data.status === 'rejected' || data.status === 'closed')" class="p-3 bg-gray-50 border-t-2 border-gray-900 flex gap-2">
              <input type="text" [(ngModel)]="newComment" (keyup.enter)="postComment()"
                     class="flex-1 rounded-sm border-2 border-gray-900 px-4 py-2 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-primary-600 focus:ring-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] placeholder-gray-400" 
                     placeholder="Type a message...">
              <button mat-flat-button color="primary" (click)="postComment()" [disabled]="!newComment.trim() || postingComment" class="!min-w-[48px] !px-0 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all">
                <mat-icon class="scale-90 m-0">send</mat-icon>
              </button>
            </div>

            <!-- Read-only message for rejected/closed complaints -->
            <div *ngIf="(data.status === 'rejected' || data.status === 'closed')" class="p-4 bg-gray-100 border-t-2 border-gray-900 flex items-center justify-center gap-2"
                 [ngClass]="data.status === 'rejected' ? 'bg-red-50' : 'bg-gray-100'">
              <mat-icon class="scale-90" [ngClass]="data.status === 'rejected' ? 'text-red-600' : 'text-gray-600'">lock</mat-icon>
              <span class="text-xs font-black uppercase tracking-widest" [ngClass]="data.status === 'rejected' ? 'text-red-800' : 'text-gray-800'">
                Thread Locked: Complaint {{ data.status | titlecase }}
              </span>
            </div>
          </div>

        </div>
      </mat-dialog-content>

      <!-- Actions -->
      <mat-dialog-actions align="end" class="!px-6 sm:!px-8 !pb-6 !pt-4 border-t-2 border-gray-900 m-0 bg-gray-50 rounded-b-sm">
        <button mat-button color="primary" class="h-10 px-4 mr-auto font-black uppercase tracking-wider text-[10px]" (click)="exportToPDF()" [disabled]="exportingPdf">
          <mat-icon *ngIf="!exportingPdf">picture_as_pdf</mat-icon>
          <mat-icon *ngIf="exportingPdf" class="animate-spin">autorenew</mat-icon>
          {{ exportingPdf ? 'Exporting...' : 'Export to PDF' }}
        </button>
        <button mat-flat-button mat-dialog-close color="primary" class="!px-8 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider text-[11px] !bg-gray-100 !text-gray-900">Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    /* Hide default dialog padding to allow full-bleed headers/footers */
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      padding: 0 !important;
      border-radius: 4px !important;
    }
    
    /* Hide scrollbar for the content area but keep functionality */
    .custom-scrollbar {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
    .custom-scrollbar::-webkit-scrollbar {
      display: none; /* Chrome, Safari and Opera */
    }
  `]
})
export class ComplaintDetailDialogComponent implements OnInit, AfterViewChecked {
  @ViewChild('commentsContainer') private commentsContainer!: ElementRef;
  
  mapCenter: google.maps.LatLngLiteral | null = null;
  mapLoaded = false;
  scriptElement: HTMLScriptElement | null = null;

  // Rating state
  isCitizen = false;
  currentUserId: string | null = null;
  hoverRating = 0;
  currentRating = 0;
  feedbackText = '';
  submittingRating = false;

  // Comments state
  comments: any[] = [];
  loadingComments = true;
  newComment = '';
  postingComment = false;
  shouldScrollToBottom = false;

  exportingPdf = false;

  private supabaseService = inject(SupabaseService);

  constructor(
    public dialogRef: MatDialogRef<ComplaintDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data.latitude && this.data.longitude) {
      this.mapCenter = {
        lat: this.data.latitude,
        lng: this.data.longitude
      };
    }
  }

  async ngOnInit() {
    if (this.mapCenter) {
      this.loadGoogleMaps();
    }

    const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
    if (user) {
      this.currentUserId = user.id;
      // Determine if the current user is the citizen who created it
      this.isCitizen = this.data.created_by === user.id;
    }

    this.loadComments();
    this.subscribeToComments();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  scrollToBottom(): void {
    try {
      this.commentsContainer.nativeElement.scrollTop = this.commentsContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  async loadComments() {
    this.loadingComments = true;
    const { data, error } = await this.supabaseService.supabase
      .from('complaint_comments')
      .select('*, users!complaint_comments_user_id_fkey(full_name, role)')
      .eq('complaint_id', this.data.id)
      .eq('is_internal', false)
      .order('created_at', { ascending: true });

    if (!error && data) {
      this.comments = data.map((c: any) => ({
        ...c,
        user_full_name: c.users?.full_name,
        user_role: c.users?.role
      }));
      this.shouldScrollToBottom = true;
    }
    this.loadingComments = false;
  }

  subscribeToComments() {
    this.supabaseService.supabase.channel(`comments-${this.data.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'complaint_comments', filter: `complaint_id=eq.${this.data.id}` },
        async (payload: any) => {
          if (payload.new['is_internal'] === false) {
            // Fetch user info for the new comment
            const { data: userData } = await this.supabaseService.supabase
              .from('users')
              .select('full_name, role')
              .eq('id', payload.new['user_id'])
              .single();
              
            const newComment = {
              ...payload.new,
              user_full_name: userData?.full_name,
              user_role: userData?.role
            };
            
            // Only add if we don't already have it (optimistic update might have added it)
            if (!this.comments.find(c => c.id === newComment.id)) {
              this.comments.push(newComment);
              this.shouldScrollToBottom = true;
            }
          }
        }
      )
      .subscribe();
  }

  async postComment() {
    if (!this.newComment.trim() || !this.currentUserId) return;
    
    this.postingComment = true;
    const text = this.newComment.trim();
    this.newComment = '';

    const { data, error } = await this.supabaseService.supabase
      .from('complaint_comments')
      .insert({
        complaint_id: this.data.id,
        user_id: this.currentUserId,
        body: text,
        is_internal: false
      })
      .select('*, users!complaint_comments_user_id_fkey(full_name, role)')
      .single();

    if (!error && data) {
      const commentWithUser = {
        ...data,
        user_full_name: data.users?.full_name,
        user_role: data.users?.role
      };
      this.comments.push(commentWithUser);
      this.shouldScrollToBottom = true;
    }
    this.postingComment = false;
  }

  setRating(rating: number) {
    this.currentRating = rating;
  }

  async submitRating() {
    if (this.currentRating === 0) return;
    this.submittingRating = true;

    const { error } = await this.supabaseService.supabase
      .from('complaints')
      .update({
        rating: this.currentRating,
        feedback_text: this.feedbackText.trim() || null
      })
      .eq('id', this.data.id);

    if (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } else {
      this.data.rating = this.currentRating;
      this.data.feedback_text = this.feedbackText.trim() || null;
    }
    this.submittingRating = false;
  }

  async exportToPDF() {
    this.exportingPdf = true;
    
    // Slight delay to ensure UI updates before capture
    setTimeout(async () => {
      try {
        const element = document.getElementById('pdf-content');
        if (!element) throw new Error('PDF content element not found');

        // We use html2canvas to capture the styled HTML as an image
        const canvas = await html2canvas(element, {
          scale: 2, // Higher scale for better resolution
          useCORS: true, // Attempt to load cross-origin images (like maps/supabase storage)
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        // Calculate PDF dimensions based on A4 size
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Add a nice header
        pdf.setFontSize(18);
        pdf.setTextColor(31, 41, 55); // gray-800
        pdf.text('Complaint Official Record', 10, 15);
        
        pdf.setFontSize(10);
        pdf.setTextColor(107, 114, 128); // gray-500
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, 10, 22);
        
        // Draw a separator line
        pdf.setDrawColor(229, 231, 235); // gray-200
        pdf.line(10, 26, pdfWidth - 10, 26);

        // Add the captured content
        pdf.addImage(imgData, 'JPEG', 10, 30, pdfWidth - 20, pdfHeight - 40);

        // Save the PDF
        const filename = `Complaint_${this.data.id ? this.data.id.substring(0,8) : 'Export'}.pdf`;
        pdf.save(filename);
      } catch (err) {
        console.error('Failed to export PDF', err);
        // Fallback to simple browser print if canvas fails due to severe CORS
        window.print();
      } finally {
        this.exportingPdf = false;
      }
    }, 100);
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
}