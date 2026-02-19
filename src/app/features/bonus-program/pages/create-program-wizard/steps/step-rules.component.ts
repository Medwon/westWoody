import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { NumberFieldComponent } from '../../../../../shared/components/number-field/number-field.component';

@Component({
  selector: 'app-step-rules',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectComponent, NumberFieldComponent],
  template: `
    <div class="step-form" [formGroup]="form">
      <!-- Min spend -->
      <div class="form-group">
        <app-number-field
          id="minSpendAmount"
          label="Minimum spend amount"
          placeholder="0"
          formControlName="minSpendAmount"
          [min]="0"
          hint="Set to 0 for any transaction amount to qualify."
        ></app-number-field>
      </div>

      <!-- Eligibility -->
      <div class="form-group">
        <app-select
          id="eligibilityType"
          label="Transaction eligibility"
          formControlName="eligibilityType"
          [options]="eligibilityOptions"
          [required]="true"
        ></app-select>
        <p class="field-hint" *ngIf="form.get('eligibilityType')?.value !== 'ALL'">
          Specific item/category/service filtering will be available when multi-tenancy is supported.
        </p>
      </div>

      <!-- Redeem limit — numeric input + presets -->
      <div class="form-group">
        <label class="field-label">Redeem up to</label>

        <div class="redeem-input-row">
          <div class="redeem-stepper">
            <button type="button" class="stepper-btn" (click)="adjustRedeem(-5)" [disabled]="redeemValue <= 0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/></svg>
            </button>
            <div class="redeem-value-wrap">
              <input
                type="number"
                class="redeem-input"
                [value]="redeemValue"
                (input)="onRedeemInput($event)"
                min="0"
                max="100"
              />
              <span class="redeem-unit">%</span>
            </div>
            <button type="button" class="stepper-btn" (click)="adjustRedeem(5)" [disabled]="redeemValue >= 100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        </div>

        <div class="preset-chips">
          <button
            *ngFor="let p of redeemPresets"
            type="button"
            class="preset-chip"
            [class.active]="redeemValue === p"
            (click)="setRedeem(p)"
          >{{ p }}%</button>
        </div>

        <!-- Contextual help -->
        <div class="redeem-context">
          <p class="context-text">
            Customer can pay up to <strong>{{ redeemValue }}%</strong> of purchase using points.
          </p>
          <p class="context-example" *ngIf="redeemValue > 0">
            Example: Purchase 10,000 — customer can cover up to {{ (10000 * redeemValue / 100) | number:'1.0-0' }} using points.
          </p>
          <p class="context-recommend">Recommended: 30–70%</p>
        </div>
      </div>

      <!-- Bonus lifespan -->
      <div class="form-group">
        <app-number-field
          id="bonusLifespanDays"
          label="Bonus lifespan (days)"
          placeholder="e.g. 90"
          formControlName="bonusLifespanDays"
          [min]="0"
          hint="Leave empty for bonuses that never expire. Set a value for time-limited bonuses."
        ></app-number-field>
      </div>
    </div>
  `,
  styles: [`
    .step-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .field-label { font-weight: 500; font-size: 0.875rem; color: #1a202c; margin-bottom: 0.25rem; }
    .field-hint { font-size: 0.8rem; color: #64748b; margin: 0.25rem 0 0 0; }

    /* Redeem stepper */
    .redeem-input-row { display: flex; align-items: center; gap: 0.75rem; }
    .redeem-stepper {
      display: inline-flex; align-items: center;
      border: 1px solid #e2e8f0; border-radius: 8px;
      background: #ffffff; overflow: hidden;
    }
    .stepper-btn {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 44px;
      background: #f8fafc; border: none; cursor: pointer;
      color: #475569; transition: all 0.15s;
    }
    .stepper-btn:hover:not(:disabled) { background: #f0fdf4; color: #16A34A; }
    .stepper-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .stepper-btn svg { width: 16px; height: 16px; }
    .redeem-value-wrap {
      display: flex; align-items: center; gap: 0.2rem;
      padding: 0 0.5rem; min-width: 72px; justify-content: center;
    }
    .redeem-input {
      width: 48px; text-align: center;
      border: none; outline: none; font-size: 1.25rem;
      font-weight: 700; color: #0f172a; background: transparent;
      -moz-appearance: textfield;
    }
    .redeem-input::-webkit-inner-spin-button,
    .redeem-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    .redeem-unit { font-size: 1rem; font-weight: 600; color: #64748b; }

    /* Presets */
    .preset-chips { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .preset-chip {
      padding: 0.375rem 0.875rem; border: 1px solid #e2e8f0; border-radius: 20px;
      background: #ffffff; font-size: 0.8rem; font-weight: 600; color: #475569;
      cursor: pointer; transition: all 0.15s;
    }
    .preset-chip:hover { border-color: #16A34A; color: #16A34A; background: #f0fdf4; }
    .preset-chip.active {
      background: #16A34A; color: #ffffff; border-color: #16A34A;
    }

    /* Context */
    .redeem-context {
      margin-top: 0.5rem; padding: 0.75rem 1rem;
      background: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;
    }
    .context-text { font-size: 0.85rem; color: #0f172a; margin: 0 0 0.25rem 0; }
    .context-example { font-size: 0.8rem; color: #64748b; margin: 0 0 0.25rem 0; }
    .context-recommend { font-size: 0.75rem; color: #16A34A; font-weight: 600; margin: 0; }
  `]
})
export class StepRulesComponent {
  @Input() form!: FormGroup;

  redeemPresets = [25, 50, 75, 100];

  eligibilityOptions: SelectOption[] = [
    { value: 'ALL', label: 'All items and categories' },
    { value: 'SPECIFIC_ITEMS', label: 'Specific items', disabled: true },
    { value: 'SPECIFIC_CATEGORIES', label: 'Specific categories', disabled: true },
    { value: 'SPECIFIC_SERVICES', label: 'Specific services', disabled: true }
  ];

  get redeemValue(): number {
    return this.form.get('redeemLimitPercent')?.value ?? 100;
  }

  setRedeem(val: number): void {
    this.form.get('redeemLimitPercent')?.setValue(val);
  }

  adjustRedeem(delta: number): void {
    let newVal = this.redeemValue + delta;
    newVal = Math.max(0, Math.min(100, newVal));
    this.form.get('redeemLimitPercent')?.setValue(newVal);
  }

  onRedeemInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let val = parseInt(target.value, 10);
    if (isNaN(val)) val = 0;
    val = Math.max(0, Math.min(100, val));
    this.form.get('redeemLimitPercent')?.setValue(val);
  }
}
