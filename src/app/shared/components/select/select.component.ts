import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="select-wrapper">
      <label *ngIf="label" [for]="id" class="select-label">
        {{ label }}
        <span *ngIf="required" class="required-mark">*</span>
      </label>
      <select
        [id]="id"
        [value]="value"
        [disabled]="disabled"
        (change)="onChange($event)"
        (blur)="onBlur()"
        class="select"
        [class.error]="!!errorMessage"
      >
        <option *ngIf="placeholder" value="" disabled>{{ placeholder }}</option>
        <option *ngFor="let option of options" [value]="option.value" [disabled]="option.disabled">
          {{ option.label }}
        </option>
      </select>
      <span *ngIf="errorMessage" class="error-message">{{ errorMessage }}</span>
    </div>
  `,
  styles: [`
    .select-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }

    .select-label {
      font-weight: 500;
      font-size: 0.875rem;
      color: #1a202c;
    }

    .required-mark {
      color: #dc3545;
      margin-left: 0.25rem;
    }

    .select {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.875rem;
      background-color: #ffffff;
      color: #1a202c;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .select:disabled {
      background-color: #f8f9fa;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .select.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.75rem;
    }
  `]
})
export class SelectComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() options: SelectOption[] = [];
  @Input() disabled = false;
  @Input() required = false;
  @Input() errorMessage = '';

  value: any = '';
  private onChangeFn = (value: any) => {};
  private onTouchedFn = () => {};

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChangeFn(this.value);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

