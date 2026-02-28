import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize, debounceTime, combineLatest, startWith } from 'rxjs';

import { PageHeaderService } from '../../../../core/services/page-header.service';
import { ToastService } from '../../../../core/services/toast.service';
import { RewardProgramsService } from '../../../../core/services/reward-programs.service';
import {
  RewardProgramResponse,
  SaveWelcomeProgramDraftRequest,
  LaunchWelcomeProgramRequest,
  ScheduleOverlapCheckResponse
} from '../../../../core/models/reward-program.model';

import { StepWelcomeDetailsComponent } from '../create-program-wizard/steps/step-welcome-details.component';
import { StepScheduleComponent } from '../create-program-wizard/steps/step-schedule.component';
import { StepWelcomeRulesComponent } from '../create-program-wizard/steps/step-welcome-rules.component';
import { StepNotificationsComponent } from '../create-program-wizard/steps/step-notifications.component';
import { StepWelcomeSummaryComponent } from '../create-program-wizard/steps/step-welcome-summary.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

const WELCOME_STEPS = [
  { num: 1, label: 'Program details', hint: 'Name and description of this event program.' },
  { num: 2, label: 'Rules', hint: 'Type and value to grant, bonus lifespan and when to grant.' },
  { num: 3, label: 'Schedule', hint: 'Launch always-on or schedule with start/end dates.' },
  { num: 4, label: 'Notifications', hint: 'Preview promotional messaging options.' },
  { num: 5, label: 'Summary & Launch', hint: 'Review and launch the event program.' }
];

const ALL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

