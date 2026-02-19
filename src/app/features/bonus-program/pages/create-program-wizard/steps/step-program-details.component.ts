import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';

@Component({
  selector: 'app-step-program-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, SelectComponent],
  template: `
    <div class="step-form" [formGroup]="form">
      <div class="form-group">
        <app-input
          id="programName"
          label="Program name"
          placeholder="e.g. Weekend Cashback"
          formControlName="name"
          [required]="true"
          [errorMessage]="getError('name')"
        ></app-input>
      </div>

      <div class="form-group">
        <label class="field-label">Description</label>
        <textarea
          class="field-textarea"
          rows="3"
          placeholder="Describe this reward program for your team."
          formControlName="description"
        ></textarea>
      </div>

      <div class="form-group">
        <app-select
          id="cashbackType"
          label="Cashback type"
          placeholder="Select cashback type"
          formControlName="cashbackType"
          [options]="cashbackTypeOptions"
          [required]="true"
          [errorMessage]="getError('cashbackType')"
        ></app-select>
        <p class="field-hint" *ngIf="form.get('cashbackType')?.value === 'PERCENTAGE'">
          Customers earn a percentage of the transaction amount as bonus points.
        </p>
        <p class="field-hint" *ngIf="form.get('cashbackType')?.value === 'BONUS_POINTS'">
          Customers earn a fixed number of bonus points per spend threshold (e.g. 1 point per 1,000 tg).
        </p>
      </div>

      <div class="form-group" *ngIf="form.get('cashbackType')?.value === 'PERCENTAGE'">
        <app-input
          id="cashbackValue"
          label="Cashback rate (%)"
          type="number"
          placeholder="e.g. 5"
          suffix="%"
          formControlName="cashbackValue"
          [required]="true"
          [errorMessage]="getError('cashbackValue')"
        ></app-input>
      </div>

      <div class="form-row" *ngIf="form.get('cashbackType')?.value === 'BONUS_POINTS'">
        <div class="form-group flex-1">
          <app-input
            id="cashbackValue"
            label="Points earned"
            type="number"
            placeholder="e.g. 1"
            formControlName="cashbackValue"
            [required]="true"
            hint="Points awarded per threshold"
            [errorMessage]="getError('cashbackValue')"
          ></app-input>
        </div>
        <div class="form-group flex-1">
          <app-input
            id="pointsSpendThreshold"
            label="Per spend amount"
            type="number"
            placeholder="e.g. 1000"
            formControlName="pointsSpendThreshold"
            [required]="true"
            hint="Spend amount required to earn above points"
            [errorMessage]="getError('pointsSpendThreshold')"
          ></app-input>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .step-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .step-form > .form-group { margin: 0; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .field-label { font-weight: 500; font-size: 0.875rem; color: #1a202c; margin-bottom: 0.25rem; }
    .field-textarea {
      width: 100%; border-radius: 6px; border: 1px solid var(--color-input-border);
      padding: 0.625rem 0.875rem; font-size: 0.875rem; color: #1a202c;
      background: #ffffff; resize: vertical; min-height: 72px; font-family: inherit;
    }
    .field-textarea:hover { border-color: var(--color-input-border-hover); }
    .field-textarea:focus { outline: none; border-color: var(--color-input-border-focus); box-shadow: 0 0 0 3px var(--color-input-shadow-focus); }
    .field-hint { font-size: 0.8rem; color: #64748b; margin: 0.25rem 0 0 0; line-height: 1.4; }
  `]
})
export class StepProgramDetailsComponent {
  @Input() form!: FormGroup;

  cashbackTypeOptions: SelectOption[] = [
    { value: 'PERCENTAGE', label: 'Percentage (%)' },
    { value: 'BONUS_POINTS', label: 'Bonus Points' }
  ];

  getError(field: string): string {
    const control = this.form.get(field);
    if (control && control.touched && control.invalid) {
      if (control.errors?.['required']) return 'This field is required';
      if (control.errors?.['min']) return `Minimum value is ${control.errors['min'].min}`;
      if (control.errors?.['max']) return `Maximum value is ${control.errors['max'].max}`;
    }
    return '';
  }
}
