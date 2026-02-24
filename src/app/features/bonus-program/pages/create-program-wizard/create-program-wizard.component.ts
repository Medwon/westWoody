import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize, debounceTime, combineLatest, startWith } from 'rxjs';

import { PageHeaderService } from '../../../../core/services/page-header.service';
import { ToastService } from '../../../../core/services/toast.service';
import { RewardProgramsService } from '../../../../core/services/reward-programs.service';
import {
  DayOfWeek,
  RewardProgramResponse,
  SaveCashbackDraftRequest,
  LaunchCashbackProgramRequest,
  WeeklyScheduleEntry,
  CashbackTierEntry,
  ScheduleOverlapCheckResponse
} from '../../../../core/models/reward-program.model';

import { StepProgramDetailsComponent } from './steps/step-program-details.component';
import { StepScheduleComponent } from './steps/step-schedule.component';
import { StepRulesComponent } from './steps/step-rules.component';
import { StepTiersComponent } from './steps/step-tiers.component';
import { StepNotificationsComponent } from './steps/step-notifications.component';
import { StepSummaryComponent } from './steps/step-summary.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

// ─── Step definitions ────────────────────────────────────────────────

interface WizardStep {
  num: number;
  label: string;
  hint: string;
}

const STEPS: WizardStep[] = [
  { num: 1, label: 'Program details', hint: 'Define basic information about this cashback program.' },
  { num: 2, label: 'Schedule', hint: 'Set program dates and weekly active hours.' },
  { num: 3, label: 'Rules', hint: 'Configure spending rules and redeem limits.' },
  { num: 4, label: 'Tiers (optional)', hint: 'Optionally add tiers to reward loyal customers.' },
  { num: 5, label: 'Notifications', hint: 'Preview promotional messaging options.' },
  { num: 6, label: 'Summary & Launch', hint: 'Review all settings and launch the program.' }
];

const ALL_DAYS: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

