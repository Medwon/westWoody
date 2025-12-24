import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-number-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberFieldComponent),
      multi: true
    }
  ],
  template: `
    <div class="number-field-wrapper">
      <label *ngIf="label" [for]="id" class="number-field-label">
        {{ label }}
        <span *ngIf="required" class="required-mark">*</span>
      </label>
      <div class="number-field-container">
        <span *ngIf="prefix" class="number-field-prefix">{{ prefix }}</span>
        <input
          [id]="id"
          type="number"
          [placeholder]="placeholder"
          [value]="value"
          [disabled]="disabled"
          [min]="min"
          [max]="max"
          [step]="step"
          (input)="onInput($event)"
          (blur)="onBlur()"
          class="number-field"
          [class.error]="!!errorMessage"
          [class.has-prefix]="prefix"
          [class.has-suffix]="suffix"
        />
        <span *ngIf="suffix" class="number-field-suffix">{{ suffix }}</span>
      </div>
      <span *ngIf="errorMessage" class="error-message">{{ errorMessage }}</span>
    </div>
  `,
  styles: [`
    .number-field-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }

    .number-field-label {
      font-weight: 500;
      font-size: 0.875rem;
      color: #1a202c;
    }

    .required-mark {
      color: #dc3545;
      margin-left: 0.25rem;
    }

    .number-field-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .number-field {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      background-color: #ffffff;
      color: #1a202c;
    }

    .number-field:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .number-field:disabled {
      background-color: #f8f9fa;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .number-field.error {
      border-color: #dc3545;
    }

    .number-field.has-prefix {
      padding-left: 2.5rem;
    }

    .number-field.has-suffix {
      padding-right: 2.5rem;
    }

    .number-field-prefix,
    .number-field-suffix {
      position: absolute;
      color: #64748b;
      font-size: 0.875rem;
      pointer-events: none;
    }

    .number-field-prefix {
      left: 0.875rem;
    }

    .number-field-suffix {
      right: 0.875rem;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.75rem;
    }
  `]
})
export class NumberFieldComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step?: number;
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() errorMessage = '';

  value: number | null = null;
  private onChangeFn = (value: number | null) => {};
  private onTouchedFn = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value ? parseFloat(target.value) : null;
    this.onChangeFn(this.value);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  writeValue(value: number | null): void {
    this.value = value ?? null;
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

