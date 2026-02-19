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
          [type]="getInputType()"
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
          [class.has-suffix]="suffix || (showPasswordToggle && type === 'password')"
        />
        <span *ngIf="suffix" class="input-suffix">{{ suffix }}</span>
        <button
          *ngIf="showPasswordToggle && type === 'password'"
          type="button"
          class="password-toggle-btn"
          (click)="togglePasswordVisibility()"
          [attr.aria-label]="showPassword ? 'Скрыть пароль' : 'Показать пароль'">
          <svg *ngIf="!showPassword" viewBox="0 0 24 24" fill="none" class="eye-icon">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg *ngIf="showPassword" viewBox="0 0 24 24" fill="none" class="eye-icon">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
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
      border: 1px solid var(--color-input-border);
      border-radius: 6px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      background-color: #ffffff;
      color: #1a202c;
    }

    input:hover {
      border-color: var(--color-input-border-hover);
    }

    input:focus {
      outline: none;
      border-color: var(--color-input-border-focus);
      box-shadow: 0 0 0 3px var(--color-input-shadow-focus);
    }

    input.error {
      border-color: var(--color-input-error);
    }

    input.error:focus {
      box-shadow: 0 0 0 3px var(--color-input-error-shadow);
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

    .password-toggle-btn {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      padding: 0.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: color 0.2s ease;
      z-index: 1;
    }

    .password-toggle-btn:hover {
      color: #1a202c;
    }

    .password-toggle-btn:focus {
      outline: none;
      color: #15803d;
    }

    .eye-icon {
      width: 20px;
      height: 20px;
      display: block;
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
  @Input() showPasswordToggle = false;

  value = '';
  hasError = false;
  showPassword = false;

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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getInputType(): string {
    if (this.type === 'password' && this.showPassword) {
      return 'text';
    }
    return this.type;
  }
}