@Component({
  selector: 'app-create-program-wizard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, AlertComponent,
    StepProgramDetailsComponent, StepScheduleComponent, StepRulesComponent,
    StepTiersComponent, StepNotificationsComponent, StepSummaryComponent
  ],
  template: `
    
      <div class="wizard-layout">
        <!-- ====== LEFT: Main content ====== -->
        <main class="wizard-main">
          <h2 class="step-title">{{ currentStep }}. {{ STEPS[currentStep - 1].label }}</h2>

          <!-- Global error -->
          <app-alert *ngIf="globalError" type="error" [dismissible]="true" (dismissed)="globalError = ''">
            {{ globalError }}
          </app-alert>

          <!-- Step 1: Program Details -->
          <app-step-program-details
            *ngIf="currentStep === 1"
            [form]="form"
          ></app-step-program-details>

          <!-- Step 2: Schedule -->
          <app-step-schedule
            *ngIf="currentStep === 2"
            [form]="form"
            [scheduleOverlap]="scheduleOverlap"
          ></app-step-schedule>

          <!-- Step 3: Rules -->
          <app-step-rules
            *ngIf="currentStep === 3"
            [form]="form"
          ></app-step-rules>

          <!-- Step 4: Tiers -->
          <app-step-tiers
            *ngIf="currentStep === 4"
            [form]="form"
          ></app-step-tiers>

          <!-- Step 5: Notifications -->
          <app-step-notifications
            *ngIf="currentStep === 5"
          ></app-step-notifications>

          <!-- Step 6: Summary -->
          <app-step-summary
            *ngIf="currentStep === 6"
            [form]="form"
            [isScheduledLaunch]="isScheduledLaunch"
            [isFormValidForLaunch]="isFormValidForLaunch && !scheduleOverlap?.overlaps"
            [launching]="launching"
            [scheduleOverlap]="scheduleOverlap"
            (goToStep)="goToStep($event)"
            (launch)="launch()"
          ></app-step-summary>
        </main>

        <!-- ====== RIGHT: Sidebar stepper card ====== -->
        <aside class="steps-sidebar">
          <h3 class="sidebar-title">Cashback Program</h3>

          <ul class="steps-list">
            <li *ngFor="let step of STEPS; let last = last"
                class="step-item"
                [class.active]="currentStep === step.num"
                [class.done]="isStepDone(step.num)"
                [class.future]="currentStep < step.num && !isStepDone(step.num)"
                (click)="goToStep(step.num)">
              <div class="step-row">
                <span class="step-num">
                  <ng-container *ngIf="isStepDone(step.num)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
                  </ng-container>
                  <ng-container *ngIf="!isStepDone(step.num)">{{ step.num }}</ng-container>
                </span>
                <span class="step-label">{{ step.label }}</span>
              </div>
              <!-- Active step hint + next -->
              <div *ngIf="currentStep === step.num" class="step-active-detail">
                <p class="step-hint">{{ step.hint }}</p>
                <button
                  *ngIf="currentStep < STEPS.length"
                  type="button"
                  class="btn-next-step"
                  (click)="nextStep(); $event.stopPropagation()"
                >
                  Next step
                </button>
              </div>
              <!-- Connector -->
              <div class="step-connector" *ngIf="!last"></div>
            </li>
          </ul>

          <!-- Sidebar footer -->
          <div class="sidebar-footer">
            <button type="button" class="btn-cancel" (click)="onCancel()">
              Cancel
            </button>
            @if (isFormValidForLaunch) {
              <div class="launch-footer-row">
                @if (scheduleOverlap?.overlaps) {
                  <span class="footer-tooltip-icon" tabindex="0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                    <span class="footer-tooltip-popover">{{ overlapTooltipTitle }}</span>
                  </span>
                }
                <button
                  type="button"
                  class="btn-save-draft btn-launch"
                  [disabled]="launching || (scheduleOverlap?.overlaps ?? false)"
                  (click)="launch()"
                >
                  {{ launching ? 'Launching...' : (isScheduledLaunch ? 'Schedule' : 'Launch now') }}
                </button>
              </div>
            } @else {
              <button
                type="button"
                class="btn-save-draft"
                [disabled]="saving"
                (click)="saveDraft()"
              >
                {{ saving ? 'Saving...' : 'Save draft' }}
              </button>
            }
          </div>
        </aside>
      </div>
    
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .wizard-wrapper { min-height: 100%; margin: -2rem; padding: 2rem; background: #f8fafc; }

    /* Layout */
    .wizard-layout { display: flex; gap: 1.5rem; align-items: flex-start; }

    /* Main panel */
    .wizard-main {
      flex: 1; min-width: 0;
      background: white; border-radius: 12px; border: 1px solid #e2e8f0;
      padding: 2rem 2.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .step-title {
      font-size: 1.25rem; font-weight: 700; color: #0f172a;
      margin: 0 0 1.5rem 0; padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    /* Sidebar */
    .steps-sidebar {
      flex-shrink: 0; width: 320px;
      background: white; border-radius: 12px; border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      padding: 1.75rem; display: flex; flex-direction: column;
      position: sticky; top: 2rem;
    }
    .sidebar-title {
      font-size: 1.1rem; font-weight: 700; color: #0f172a;
      margin: 0 0 1.5rem 0; padding-bottom: 1.1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    /* Steps list */
    .steps-list { list-style: none; padding: 0; margin: 0; flex: 1; }
    .step-item { position: relative; cursor: pointer; }
    .step-item.future { cursor: pointer; }
    .step-row { display: flex; align-items: center; gap: 0.85rem; }
    .step-num {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; font-weight: 700; flex-shrink: 0;
      background: #f1f5f9; color: #94a3b8;
      transition: all 0.2s;
    }
    .step-num svg { width: 16px; height: 16px; }
    .step-item.active .step-num { background: #16A34A; color: white; }
    .step-item.done .step-num { background: #dcfce7; color: #16A34A; }
    .step-label { font-size: 0.95rem; color: #94a3b8; font-weight: 500; transition: color 0.15s; }
    .step-item.active .step-label { color: #0f172a; font-weight: 600; }
    .step-item.done .step-label { color: #64748b; }
    .step-item:hover .step-label { color: #0f172a; }

    /* Active step detail */
    .step-active-detail {
      margin-left: calc(36px + 0.85rem);
      padding: 0.5rem 0 0.25rem 0;
    }
    .step-hint {
      font-size: 0.85rem; color: #64748b; line-height: 1.45;
      margin: 0 0 0.85rem 0;
    }
    .btn-next-step {
      display: inline-block; padding: 0.5rem 1.25rem;
      background: #0f172a; color: white; border: none; border-radius: 6px;
      font-size: 0.85rem; font-weight: 600; cursor: pointer;
      transition: background 0.15s;
    }
    .btn-next-step:hover { background: #1e293b; }

    /* Connector */
    .step-connector {
      width: 2px; height: 20px;
      background: #e2e8f0; margin: 4px 0 4px 17px;
      border-radius: 1px;
    }
    .step-item.done .step-connector { background: #bbf7d0; }

    /* Footer: Cancel and Save grouped with a small gap between them */
    .sidebar-footer {
      display: flex; align-items: center; justify-content: flex-end;
      gap: 1.25rem; margin-top: 1.5rem; padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    .btn-cancel {
      display: inline-flex; align-items: center;
      font-size: 0.85rem; font-weight: 600; color: #ef4444;
      text-decoration: none; cursor: pointer; background: none; border: none;
      transition: color 0.15s;
    }
    .btn-cancel:hover { color: #dc2626; }
    .btn-save-draft {
      padding: 0.5rem 1.25rem; border: 1px solid #e2e8f0; border-radius: 6px;
      background: white; color: #0f172a; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: all 0.15s;
    }
    .btn-save-draft:hover { background: #f8fafc; border-color: #cbd5e1; }
    .btn-save-draft:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-save-draft.btn-launch {
      background: #16A34A; color: white; border-color: #16A34A;
    }
    .btn-save-draft.btn-launch:hover:not(:disabled) { background: #15803d; border-color: #15803d; }
    .launch-footer-row {
      display: flex; align-items: center; gap: 0.5rem;
    }
    .footer-tooltip-icon {
      position: relative;
      display: inline-flex; align-items: center; justify-content: center;
      cursor: help; color: #64748b; flex-shrink: 0;
    }
    .footer-tooltip-icon svg {
      width: 14px; height: 14px; display: block;
    }
    .footer-tooltip-icon:hover {
      color: #22c55e;
    }
    .footer-tooltip-popover {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) translateY(6px) scale(0.97);
      background: #1f2937;
      color: #f3f4f6;
      padding: 0.625rem 0.875rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      white-space: normal;
      max-width: 260px;
      text-align: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: none;
      z-index: 20;
    }
    .footer-tooltip-popover::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #1f2937;
    }
    .footer-tooltip-icon:hover .footer-tooltip-popover {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0) scale(1);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .wizard-layout { flex-direction: column; }
      .steps-sidebar { width: 100%; order: -1; position: static; }
    }
  `]
})
export class CreateProgramWizardComponent implements OnInit, OnDestroy {
  private pageHeaderService = inject(PageHeaderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private rewardProgramsService = inject(RewardProgramsService);
  private destroy$ = new Subject<void>();

  readonly STEPS = STEPS;
  currentStep = 1;
  /** Highest step number the user has opened (by next or by clicking). Used so optional steps only show green after visit. */
  maxStepVisited = 1;
  draftUuid = '';
  saving = false;
  launching = false;
  globalError = '';
  /** When true, cancel should only navigate away and not delete the draft (URL has ?continue-editing). */
  private preserveDraftOnCancel = false;
  /** Set when schedule (start/end) is checked; overlaps true means Schedule/Launch must be disabled. */
  scheduleOverlap: ScheduleOverlapCheckResponse | null = null;

  form!: FormGroup;

  get stepsBaseUrl(): string {
    return `/reward-programs/create/cashback/${this.draftUuid}/steps`;
  }

  get overlapTooltipTitle(): string {
    if (this.scheduleOverlap?.alwaysOnConflict) {
      return 'You can have only one always-on program. Schedule or launch a periodic program instead.';
    }
    const name = this.scheduleOverlap?.overlappingProgramName || 'another program';
    return `It's overlapping with ${name} and scheduling/launching is not possible.`;
  }

  /** Step shows green + check only if user has visited it AND the step is valid (mandatory filled, or optional with no invalid data e.g. tiers). */
  isStepDone(stepNum: number): boolean {
    if (this.maxStepVisited < stepNum) return false;
    return this.isStepComplete(stepNum);
  }

  /** True if this step is complete: required fields valid; for step 4, tiers array valid if any. */
  isStepComplete(stepNum: number): boolean {
    if (!this.form) return false;
    switch (stepNum) {
      case 1: {
        const name = this.form.get('name');
        const cashbackType = this.form.get('cashbackType');
        const cashbackValue = this.form.get('cashbackValue');
        const pts = this.form.get('pointsSpendThreshold');
        const type = cashbackType?.value;
        const nameVal = name?.value;
        const hasName = typeof nameVal === 'string' && nameVal.trim().length > 0;
        return !!(hasName && cashbackType?.valid && cashbackValue?.valid
          && (type !== 'BONUS_POINTS' || (pts?.value != null && Number(pts?.value) > 0)));
      }
      case 2: {
        const mode = this.form.get('scheduleMode')?.value;
        if (mode === 'immediate_always_on') {
          return !(this.scheduleOverlap?.overlaps && this.scheduleOverlap?.alwaysOnConflict);
        }
        const start = this.form.get('startDate');
        const end = this.form.get('endDate');
        const sv = start?.value;
        const ev = end?.value;
        return !!(start?.valid && end?.valid
          && sv != null && String(sv).trim().length > 0
          && ev != null && String(ev).trim().length > 0);
      }
      case 3: {
        const minSpend = this.form.get('minSpendAmount');
        return minSpend?.valid === true;
      }
      case 4: {
        const tiers = this.form.get('tiers') as FormArray;
        return tiers?.valid === true;
      }
      case 5:
      case 6:
        return true;
      default:
        return false;
    }
  }

  /** True when all mandatory fields for launch are filled; then show Launch/Schedule on any step. */
  get isFormValidForLaunch(): boolean {
    if (!this.form) return false;
    return this.isStepComplete(1) && this.isStepComplete(2) && (this.form.get('tiers') as FormArray)?.valid !== false;
  }

  ngOnInit(): void {
    this.preserveDraftOnCancel = this.route.snapshot.queryParamMap.get('continue-editing') != null;

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.draftUuid = params.get('uuid') ?? '';
      const stepParam = params.get('step');
      if (stepParam) {
        const step = parseInt(stepParam, 10);
        if (step >= 1 && step <= STEPS.length) {
          this.currentStep = step;
          this.maxStepVisited = Math.max(this.maxStepVisited, step);
          if (step === 6) this.runOverlapCheck();
        } else {
          this.router.navigate(['/reward-programs', 'create', 'cashback', this.draftUuid, 'steps', '1'], { replaceUrl: true, queryParamsHandling: 'preserve' });
        }
      }
    });

