import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';

@Component({
  selector: 'app-reward-program-create-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">
      <div class="in-dev-card">
        <div class="in-dev-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 6V4M12 6c-2.5 0-4.5 2-4.5 4.5S9.5 15 12 15s4.5-2 4.5-4.5S14.5 6 12 6z"/>
            <path d="M19.4 15a7.5 7.5 0 01-14.8 0"/>
          </svg>
        </div>
        <h1 class="in-dev-title">{{ typeLabel }} — In development</h1>
        <p class="in-dev-desc">
          This program type is not yet available. The creation flow and steps are currently in development.
          Only <strong>Cashback</strong> programs can be created at this time.
        </p>
        <p class="in-dev-meta">Draft UUID: {{ uuid }}</p>
        <a routerLink="/reward-programs" class="in-dev-back">← Back to Reward Programs</a>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { padding: 2rem; min-height: 100%; display: flex; align-items: center; justify-content: center; }
    .in-dev-card {
      max-width: 480px; padding: 2rem; text-align: center;
      background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .in-dev-icon {
      width: 64px; height: 64px; margin: 0 auto 1.25rem;
      background: #fef3c7; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #d97706;
    }
    .in-dev-icon svg { width: 32px; height: 32px; }
    .in-dev-title { font-size: 1.35rem; font-weight: 700; color: #0f172a; margin: 0 0 0.75rem 0; }
    .in-dev-desc { font-size: 0.95rem; color: #64748b; line-height: 1.55; margin: 0 0 1rem 0; }
    .in-dev-meta { font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin: 0 0 1.25rem 0; word-break: break-all; }
    .in-dev-back {
      display: inline-block; color: #16A34A; font-weight: 600; text-decoration: none;
      font-size: 0.9rem; transition: color 0.15s;
    }
    .in-dev-back:hover { color: #15803d; }
  `]
})
export class RewardProgramCreatePageComponent implements OnInit {
  type = '';
  uuid = '';
  typeLabel = '';

  private route = inject(ActivatedRoute);
  private pageHeaderService = inject(PageHeaderService);

  private readonly typeLabels: Record<string, string> = {
    welcome: 'Welcome reward',
    birthday: 'Birthday reward',
    referral: 'Referral',
    cashback: 'Cashback'
  };

  ngOnInit(): void {
    // Type is in the path: create/welcome/:uuid, create/birthday/:uuid, create/referral/:uuid
    const segments = this.route.snapshot.url;
    this.type = segments.length >= 2 ? segments[1].path : '';
    this.uuid = this.route.snapshot.paramMap.get('uuid') ?? '';
    this.typeLabel = this.typeLabels[this.type] ?? this.type;

    this.pageHeaderService.setPageHeader(`Create ${this.typeLabel}`, [
      { label: 'Home', route: '/home' },
      { label: 'Reward Programs', route: '/reward-programs' },
      { label: `Create ${this.typeLabel}` }
    ]);
  }
}
