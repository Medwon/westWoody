import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ],
  template: `
    <label class="checkbox-wrapper" [class.disabled]="disabled">
      <input
        type="checkbox"
        [checked]="checked"
        [disabled]="disabled"
        (change)="onChange($event)"
        (blur)="onBlur()"
        class="checkbox-input"
      />
      <span class="checkbox-label">
        <span class="checkbox-checkmark" [class.checked]="checked">
          <span *ngIf="checked" class="checkmark-icon">✓</span>
        </span>
        <span class="checkbox-text" *ngIf="label">{{ label }}</span>
      </span>
    </label>
  `,
  styles: [`
    .checkbox-wrapper {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }

    .checkbox-wrapper.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .checkbox-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .checkbox-checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid #cbd5e1;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #ffffff;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .checkbox-checkmark.checked {
      background-color: #007bff;
      border-color: #007bff;
    }

    .checkmark-icon {
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: bold;
    }

    .checkbox-text {
      font-size: 0.875rem;
      color: #1a202c;
    }

    .checkbox-wrapper:hover:not(.disabled) .checkbox-checkmark:not(.checked) {
      border-color: #007bff;
    }
  `]
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() disabled = false;

  checked = false;
  private onChangeFn = (value: boolean) => {};
  private onTouchedFn = () => {};

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.onChangeFn(this.checked);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  writeValue(value: boolean): void {
    this.checked = value || false;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