@Component({
  selector: 'app-create-welcome-program-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AlertComponent,
    StepWelcomeDetailsComponent,
    StepScheduleComponent,
    StepWelcomeRulesComponent,
    StepNotificationsComponent,
    StepWelcomeSummaryComponent
  ],
  template: `
    <div class="wizard-wrapper">
      <div class="wizard-layout">
        <main class="wizard-main">
          <h2 class="step-title">{{ currentStep }}. {{ WELCOME_STEPS[currentStep - 1].label }}</h2>
          <app-alert *ngIf="globalError" type="error" [dismissible]="true" (dismissed)="globalError = ''">
            {{ globalError }}
          </app-alert>

          <app-step-welcome-details *ngIf="currentStep === 1" [form]="form"></app-step-welcome-details>
          <app-step-welcome-rules *ngIf="currentStep === 2" [form]="form"></app-step-welcome-rules>
          <app-step-schedule
            *ngIf="currentStep === 3"
            [form]="form"
            [scheduleOverlap]="scheduleOverlap"
            [hideWeekly]="true"
            [hidePeriodicOption]="isBirthdayProgram()"
            [birthdayAlwaysOnInfo]="isBirthdayProgram()"
          ></app-step-schedule>
          <app-step-notifications *ngIf="currentStep === 4"></app-step-notifications>
          <app-step-welcome-summary
            *ngIf="currentStep === 5"
            [form]="form"
            [isScheduledLaunch]="isScheduledLaunch"
            [isFormValidForLaunch]="isFormValidForLaunch && !scheduleOverlap?.overlaps"
            [launching]="launching"
            [launchError]="globalError"
            [scheduleOverlap]="scheduleOverlap"
            (goToStep)="goToStep($event)"
            (launch)="launch()"
          ></app-step-welcome-summary>
        </main>

        <aside class="steps-sidebar">
          <h3 class="sidebar-title">Event (Событийный) Program</h3>
          <ul class="steps-list">
            <li *ngFor="let step of WELCOME_STEPS; let last = last"
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
              <div *ngIf="currentStep === step.num" class="step-active-detail">
                <p class="step-hint">{{ step.hint }}</p>
                <button *ngIf="currentStep < WELCOME_STEPS.length" type="button" class="btn-next-step" (click)="nextStep(); $event.stopPropagation()">
                  Next step
                </button>
              </div>
              <div class="step-connector" *ngIf="!last"></div>
            </li>
          </ul>
          <div class="sidebar-footer">
            <button type="button" class="btn-cancel" (click)="onCancel()">Cancel</button>
            @if (isFormValidForLaunch) {
              <button type="button" class="btn-save-draft btn-launch" [disabled]="launching || (scheduleOverlap?.overlaps ?? false)" (click)="launch()">
                {{ launching ? 'Launching...' : (isScheduledLaunch ? 'Schedule' : 'Launch now') }}
              </button>
            } @else {
              <button type="button" class="btn-save-draft" [disabled]="saving" (click)="saveDraft()">
                {{ saving ? 'Saving...' : 'Save draft' }}
              </button>
            }
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .wizard-wrapper { min-height: 100%; margin: -2rem; padding: 2rem; background: #f8fafc; }
    .wizard-layout { display: flex; gap: 1.5rem; align-items: flex-start; }
    .wizard-main {
      flex: 1; min-width: 0;
      background: white; border-radius: 12px; border: 1px solid #e2e8f0;
      padding: 2rem 2.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .step-title { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 1.5rem 0; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; }
    .steps-sidebar {
      flex-shrink: 0; width: 320px;
      background: white; border-radius: 12px; border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      padding: 1.75rem; display: flex; flex-direction: column;
      position: sticky; top: 2rem;
    }
    .sidebar-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 1.5rem 0; padding-bottom: 1.1rem; border-bottom: 1px solid #e2e8f0; }
    .steps-list { list-style: none; padding: 0; margin: 0; flex: 1; }
    .step-item { position: relative; cursor: pointer; }
    .step-row { display: flex; align-items: center; gap: 0.85rem; }
    .step-num {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; font-weight: 700; flex-shrink: 0;
      background: #f1f5f9; color: #94a3b8;
    }
    .step-num svg { width: 16px; height: 16px; }
    .step-item.active .step-num { background: #16A34A; color: white; }
    .step-item.done .step-num { background: #dcfce7; color: #16A34A; }
    .step-label { font-size: 0.95rem; color: #94a3b8; font-weight: 500; }
    .step-item.active .step-label { color: #0f172a; font-weight: 600; }
    .step-item.done .step-label { color: #64748b; }
    .step-active-detail { margin-left: calc(36px + 0.85rem); padding: 0.5rem 0 0.25rem 0; }
    .step-hint { font-size: 0.85rem; color: #64748b; line-height: 1.45; margin: 0 0 0.85rem 0; }
    .btn-next-step {
      display: inline-block; padding: 0.5rem 1.25rem;
      background: #0f172a; color: white; border: none; border-radius: 6px;
      font-size: 0.85rem; font-weight: 600; cursor: pointer;
    }
    .btn-next-step:hover { background: #1e293b; }
    .step-connector { width: 2px; height: 20px; background: #e2e8f0; margin: 4px 0 4px 17px; border-radius: 1px; }
    .step-item.done .step-connector { background: #bbf7d0; }
    .sidebar-footer {
      display: flex; align-items: center; justify-content: flex-end;
      gap: 1.25rem; margin-top: 1.5rem; padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    .btn-cancel {
      display: inline-flex; align-items: center;
      font-size: 0.85rem; font-weight: 600; color: #ef4444;
      text-decoration: none; cursor: pointer; background: none; border: none;
    }
    .btn-cancel:hover { color: #dc2626; }
    .btn-save-draft {
      padding: 0.5rem 1.25rem; border: 1px solid #e2e8f0; border-radius: 6px;
      background: white; color: #0f172a; font-size: 0.85rem; font-weight: 600;
      cursor: pointer;
    }
    .btn-save-draft:hover { background: #f8fafc; border-color: #cbd5e1; }
    .btn-save-draft.btn-launch { background: #16A34A; color: white; border-color: #16A34A; }
    .btn-save-draft.btn-launch:hover:not(:disabled) { background: #15803d; border-color: #15803d; }
    @media (max-width: 768px) {
      .wizard-layout { flex-direction: column; }
      .steps-sidebar { width: 100%; order: -1; position: static; }
    }
  `]
})
export class CreateWelcomeProgramWizardComponent implements OnInit, OnDestroy {
  private pageHeaderService = inject(PageHeaderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private rewardProgramsService = inject(RewardProgramsService);
  private destroy$ = new Subject<void>();

  readonly WELCOME_STEPS = WELCOME_STEPS;
  currentStep = 1;
  maxStepVisited = 1;
  draftUuid = '';
  saving = false;
  launching = false;
  globalError = '';
  private preserveDraftOnCancel = false;
  scheduleOverlap: ScheduleOverlapCheckResponse | null = null;

  form!: FormGroup;

  isStepDone(stepNum: number): boolean {
    if (this.maxStepVisited < stepNum) return false;
    return this.isStepComplete(stepNum);
  }

  isStepComplete(stepNum: number): boolean {
    if (!this.form) return false;
    switch (stepNum) {
      case 1: {
        const name = this.form.get('name')?.value;
        const hasName = typeof name === 'string' && name.trim().length > 0;
        return !!hasName;
      }
      case 2: {
        const grantType = this.form.get('grantType')?.value;
        const grantValue = this.form.get('grantValue')?.value;
        const trigger = this.form.get('grantTrigger')?.value;
        const hasGrant = !!(grantType && grantValue != null && Number(grantValue) > 0);
        if (!hasGrant) return false;
        if (trigger === 'ON_JOIN' || trigger === 'ON_BIRTHDAY') return true;
        return !!this.form.get('firstPayMode')?.value;
      }
      case 3: {
        if (this.isBirthdayProgram()) {
          return this.form.get('scheduleMode')?.value === 'immediate_always_on'
            && !(this.scheduleOverlap?.overlaps && this.scheduleOverlap?.alwaysOnConflict);
        }
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
      case 4:
      case 5:
        return true;
      default:
        return false;
    }
  }

  get isFormValidForLaunch(): boolean {
    if (!this.form) return false;
    return this.isStepComplete(1) && this.isStepComplete(2) && this.isStepComplete(3);
  }

  get isScheduledLaunch(): boolean {
    return this.form?.get('scheduleMode')?.value === 'periodic';
  }

  isBirthdayProgram(): boolean {
    return this.form?.get('grantTrigger')?.value === 'ON_BIRTHDAY';
  }

  ngOnInit(): void {
    this.preserveDraftOnCancel = this.route.snapshot.queryParamMap.get('continue-editing') != null;
    this.draftUuid = this.route.snapshot.paramMap.get('uuid') ?? '';

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.draftUuid = params.get('uuid') ?? '';
      const stepParam = params.get('step');
      if (stepParam) {
        const step = parseInt(stepParam, 10);
        if (step >= 1 && step <= WELCOME_STEPS.length) {
          this.currentStep = step;
          this.maxStepVisited = Math.max(this.maxStepVisited, step);
        }
      }
    });

    this.pageHeaderService.setPageHeader('Create Event Program', [
      { label: 'Home', route: '/home' },
      { label: 'Reward Programs', route: '/reward-programs' },
      { label: 'Create Event Program' }
    ]);

    this.buildForm();
    this.setupBirthdayScheduleSync();
    this.loadExistingDraft();
    this.setupOverlapCheck();
  }