    this.pageHeaderService.setPageHeader('Create Cashback Program', [
      { label: 'Home', route: '/home' },
      { label: 'Reward Programs', route: '/reward-programs' },
      { label: 'Create Cashback Program' }
    ]);

    this.buildForm();
    this.loadExistingDraft();
    this.setupOverlapCheck();
  }

  private setupOverlapCheck(): void {
    const scheduleMode = this.form.get('scheduleMode');
    const startDate = this.form.get('startDate');
    const endDate = this.form.get('endDate');
    if (!scheduleMode || !startDate || !endDate) return;
    combineLatest([
      scheduleMode.valueChanges.pipe(startWith(scheduleMode.value)),
      startDate.valueChanges.pipe(startWith(startDate.value)),
      endDate.valueChanges.pipe(startWith(endDate.value))
    ])
      .pipe(
        debounceTime(400),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.runOverlapCheck());
    setTimeout(() => this.runOverlapCheck(), 500);
  }

  private runOverlapCheck(): void {
    if (!this.draftUuid) {
      this.scheduleOverlap = null;
      return;
    }
    const mode = this.form.get('scheduleMode')?.value;
    if (mode === 'immediate_always_on') {
      const nowIso = new Date().toISOString();
      this.rewardProgramsService
        .checkScheduleOverlap('CASHBACK', nowIso, null, this.draftUuid)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => (this.scheduleOverlap = res),
          error: () => (this.scheduleOverlap = null)
        });
      return;
    }
    const startVal = this.form.get('startDate')?.value;
    const endVal = this.form.get('endDate')?.value;
    if (startVal && endVal) {
      const startIso = new Date(startVal).toISOString();
      const endIso = new Date(endVal).toISOString();
      this.rewardProgramsService
        .checkScheduleOverlap('CASHBACK', startIso, endIso, this.draftUuid)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => (this.scheduleOverlap = res),
          error: () => (this.scheduleOverlap = null)
        });
    } else {
      const nowIso = new Date().toISOString();
      this.rewardProgramsService
        .checkScheduleOverlap('CASHBACK', nowIso, null, this.draftUuid)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => (this.scheduleOverlap = res),
          error: () => (this.scheduleOverlap = null)
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Form building ─────────────────────────────────────────────────

  private buildForm(): void {
    this.form = this.fb.group({
      // Step 1: Details
      name: ['', Validators.required],
      description: [''],
      cashbackType: ['', Validators.required],
      cashbackValue: [null, [Validators.required, Validators.min(0)]],
      pointsSpendThreshold: [null],

      // Step 2: Schedule (periodic only; start and end required)
      scheduleMode: ['periodic'],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      weeklySchedules: this.fb.array(
        ALL_DAYS.map(day => {
          const isWeekday = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day);
          return this.fb.group({
            dayOfWeek: [day],
            enabled: [isWeekday],
            startTime: ['08:00'],
            endTime: ['18:00']
          });
        })
      ),

      // Step 3: Rules
      minSpendAmount: [0, Validators.min(0)],
      eligibilityType: ['ALL'],
      redeemLimitPercent: [100],
      bonusLifespanDays: [null],

      // Step 4: Tiers
      tiers: this.fb.array([])
    });
  }

  // ─── Load existing draft from backend ──────────────────────────────

  private loadExistingDraft(): void {
    if (!this.draftUuid) return;

    this.rewardProgramsService.getProgram(this.draftUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (program) => {
          if (program.status !== 'DRAFT') {
            this.router.navigate(['/reward-programs', 'view', program.uuid], { replaceUrl: true });
            return;
          }   
          this.patchFormFromResponse(program);
        },
        error: () => {} // Draft might not have data yet — that's fine
      });
  }

  private patchFormFromResponse(p: RewardProgramResponse): void {
    this.form.patchValue({
      name: p.name || '',
      description: p.description || '',
      startDate: p.startDate ? this.toLocalDatetime(p.startDate) : '',
      endDate: p.endDate ? this.toLocalDatetime(p.endDate) : ''
    });

    // Cashback rule
    if (p.cashbackRule) {
      this.form.patchValue({
        cashbackType: p.cashbackRule.cashbackType,
        cashbackValue: p.cashbackRule.cashbackValue,
        pointsSpendThreshold: p.cashbackRule.pointsSpendThreshold,
        minSpendAmount: p.cashbackRule.minSpendAmount,
        eligibilityType: p.cashbackRule.eligibilityType,
        redeemLimitPercent: p.cashbackRule.redeemLimitPercent,
        bonusLifespanDays: p.cashbackRule.bonusLifespanDays
      });
    }

    // Weekly schedules
    if (p.weeklySchedules && p.weeklySchedules.length > 0) {
      const schedulesArray = this.form.get('weeklySchedules') as FormArray;
      p.weeklySchedules.forEach(ws => {
        const dayIndex = ALL_DAYS.indexOf(ws.dayOfWeek);
        if (dayIndex >= 0) {
          schedulesArray.at(dayIndex).patchValue({
            enabled: ws.enabled,
            startTime: ws.startTime || '08:00',
            endTime: ws.endTime || '22:00'
          });
        }
      });
    }

    // Tiers
    if (p.cashbackTiers && p.cashbackTiers.length > 0) {
      const tiersArray = this.form.get('tiers') as FormArray;
      tiersArray.clear();
      p.cashbackTiers.forEach(t => {
        tiersArray.push(this.fb.group({
          name: [t.name, Validators.required],
          minAmount: [t.minAmount, [Validators.required, Validators.min(0)]],
          maxAmount: [t.maxAmount],
          extraEarningPercent: [t.extraEarningPercent, [Validators.required, Validators.min(0)]],
          sortOrder: [t.sortOrder]
        }));
      });
    }
  }

  private toLocalDatetime(iso: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return iso;
    }
  }

  // ─── Navigation ────────────────────────────────────────────────────

  goToStep(step: number): void {
    if (step >= 1 && step <= STEPS.length) {
      this.router.navigate(['/reward-programs', 'create', 'cashback', this.draftUuid, 'steps', step.toString()], { queryParamsHandling: 'preserve' });
    }
  }

  nextStep(): void {
    if (this.currentStep < STEPS.length) {
      const next = this.currentStep + 1;
      this.router.navigate(['/reward-programs', 'create', 'cashback', this.draftUuid, 'steps', next.toString()], { queryParamsHandling: 'preserve' });
    }
  }

  onCancel(): void {
    if (!this.draftUuid) {
      this.router.navigate(['/reward-programs', 'programs']);
      return;
    }
    if (this.preserveDraftOnCancel) {
      this.router.navigate(['/reward-programs', 'programs']);
      return;
    }
    this.rewardProgramsService.deleteProgram(this.draftUuid).subscribe({
      next: () => this.router.navigate(['/reward-programs', 'programs']),
      error: () => this.router.navigate(['/reward-programs', 'programs'])
    });
  }

  // ─── Build request payload ─────────────────────────────────────────

  private buildSaveDraftPayload(): SaveCashbackDraftRequest {
    const v = this.form.getRawValue();
    const schedules: WeeklyScheduleEntry[] = v.weeklySchedules
      .filter((s: any) => s.enabled)
      .map((s: any) => ({
        dayOfWeek: s.dayOfWeek,
        enabled: true,
        startTime: s.startTime || null,
        endTime: s.endTime || null
      }));

    const tiers: CashbackTierEntry[] = v.tiers.map((t: any, i: number) => ({
      name: t.name,
      minAmount: t.minAmount,
      maxAmount: t.maxAmount ?? null,
      extraEarningPercent: t.extraEarningPercent,
      sortOrder: i
    }));

    return {
      name: v.name || undefined,
      description: v.description || undefined,
      cashbackType: v.cashbackType || undefined,
      cashbackValue: v.cashbackValue ?? undefined,
      pointsSpendThreshold: v.pointsSpendThreshold ?? undefined,
      minSpendAmount: v.minSpendAmount ?? undefined,
      eligibilityType: v.eligibilityType || undefined,
      redeemLimitPercent: v.redeemLimitPercent ?? undefined,
      bonusLifespanDays: v.bonusLifespanDays ?? undefined,
      startDate: v.startDate ? new Date(v.startDate).toISOString() : undefined,
      endDate: v.endDate ? new Date(v.endDate).toISOString() : null,
      weeklySchedules: schedules.length > 0 ? schedules : undefined,
      tiers: tiers.length > 0 ? tiers : undefined
    };
  }

  // ─── Save Draft ────────────────────────────────────────────────────

  saveDraft(): void {
    if (!this.draftUuid || this.saving) return;

    this.saving = true;
    this.globalError = '';
    const payload = this.buildSaveDraftPayload();

    this.rewardProgramsService.saveCashbackDraft(this.draftUuid, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.saving = false)
      )
      .subscribe({
        next: () => {
          this.toast.success('Draft saved');
          this.router.navigate(['/reward-programs']);
        },
        error: (err) => {
          const status = err?.status ?? 0;
          const message = err?.error?.message || 'Failed to save draft. Please try again.';
          if (status >= 500) {
            this.toast.error(message);
          } else {
            this.globalError = message;
          }
        }
      });
  }

  // ─── Launch ────────────────────────────────────────────────────────

  get isScheduledLaunch(): boolean {
    return this.form.get('scheduleMode')?.value === 'periodic';
  }

  launch(): void {
    if (!this.draftUuid || this.launching) return;

    // Mark all controls as touched for validation display
    this.form.markAllAsTouched();

    this.launching = true;
    this.globalError = '';

    const v = this.form.getRawValue();
    const schedules: WeeklyScheduleEntry[] = v.weeklySchedules
      .filter((s: any) => s.enabled)
      .map((s: any) => ({
        dayOfWeek: s.dayOfWeek,
        enabled: true,
        startTime: s.startTime || null,
        endTime: s.endTime || null
      }));

    const tiers: CashbackTierEntry[] = v.tiers.map((t: any, i: number) => ({
      name: t.name,
      minAmount: t.minAmount,
      maxAmount: t.maxAmount ?? null,
      extraEarningPercent: t.extraEarningPercent,
      sortOrder: i
    }));

    // Send all fields so backend applyCashbackData can set them (omit undefined so required are always sent)
    const isImmediate = this.form.get('scheduleMode')?.value === 'immediate_always_on';
    const payload: LaunchCashbackProgramRequest = {
      immediate: isImmediate,
      name: v.name ?? null,
      description: v.description ?? null,
      cashbackType: v.cashbackType ?? null,
      cashbackValue: v.cashbackValue != null ? Number(v.cashbackValue) : null,
      pointsSpendThreshold: v.pointsSpendThreshold != null ? Number(v.pointsSpendThreshold) : null,
      minSpendAmount: v.minSpendAmount != null ? Number(v.minSpendAmount) : null,
      eligibilityType: v.eligibilityType ?? null,
      redeemLimitPercent: v.redeemLimitPercent != null ? Number(v.redeemLimitPercent) : null,
      bonusLifespanDays: v.bonusLifespanDays != null ? Number(v.bonusLifespanDays) : null,
      startDate: isImmediate ? null : (v.startDate ? new Date(v.startDate).toISOString() : null),
      endDate: isImmediate ? null : (v.endDate ? new Date(v.endDate).toISOString() : null),
      weeklySchedules: schedules.length > 0 ? schedules : null,
      tiers: tiers.length > 0 ? tiers : null
    };

    this.rewardProgramsService.launchCashbackProgram(this.draftUuid, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.launching = false)
      )
      .subscribe({
        next: () => {
          this.toast.success(this.isScheduledLaunch ? 'Program scheduled' : 'Program launched');
          this.router.navigate(['/reward-programs']);
        },
        error: (err) => {
          const status = err?.status ?? 0;
          const message = err?.error?.message || 'Failed to launch program. Please review your configuration.';
          if (status >= 500) {
            this.toast.error(message);
          } else {
            this.globalError = message;
          }
        }
      });
  }
}
