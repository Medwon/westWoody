import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderComponent),
      multi: true
    }
  ],
  template: `
    <div class="slider-wrapper">
      <label *ngIf="label" class="slider-label">
        {{ label }}
        <span class="slider-value" *ngIf="showValue">{{ value }}</span>
      </label>
      <div class="slider-container">
        <input
          type="range"
          [min]="min"
          [max]="max"
          [step]="step"
          [value]="value"
          [disabled]="disabled"
          (input)="onInput($event)"
          (blur)="onBlur()"
          class="slider"
        />
      </div>
      <div class="slider-labels" *ngIf="showLabels">
        <span>{{ min }}</span>
        <span>{{ max }}</span>
      </div>
    </div>
  `,
  styles: [`
    .slider-wrapper {
      width: 100%;
    }

    .slider-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      font-weight: 500;
      color: #1a202c;
      margin-bottom: 0.5rem;
    }

    .slider-value {
      color: #64748b;
      font-weight: 400;
    }

    .slider-container {
      width: 100%;
    }

    .slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #e2e8f0;
      outline: none;
      -webkit-appearance: none;
    }

    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #007bff;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #007bff;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .slider:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .slider-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.25rem;
    }
  `]
})
export class SliderComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() min = 0;
  @Input() max = 100;
  @Input() step = 1;
  @Input() disabled = false;
  @Input() showValue = false;
  @Input() showLabels = false;

  value = 0;
  private onChangeFn = (value: number) => {};
  private onTouchedFn = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = parseFloat(target.value);
    this.onChangeFn(this.value);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  writeValue(value: number): void {
    this.value = value || 0;
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

