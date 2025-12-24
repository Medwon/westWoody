import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-switch',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true
    }
  ],
  template: `
    <label class="switch-wrapper" [class.disabled]="disabled">
      <input
        type="checkbox"
        [checked]="checked"
        [disabled]="disabled"
        (change)="onChange($event)"
        (blur)="onBlur()"
        class="switch-input"
      />
      <span class="switch-label">
        <span class="switch-track" [class.checked]="checked">
          <span class="switch-thumb"></span>
        </span>
        <span class="switch-text" *ngIf="label">{{ label }}</span>
      </span>
    </label>
  `,
  styles: [`
    .switch-wrapper {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }

    .switch-wrapper.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .switch-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .switch-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .switch-track {
      width: 44px;
      height: 24px;
      background-color: #cbd5e1;
      border-radius: 12px;
      position: relative;
      transition: background-color 0.2s ease;
      flex-shrink: 0;
    }

    .switch-track.checked {
      background-color: #007bff;
    }

    .switch-thumb {
      width: 20px;
      height: 20px;
      background-color: #ffffff;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .switch-track.checked .switch-thumb {
      transform: translateX(20px);
    }

    .switch-text {
      font-size: 0.875rem;
      color: #1a202c;
    }

    .switch-wrapper:hover:not(.disabled) .switch-track:not(.checked) {
      background-color: #94a3b8;
    }
  `]
})
export class SwitchComponent implements ControlValueAccessor {
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