  /** When grant trigger is ON_BIRTHDAY, force schedule to always-on (no periodic option). */
  private setupBirthdayScheduleSync(): void {
    this.form.get('grantTrigger')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(trigger => {
      if (trigger === 'ON_BIRTHDAY') {
        // Switch to always-on; require start date, but let user choose it.
        this.form.patchValue({ scheduleMode: 'immediate_always_on', endDate: '' }, { emitEvent: false });
        this.form.get('startDate')?.setValidators(Validators.required);
        this.form.get('endDate')?.clearValidators();
        this.form.get('startDate')?.updateValueAndValidity();
        this.form.get('endDate')?.updateValueAndValidity();
      }
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      grantType: ['', Validators.required],
      grantValue: [null, [Validators.required, Validators.min(0.01)]],

      scheduleMode: ['periodic'],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      weeklySchedules: this.fb.array(
        ALL_DAYS.map(day =>
          this.fb.group({
            dayOfWeek: [day],
            enabled: [false],
            startTime: ['08:00'],
            endTime: ['18:00']
          })
        )
      ),

      bonusLifespanDays: [null],
      grantTrigger: ['ON_JOIN', Validators.required],
      firstPayMode: [null]
    });
  }

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
        error: () => {}
      });
  }

  private patchFormFromResponse(p: RewardProgramResponse): void {
    this.form.patchValue({
      name: p.name || '',
      description: p.description || '',
      startDate: p.startDate ? this.toLocalDatetime(p.startDate) : '',
      endDate: p.endDate ? this.toLocalDatetime(p.endDate) : ''
    });
    if (p.welcomeRule) {
      this.form.patchValue({
        grantType: p.welcomeRule.grantType,
        grantValue: p.welcomeRule.grantValue,
        bonusLifespanDays: p.welcomeRule.bonusLifespanDays,
        grantTrigger: p.welcomeRule.grantTrigger,
        firstPayMode: p.welcomeRule.firstPayMode ?? null
      });
      if (p.welcomeRule.grantTrigger === 'ON_BIRTHDAY') {
        // For birthday programs loaded from draft, keep existing startDate if present, just enforce always-on + validators.
        this.form.patchValue({ scheduleMode: 'immediate_always_on', endDate: '' });
        this.form.get('startDate')?.setValidators(Validators.required);
        this.form.get('endDate')?.clearValidators();
        this.form.get('startDate')?.updateValueAndValidity();
        this.form.get('endDate')?.updateValueAndValidity();
      }
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
      .pipe(debounceTime(400), takeUntil(this.destroy$))
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
      // Check if an always-on already exists (only one per type allowed)
      const nowIso = new Date().toISOString();
      this.rewardProgramsService
        .checkScheduleOverlap('WELCOME', nowIso, null, this.draftUuid)
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
        .checkScheduleOverlap('WELCOME', startIso, endIso, this.draftUuid)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => (this.scheduleOverlap = res),
          error: () => (this.scheduleOverlap = null)
        });
    } else {
      // No dates yet: still check if always-on is allowed (for disabling the always-on button)
      const nowIso = new Date().toISOString();
      this.rewardProgramsService
        .checkScheduleOverlap('WELCOME', nowIso, null, this.draftUuid)
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

  goToStep(step: number): void {
    if (step >= 1 && step <= WELCOME_STEPS.length) {
      this.router.navigate(['/reward-programs', 'create', 'welcome', this.draftUuid, 'steps', step.toString()], { queryParamsHandling: 'preserve' });
    }
  }

  nextStep(): void {
    if (this.currentStep < WELCOME_STEPS.length) {
      const next = this.currentStep + 1;
      this.router.navigate(['/reward-programs', 'create', 'welcome', this.draftUuid, 'steps', next.toString()], { queryParamsHandling: 'preserve' });
    }
  }

  onCancel(): void {
    if (!this.draftUuid) {
      this.router.navigate(['/reward-programs']);
      return;
    }
    if (this.preserveDraftOnCancel) {
      this.router.navigate(['/reward-programs']);
      return;
    }
    this.rewardProgramsService.deleteProgram(this.draftUuid).subscribe({
      next: () => this.router.navigate(['/reward-programs']),
      error: () => this.router.navigate(['/reward-programs'])
    });
  }

  saveDraft(): void {
    if (!this.draftUuid || this.saving) return;
    this.saving = true;
    this.globalError = '';
    const v = this.form.getRawValue();
    const payload: SaveWelcomeProgramDraftRequest = {
      name: v.name || undefined,
      description: v.description || undefined,
      grantType: v.grantType || undefined,
      grantValue: v.grantValue != null ? Number(v.grantValue) : undefined,
      bonusLifespanDays: v.bonusLifespanDays != null ? Number(v.bonusLifespanDays) : undefined,
      grantTrigger: v.grantTrigger || undefined,
      firstPayMode: v.firstPayMode || undefined,
      startDate: v.startDate ? new Date(v.startDate).toISOString() : undefined,
      endDate: v.endDate ? new Date(v.endDate).toISOString() : null
    };
    this.rewardProgramsService.saveWelcomeDraft(this.draftUuid, payload)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.toast.success('Draft saved');
          this.router.navigate(['/reward-programs']);
        },
        error: (err) => {
          this.globalError = err?.error?.message || 'Failed to save draft.';
        }
      });
  }

  launch(): void {
    if (!this.draftUuid || this.launching) return;
    this.form.markAllAsTouched();
    this.launching = true;
    this.globalError = '';
    const v = this.form.getRawValue();
    const isImmediate = this.form.get('scheduleMode')?.value === 'immediate_always_on';
    const payload: LaunchWelcomeProgramRequest = {
      immediate: isImmediate,
      name: v.name ?? null,
      description: v.description ?? null,
      grantType: v.grantType ?? null,
      grantValue: v.grantValue != null ? Number(v.grantValue) : null,
      bonusLifespanDays: v.bonusLifespanDays != null ? Number(v.bonusLifespanDays) : null,
      grantTrigger: v.grantTrigger ?? null,
      firstPayMode: v.firstPayMode ?? null,
      startDate: isImmediate ? null : (v.startDate ? new Date(v.startDate).toISOString() : null),
      endDate: isImmediate ? null : (v.endDate ? new Date(v.endDate).toISOString() : null)
    };
    this.rewardProgramsService.launchWelcomeProgram(this.draftUuid, payload)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.launching = false)))
      .subscribe({
        next: () => {
          this.toast.success(this.isScheduledLaunch ? 'Program scheduled' : 'Program launched');
          this.router.navigate(['/reward-programs']);
        },
        error: (err) => {
          this.globalError = err?.error?.message || 'Failed to launch.';
        }
      });
  }
}
