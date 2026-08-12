import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MUNICIPALITY_CONFIG } from '../../../core/constants/municipality.config';

interface BoardingHouse {
  id: string;
  barangay: string;
  name: string;
  street_address: string;
  owner_name: string;
  owner_contact: string;
  max_occupancy: number | null;
  is_approved: boolean;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface TenantSummary {
  id: string;
  full_name: string;
  residency_type: string;
  residency_start_date: string | null;
  residency_end_date: string | null;
  verification_status: string;
}

@Component({
  selector: 'app-captain-boarding-houses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <div class="p-6 max-w-7xl mx-auto pb-20">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-black text-gray-900 uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Boarding House Registry</h1>
          <p class="text-sm font-bold text-gray-600 uppercase tracking-wider">Pre-approve boarding houses &amp; dormitories. New tenants are auto-linked for bulk verification.</p>
        </div>
        <button mat-flat-button color="primary" (click)="openEditor()" class="!rounded-sm !border-2 !border-gray-900 !shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
          <mat-icon>add_home</mat-icon> Register New House
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white border-2 border-gray-900 rounded-sm p-4 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
          <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Houses</p>
          <p class="text-3xl font-black text-gray-900 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ houses.length }}</p>
        </div>
        <div class="bg-white border-2 border-gray-900 rounded-sm p-4 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
          <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Approved</p>
          <p class="text-3xl font-black text-green-700 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ approvedCount() }}</p>
        </div>
        <div class="bg-white border-2 border-gray-900 rounded-sm p-4 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
          <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Pending</p>
          <p class="text-3xl font-black text-amber-700 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ pendingCount() }}</p>
        </div>
        <div class="bg-white border-2 border-gray-900 rounded-sm p-4 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
          <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Linked Tenants</p>
          <p class="text-3xl font-black text-primary-700 mt-1" style="font-family: 'Arial Black', Impact, sans-serif;">{{ totalTenants() }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-3 mb-6 bg-gray-50 border-2 border-gray-900 p-4 rounded-sm shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]">
        <mat-form-field appearance="outline" class="w-full sm:flex-1 bg-white">
          <mat-label>Barangay</mat-label>
          <mat-select [(ngModel)]="barangayFilter" (selectionChange)="applyFilter()">
            <mat-option value="all">All Barangays</mat-option>
            <mat-option *ngFor="let b of barangays" [value]="b">{{ b }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full sm:w-48 bg-white">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (selectionChange)="applyFilter()">
            <mat-option value="all">All</mat-option>
            <mat-option value="approved">Approved</mat-option>
            <mat-option value="pending">Pending</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full sm:flex-1 bg-white">
          <mat-label>Search by name / address</mat-label>
          <input matInput [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" placeholder="e.g. Doña Maria's">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <!-- Loading -->
      <mat-progress-bar *ngIf="loading" mode="indeterminate" color="primary"></mat-progress-bar>

      <!-- Empty state -->
      <div *ngIf="!loading && filteredHouses.length === 0" class="bg-white border-2 border-dashed border-gray-400 rounded-sm p-10 text-center">
        <mat-icon class="text-gray-300 scale-[2.5] mb-3">home_work</mat-icon>
        <p class="text-base font-black text-gray-700 uppercase tracking-widest">No boarding houses registered</p>
        <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Register your first boarding house to start onboarding tenants in bulk.</p>
        <button mat-flat-button color="primary" (click)="openEditor()" class="!mt-5 !rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] font-black uppercase tracking-wider">
          <mat-icon>add_home</mat-icon> Register First House
        </button>
      </div>

      <!-- House cards -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4" *ngIf="!loading && filteredHouses.length > 0">
        <mat-card *ngFor="let house of filteredHouses" class="!rounded-sm !border-2 !border-gray-900 !shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] !bg-white">
          <div class="p-5">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight truncate" style="font-family: 'Arial Black', Impact, sans-serif;">{{ house.name }}</h3>
                  <span *ngIf="house.is_approved"
                        class="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-widest border-2 border-green-700 bg-green-100 text-green-900 shadow-[1px_1px_0px_0px_rgba(20,83,45,1)]">
                    <mat-icon class="!text-[10px] !w-3 !h-3 !leading-3 -ml-0.5 mr-0.5">verified</mat-icon> Approved
                  </span>
                  <span *ngIf="!house.is_approved"
                        class="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-widest border-2 border-amber-700 bg-amber-100 text-amber-900 shadow-[1px_1px_0px_0px_rgba(180,83,9,1)]">
                    <mat-icon class="!text-[10px] !w-3 !h-3 !leading-3 -ml-0.5 mr-0.5">pending</mat-icon> Pending
                  </span>
                </div>
                <p class="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                  <mat-icon class="!text-[12px] !w-3 !h-3 !leading-3">place</mat-icon>
                  {{ house.street_address }} • {{ house.barangay }}
                </p>
              </div>

              <button mat-icon-button [matMenuTriggerFor]="rowMenu" class="!shrink-0">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #rowMenu="matMenu">
                <button mat-menu-item (click)="openEditor(house)">
                  <mat-icon>edit</mat-icon>
                  <span class="font-bold uppercase tracking-wider text-[11px]">Edit</span>
                </button>
                <button mat-menu-item (click)="toggleApproval(house)" *ngIf="!house.is_approved">
                  <mat-icon class="text-green-700">verified</mat-icon>
                  <span class="font-bold uppercase tracking-wider text-[11px] text-green-700">Approve</span>
                </button>
                <button mat-menu-item (click)="toggleApproval(house)" *ngIf="house.is_approved">
                  <mat-icon class="text-amber-700">block</mat-icon>
                  <span class="font-bold uppercase tracking-wider text-[11px] text-amber-700">Revoke Approval</span>
                </button>
              </mat-menu>
            </div>

            <div class="grid grid-cols-2 gap-3 text-[12px] mb-3">
              <div>
                <p class="text-[9px] font-black uppercase tracking-widest text-gray-500">Owner</p>
                <p class="font-bold text-gray-900">{{ house.owner_name }}</p>
              </div>
              <div>
                <p class="text-[9px] font-black uppercase tracking-widest text-gray-500">Contact</p>
                <p class="font-bold text-gray-900">{{ house.owner_contact }}</p>
              </div>
              <div *ngIf="house.max_occupancy">
                <p class="text-[9px] font-black uppercase tracking-widest text-gray-500">Max Occupancy</p>
                <p class="font-bold text-gray-900">{{ house.max_occupancy }} persons</p>
              </div>
              <div *ngIf="house.notes">
                <p class="text-[9px] font-black uppercase tracking-widest text-gray-500">Notes</p>
                <p class="font-bold text-gray-900 line-clamp-2">{{ house.notes }}</p>
              </div>
            </div>

            <mat-divider class="!my-3"></mat-divider>

            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1">
                <mat-icon class="!text-[12px] !w-3 !h-3 !leading-3">groups</mat-icon>
                Linked Tenants ({{ getTenants(house).length }})
              </p>
              <div *ngIf="getTenants(house).length === 0" class="text-[11px] text-gray-500 italic py-2">
                No tenants registered against this house yet.
              </div>
              <div class="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                <div *ngFor="let tenant of getTenants(house)" class="flex items-center justify-between gap-2 p-2 rounded-sm border border-gray-200 bg-gray-50">
                  <div class="min-w-0 flex-1">
                    <p class="text-[12px] font-black text-gray-900 truncate uppercase tracking-tight">{{ tenant.full_name }}</p>
                    <p class="text-[10px] text-gray-500 uppercase tracking-widest">
                      {{ tenant.residency_type }} • Stay: {{ tenant.residency_start_date | date:'mediumDate' || '?' }} → {{ tenant.residency_end_date | date:'mediumDate' || 'open' }}
                    </p>
                  </div>
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border"
                        [ngClass]="{
                          'border-amber-700 bg-amber-100 text-amber-900': tenant.verification_status === 'pending',
                          'border-green-700 bg-green-100 text-green-900': tenant.verification_status === 'approved',
                          'border-red-700 bg-red-100 text-red-900': tenant.verification_status === 'rejected'
                        }">
                    {{ tenant.verification_status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
  `]
})
export class CaptainBoardingHousesComponent implements OnInit, OnDestroy {
  private supabaseService = inject(SupabaseService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  barangays = MUNICIPALITY_CONFIG.barangays;

  houses: BoardingHouse[] = [];
  filteredHouses: BoardingHouse[] = [];
  loading = true;

  tenantsByHouse = new Map<string, TenantSummary[]>();

  barangayFilter: string = 'all';
  statusFilter: 'all' | 'approved' | 'pending' = 'all';
  searchTerm = '';

  ngOnInit() {
    this.loadHouses();
  }

  ngOnDestroy() {
    // No long-lived subscriptions in this component
  }

  async loadHouses() {
    this.loading = true;
    const { data: houses, error } = await this.supabaseService.supabase
      .from('boarding_houses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading boarding houses:', error);
      this.snackBar.open('Failed to load boarding houses', 'Close', { duration: 3000 });
      this.houses = [];
    } else {
      this.houses = houses || [];
    }

    await this.loadTenants();
    this.applyFilter();
    this.loading = false;
    this.cdr.markForCheck();
  }

  private async loadTenants() {
    const { data: tenants, error } = await this.supabaseService.supabase
      .from('users')
      .select('id, full_name, barangay, residency_type, boarding_house_name, residency_start_date, residency_end_date, verification_status')
      .in('residency_type', ['Boarding House Tenant', 'Institution Resident', 'Migrant Worker']);

    this.tenantsByHouse.clear();
    if (error || !tenants) return;

    for (const t of tenants) {
      if (!t.boarding_house_name) continue;
      const key = this.houseKey(t.barangay, t.boarding_house_name);
      const list = this.tenantsByHouse.get(key) ?? [];
      list.push({
        id: t.id,
        full_name: t.full_name,
        residency_type: t.residency_type,
        residency_start_date: t.residency_start_date,
        residency_end_date: t.residency_end_date,
        verification_status: t.verification_status || 'pending'
      });
      this.tenantsByHouse.set(key, list);
    }
  }

  private houseKey(barangay: string, name: string): string {
    return `${barangay}||${(name || '').trim().toLowerCase()}`;
  }

  getTenants(house: BoardingHouse): TenantSummary[] {
    return this.tenantsByHouse.get(this.houseKey(house.barangay, house.name)) ?? [];
  }

  applyFilter() {
    const term = (this.searchTerm || '').trim().toLowerCase();
    this.filteredHouses = this.houses.filter(h => {
      if (this.barangayFilter !== 'all' && h.barangay !== this.barangayFilter) return false;
      if (this.statusFilter === 'approved' && !h.is_approved) return false;
      if (this.statusFilter === 'pending' && h.is_approved) return false;
      if (term && !h.name.toLowerCase().includes(term) && !h.street_address.toLowerCase().includes(term)) return false;
      return true;
    });
    this.cdr.markForCheck();
  }

  approvedCount(): number { return this.houses.filter(h => h.is_approved).length; }
  pendingCount(): number  { return this.houses.filter(h => !h.is_approved).length; }
  totalTenants(): number {
    let n = 0;
    this.tenantsByHouse.forEach(list => n += list.length);
    return n;
  }

  openEditor(house?: BoardingHouse) {
    const ref = this.dialog.open(BoardingHouseEditorDialogComponent, {
      width: '640px',
      data: { house, barangays: this.barangays }
    });
    ref.afterClosed().subscribe((result: BoardingHouse | undefined) => {
      if (result) this.loadHouses();
    });
  }

  async toggleApproval(house: BoardingHouse) {
    const nextState = !house.is_approved;
    const action = nextState ? 'Approve' : 'Revoke approval for';

    const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
    if (!user) return;

    const update: any = { is_approved: nextState };
    if (nextState) {
      update.approved_by = user.id;
      update.approved_at = new Date().toISOString();
    } else {
      update.approved_by = null;
      update.approved_at = null;
    }

    const { error } = await this.supabaseService.supabase
      .from('boarding_houses')
      .update(update)
      .eq('id', house.id);

    if (error) {
      this.snackBar.open(`Failed to ${action.toLowerCase()} house: ${error.message}`, 'Close', { duration: 4000 });
      return;
    }

    this.snackBar.open(`${action} ${house.name}`, 'Close', { duration: 3000 });
    this.loadHouses();
  }
}

// ============================================================
// Editor dialog (Add / Edit a boarding house)
// ============================================================

@Component({
  selector: 'app-boarding-house-editor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  template: `
    <div class="border-4 border-gray-900 bg-white shadow-[8px_8px_0px_0px_rgba(17,24,39,1)]">
      <div class="bg-gray-900 text-white px-6 py-4 flex items-center gap-3">
        <mat-icon>home_work</mat-icon>
        <h2 class="text-lg font-black uppercase tracking-tight" style="font-family: 'Arial Black', Impact, sans-serif;">
          {{ data.house ? 'Edit Boarding House' : 'Register Boarding House' }}
        </h2>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()" class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Barangay</mat-label>
            <mat-select formControlName="barangay">
              <mat-option *ngFor="let b of data.barangays" [value]="b">{{ b }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>House Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g. Doña Maria's Boarding House">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full md:col-span-2">
            <mat-label>Street Address</mat-label>
            <input matInput formControlName="street_address" placeholder="e.g. 23 Rizal St.">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Owner Name</mat-label>
            <input matInput formControlName="owner_name">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Owner Contact</mat-label>
            <input matInput formControlName="owner_contact" placeholder="09xx-xxx-xxxx">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Max Occupancy (Optional)</mat-label>
            <input matInput type="number" formControlName="max_occupancy">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Notes (Optional)</mat-label>
          <textarea matInput formControlName="notes" rows="3" placeholder="e.g. Female-only, curfew at 10pm, vegetarian meals..."></textarea>
        </mat-form-field>

        <div class="flex justify-end gap-3 pt-2">
          <button mat-stroked-button type="button" (click)="cancel()" class="!rounded-sm !border-2 !border-gray-900 !bg-white !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] font-black uppercase tracking-wider">
            Cancel
          </button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving" class="!rounded-sm !border-2 !border-gray-900 !shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[1px] hover:!translate-x-[1px] hover:!shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider">
            <mat-icon *ngIf="!saving">save</mat-icon>
            <mat-icon *ngIf="saving" class="animate-spin">autorenew</mat-icon>
            {{ saving ? 'Saving...' : (data.house ? 'Save Changes' : 'Register House') }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class BoardingHouseEditorDialogComponent {
  private supabaseService = inject(SupabaseService);
  private dialogRef = inject(MatDialogRef<BoardingHouseEditorDialogComponent>);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  saving = false;
  form: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { house?: BoardingHouse; barangays: string[] }) {
    this.form = this.fb.group({
      barangay: [data.house?.barangay || '', Validators.required],
      name: [data.house?.name || '', [Validators.required, Validators.minLength(2)]],
      street_address: [data.house?.street_address || '', Validators.required],
      owner_name: [data.house?.owner_name || '', Validators.required],
      owner_contact: [data.house?.owner_contact || '', Validators.required],
      max_occupancy: [data.house?.max_occupancy || null],
      notes: [data.house?.notes || '']
    });
  }

  cancel() {
    this.dialogRef.close();
  }

  async save() {
    if (this.form.invalid) return;
    this.saving = true;

    const values = this.form.value;
    const { data: { user } } = await this.supabaseService.supabase.auth.getUser();

    if (this.data.house) {
      const { data, error } = await this.supabaseService.supabase
        .from('boarding_houses')
        .update({
          barangay: values.barangay,
          name: values.name,
          street_address: values.street_address,
          owner_name: values.owner_name,
          owner_contact: values.owner_contact,
          max_occupancy: values.max_occupancy || null,
          notes: values.notes || null
        })
        .eq('id', this.data.house.id)
        .select()
        .single();

      this.saving = false;
      if (error) {
        this.snackBar.open(`Failed to update: ${error.message}`, 'Close', { duration: 4000 });
        return;
      }
      this.snackBar.open('Boarding house updated', 'Close', { duration: 3000 });
      this.dialogRef.close(data);
    } else {
      const { data, error } = await this.supabaseService.supabase
        .from('boarding_houses')
        .insert({
          barangay: values.barangay,
          name: values.name,
          street_address: values.street_address,
          owner_name: values.owner_name,
          owner_contact: values.owner_contact,
          max_occupancy: values.max_occupancy || null,
          notes: values.notes || null,
          created_by: user?.id
        })
        .select()
        .single();

      this.saving = false;
      if (error) {
        this.snackBar.open(`Failed to register: ${error.message}`, 'Close', { duration: 4000 });
        return;
      }
      this.snackBar.open('Boarding house registered', 'Close', { duration: 3000 });
      this.dialogRef.close(data);
    }
  }
}
