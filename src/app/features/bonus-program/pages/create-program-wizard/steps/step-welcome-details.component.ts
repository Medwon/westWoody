import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';

@Component({
  selector: 'app-step-welcome-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, SelectComponent],
  template: `
    <div class="step-form" [formGroup]="form">
      <div class="form-group">
        <app-input
          id="programName"
          label="Program name"
          placeholder="e.g. Welcome bonus"
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
          placeholder="Describe this event program for your team."
          formControlName="description"
        ></textarea>
      </div>

      <!-- Type to grant and amount moved to Rules step -->
    </div>
  `,
  styles: [`
    .step-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .field-label { font-weight: 500; font-size: 0.875rem; color: #1a202c; margin-bottom: 0.25rem; }
    .field-textarea {
      width: 100%; border-radius: 6px; border: 1px solid var(--color-input-border);
      padding: 0.625rem 0.875rem; font-size: 0.875rem; color: #1a202c;
      background: #ffffff; resize: vertical; min-height: 72px; font-family: inherit;
    }
    .field-textarea:focus { outline: none; border-color: var(--color-input-border-focus); box-shadow: 0 0 0 3px var(--color-input-shadow-focus); }
    .field-hint { font-size: 0.8rem; color: #64748b; margin: 0.25rem 0 0 0; line-height: 1.4; }
  `]
})
export class StepWelcomeDetailsComponent {
  @Input() form!: FormGroup;

  grantTypeOptions: SelectOption[] = [
    { value: 'POINTS', label: 'Points' },
    { value: 'FIXED_MONEY_KZT', label: 'Fixed amount (KZT)' }
  ];

  getError(field: string): string {
    const control = this.form.get(field);
    if (control && control.touched && control.invalid) {
      if (control.errors?.['required']) return 'This field is required';
      if (control.errors?.['min']) return `Minimum value is ${control.errors['min'].min}`;
    }
    return '';
  }
}
