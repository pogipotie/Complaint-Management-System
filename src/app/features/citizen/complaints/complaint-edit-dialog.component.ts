import { Component, Inject, inject, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { ComplaintsService } from '../../../core/services/complaints.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { environment } from '../../../../environments/environment';
import { Observable, of } from 'rxjs';
import { map, startWith, switchMap, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-complaint-edit-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    GoogleMap,
    MapMarker
  ],
  template: `
    <div class="relative bg-white rounded">
      <!-- Header -->
      <div mat-dialog-title class="pt-6 pb-4 px-6 sm:px-8 border-b border-gray-100 m-0 bg-white sticky top-0 z-20">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Edit Complaint</h2>
      </div>

      <!-- Content -->
      <mat-dialog-content class="mat-typography !p-6 sm:!p-8 custom-scrollbar max-h-[70vh]">
        <form [formGroup]="editForm" class="space-y-6">
          
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-gray-900 flex items-center border-b border-gray-100 pb-2">
              <mat-icon class="scale-75 mr-1 text-indigo-500">info</mat-icon> Basic Information
            </h3>
            
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Complaint Title</mat-label>
              <input matInput formControlName="title" placeholder="Brief title">
              <mat-error *ngIf="editForm.get('title')?.hasError('required')">Title is required</mat-error>
              <mat-error *ngIf="editForm.get('title')?.hasError('minlength')">Must be at least 5 characters</mat-error>
            </mat-form-field>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Category</mat-label>
                <mat-select formControlName="category_id">
                  <mat-option *ngFor="let cat of categories" [value]="cat.id">
                    {{ cat.name }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="editForm.get('category_id')?.hasError('required')">Category is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Priority Level</mat-label>
                <mat-select formControlName="priority">
                  <mat-option value="low">Low - Minor issue</mat-option>
                  <mat-option value="medium">Medium - Needs attention soon</mat-option>
                  <mat-option value="high">High - Significant disruption</mat-option>
                  <mat-option value="emergency">Emergency - Immediate danger</mat-option>
                </mat-select>
                <mat-error *ngIf="editForm.get('priority')?.hasError('required')">Priority is required</mat-error>
              </mat-form-field>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-sm font-bold text-gray-900 flex items-center border-b border-gray-100 pb-2">
              <mat-icon class="scale-75 mr-1 text-red-500">place</mat-icon> Location Details
            </h3>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Barangay / Location</mat-label>
              <input type="text" matInput formControlName="barangay" placeholder="Search your barangay or location..." [matAutocomplete]="auto" (keydown.enter)="$event.preventDefault(); searchLocation(editForm.get('barangay')?.value)">
              <button matSuffix mat-flat-button color="primary" type="button" (click)="searchLocation(editForm.get('barangay')?.value)" class="search-text-btn">Search</button>
              <mat-autocomplete #auto="matAutocomplete" (optionSelected)="searchLocation($event.option.value)">
                <mat-option *ngFor="let brgy of filteredBarangays$ | async" [value]="brgy">{{ brgy }}</mat-option>
              </mat-autocomplete>
              <mat-error *ngIf="editForm.get('barangay')?.hasError('required')">Location is required</mat-error>
            </mat-form-field>

            <div class="space-y-3">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <label class="text-sm font-medium text-gray-700">Pinpoint Location</label>
                <div class="flex items-center gap-2">
                  <button mat-stroked-button type="button" color="primary" (click)="getCurrentLocation()" [disabled]="locating" class="h-8 text-xs location-btn">
                    <mat-icon>my_location</mat-icon>
                    <span>{{ locating ? 'Locating...' : 'Use My Location' }}</span>
                  </button>
                  <span class="map-badge hidden sm:inline-block">Drag marker to adjust</span>
                </div>
              </div>

              <!-- Coordinate Display -->
              <div class="grid grid-cols-2 gap-4 mb-2" *ngIf="editForm.get('latitude')?.value">
                <div class="text-xs bg-gray-50 p-2 rounded border border-gray-200 text-gray-600 flex items-center">
                  <span class="font-semibold mr-2 text-gray-700">Lat:</span> {{ editForm.get('latitude')?.value | number:'1.6-6' }}
                </div>
                <div class="text-xs bg-gray-50 p-2 rounded border border-gray-200 text-gray-600 flex items-center">
                  <span class="font-semibold mr-2 text-gray-700">Lng:</span> {{ editForm.get('longitude')?.value | number:'1.6-6' }}
                </div>
              </div>

              <div *ngIf="mapLoaded" class="map-container">
                <google-map height="100%" width="100%" [center]="mapCenter" [zoom]="15" (mapClick)="onMapClick($event)" [options]="{ disableDefaultUI: true, zoomControl: true }">
                  <map-marker *ngIf="markerPosition" [position]="markerPosition" [options]="{ draggable: true, animation: 2 }" (mapDragend)="onMarkerDragEnd($event)"></map-marker>
                </google-map>
              </div>
              <div *ngIf="!mapLoaded" class="map-loading">
                <mat-icon class="animate-spin text-indigo-500">autorenew</mat-icon>
                <span class="text-gray-500 font-medium">Loading Map Interface...</span>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-sm font-bold text-gray-900 flex items-center border-b border-gray-100 pb-2">
              <mat-icon class="scale-75 mr-1 text-gray-500">description</mat-icon> Additional Details
            </h3>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="5" placeholder="Detailed description"></textarea>
              <mat-error *ngIf="editForm.get('description')?.hasError('required')">Description is required</mat-error>
              <mat-error *ngIf="editForm.get('description')?.hasError('minlength')">Must be at least 10 characters</mat-error>
            </mat-form-field>

            <!-- Image Upload -->
            <div class="space-y-3">
              <label class="text-sm font-medium text-gray-700 block">Attach a Photo <span class="text-red-500">*</span></label>
              
              <div class="upload-dropzone" [class.has-file]="!!selectedFile || !!existingImageUrl" [class.border-red-500]="formSubmitted && !selectedFile && !existingImageUrl" (click)="(!selectedFile && !existingImageUrl) ? fileInput.click() : null">
                <input type="file" #fileInput class="hidden" accept="image/jpeg, image/png, image/webp" capture="environment" (change)="onFileSelected($event)">
                
                <ng-container *ngIf="!selectedFile && !existingImageUrl">
                  <mat-icon class="upload-icon" [class.text-red-400]="formSubmitted && !selectedFile && !existingImageUrl">add_a_photo</mat-icon>
                  <div class="mt-2 text-sm text-gray-600 font-medium">Take a photo or upload an image</div>
                  <div class="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (Will be compressed automatically)</div>
                </ng-container>

                <ng-container *ngIf="selectedFile || existingImageUrl">
                  <div class="file-preview">
                    <img [src]="imagePreviewUrl || existingImageUrl" class="preview-img" alt="Preview">
                    <div class="file-info">
                      <span class="file-name">{{ selectedFile?.name || 'Existing Photo' }}</span>
                      <button mat-icon-button type="button" (click)="removeFile($event)" color="warn" class="remove-btn">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  </div>
                </ng-container>
              </div>
              <mat-error class="text-xs mt-1" *ngIf="formSubmitted && !selectedFile && !existingImageUrl">
                A photo of the issue is required to submit a complaint.
              </mat-error>
            </div>

            <!-- Error -->
            <div *ngIf="errorMsg" class="error-alert">
              <mat-icon class="text-red-500">error_outline</mat-icon>
              <div>
                <h4 class="font-semibold text-red-800">Save Failed</h4>
                <p class="text-sm text-red-700 mt-1">{{ errorMsg }}</p>
              </div>
            </div>

          </div>
        </form>
      </mat-dialog-content>

      <!-- Actions -->
      <mat-dialog-actions align="end" class="!px-6 sm:!px-8 !pb-6 !pt-4 border-t border-gray-100 m-0">
        <button mat-button mat-dialog-close [disabled]="isSaving" class="h-10 px-4 rounded font-medium mr-2">Cancel</button>
        <button mat-flat-button color="primary" (click)="saveChanges()" [disabled]="editForm.invalid || isSaving" class="h-10 px-6 rounded font-medium">
          <mat-icon *ngIf="isSaving" class="animate-spin mr-2">autorenew</mat-icon>
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </button>
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
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .custom-scrollbar::-webkit-scrollbar {
      display: none;
    }

    .map-container {
      height: 300px;
      width: 100%;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      background: #f3f4f6;
    }

    .map-loading {
      height: 300px;
      width: 100%;
      border-radius: 4px;
      border: 1px dashed #d1d5db;
      background: #f9fafb;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .map-badge {
      font-size: 12px;
      font-weight: 600;
      color: #4f46e5;
      background: #eef2ff;
      padding: 0 12px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      border-radius: 4px;
    }

    .location-btn {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      height: 32px !important;
    }
    
    .location-btn ::ng-deep .mat-mdc-button-touch-target,
    .location-btn ::ng-deep .mdc-button__label {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .location-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 16px;
      margin: 0;
    }

    .search-text-btn {
      margin-right: 8px !important;
      font-weight: 600 !important;
      letter-spacing: 0.5px;
      height: 36px !important;
      border-radius: 4px !important;
    }

    /* Image Upload Styles */
    .upload-dropzone {
      border: 2px dashed #d1d5db;
      border-radius: 4px;
      padding: 32px 24px;
      text-align: center;
      background: #f9fafb;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .upload-dropzone:hover {
      border-color: #4f46e5;
      background: #eef2ff;
    }

    .upload-dropzone.has-file {
      padding: 16px;
      border-style: solid;
      border-color: #e5e7eb;
      background: white;
      cursor: default;
    }

    .upload-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #9ca3af;
    }

    .upload-dropzone:hover .upload-icon {
      color: #4f46e5;
    }

    .file-preview {
      display: flex;
      align-items: center;
      gap: 16px;
      text-align: left;
    }

    .preview-img {
      width: 64px;
      height: 64px;
      border-radius: 4px;
      object-fit: cover;
      border: 1px solid #e5e7eb;
    }

    .file-info {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .file-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      word-break: break-all;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class ComplaintEditDialogComponent {
  isSaving = false;
  editForm: FormGroup;
  private complaintsService = inject(ComplaintsService);

  errorMsg = '';
  formSubmitted = false;
  
  // Category mapping
  categories: any[] = [];
  
  // Map and Geolocation
  mapLoaded = false;
  locating = false;
  filteredBarangays$!: Observable<string[]>;
  mapCenter: google.maps.LatLngLiteral = { lat: 14.5995, lng: 120.9842 };
  markerPosition: google.maps.LatLngLiteral | null = null;
  scriptElement: HTMLScriptElement | null = null;
  geocoder: google.maps.Geocoder | null = null;
  autocompleteService: google.maps.places.AutocompleteService | null = null;

  // Image handling
  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;
  existingImageUrl: string | null = null;

  private ngZone = inject(NgZone);
  private supabaseService = inject(SupabaseService);

  constructor(
    public dialogRef: MatDialogRef<ComplaintEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.existingImageUrl = this.data.image_url;
    
    if (this.data.latitude && this.data.longitude) {
      this.mapCenter = { lat: this.data.latitude, lng: this.data.longitude };
      this.markerPosition = { lat: this.data.latitude, lng: this.data.longitude };
    }

    this.editForm = this.fb.group({
      title: [this.data.title, [Validators.required, Validators.minLength(5)]],
      category_id: [this.data.category_id, Validators.required],
      priority: [this.data.priority, Validators.required],
      barangay: [this.data.barangay, Validators.required],
      description: [this.data.description, [Validators.required, Validators.minLength(10)]],
      latitude: [this.data.latitude],
      longitude: [this.data.longitude]
    });
  }

  ngOnInit() {
    this.complaintsService.getCategories().subscribe(({ data }) => {
      if (data) {
        this.categories = data;
      }
    });

    this.loadGoogleMaps();
  }

  setupAutocomplete() {
    this.filteredBarangays$ = this.editForm.get('barangay')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        if (!value || typeof value !== 'string' || !this.autocompleteService) {
          return of([]);
        }

        return new Observable<string[]>(observer => {
          this.autocompleteService!.getPlacePredictions({
            input: value,
            componentRestrictions: { country: 'ph' },
            locationBias: {
              center: { lat: 18.258, lng: 121.995 },
              radius: 50000 
            }
          }, (predictions, status) => {
            this.ngZone.run(() => {
              if (status === 'OK' && predictions) {
                observer.next(predictions.map(p => p.description));
              } else {
                observer.next([]);
              }
              observer.complete();
            });
          });
        });
      })
    );
  }

  ngOnDestroy() {}

  loadGoogleMaps() {
    if ((window as any).google?.maps) {
      this.initMap();
      return;
    }

    if (document.getElementById('google-maps-script')) {
      const checkInterval = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(checkInterval);
          this.initMap();
        }
      }, 100);
      return;
    }

    this.scriptElement = document.createElement('script');
    this.scriptElement.id = 'google-maps-script';
    this.scriptElement.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
    this.scriptElement.async = true;
    this.scriptElement.defer = true;
    this.scriptElement.onload = () => this.initMap();
    document.head.appendChild(this.scriptElement);
  }

  initMap() {
    this.mapLoaded = true;
    
    if ((window as any).google?.maps?.Geocoder) {
      this.geocoder = new google.maps.Geocoder();
      this.autocompleteService = new google.maps.places.AutocompleteService();
      this.setupAutocomplete();
    }

    if (this.markerPosition) {
      this.updateMarker(this.markerPosition);
    } else {
      this.updateMarker(this.mapCenter);
    }
  }

  searchLocation(searchText: string) {
    if (!searchText || !this.geocoder) return;

    const searchQuery = searchText.toLowerCase().includes('cagayan') 
      ? searchText 
      : `${searchText}, Gonzaga, Cagayan, Philippines`;

    this.locating = true;
    this.geocoder.geocode({ address: searchQuery }, (results, status) => {
      this.ngZone.run(() => {
        this.locating = false;
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          this.mapCenter = {
            lat: location.lat(),
            lng: location.lng()
          };
          this.updateMarker(this.mapCenter);
        } else {
          console.warn('Geocode was not successful for the following reason: ' + status);
        }
      });
    });
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.errorMsg = 'Geolocation is not supported by your browser';
      return;
    }

    this.locating = true;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.locating = false;
        this.mapCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.updateMarker(this.mapCenter);
      },
      (error) => {
        this.locating = false;
        console.warn('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
           this.errorMsg = 'Location permission was denied. Please drag the marker manually.';
        } else {
           this.errorMsg = 'Failed to get your current location.';
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.updateMarker(event.latLng.toJSON());
    }
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.updateMarker(event.latLng.toJSON());
    }
  }

  updateMarker(position: google.maps.LatLngLiteral) {
    this.markerPosition = position;
    this.editForm.patchValue({
      latitude: position.lat,
      longitude: position.lng
    });
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        const compressedFile = await this.compressImage(file);
        this.selectedFile = compressedFile;
        this.existingImageUrl = null; // Clear existing image if a new one is selected
        
        const reader = new FileReader();
        reader.onload = e => this.imagePreviewUrl = reader?.result ?? null;
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        this.errorMsg = 'Failed to process image.';
        console.error(err);
      }
    }
  }

  compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context not found'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob failed'));
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpeg"), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.7);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.existingImageUrl = null;
  }

  async saveChanges() {
    this.formSubmitted = true;
    this.errorMsg = '';

    if (this.editForm.invalid || (!this.selectedFile && !this.existingImageUrl)) {
      return;
    }

    this.isSaving = true;
    let finalImageUrl = this.existingImageUrl;

    // If they uploaded a new image, upload to Supabase first
    if (this.selectedFile) {
      const fileExt = this.selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${this.data.created_by}/${fileName}`;
      
      const { url, error } = await this.supabaseService.uploadFile('complaint_images', filePath, this.selectedFile);
      
      if (error) {
        this.isSaving = false;
        this.errorMsg = 'Failed to upload image: ' + error.message;
        return;
      }
      
      finalImageUrl = url;
    }

    const updates = {
      ...this.editForm.value,
      image_url: finalImageUrl
    };

    this.complaintsService.updateComplaint(this.data.id, updates).subscribe({
      next: ({ error }) => {
        this.isSaving = false;
        if (!error) {
          // Pass back the updated data to the parent component
          this.dialogRef.close({ ...this.data, ...updates });
        } else {
          this.errorMsg = 'Failed to update complaint: ' + error.message;
          console.error('Failed to update complaint:', error);
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMsg = 'Failed to update complaint: ' + err.message;
        console.error(err);
      }
    });
  }
}