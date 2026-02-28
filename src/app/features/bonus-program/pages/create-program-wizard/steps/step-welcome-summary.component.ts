import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { AlertComponent } from '../../../../../shared/components/alert/alert.component';
import { ScheduleOverlapCheckResponse } from '../../../../../core/models/reward-program.model';

@Component({
  selector: 'app-step-welcome-summary',
  standalone: true,
  imports: [CommonModule, AlertComponent],
  template: `
    <div class="step-content">
      <app-alert *ngIf="launchError" type="error" [dismissible]="true" (dismissed)="launchError = ''">
        {{ launchError }}
      </app-alert>

      <div class="launch-section">
        <div class="launch-info">
          <p class="launch-text" *ngIf="isScheduledLaunch">
            This program will be <strong>scheduled</strong> and automatically activated on the start date.
          </p>
          <p class="launch-text" *ngIf="!isScheduledLaunch">
            This program will be <strong>launched immediately</strong> and become active right away.
          </p>
        </div>
        <div class="launch-cta-row">
          <button
            type="button"
            class="btn-launch-cta"
            [disabled]="!isFormValidForLaunch || launching"
            (click)="launch.emit()"
          >
            {{ launching ? 'Launching...' : (isScheduledLaunch ? 'Schedule' : 'Launch now') }}
          </button>
        </div>
      </div>

      @if (scheduleOverlap?.overlaps) {
        <app-alert type="warning" [dismissible]="false">
          {{ scheduleOverlap?.alwaysOnConflict
            ? 'You can have only one always-on program. Schedule or launch a periodic program instead.'
            : 'It overlaps with ' + (scheduleOverlap?.overlappingProgramName || 'another program') + ' of the same type.' }}
        </app-alert>
      }

      <div class="summary-section">
        <h3 class="section-heading">
          <span class="section-num">1</span>
          Program details
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
            <span class="item-label">Type to grant</span>
            <span class="item-value">{{ formValue.grantType === 'POINTS' ? 'Points' : 'Fixed amount (KZT)' }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Grant value</span>
            <span class="item-value">{{ formValue.grantValue ?? '—' }}{{ formValue.grantType === 'FIXED_MONEY_KZT' ? ' ₸' : '' }}</span>
          </div>
        </div>
      </div>

      <div class="summary-section">
        <h3 class="section-heading">
          <span class="section-num">2</span>
          Rules
          <button type="button" class="btn-edit" (click)="goToStep.emit(2)" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="item-label">Bonus lifespan</span>
            <span class="item-value">{{ formValue.bonusLifespanDays ? formValue.bonusLifespanDays + ' days' : 'Never expires' }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">When to grant</span>
            <span class="item-value">{{ whenToGrantLabel(formValue.grantTrigger) }}</span>
          </div>
          <div class="summary-item" *ngIf="formValue.grantTrigger === 'ON_FIRST_PAY'">
            <span class="item-label">On first payment</span>
            <span class="item-value">{{ formValue.firstPayMode === 'WELCOME_ONLY' ? 'Grant only event bonus' : 'Grant alongside cashback' }}</span>
          </div>
        </div>
      </div>

      <div class="summary-section">
        <h3 class="section-heading">
          <span class="section-num">3</span>
          Schedule
          <button type="button" class="btn-edit" (click)="goToStep.emit(3)" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </h3>
        <div class="summary-grid">
          <div class="summary-item" *ngIf="formValue.scheduleMode === 'immediate_always_on'">
            <span class="item-label">Schedule</span>
            <span class="item-value">Launch always-on immediately</span>
          </div>
          <div class="summary-item" *ngIf="formValue.scheduleMode !== 'immediate_always_on'">
            <span class="item-label">Start date</span>
            <span class="item-value">{{ formValue.startDate ? formatDate(formValue.startDate) : '—' }}</span>
          </div>
          <div class="summary-item" *ngIf="formValue.scheduleMode !== 'immediate_always_on'">
            <span class="item-label">End date</span>
            <span class="item-value">{{ formValue.endDate ? formatDate(formValue.endDate) : '—' }}</span>
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
      background: #16A34A; color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700;
    }
    .btn-edit {
      margin-left: auto; padding: 0.25rem; border: none; background: none;
      color: #64748b; cursor: pointer; border-radius: 4px;
    }
    .btn-edit:hover { color: #16A34A; background: #f0fdf4; }
    .btn-edit svg { width: 16px; height: 16px; display: block; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem 1.5rem; }
    .summary-item { display: flex; flex-direction: column; gap: 0.2rem; }
    .item-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.02em; }
    .item-value { font-size: 0.9rem; font-weight: 500; color: #0f172a; }
    .launch-section { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; padding: 1rem; background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0; }
    .launch-text { margin: 0; font-size: 0.95rem; color: #166534; }
    .btn-launch-cta { padding: 0.6rem 1.5rem; background: #16A34A; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-launch-cta:hover:not(:disabled) { background: #15803d; }
    .btn-launch-cta:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class StepWelcomeSummaryComponent {
  @Input() form!: FormGroup;
  @Input() isScheduledLaunch = false;
  @Input() isFormValidForLaunch = false;
  @Input() launching = false;
  @Input() launchError = '';
  @Input() scheduleOverlap: ScheduleOverlapCheckResponse | null = null;
  @Output() goToStep = new EventEmitter<number>();
  @Output() launch = new EventEmitter<void>();

  get formValue(): any {
    return this.form?.getRawValue() ?? {};
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

  whenToGrantLabel(trigger: string): string {
    if (trigger === 'ON_JOIN') return 'On client joining the program';
    if (trigger === 'ON_BIRTHDAY') return "On client's birthday";
    return 'On first payment';
  }
}
