import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { RewardProgramsService } from '../../../../core/services/reward-programs.service';
import { RewardProgramSlot, RewardProgramType } from '../../../../core/models/reward-program.model';

type ProgramTypeId = 'welcome' | 'birthday' | 'referral' | 'cashback';

interface ProgramTypeCard {
  id: ProgramTypeId;
  title: string;
  description: string;
  section: 'Acquisition' | 'Events' | 'Growth';
  icon: string;
}

const PROGRAM_TYPES: ProgramTypeCard[] = [
  { id: 'welcome', title: 'Welcome reward', description: 'Fixed bonus after the first purchase.', section: 'Acquisition', icon: 'welcome' },
  { id: 'birthday', title: 'Birthday reward', description: 'Bonus to customers on their birthday.', section: 'Events', icon: 'gift' },
  { id: 'referral', title: 'Referral', description: 'Rewards for successful client referrals.', section: 'Growth', icon: 'referral' },
  { id: 'cashback', title: 'Cashback', description: 'Percentage cashback on each payment.', section: 'Growth', icon: 'percent' }
];

@Component({
  selector: 'app-program-types-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">
      <a routerLink="/bonus-program" class="back-link">
        <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back
      </a>
      <h2 class="page-title">Reward Program types</h2>
      <p class="page-subtitle">Choose what kind of reward program you want to configure.</p>

      <div class="types-grid">
        <article *ngFor="let card of PROGRAM_TYPES" class="type-card">
          <div class="type-card-header">
            <div class="type-card-icon">
              <ng-container [ngSwitch]="card.icon">
                <svg *ngSwitchCase="'welcome'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M7 4v4M17 4v4"/></svg>
                <svg *ngSwitchCase="'gift'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 12v9H4v-9"/><rect x="2" y="7" width="20" height="5" rx="1"/><path d="M12 22V7"/><path d="M12 7c-2-2-4-2.5-4-4.5a2 2 0 0 1 4 0c0 1.5-2 2-4 4.5"/><path d="M12 7c2-2 4-2.5 4-4.5a2 2 0 0 0-4 0c0 1.5 2 2 4 4.5"/></svg>
                <svg *ngSwitchCase="'referral'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.5 13.5l7 4M15.5 6.5l-7 4"/></svg>
                <svg *ngSwitchCase="'percent'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="2"/><circle cx="15" cy="15" r="2"/><path d="M5 19L19 5"/></svg>
              </ng-container>
            </div>
            <span *ngIf="getSlotState(card) === 'ACTIVE'" class="slot-badge slot-active">Already active</span>
            <span *ngIf="getSlotState(card) === 'SCHEDULED'" class="slot-badge slot-scheduled">Scheduled</span>
          </div>
          <div class="type-card-body">
            <h3 class="type-card-title">{{ card.title }}</h3>
            <p class="type-card-desc">{{ card.description }}</p>
          </div>
          <div class="type-card-footer">
            <button type="button" class="btn-go" [disabled]="isSlotBlocked(card)" (click)="onCreate(card)" title="Create program" aria-label="Create program">
              <svg class="btn-go-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <span class="btn-go-label">Create</span>
            </button>
          </div>
        </article>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .page-wrapper { min-height: 100%; margin: -2rem; padding: 2rem; background: #f8fafc; }

    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 500; color: #475569; text-decoration: none; margin-bottom: 1rem; transition: color 0.2s; }
    .back-link:hover { color: #16A34A; }
    .back-icon { width: 20px; height: 20px; }

    .page-title { font-size: 1.4rem; font-weight: 700; margin: 0 0 0.25rem 0; color: #0f172a; }
    .page-subtitle { font-size: 0.9rem; color: #64748b; margin: 0 0 1.5rem 0; }

    .types-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; }
    .type-card { display: flex; flex-direction: column; gap: 0.75rem; padding: 2rem 2rem 1.5rem; border-radius: 14px; border: 1px solid #e2e8f0; background: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
    .type-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem; gap: 0.5rem; }
    .slot-badge { font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 6px; flex-shrink: 0; }
    .slot-active { background: #dcfce7; color: #16A34A; }
    .slot-scheduled { background: #e0f2fe; color: #0369a1; }
    .type-card-icon { width: 56px; height: 56px; border-radius: 14px; background: #dcfce7; color: #16A34A; display: flex; align-items: center; justify-content: center; }
    .type-card-icon svg { width: 28px; height: 28px; }
    .type-card-body { flex: 1; }
    .type-card-title { font-size: 1.2rem; font-weight: 700; color: #0f172a; margin: 0 0 0.35rem 0; }
    .type-card-desc { font-size: 0.95rem; color: #64748b; margin: 0; line-height: 1.5; }
    .type-card-footer { margin-top: 1.25rem; display: flex; justify-content: flex-end; }
    .btn-go { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0 1.25rem; height: 44px; border: none; border-radius: 22px; background: transparent; color: #94a3b8; cursor: pointer; transition: color 0.2s, background 0.2s; }
    .btn-go:hover:not(:disabled) { color: #16A34A; background: #dcfce7; }
    .btn-go:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-go-arrow { width: 22px; height: 22px; flex-shrink: 0; }
    .btn-go-label { font-size: 0.9rem; font-weight: 500; }
  `]
})
export class ProgramTypesPageComponent implements OnInit {
  private pageHeaderService = inject(PageHeaderService);
  private router = inject(Router);
  private rewardProgramsService = inject(RewardProgramsService);

  readonly PROGRAM_TYPES = PROGRAM_TYPES;
  slots: RewardProgramSlot[] = [];

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Create Program', [
      { label: 'Главная', route: '/home' },
      { label: 'Reward Programs', route: '/bonus-program' },
      { label: 'Reward Program types' }
    ]);
    this.rewardProgramsService.getSlots().subscribe({
      next: (list) => this.slots = list
    });
  }

  getSlotState(card: ProgramTypeCard): string | null {
    const type = this.toRewardProgramType(card.id);
    const slot = this.slots.find(s => s.type === type);
    if (!slot || slot.status === 'NOT_CREATED' || slot.status === 'DRAFT' || slot.status === 'INACTIVE' || slot.status === 'ARCHIVED') return null;
    return slot.status; // ACTIVE | SCHEDULED
  }

  isSlotBlocked(card: ProgramTypeCard): boolean {
    const state = this.getSlotState(card);
    return state === 'ACTIVE' || state === 'SCHEDULED';
  }

  onCreate(card: ProgramTypeCard): void {
    if (this.isSlotBlocked(card)) return;
    const type = this.toRewardProgramType(card.id);
    const typeSlug = card.id;
    this.rewardProgramsService.createDraft(type).subscribe({
      next: res => {
        this.router.navigate(['/bonus-program', 'create', typeSlug, res.uuid]);
      }
    });
  }

  private toRewardProgramType(id: ProgramTypeId): RewardProgramType {
    switch (id) {
      case 'welcome': return 'WELCOME';
      case 'birthday': return 'BIRTHDAY';
      case 'referral': return 'REFERRAL';
      case 'cashback':
      default:
        return 'CASHBACK';
    }
  }
}

