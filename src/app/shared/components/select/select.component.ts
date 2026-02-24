import { Component, Input, Output, EventEmitter, forwardRef, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  /** Optional status for rendering a status icon (e.g. ACTIVE, INACTIVE, ARCHIVED, DRAFT, SCHEDULED). */
  status?: string;
}

export interface SelectOptionGroup {
  groupLabel: string;
  options: SelectOption[];
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
        (mousedown)="onTriggerMouseDown($event)"
        (keydown)="onKeydown($event)"
        (blur)="onBlurTrigger()"
        tabindex="0"
      >
        <span class="select-value" [class.placeholder]="!selectedLabel">
          {{ selectedLabel || placeholder || 'Select...' }}
        </span>
        <svg class="select-chevron" [class.rotated]="isOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>

      <div class="select-dropdown" *ngIf="isOpen">
        <ng-container *ngIf="optionGroups?.length; else flatOptions">
          <div *ngFor="let row of dropdownRows" [class.select-option-group-header]="row.type === 'groupHeader'">
            <div *ngIf="row.type === 'groupHeader'" class="select-group-label">{{ row.label }}</div>
            <div
              *ngIf="row.type === 'option'"
              class="select-option"
              role="option"
              [class.selected]="optionValueEquals(row.option.value, value)"
              [class.disabled]="row.option.disabled"
              [class.highlighted]="highlightedIndex === row.index"
              (click)="onOptionClick(row.option, $event)"
              (mouseenter)="highlightedIndex = row.index"
            >
              <span class="select-option-label">{{ row.option.label }}</span>
              <span *ngIf="row.option.status" class="select-option-status select-option-status-badge" [class.select-option-status-badge--active]="row.option.status === 'ACTIVE'" [class.select-option-status-badge--scheduled]="row.option.status === 'SCHEDULED'" [class.select-option-status-badge--draft]="row.option.status === 'DRAFT'" [class.select-option-status-badge--archived]="row.option.status === 'ARCHIVED'" [class.select-option-status-badge--inactive]="row.option.status === 'INACTIVE'" [attr.aria-label]="row.option.status">
                <svg *ngIf="row.option.status === 'ACTIVE'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                <svg *ngIf="row.option.status === 'SCHEDULED'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <svg *ngIf="row.option.status === 'DRAFT'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <svg *ngIf="row.option.status === 'ARCHIVED'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
                <svg *ngIf="row.option.status === 'INACTIVE'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M10 15V9"/><path d="M14 15V9"/></svg>
              </span>
            </div>
          </div>
          <div class="select-empty" *ngIf="flattenedSelectableOptions.length === 0">No options</div>
        </ng-container>
        <ng-template #flatOptions>
          <ng-container *ngFor="let option of options; let i = index">
            <div
              *ngIf="option.disabled && isGroupHeader(option)"
              class="select-flat-group-header"
            >{{ option.label }}</div>
            <div
              *ngIf="!option.disabled || !isGroupHeader(option)"
              class="select-option"
              [class.selected]="optionValueEquals(option.value, value)"
              [class.disabled]="option.disabled"
              [class.highlighted]="highlightedIndex === i"
              (click)="selectOption(option, $event)"
              (mouseenter)="highlightedIndex = i"
            >
              <span class="select-option-label">{{ option.label }}</span>
              <span *ngIf="option.status" class="select-option-status select-option-status-badge"
                [class.select-option-status-badge--active]="option.status === 'ACTIVE'"
                [class.select-option-status-badge--scheduled]="option.status === 'SCHEDULED'"
                [class.select-option-status-badge--draft]="option.status === 'DRAFT'"
                [class.select-option-status-badge--archived]="option.status === 'ARCHIVED'"
                [class.select-option-status-badge--inactive]="option.status === 'INACTIVE'"
                [attr.aria-label]="option.status">
                <svg *ngIf="option.status === 'ACTIVE'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                <svg *ngIf="option.status === 'SCHEDULED'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <svg *ngIf="option.status === 'DRAFT'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <svg *ngIf="option.status === 'ARCHIVED'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
                <svg *ngIf="option.status === 'INACTIVE'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M10 15V9"/><path d="M14 15V9"/></svg>
              </span>
            </div>
          </ng-container>
          <div class="select-empty" *ngIf="options.length === 0">No options</div>
        </ng-template>
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
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

    .select-option-label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .select-option-status {
      flex-shrink: 0;
      display: inline-flex;
      width: 16px;
      height: 16px;
      color: #64748b;
    }

    .select-option-status svg {
      width: 100%;
      height: 100%;
    }

    .select-option.selected .select-option-status {
      color: #15803d;
    }

