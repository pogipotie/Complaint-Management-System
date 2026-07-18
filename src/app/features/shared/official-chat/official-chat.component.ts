import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-official-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="h-[calc(100vh-140px)] flex flex-col bg-white border-4 border-gray-900 shadow-[8px_8px_0px_0px_rgba(17,24,39,1)] rounded-sm">
      <!-- Header -->
      <div class="bg-primary-300 border-b-4 border-gray-900 p-4 shrink-0 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white border-2 border-gray-900 rounded-sm flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
            <mat-icon class="text-primary-600">forum</mat-icon>
          </div>
          <div>
            <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight m-0 leading-tight" style="font-family: 'Arial Black', Impact, sans-serif;">Official LGU Chat</h2>
            <p class="text-[10px] font-bold text-gray-800 uppercase tracking-widest m-0">Private channel for Admins & Captains</p>
          </div>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50 flex flex-col gap-4" #chatContainer>
        <div *ngIf="loading" class="flex justify-center py-4 my-auto">
          <mat-icon class="animate-spin text-primary-500 scale-150">autorenew</mat-icon>
        </div>
        
        <div *ngIf="!loading && messages.length === 0" class="text-center py-10 my-auto">
          <mat-icon class="text-gray-300 scale-[2] mb-4">chat_bubble_outline</mat-icon>
          <p class="text-gray-500 font-bold text-xs uppercase tracking-widest">No messages yet. Start the conversation!</p>
        </div>

        <div *ngFor="let msg of messages" class="flex gap-3" [class.flex-row-reverse]="msg.user_id === currentUserId">
          <!-- Avatar -->
          <div class="w-10 h-10 rounded-sm border-2 border-gray-900 flex-shrink-0 flex items-center justify-center text-gray-900 text-sm font-black shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]"
               [ngClass]="msg.user_role === 'brgy_captain' ? 'bg-orange-200' : 'bg-primary-200'">
            {{ msg.user_full_name ? msg.user_full_name.charAt(0).toUpperCase() : 'U' }}
          </div>
          
          <!-- Message Body -->
          <div class="flex flex-col max-w-[75%]" [class.items-end]="msg.user_id === currentUserId">
            <div class="flex items-baseline gap-2 mb-1" [class.flex-row-reverse]="msg.user_id === currentUserId">
              <span class="text-[11px] font-black uppercase tracking-widest text-gray-800">{{ msg.user_full_name || 'Unknown' }}</span>
              <span class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{{ msg.created_at | date:'MMM d, h:mm a' }}</span>
              <span class="text-[9px] border-2 border-gray-900 px-1 rounded-sm uppercase font-black"
                    [ngClass]="msg.user_role === 'brgy_captain' ? 'bg-orange-100 text-orange-900' : 'bg-primary-100 text-primary-900'">
                {{ msg.user_role === 'brgy_captain' ? 'Captain' : 'Admin' }}
                <span *ngIf="msg.user_barangay && msg.user_role === 'brgy_captain'">({{ msg.user_barangay }})</span>
              </span>
            </div>
            
            <div class="p-3 border-2 border-gray-900 text-sm font-bold text-gray-800 leading-relaxed shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] whitespace-pre-wrap"
                 [ngClass]="msg.user_id === currentUserId ? 'bg-white rounded-l-sm rounded-br-sm' : 'bg-white rounded-r-sm rounded-bl-sm'">
              {{ msg.body }}
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="border-t-4 border-gray-900 bg-white p-4 shrink-0 flex gap-3">
        <textarea 
          [(ngModel)]="newMessage" 
          (keydown.enter)="onEnter($event)"
          placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
          rows="2"
          class="flex-1 resize-none bg-gray-50 border-2 border-gray-900 rounded-sm p-3 text-sm font-bold text-gray-900 focus:outline-none focus:bg-white focus:ring-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] custom-scrollbar">
        </textarea>
        <button mat-flat-button color="primary" (click)="sendMessage()" [disabled]="!newMessage.trim() || sending" class="!h-auto !px-6 !rounded-sm !border-2 !border-gray-900 !shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] hover:!translate-y-[2px] hover:!translate-x-[2px] hover:!shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] transition-all font-black uppercase tracking-wider disabled:opacity-50">
          <mat-icon class="scale-125">send</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { width: 8px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-left: 2px solid #111827; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #111827; border: 2px solid #111827; }
  `]
})
export class OfficialChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  messages: any[] = [];
  newMessage = '';
  currentUserId: string | null = null;
  loading = true;
  sending = false;
  shouldScroll = false;
  private subscription: any;

  async ngOnInit() {
    if (this.authService.user) {
      this.currentUserId = this.authService.user.id;
    }
    await this.loadMessages();
    this.subscribeToMessages();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.supabaseService.supabase.removeChannel(this.subscription);
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  scrollToBottom() {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  async loadMessages() {
    this.loading = true;
    const { data, error } = await this.supabaseService.supabase
      .from('official_messages')
      .select('*, users!official_messages_user_id_fkey(full_name, role, barangay)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      this.messages = data.map((m: any) => ({
        ...m,
        user_full_name: m.users?.full_name,
        user_role: m.users?.role,
        user_barangay: m.users?.barangay
      })).reverse();
      this.shouldScroll = true;
    }
    this.loading = false;
  }

  subscribeToMessages() {
    this.subscription = this.supabaseService.supabase.channel('public:official_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'official_messages' },
        async (payload: any) => {
          // Fetch user details for the new message
          const { data: userData } = await this.supabaseService.supabase
            .from('users')
            .select('full_name, role, barangay')
            .eq('id', payload.new.user_id)
            .single();

          const newMsg = {
            ...payload.new,
            user_full_name: userData?.full_name,
            user_role: userData?.role,
            user_barangay: userData?.barangay
          };

          if (!this.messages.find(m => m.id === newMsg.id)) {
            this.messages.push(newMsg);
            this.shouldScroll = true;
            this.cdr.detectChanges(); // Force UI update
          }
        }
      )
      .subscribe();
  }

  onEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.currentUserId || this.sending) return;

    this.sending = true;
    const text = this.newMessage.trim();
    this.newMessage = '';

    const { data, error } = await this.supabaseService.supabase
      .from('official_messages')
      .insert({
        user_id: this.currentUserId,
        body: text
      })
      .select('*, users!official_messages_user_id_fkey(full_name, role, barangay)')
      .single();

    if (!error && data) {
      const newMsg = {
        ...data,
        user_full_name: data.users?.full_name,
        user_role: data.users?.role,
        user_barangay: data.users?.barangay
      };
      
      if (!this.messages.find(m => m.id === newMsg.id)) {
        this.messages.push(newMsg);
        this.shouldScroll = true;
      }
    } else if (error) {
      console.error('Error sending message:', error);
      this.newMessage = text; // Restore text on failure
    }
    
    this.sending = false;
  }
}