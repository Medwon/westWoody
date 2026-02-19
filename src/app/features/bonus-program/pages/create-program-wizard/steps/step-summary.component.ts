import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray } from '@angular/forms';
import { AlertComponent } from '../../../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-step-summary',
  standalone: true,
  imports: [CommonModule, AlertComponent],
  template: `
    <div class="step-content">
      <!-- Errors -->
      <app-alert *ngIf="launchError" type="error" [dismissible]="true" (dismissed)="launchError = ''">
        {{ launchError }}
      </app-alert>

      <!-- Launch CTA: first thing user sees, with Launch | Schedule on the right -->
      <div class="launch-section">
        <div class="launch-info">
          <p class="launch-text" *ngIf="isScheduledLaunch">
            This program will be <strong>scheduled</strong> and automatically activated on the start date.
          </p>
          <p class="launch-text" *ngIf="!isScheduledLaunch">
            This program will be <strong>launched immediately</strong> and become active right away.
          </p>
        </div>
        <button
          type="button"
          class="btn-launch-cta"
          [disabled]="!isFormValidForLaunch || launching"
          (click)="launch.emit()"
        >
          {{ launching ? 'Launching...' : (isScheduledLaunch ? 'Schedule' : 'Launch now') }}
        </button>
      </div>

      <!-- Program details -->
      <div class="summary-section">
        <h3 class="section-heading">
          <span class="section-num">1</span>
          Program Details
          <button type="button" class="btn-edit" (click)="goToStep.emit(1)" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="item-label">Name</span>
            <span class="item-value">{{ formValue.name || '—' }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Description</span>
            <span class="item-value">{{ formValue.description || '—' }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Cashback type</span>
            <span class="item-value">{{ formatCashbackType() }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Cashback value</span>
            <span class="item-value">{{ formatCashbackValue() }}</span>
          </div>
        </div>
      </div>

      <!-- Schedule -->
      <div class="summary-section">
        <h3 class="section-heading">
          <span class="section-num">2</span>
          Schedule
          <button type="button" class="btn-edit" (click)="goToStep.emit(2)" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="item-label">Start date</span>
            <span class="item-value">{{ formValue.startDate ? formatDate(formValue.startDate) : '—' }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">End date</span>
            <span class="item-value">{{ formValue.endDate ? formatDate(formValue.endDate) : 'Ongoing' }}</span>
          </div>
          <div class="summary-item full-width" *ngIf="enabledDays.length > 0">
            <span class="item-label">Active days</span>
            <span class="item-value">{{ enabledDays.join(', ') }}</span>
          </div>
          <div class="summary-item full-width" *ngIf="enabledDays.length === 0">
            <span class="item-label">Active days</span>
            <span class="item-value">All days (24/7)</span>
          </div>
        </div>
      </div>

      <!-- Rules -->
      <div class="summary-section">
        <h3 class="section-heading">
          <span class="section-num">3</span>
          Rules
          <button type="button" class="btn-edit" (click)="goToStep.emit(3)" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="item-label">Min spend</span>
            <span class="item-value">{{ formValue.minSpendAmount ?? 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Eligibility</span>
            <span class="item-value">{{ formatEligibility() }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Redeem limit</span>
            <span class="item-value">Up to {{ formValue.redeemLimitPercent ?? 100 }}%</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Bonus lifespan</span>
            <span class="item-value">{{ formValue.bonusLifespanDays ? formValue.bonusLifespanDays + ' days' : 'Never expires' }}</span>
          </div>
        </div>
      </div>

      <!-- Tiers -->
      <div class="summary-section">
        <h3 class="section-heading">
          <span class="section-num">4</span>
          Tiers
          <button type="button" class="btn-edit" (click)="goToStep.emit(4)" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </h3>
        <div *ngIf="tiersValue.length === 0" class="no-data">No tiers configured</div>
        <div *ngIf="tiersValue.length > 0" class="tiers-table">
          <div class="tier-row tier-header-row">
            <span>Name</span>
            <span>Min</span>
            <span>Max</span>
            <span>Extra %</span>
          </div>
          <div class="tier-row" *ngFor="let tier of tiersValue">
            <span class="tier-name">{{ tier.name }}</span>
            <span>{{ tier.minAmount }}</span>
            <span>{{ tier.maxAmount ?? '∞' }}</span>
            <span>+{{ tier.extraEarningPercent }}%</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .step-content { display: flex; flex-direction: column; gap: 1.25rem; }

    .summary-section {
      border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem 1.25rem;
      background: #ffffff;
    }
    .section-heading {
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.95rem; font-weight: 700; color: #0f172a;
      margin: 0 0 0.75rem 0; padding-bottom: 0.5rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .section-num {
      width: 24px; height: 24px; border-radius: 50%;
      background: #dcfce7; color: #16A34A;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
    }
    .btn-edit {
      margin-left: auto; background: none; border: none; padding: 0.25rem;
      color: #16A34A; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .btn-edit:hover { color: #15803d; }
    .btn-edit svg { width: 18px; height: 18px; }

    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 1.5rem; }
    .summary-item { display: flex; flex-direction: column; gap: 0.15rem; }
    .summary-item.full-width { grid-column: 1 / -1; }
    .item-label { font-size: 0.75rem; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; }
    .item-value { font-size: 0.875rem; color: #0f172a; }

    .no-data { font-size: 0.85rem; color: #94a3b8; font-style: italic; }

    .tiers-table { display: flex; flex-direction: column; }
    .tier-row {
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 0.5rem; padding: 0.5rem 0; font-size: 0.85rem; color: #475569;
      border-bottom: 1px solid #f1f5f9;
    }
    .tier-row:last-child { border-bottom: none; }
    .tier-header-row { font-weight: 600; color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; }
    .tier-name { font-weight: 600; color: #0f172a; }

    .launch-section {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: 1rem 1.25rem; border-radius: 10px;
      background: #f0fdf4; border: 1px solid #bbf7d0;
    }
    .launch-info { flex: 1; min-width: 0; }
    .launch-text { font-size: 0.9rem; color: #15803d; margin: 0; line-height: 1.5; }
    .btn-launch-cta {
      flex-shrink: 0;
      padding: 0.5rem 1.25rem; border: none; border-radius: 6px;
      background: #16A34A; color: white; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: all 0.15s;
    }
    .btn-launch-cta:hover:not(:disabled) { background: #15803d; }
    .btn-launch-cta:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class StepSummaryComponent {
  @Input() form!: FormGroup;
  @Input() isScheduledLaunch = false;
  @Input() isFormValidForLaunch = false;
  @Input() launching = false;
  @Output() goToStep = new EventEmitter<number>();
  @Output() launch = new EventEmitter<void>();

  launchError = '';

  get formValue(): any {
    return this.form.getRawValue();
  }

  get tiersValue(): any[] {
    const tiers = this.form.get('tiers') as FormArray;
    return tiers ? tiers.getRawValue() : [];
  }

  get enabledDays(): string[] {
    const schedules = this.form.get('weeklySchedules') as FormArray;
    if (!schedules) return [];
    return schedules.getRawValue()
      .filter((s: any) => s.enabled)
      .map((s: any) => {
        const label = s.dayOfWeek.charAt(0) + s.dayOfWeek.slice(1).toLowerCase();
        const time = s.startTime && s.endTime ? ` (${s.startTime}–${s.endTime})` : '';
        return label + time;
      });
  }


  formatCashbackType(): string {
    const type = this.formValue.cashbackType;
    if (type === 'PERCENTAGE') return 'Percentage (%)';
    if (type === 'BONUS_POINTS') return 'Bonus Points';
    return '—';
  }

  formatCashbackValue(): string {
    const type = this.formValue.cashbackType;
    const value = this.formValue.cashbackValue;
    if (!value && value !== 0) return '—';
    if (type === 'PERCENTAGE') return `${value}%`;
    if (type === 'BONUS_POINTS') {
      const threshold = this.formValue.pointsSpendThreshold;
      return threshold ? `${value} point(s) per ${threshold} spent` : `${value} points`;
    }
    return String(value);
  }

  formatEligibility(): string {
    const map: Record<string, string> = {
      ALL: 'All transactions',
      SPECIFIC_ITEMS: 'Specific items',
      SPECIFIC_CATEGORIES: 'Specific categories',
      SPECIFIC_SERVICES: 'Specific services'
    };
    return map[this.formValue.eligibilityType] || '—';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }
}
