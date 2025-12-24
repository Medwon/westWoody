import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-radio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioComponent),
      multi: true
    }
  ],
  template: `
    <label class="radio-wrapper" [class.disabled]="disabled">
      <input
        type="radio"
        [name]="name"
        [value]="value"
        [checked]="checked"
        [disabled]="disabled"
        (change)="onChange($event)"
        (blur)="onBlur()"
        class="radio-input"
      />
      <span class="radio-label">
        <span class="radio-circle" [class.checked]="checked">
          <span *ngIf="checked" class="radio-dot"></span>
        </span>
        <span class="radio-text" *ngIf="label">{{ label }}</span>
      </span>
    </label>
  `,
  styles: [`
    .radio-wrapper {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }

    .radio-wrapper.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .radio-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .radio-circle {
      width: 20px;
      height: 20px;
      border: 2px solid #cbd5e1;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #ffffff;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .radio-circle.checked {
      border-color: #007bff;
    }

    .radio-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #007bff;
    }

    .radio-text {
      font-size: 0.875rem;
      color: #1a202c;
    }

    .radio-wrapper:hover:not(.disabled) .radio-circle:not(.checked) {
      border-color: #007bff;
    }
  `]
})
export class RadioComponent implements ControlValueAccessor {
  @Input() name = '';
  @Input() value: any;
  @Input() label = '';
  @Input() disabled = false;

  checked = false;
  private onChangeFn = (value: any) => {};
  private onTouchedFn = () => {};

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.checked = true;
      this.onChangeFn(this.value);
    }
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  writeValue(value: any): void {
    this.checked = value === this.value;
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

