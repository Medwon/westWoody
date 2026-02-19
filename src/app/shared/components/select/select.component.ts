import { Component, Input, forwardRef, ElementRef, HostListener } from '@angular/core';
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
      <label *ngIf="label" class="select-label">
        {{ label }}
        <span *ngIf="required" class="required-mark">*</span>
      </label>

      <div
        class="select-trigger"
        [class.open]="isOpen"
        [class.error]="!!errorMessage"
        [class.disabled]="disabled"
        (click)="toggle()"
        tabindex="0"
        (keydown)="onKeydown($event)"
        (blur)="onBlurTrigger()"
      >
        <span class="select-value" [class.placeholder]="!selectedLabel">
          {{ selectedLabel || placeholder || 'Select...' }}
        </span>
        <svg class="select-chevron" [class.rotated]="isOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>

      <div class="select-dropdown" *ngIf="isOpen">
        <div
          *ngFor="let option of options; let i = index"
          class="select-option"
          [class.selected]="option.value === value"
          [class.disabled]="option.disabled"
          [class.highlighted]="highlightedIndex === i"
          (click)="selectOption(option, $event)"
          (mouseenter)="highlightedIndex = i"
        >
          {{ option.label }}
        </div>
        <div class="select-empty" *ngIf="options.length === 0">No options</div>
      </div>

      <span *ngIf="errorMessage" class="error-message">{{ errorMessage }}</span>
    </div>
  `,
  styles: [`
    .select-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
      position: relative;
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

    .select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--color-input-border);
      border-radius: 6px;
      font-size: 0.875rem;
      background-color: #ffffff;
      color: #1a202c;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
      outline: none;
    }

    .select-trigger:hover:not(.disabled) {
      border-color: var(--color-input-border-hover);
    }

    .select-trigger:focus:not(.disabled) {
      border-color: var(--color-input-border-focus);
      box-shadow: 0 0 0 3px var(--color-input-shadow-focus);
    }

    .select-trigger.open {
      border-color: var(--color-input-border-focus);
      box-shadow: 0 0 0 3px var(--color-input-shadow-focus);
    }

    .select-trigger.disabled {
      background-color: #f8f9fa;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .select-trigger.error {
      border-color: var(--color-input-error);
    }

    .select-trigger.error:focus,
    .select-trigger.error.open {
      box-shadow: 0 0 0 3px var(--color-input-error-shadow);
    }

    .select-value {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .select-value.placeholder {
      color: #94a3b8;
    }

    .select-chevron {
      width: 18px;
      height: 18px;
      color: #94a3b8;
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }

    .select-chevron.rotated {
      transform: rotate(180deg);
    }

    .select-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 50;
      margin-top: 4px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
      max-height: 240px;
      overflow-y: auto;
      padding: 4px;
    }

    .select-option {
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
      color: #1a202c;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.1s ease;
      user-select: none;
    }

    .select-option:hover,
    .select-option.highlighted {
      background-color: #f0fdf4;
      color: #15803d;
    }

    .select-option.selected {
      background-color: #dcfce7;
      color: #15803d;
      font-weight: 600;
    }

    .select-option.disabled {
      color: #94a3b8;
      cursor: not-allowed;
    }

    .select-option.disabled:hover {
      background-color: transparent;
      color: #94a3b8;
    }

    .select-empty {
      padding: 0.75rem;
      font-size: 0.85rem;
      color: #94a3b8;
      text-align: center;
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
  isOpen = false;
  highlightedIndex = -1;

  private onChangeFn = (value: any) => {};
  private onTouchedFn = () => {};

  constructor(private elementRef: ElementRef) {}

  get selectedLabel(): string {
    const found = this.options.find(o => o.value === this.value);
    return found ? found.label : '';
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      const idx = this.options.findIndex(o => o.value === this.value);
      this.highlightedIndex = idx >= 0 ? idx : 0;
    }
  }

  selectOption(option: SelectOption, event: Event): void {
    event.stopPropagation();
    if (option.disabled) return;
    this.value = option.value;
    this.onChangeFn(this.value);
    this.isOpen = false;
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.isOpen && this.highlightedIndex >= 0) {
          const opt = this.options[this.highlightedIndex];
          if (opt && !opt.disabled) {
            this.selectOption(opt, event);
          }
        } else {
          this.toggle();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen) { this.isOpen = true; }
        this.moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveHighlight(-1);
        break;
      case 'Escape':
        this.isOpen = false;
        break;
    }
  }

  private moveHighlight(direction: number): void {
    let next = this.highlightedIndex + direction;
    while (next >= 0 && next < this.options.length && this.options[next].disabled) {
      next += direction;
    }
    if (next >= 0 && next < this.options.length) {
      this.highlightedIndex = next;
    }
  }

  onBlurTrigger(): void {
    // Small delay so click on option registers before closing
    setTimeout(() => {
      if (!this.elementRef.nativeElement.contains(document.activeElement)) {
        this.isOpen = false;
        this.onTouchedFn();
      }
    }, 150);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
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
