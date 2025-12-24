import { Component, Input, Output, EventEmitter, forwardRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface AutocompleteOption {
  value: any;
  label: string;
}

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true
    }
  ],
  template: `
    <div class="autocomplete-wrapper">
      <label *ngIf="label" [for]="id" class="autocomplete-label">
        {{ label }}
      </label>
      <div class="autocomplete-container">
        <input
          [id]="id"
          type="text"
          [placeholder]="placeholder"
          [value]="displayValue"
          [disabled]="disabled"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          class="autocomplete-input"
          [class.error]="!!errorMessage"
        />
        <div class="autocomplete-dropdown" *ngIf="showDropdown && filteredOptions.length > 0">
          <div
            *ngFor="let option of filteredOptions; let i = index"
            class="autocomplete-option"
            [class.highlighted]="highlightedIndex === i"
            (click)="selectOption(option)"
            (mouseenter)="highlightedIndex = i"
          >
            {{ option.label }}
          </div>
        </div>
      </div>
      <span *ngIf="errorMessage" class="error-message">{{ errorMessage }}</span>
    </div>
  `,
  styles: [`
    .autocomplete-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
      position: relative;
    }

    .autocomplete-label {
      font-weight: 500;
      font-size: 0.875rem;
      color: #1a202c;
    }

    .autocomplete-container {
      position: relative;
    }

    .autocomplete-input {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      background-color: #ffffff;
      color: #1a202c;
    }

    .autocomplete-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .autocomplete-input:disabled {
      background-color: #f8f9fa;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .autocomplete-input.error {
      border-color: #dc3545;
    }

    .autocomplete-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 0.25rem;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
    }

    .autocomplete-option {
      padding: 0.625rem 0.875rem;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background-color 0.15s ease;
    }

    .autocomplete-option:hover,
    .autocomplete-option.highlighted {
      background-color: #f1f5f9;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.75rem;
    }
  `]
})
export class AutocompleteComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() options: AutocompleteOption[] = [];
  @Input() disabled = false;
  @Input() errorMessage = '';

  value: any = null;
  displayValue = '';
  showDropdown = false;
  filteredOptions: AutocompleteOption[] = [];
  highlightedIndex = -1;

  private onChangeFn = (value: any) => {};
  private onTouchedFn = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.displayValue = target.value;
    this.filterOptions();
    this.showDropdown = true;
    this.highlightedIndex = -1;
  }

  onFocus(): void {
    this.filterOptions();
    this.showDropdown = true;
  }

  onBlur(): void {
    setTimeout(() => {
      this.showDropdown = false;
      this.onTouchedFn();
    }, 200);
  }

  filterOptions(): void {
    if (!this.displayValue) {
      this.filteredOptions = this.options;
      return;
    }

    const search = this.displayValue.toLowerCase();
    this.filteredOptions = this.options.filter(option =>
      option.label.toLowerCase().includes(search)
    );
  }

  selectOption(option: AutocompleteOption): void {
    this.value = option.value;
    this.displayValue = option.label;
    this.showDropdown = false;
    this.onChangeFn(this.value);
  }

  writeValue(value: any): void {
    this.value = value;
    const option = this.options.find(opt => opt.value === value);
    this.displayValue = option ? option.label : '';
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

