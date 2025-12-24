import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div class="input-wrapper">
      <label *ngIf="label" [for]="id" class="input-label">
        {{ label }}
        <span *ngIf="required" class="required-mark">*</span>
      </label>
      <div class="input-container">
        <span *ngIf="prefix" class="input-prefix">{{ prefix }}</span>
        <input
          [id]="id"
          [type]="type"
          [placeholder]="placeholder"
          [value]="value"
          [disabled]="disabled"
          [readonly]="readonly"
          [attr.maxlength]="maxLength"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
          [class.error]="hasError || !!errorMessage"
          [class.has-prefix]="prefix"
          [class.has-suffix]="suffix"
        />
        <span *ngIf="suffix" class="input-suffix">{{ suffix }}</span>
      </div>
      <div class="input-footer">
        <span *ngIf="errorMessage" class="error-message">{{ errorMessage }}</span>
        <span *ngIf="hint && !errorMessage" class="hint-message">{{ hint }}</span>
        <span *ngIf="maxLength && showCharCount" class="char-count">
          {{ value.length }} / {{ maxLength }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }

    .input-label {
      font-weight: 500;
      font-size: 0.875rem;
      color: #1a202c;
    }

    .required-mark {
      color: #dc3545;
      margin-left: 0.25rem;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    input {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      background-color: #ffffff;
      color: #1a202c;
    }

    input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    input.error {
      border-color: #dc3545;
    }

    input.error:focus {
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }

    input:disabled {
      background-color: #f8f9fa;
      color: #94a3b8;
      cursor: not-allowed;
    }

    input.readonly {
      background-color: #f8f9fa;
      cursor: default;
    }

    input.has-prefix {
      padding-left: 2.5rem;
    }

    input.has-suffix {
      padding-right: 2.5rem;
    }

    .input-prefix,
    .input-suffix {
      position: absolute;
      color: #64748b;
      font-size: 0.875rem;
      pointer-events: none;
    }

    .input-prefix {
      left: 0.875rem;
    }

    .input-suffix {
      right: 0.875rem;
    }

    .input-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 1.25rem;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.75rem;
    }

    .hint-message {
      color: #64748b;
      font-size: 0.75rem;
    }

    .char-count {
      color: #94a3b8;
      font-size: 0.75rem;
      margin-left: auto;
    }
  `]
})
export class InputComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() label = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() errorMessage = '';
  @Input() hint = '';
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() maxLength?: number;
  @Input() showCharCount = false;

  value = '';
  hasError = false;

  private onChange = (value: string) => {};
  private onTouched = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.hasError = false;
  }

  onBlur(): void {
    this.onTouched();
  }

  onFocus(): void {
    this.hasError = false;
  }

  getErrorMessage(): string {
    return this.errorMessage || '';
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

