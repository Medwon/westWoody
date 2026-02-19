import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { SwitchComponent } from '../../../../../shared/components/switch/switch.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { DatePickerComponent } from '../../../../../shared/components/date-picker/date-picker.component';
import { DayOfWeek } from '../../../../../core/models/reward-program.model';

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
  imports: [CommonModule, ReactiveFormsModule, SwitchComponent, SelectComponent, DatePickerComponent],
  template: `
    <div class="step-form" [formGroup]="form">
      <!-- Date range -->
      <div class="section">
        <h3 class="section-title">Program dates</h3>
        <p class="section-desc">Set when this program will be active.</p>

        <div class="form-row">
          <div class="form-group flex-1">
            <app-date-picker
              label="Start date"
              placeholder="Select start date"
              formControlName="startDate"
              [showTime]="true"
              [required]="true"
              [errorMessage]="form.get('startDate')?.touched && form.get('startDate')?.invalid ? 'Start date is required' : ''"
            ></app-date-picker>
          </div>

          <!-- End date: shown only if toggled on -->
          <div class="form-group flex-1" *ngIf="showEndDate">
            <app-date-picker
              label="End date"
              placeholder="Select end date"
              formControlName="endDate"
              [showTime]="true"
              [clearable]="false"
            >
              <button labelExtra type="button" class="btn-remove-field" (click)="removeEndDate()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                Remove
              </button>
            </app-date-picker>
          </div>
        </div>

        <button
          *ngIf="!showEndDate"
          type="button"
          class="btn-add-enddate"
          (click)="showEndDate = true"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          Add end date
        </button>
        <p class="field-hint" *ngIf="!showEndDate">This program will run indefinitely until manually stopped.</p>
      </div>

      <!-- Weekly time windows -->
      <div class="section">
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
    .form-row { display: flex; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .flex-1 { flex: 1; }
    .field-hint { font-size: 0.8rem; color: #64748b; margin: 0.5rem 0 0 0; }

    .btn-add-enddate {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: none; border: 1px dashed #cbd5e1; border-radius: 6px;
      padding: 0.5rem 1rem; color: #16A34A; font-size: 0.85rem;
      font-weight: 600; cursor: pointer; transition: all 0.15s;
      margin-top: 0.5rem;
    }
    .btn-add-enddate:hover { border-color: #16A34A; background: #f0fdf4; }
    .btn-add-enddate svg { width: 16px; height: 16px; }

    .btn-remove-field {
      display: inline-flex; align-items: center; gap: 0.25rem;
      background: none; border: none; padding: 0; margin-left: auto;
      color: #ef4444; font-size: 0.75rem; font-weight: 600;
      cursor: pointer; transition: color 0.15s;
    }
    .btn-remove-field:hover { color: #dc2626; }
    .btn-remove-field svg { width: 14px; height: 14px; }

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

  showEndDate = false;
  timeOptions: SelectOption[] = [];

  private readonly days: DayOfWeek[] = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
  ];

  ngOnInit(): void {
    this.timeOptions = this.generateTimeOptions();

    const endDateValue = this.form.get('endDate')?.value;
    if (endDateValue) {
      this.showEndDate = true;
    }
  }

  get weeklySchedulesArray(): FormArray {
    return this.form.get('weeklySchedules') as FormArray;
  }

  getShortDayLabel(index: number): string {
    return DAY_LABELS[this.days[index]];
  }

  removeEndDate(): void {
    this.form.get('endDate')?.setValue('');
    this.showEndDate = false;
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
