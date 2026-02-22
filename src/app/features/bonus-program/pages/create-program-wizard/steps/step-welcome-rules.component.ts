import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { NumberFieldComponent } from '../../../../../shared/components/number-field/number-field.component';

@Component({
  selector: 'app-step-welcome-rules',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectComponent, NumberFieldComponent],
  template: `
    <div class="step-form" [formGroup]="form">
      <div class="form-group">
        <app-number-field
          id="bonusLifespanDays"
          label="Bonus lifespan (days)"
          placeholder="e.g. 90"
          formControlName="bonusLifespanDays"
          [min]="0"
          hint="Leave empty for bonuses that never expire."
        ></app-number-field>
      </div>

      <div class="form-group">
        <app-select
          id="grantTrigger"
          label="When to grant"
          placeholder="Select when to grant"
          formControlName="grantTrigger"
          [options]="grantTriggerOptions"
          [required]="true"
          [errorMessage]="getError('grantTrigger')"
        ></app-select>
        <p class="field-hint" *ngIf="form.get('grantTrigger')?.value === 'ON_JOIN'">
          Grant when the client is created in the app while this program is active.
        </p>
        <p class="field-hint" *ngIf="form.get('grantTrigger')?.value === 'ON_FIRST_PAY'">
          Grant when the client completes their first payment.
        </p>
      </div>

      <div class="form-group" *ngIf="form.get('grantTrigger')?.value === 'ON_FIRST_PAY'">
        <app-select
          id="firstPayMode"
          label="On first payment"
          placeholder="Select mode"
          formControlName="firstPayMode"
          [options]="firstPayModeOptions"
          [required]="true"
          [errorMessage]="getError('firstPayMode')"
        ></app-select>
        <p class="field-hint" *ngIf="form.get('firstPayMode')?.value === 'WELCOME_ONLY'">
          Grant only the welcome bonus; do not grant cashback for that payment.
        </p>
        <p class="field-hint" *ngIf="form.get('firstPayMode')?.value === 'WELCOME_AND_CASHBACK'">
          Grant welcome bonus and also apply cashback as usual for that payment.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .step-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .field-hint { font-size: 0.8rem; color: #64748b; margin: 0.25rem 0 0 0; line-height: 1.4; }
  `]
})
export class StepWelcomeRulesComponent {
  @Input() form!: FormGroup;

  grantTriggerOptions: SelectOption[] = [
    { value: 'ON_JOIN', label: 'On client joining the program' },
    { value: 'ON_FIRST_PAY', label: 'On first payment' }
  ];

  firstPayModeOptions: SelectOption[] = [
    { value: 'WELCOME_ONLY', label: 'Grant only welcome bonus' },
    { value: 'WELCOME_AND_CASHBACK', label: 'Grant alongside cashback program' }
  ];

  getError(field: string): string {
    const control = this.form.get(field);
    if (control && control.touched && control.invalid && control.errors?.['required']) {
      return 'This field is required';
    }
    return '';
  }
}
