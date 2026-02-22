import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormArray, Validators } from '@angular/forms';
import { SwitchComponent } from '../../../../../shared/components/switch/switch.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { DatePickerComponent } from '../../../../../shared/components/date-picker/date-picker.component';
import { AlertComponent } from '../../../../../shared/components/alert/alert.component';
import { DayOfWeek, ScheduleOverlapCheckResponse } from '../../../../../core/models/reward-program.model';

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun'
};

@Component({
  selector: 'app-step-schedule',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SwitchComponent, SelectComponent, DatePickerComponent, AlertComponent],
  template: `
    <div class="step-form" [formGroup]="form">
      <!-- Schedule mode: always-on or periodic. Always-on is disabled when one already exists for this type. -->
      <div class="section">
        <h3 class="section-title">When to run</h3>
        <p class="section-desc">Launch the program now as always-on, or schedule a periodic program with start and end dates.</p>

        <div class="schedule-mode-toggle">
          <button
            type="button"
            class="mode-btn"
            [class.active]="isImmediateAlwaysOn"
            [class.disabled]="isAlwaysOnDisabled"
            [attr.aria-disabled]="isAlwaysOnDisabled"
            (click)="!isAlwaysOnDisabled && setScheduleMode('immediate_always_on')"
          >
            <span class="mode-btn-label">Launch always-on immediately</span>
            <span class="mode-btn-desc">Starts now, runs until you stop it</span>
            @if (isAlwaysOnDisabled) {
              <span class="mode-btn-reason">Only one always-on program per type allowed</span>
            }
          </button>
          <button
            type="button"
            class="mode-btn"
            [class.active]="!isImmediateAlwaysOn"
            (click)="setScheduleMode('periodic')"
          >
            <span class="mode-btn-label">Schedule periodic program</span>
            <span class="mode-btn-desc">Set start and end dates</span>
          </button>
        </div>
      </div>

      <!-- Date range: only for periodic (end date required for periodic) -->
      <div class="section" *ngIf="!isImmediateAlwaysOn">
        <h3 class="section-title">Program dates</h3>
        <p class="section-desc">Set when this program will be active.</p>

        @if (scheduleOverlap?.overlaps && scheduleOverlap?.alwaysOnConflict) {
          <app-alert type="warning" [dismissible]="false">
            You can have only one always-on program per type. Schedule a periodic program with start and end dates.
          </app-alert>
        }
        @if (scheduleOverlap?.overlaps && !scheduleOverlap?.alwaysOnConflict) {
          <app-alert type="warning" [dismissible]="false">
            It overlaps with <strong>{{ scheduleOverlap?.overlappingProgramName || 'another program' }}</strong> of the same type. Only one program can be active or scheduled in the same period.
          </app-alert>
        }

        <div class="form-row">
          <div class="form-group flex-1">
            <app-date-picker
              label="Start date"
              placeholder="Select start date"
              formControlName="startDate"
              [showTime]="true"
              [required]="!isImmediateAlwaysOn"
              [errorMessage]="form.get('startDate')?.touched && form.get('startDate')?.invalid ? 'Start date is required' : ''"
            ></app-date-picker>
          </div>
          <div class="form-group flex-1">
            <app-date-picker
              label="End date"
              placeholder="Select end date"
              formControlName="endDate"
              [showTime]="true"
              [required]="!isImmediateAlwaysOn"
              [errorMessage]="form.get('endDate')?.touched && form.get('endDate')?.invalid ? 'End date is required' : ''"
            ></app-date-picker>
          </div>
        </div>
      </div>

      <!-- Weekly time windows (hidden for welcome program) -->
      <div class="section" *ngIf="!hideWeekly">
        <h3 class="section-title">Weekly schedule</h3>
        <p class="section-desc">
          Configure which days and hours the program is effective.
          If no days are enabled, the program applies 24/7 during the active period.
        </p>

        <div class="schedule-grid" formArrayName="weeklySchedules">
          <div
            *ngFor="let dayGroup of weeklySchedulesArray.controls; let i = index"
            class="schedule-row"
            [class.enabled]="dayGroup.get('enabled')?.value"
            [formGroupName]="i"
          >
            <div class="day-toggle">
              <app-switch
                [label]="getShortDayLabel(i)"
                formControlName="enabled"
              ></app-switch>
            </div>

            <div class="time-range" *ngIf="dayGroup.get('enabled')?.value">
              <div class="time-field">
                <label class="small-label">Start time</label>
                <app-select
                  formControlName="startTime"
                  [options]="timeOptions"
                  placeholder="Start"
                ></app-select>
              </div>
              <span class="time-sep">—</span>
              <div class="time-field">
                <label class="small-label">End time</label>
                <app-select
                  formControlName="endTime"
                  [options]="timeOptions"
                  placeholder="End"
                ></app-select>
              </div>
            </div>

            <div class="time-off" *ngIf="!dayGroup.get('enabled')?.value">
              <span class="off-label">Off</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .step-form { display: flex; flex-direction: column; gap: 1.75rem; }
    .section { }
    .section-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem 0; }
    .section-desc { font-size: 0.85rem; color: #64748b; margin: 0 0 1rem 0; line-height: 1.45; }
    .schedule-mode-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .mode-btn {
      display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem;
      text-align: left; padding: 1rem 1.25rem; border-radius: 10px;
      border: 2px solid #e2e8f0; background: #f8fafc;
      cursor: pointer; transition: all 0.2s;
    }
    .mode-btn:hover:not(.disabled) { border-color: #cbd5e1; background: #f1f5f9; }
    .mode-btn.active { border-color: #16A34A; background: #f0fdf4; }
    .mode-btn.disabled { opacity: 0.65; cursor: not-allowed; }
    .mode-btn-label { font-weight: 600; font-size: 0.95rem; color: #0f172a; }
    .mode-btn-desc { font-size: 0.8rem; color: #64748b; }
    .mode-btn-reason { font-size: 0.75rem; color: #b45309; margin-top: 0.15rem; }
    .form-row { display: flex; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .flex-1 { flex: 1; }

    .schedule-grid { display: flex; flex-direction: column; gap: 0.5rem; }
    .schedule-row {
      display: flex; align-items: center; gap: 1rem;
      padding: 0.65rem 1rem; border-radius: 8px;
      background: #f8fafc; border: 1px solid #f1f5f9;
      transition: all 0.15s;
    }
    .schedule-row.enabled {
      background: #fafffe; border-color: #dcfce7;
    }
    .day-toggle { min-width: 120px; }
    .time-range { display: flex; align-items: flex-end; gap: 0.5rem; flex: 1; }
    .time-field { display: flex; flex-direction: column; gap: 0.2rem; flex: 1; }
    .small-label { font-size: 0.7rem; color: #64748b; font-weight: 500; }
    .time-sep { color: #94a3b8; font-weight: 600; padding-bottom: 0.625rem; }
    .time-off { }
    .off-label { font-size: 0.8rem; color: #94a3b8; font-style: italic; }
  `]
})
export class StepScheduleComponent implements OnInit {
  @Input() form!: FormGroup;
  @Input() scheduleOverlap: ScheduleOverlapCheckResponse | null = null;
  /** When true, hide the weekly schedule section (e.g. for welcome program). */
  @Input() hideWeekly = false;

