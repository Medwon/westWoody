import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { RewardProgramsService, RewardProgramType } from '../../../../core/services/reward-programs.service';

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
  imports: [CommonModule],
  template: `
    <div class="page-wrapper">
      <div class="content-layout">
        <!-- Left: Reward Program types -->
        <section class="types-section">
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
              </div>
              <div class="type-card-body">
                <h3 class="type-card-title">{{ card.title }}</h3>
                <p class="type-card-desc">{{ card.description }}</p>
              </div>
              <div class="type-card-footer">
                <button type="button" class="btn-create" (click)="onCreate(card)">
                  Create
                  <svg class="btn-create-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </article>
          </div>
        </section>

        <!-- Right: templates (placeholder) -->
        <aside class="templates-sidebar">
          <h3 class="templates-title">Reward Program templates</h3>
          <p class="templates-subtitle">Start quickly from a pre-configured template (coming soon).</p>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .page-wrapper { min-height: 100%; margin: -2rem; padding: 2rem; background: #f8fafc; }
    .content-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 1.5rem; align-items: flex-start; }

    .types-section { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.75rem 2rem 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .page-title { font-size: 1.4rem; font-weight: 700; margin: 0 0 0.25rem 0; color: #0f172a; }
    .page-subtitle { font-size: 0.9rem; color: #64748b; margin: 0 0 1.5rem 0; }

    .types-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    .type-card { display: flex; flex-direction: column; gap: 0.75rem; padding: 2rem 2rem 1.5rem; border-radius: 14px; border: 1px solid #e2e8f0; background: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
    .type-card-header { display: flex; justify-content: flex-start; margin-bottom: 0.25rem; }
    .type-card-icon { width: 56px; height: 56px; border-radius: 14px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; }
    .type-card-icon svg { width: 28px; height: 28px; }
    .type-card-body { flex: 1; }
    .type-card-title { font-size: 1.2rem; font-weight: 700; color: #0f172a; margin: 0 0 0.35rem 0; }
    .type-card-desc { font-size: 0.95rem; color: #64748b; margin: 0; line-height: 1.5; }
    .type-card-footer { margin-top: 1rem; }
    .btn-create { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem 1.25rem; border-radius: 8px; border: none; background: #16A34A; color: white; font-size: 0.95rem; font-weight: 600; cursor: pointer; }
    .btn-create:hover { background: #15803d; }
    .btn-create-arrow { width: 18px; height: 18px; }

    .templates-sidebar { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .templates-title { font-size: 1rem; font-weight: 700; margin: 0 0 0.5rem 0; color: #0f172a; }
    .templates-subtitle { font-size: 0.85rem; color: #64748b; margin: 0; }

    @media (max-width: 900px) {
      .content-layout { grid-template-columns: minmax(0, 1fr); }
      .templates-sidebar { order: -1; }
    }
  `]
})
export class ProgramTypesPageComponent implements OnInit {
  private pageHeaderService = inject(PageHeaderService);
  private router = inject(Router);
  private rewardProgramsService = inject(RewardProgramsService);

  readonly PROGRAM_TYPES = PROGRAM_TYPES;

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Create Program', [
      { label: 'Главная', route: '/home' },
      { label: 'Reward Programs', route: '/bonus-program' },
      { label: 'Reward Program types' }
    ]);
  }

  onCreate(card: ProgramTypeCard): void {
    const type = this.toRewardProgramType(card.id);
    this.rewardProgramsService.createDraft(type).subscribe({
      next: res => {
        this.router.navigate(['/bonus-program', 'create', res.uuid]);
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

