import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SplitButtonItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-split-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="split-button" #container>
      <button
        type="button"
        class="split-button-main"
        (click)="onMainClick()"
        [attr.aria-label]="mainLabel"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open">
        <ng-content select="[mainIcon]"></ng-content>
        <span class="split-button-label">{{ mainLabel }}</span>
      </button>
      <button
        type="button"
        class="split-button-arrow"
        (click)="toggleDropdown($event)"
        (keydown)="onArrowKeydown($event)"
        [attr.aria-label]="'Открыть меню'"
        [attr.aria-expanded]="open"
        aria-haspopup="listbox"
        #arrowBtn>
        <svg viewBox="0 0 24 24" fill="none" class="arrow-icon">
          <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div
        class="split-button-dropdown"
        *ngIf="open"
        role="listbox"
        (keydown)="onDropdownKeydown($event)"
        #dropdown>
        <button
          type="button"
          class="split-button-item"
          role="option"
          *ngFor="let item of items; let i = index"
          (click)="selectItem(item)"
          (keydown.enter)="selectItem(item); $event.preventDefault()"
          (keydown.space)="selectItem(item); $event.preventDefault()"
          tabindex="0"
          #itemBtn>
          {{ item.label }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .split-button {
      display: inline-flex;
      width: 100%;
      position: relative;
      border-radius: 10px;
      overflow: visible;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .split-button-main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 0.75rem 0.875rem 1rem;
      background: #16A34A;
      color: white;
      border: none;
      border-radius: 10px 0 0 10px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.15s ease;
      min-width: 0;
    }

    .split-button-main:hover {
      background: #15803d;
    }

    .split-button-main:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.4);
    }

    .split-button-main ::ng-deep svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .split-button-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .split-button-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      flex-shrink: 0;
      padding: 0;
      background: #16A34A;
      color: white;
      border: none;
      border-left: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 0 10px 10px 0;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .split-button-arrow:hover {
      background: #15803d;
    }

    .split-button-arrow:focus {
      outline: none;
      box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.4);
    }

    .arrow-icon {
      width: 18px;
      height: 18px;
    }

    .split-button-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      z-index: 100;
      min-width: 100%;
    }

    .split-button-item {
      display: block;
      width: 100%;
      padding: 0.65rem 1rem;
      border: none;
      background: transparent;
      font-size: 0.9rem;
      font-weight: 500;
      color: #1e293b;
      text-align: left;
      cursor: pointer;
      transition: background 0.1s ease;
    }

    .split-button-item:hover,
    .split-button-item:focus {
      background: #f0fdf4;
      outline: none;
    }

    .split-button-item:not(:last-child) {
      border-bottom: 1px solid #f1f5f9;
    }
  `]
})
export class SplitButtonComponent implements AfterViewInit {
  @Input() mainLabel = '';
  @Input() items: SplitButtonItem[] = [];

  @Output() mainClick = new EventEmitter<void>();
  @Output() itemSelect = new EventEmitter<string>();

  @ViewChild('container') containerRef!: ElementRef<HTMLElement>;
  @ViewChild('dropdown') dropdownRef?: ElementRef<HTMLElement>;
  @ViewChild('arrowBtn') arrowBtnRef?: ElementRef<HTMLButtonElement>;

  open = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open) return;
    const el = this.containerRef?.nativeElement;
    if (el && !el.contains(event.target as Node)) {
      this.open = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open = false;
  }

  ngAfterViewInit(): void {
    // Ensure dropdown items are focusable when open
  }

  onMainClick(): void {
    this.mainClick.emit();
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.open = !this.open;
    if (this.open && this.dropdownRef?.nativeElement) {
      const first = this.dropdownRef.nativeElement.querySelector<HTMLButtonElement>('.split-button-item');
      first?.focus();
    }
  }

  onArrowKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open = !this.open;
      if (this.open && this.dropdownRef?.nativeElement) {
        const first = this.dropdownRef.nativeElement.querySelector<HTMLButtonElement>('.split-button-item');
        setTimeout(() => first?.focus(), 0);
      }
    }
  }

  onDropdownKeydown(event: KeyboardEvent): void {
    const items = this.dropdownRef?.nativeElement?.querySelectorAll<HTMLButtonElement>('.split-button-item');
    if (!items?.length) return;
    const current = event.target as HTMLButtonElement;
    const index = Array.from(items).indexOf(current);
    if (event.key === 'ArrowDown' && index < items.length - 1) {
      event.preventDefault();
      items[index + 1].focus();
    } else if (event.key === 'ArrowUp' && index > 0) {
      event.preventDefault();
      items[index - 1].focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.open = false;
      this.arrowBtnRef?.nativeElement?.focus();
    }
  }

  selectItem(item: SplitButtonItem): void {
    this.itemSelect.emit(item.id);
    this.open = false;
  }
}