  timeOptions: SelectOption[] = [];

  private readonly days: DayOfWeek[] = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
  ];

  /** True when an always-on program of this type already exists; then "Launch always-on immediately" is disabled. */
  get isAlwaysOnDisabled(): boolean {
    return !!(this.scheduleOverlap?.overlaps && this.scheduleOverlap?.alwaysOnConflict);
  }

  get isImmediateAlwaysOn(): boolean {
    return this.form.get('scheduleMode')?.value === 'immediate_always_on';
  }

  setScheduleMode(mode: 'immediate_always_on' | 'periodic'): void {
    this.form.patchValue({ scheduleMode: mode });
    if (mode === 'immediate_always_on') {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      this.form.patchValue({ startDate: local, endDate: '' });
      this.form.get('startDate')?.clearValidators();
      this.form.get('endDate')?.clearValidators();
      this.form.get('startDate')?.updateValueAndValidity();
      this.form.get('endDate')?.updateValueAndValidity();
    } else {
      this.form.get('startDate')?.setValidators(Validators.required);
      this.form.get('endDate')?.setValidators(Validators.required);
      this.form.get('startDate')?.updateValueAndValidity();
      this.form.get('endDate')?.updateValueAndValidity();
    }
  }

  ngOnInit(): void {
    this.timeOptions = this.generateTimeOptions();
    const mode = this.form.get('scheduleMode')?.value;
    if (mode === 'immediate_always_on') {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      this.form.patchValue({ scheduleMode: 'immediate_always_on', startDate: local, endDate: '' });
      this.form.get('startDate')?.clearValidators();
      this.form.get('endDate')?.clearValidators();
      this.form.get('startDate')?.updateValueAndValidity();
      this.form.get('endDate')?.updateValueAndValidity();
    } else {
      this.form.get('startDate')?.setValidators(Validators.required);
      this.form.get('endDate')?.setValidators(Validators.required);
      this.form.get('startDate')?.updateValueAndValidity();
      this.form.get('endDate')?.updateValueAndValidity();
    }
  }

  get weeklySchedulesArray(): FormArray {
    return this.form.get('weeklySchedules') as FormArray;
  }

  getShortDayLabel(index: number): string {
    return DAY_LABELS[this.days[index]];
  }

  private generateTimeOptions(): SelectOption[] {
    const options: SelectOption[] = [];
    for (let h = 0; h < 24; h++) {
      const hour = h.toString().padStart(2, '0');
      options.push({ value: `${hour}:00`, label: `${hour}:00` });
      options.push({ value: `${hour}:30`, label: `${hour}:30` });
    }
    return options;
  }
}
