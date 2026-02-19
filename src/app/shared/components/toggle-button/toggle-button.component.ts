import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-toggle-button',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleButtonComponent),
      multi: true
    }
  ],
  template: `
    <button
      class="toggle-button"
      [class.active]="checked"
      [class.disabled]="disabled"
      [disabled]="disabled"
      (click)="toggle()">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .toggle-button {
      padding: 0.625rem 1.25rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background-color: #ffffff;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .toggle-button:hover:not(.disabled) {
      background-color: #f8f9fa;
      border-color: #94a3b8;
    }

    .toggle-button.active {
      background-color: var(--primary-color);
      color: #ffffff;
      border-color: var(--primary-color);
    }

    .toggle-button.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class ToggleButtonComponent implements ControlValueAccessor {
  @Input() disabled = false;

  @Output() toggleChange = new EventEmitter<boolean>();

  checked = false;
  private onChangeFn = (value: boolean) => {};
  private onTouchedFn = () => {};

  toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.onChangeFn(this.checked);
    this.onTouchedFn();
    this.toggleChange.emit(this.checked);
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