    /* Status icon (rounded background, no border), colored by status */
    .select-option-status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      padding: 0;
    }
    .select-option-status-badge svg {
      width: 14px;
      height: 14px;
    }
    .select-option-status-badge--active {
      color: #16a34a;
      background-color: rgba(22, 163, 74, 0.12);
    }
    .select-option-status-badge--scheduled {
      color: #2563eb;
      background-color: rgba(37, 99, 235, 0.12);
    }
    .select-option-status-badge--draft {
      color: #94a3b8;
      background-color: rgba(148, 163, 184, 0.15);
    }
    .select-option-status-badge--archived {
      color: #64748b;
      background-color: rgba(100, 116, 139, 0.12);
    }
    .select-option-status-badge--inactive {
      color: #dc2626;
      background-color: rgba(220, 38, 38, 0.1);
    }
    .select-option.selected .select-option-status-badge--active {
      color: #15803d;
      background-color: rgba(21, 128, 61, 0.18);
    }

    .select-option-group-header {
      padding: 0;
    }

    .select-group-label {
      padding: 0.5rem 0.875rem 0.25rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 2px;
      cursor: default;
    }

    .select-group-label:empty {
      display: none;
    }

    .select-flat-group-header {
      padding: 0.5rem 0.875rem 0.25rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 2px;
      cursor: default;
      user-select: none;
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
  /** When set, dropdown shows grouped options with section headers. Only groups with at least one option are shown. */
  @Input() optionGroups: SelectOptionGroup[] | null = null;
  @Input() disabled = false;
  @Input() required = false;
  @Input() errorMessage = '';
  /** Emitted when an option is selected (use this if ngModelChange does not fire reliably with optionGroups). */
  @Output() optionSelected = new EventEmitter<any>();

  value: any = '';
  isOpen = false;
  highlightedIndex = -1;
  private justSelectedOption = false;

  private onChangeFn = (value: any) => {};
  private onTouchedFn = () => {};

  constructor(private elementRef: ElementRef) {}

  /** Flat list of all selectable options in display order (for keyboard nav and selectedLabel). */
  get flattenedSelectableOptions(): SelectOption[] {
    if (this.optionGroups?.length) {
      return [...this.options, ...this.optionGroups.flatMap(g => g.options)];
    }
    return this.options;
  }

  /** Rows to render: either a group header or an option with its global index. Top-level options first, then groups. */
  get dropdownRows(): Array<{ type: 'groupHeader'; label: string } | { type: 'option'; option: SelectOption; index: number }> {
    const rows: Array<{ type: 'groupHeader'; label: string } | { type: 'option'; option: SelectOption; index: number }> = [];
    if (!this.optionGroups?.length) return rows;
    let index = 0;
    for (const opt of this.options) {
      rows.push({ type: 'option', option: opt, index });
      index++;
    }
    for (const group of this.optionGroups) {
      if (group.options.length === 0) continue;
      rows.push({ type: 'groupHeader', label: group.groupLabel });
      for (const opt of group.options) {
        rows.push({ type: 'option', option: opt, index });
        index++;
      }
    }
    return rows;
  }

  get selectedLabel(): string {
    const list = this.flattenedSelectableOptions.length ? this.flattenedSelectableOptions : this.options;
    const found = list.find(o => this.optionValueEquals(o.value, this.value));
    return found ? found.label : '';
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      const list = this.flattenedSelectableOptions.length ? this.flattenedSelectableOptions : this.options;
      const idx = list.findIndex(o => this.optionValueEquals(o.value, this.value));
      this.highlightedIndex = idx >= 0 ? idx : (list.length > 0 ? 0 : -1);
    }
  }

  isGroupHeader(option: SelectOption): boolean {
    return typeof option.value === 'string' && option.value.startsWith('__header_');
  }

  /** Compare option value with current value (string coercion for UUIDs). */
  optionValueEquals(optionVal: any, currentVal: any): boolean {
    if (optionVal == null && currentVal == null) return true;
    if (optionVal == null || currentVal == null) return false;
    return String(optionVal) === String(currentVal);
  }

  onTriggerMouseDown(event: MouseEvent): void {
    if (this.disabled) return;
    if (this.justSelectedOption) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.toggle();
  }

  onOptionClick(option: SelectOption, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectOption(option, event);
  }

  selectOption(option: SelectOption, event: Event): void {
    event.stopPropagation();
    if (option.disabled) return;
    const val = option.value != null ? option.value : '';
    this.value = val;
    this.onChangeFn(val);
    this.optionSelected.emit(val);
    this.justSelectedOption = true;
    this.isOpen = false;
    setTimeout(() => { this.justSelectedOption = false; }, 150);
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.isOpen && this.highlightedIndex >= 0) {
          const list = this.flattenedSelectableOptions.length ? this.flattenedSelectableOptions : this.options;
          const opt = list[this.highlightedIndex];
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
    const list = this.flattenedSelectableOptions.length ? this.flattenedSelectableOptions : this.options;
    let next = this.highlightedIndex + direction;
    while (next >= 0 && next < list.length && list[next].disabled) {
      next += direction;
    }
    if (next >= 0 && next < list.length) {
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
    const target = event.target as Node;
    if (this.elementRef.nativeElement.contains(target)) return;
    setTimeout(() => {
      if (!this.justSelectedOption) this.isOpen = false;
    }, 0);
  }

  writeValue(value: any): void {
    this.value = value != null && value !== '' ? value : '';
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
