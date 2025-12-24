import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ],
  template: `
    <div class="date-picker-wrapper">
      <label *ngIf="label" [for]="id" class="date-picker-label">
        {{ label }}
        <span *ngIf="required" class="required-mark">*</span>
      </label>
      <input
        [id]="id"
        type="date"
        [placeholder]="placeholder"
        [value]="value"
        [disabled]="disabled"
        [min]="min"
        [max]="max"
        (input)="onInput($event)"
        (blur)="onBlur()"
        class="date-picker"
        [class.error]="!!errorMessage"
      />
      <span *ngIf="errorMessage" class="error-message">{{ errorMessage }}</span>
    </div>
  `,
  styles: [`
    .date-picker-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }

    .date-picker-label {
      font-weight: 500;
      font-size: 0.875rem;
      color: #1a202c;
    }

    .required-mark {
      color: #dc3545;
      margin-left: 0.25rem;
    }

    .date-picker {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      background-color: #ffffff;
      color: #1a202c;
    }

    .date-picker:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .date-picker:disabled {
      background-color: #f8f9fa;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .date-picker.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.75rem;
    }
  `]
})
export class DatePickerComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() min?: string;
  @Input() max?: string;
  @Input() errorMessage = '';

  value = '';
  private onChangeFn = (value: string) => {};
  private onTouchedFn = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChangeFn(this.value);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

