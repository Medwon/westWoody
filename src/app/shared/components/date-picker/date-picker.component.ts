import { Component, Input, forwardRef, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SelectComponent, SelectOption } from '../select/select.component';

interface CalendarDay {
  date: number;
  month: number;    // 0-indexed
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ],
  template: `
    <div class="dp-wrapper">
      <label *ngIf="label" class="dp-label">
        {{ label }}
        <span *ngIf="required" class="required-mark">*</span>
        <ng-content select="[labelExtra]"></ng-content>
      </label>

      <!-- Trigger -->
      <div
        class="dp-trigger"
        [class.open]="isOpen"
        [class.error]="!!errorMessage"
        [class.disabled]="disabled"
        [class.has-value]="!!value"
        (click)="toggleCalendar()"
        tabindex="0"
        (keydown.escape)="isOpen = false"
      >
        <svg class="dp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        <span class="dp-display" [class.placeholder]="!value">
          {{ value ? formatDisplay(value) : placeholder || 'Select date' }}
        </span>
        <button *ngIf="value && clearable && !disabled" type="button" class="dp-clear" (click)="clearValue($event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Calendar dropdown -->
      <div class="dp-dropdown" *ngIf="isOpen">
        <!-- Header: month/year + nav -->
        <div class="dp-header">
          <span class="dp-month-year">{{ monthNames[viewMonth] }} {{ viewYear }}</span>
          <div class="dp-nav">
            <button type="button" class="dp-nav-btn" (click)="prevMonth($event)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button type="button" class="dp-nav-btn" (click)="nextMonth($event)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        <!-- Day headers -->
        <div class="dp-day-headers">
          <span *ngFor="let d of dayHeaders" class="dp-day-header">{{ d }}</span>
        </div>

        <!-- Day grid -->
        <div class="dp-grid">
          <button
            *ngFor="let day of calendarDays"
            type="button"
            class="dp-day"
            [class.other-month]="!day.isCurrentMonth"
            [class.today]="day.isToday"
            [class.selected]="day.isSelected"
            [class.past]="day.isPast && disablePast"
            [disabled]="day.isPast && disablePast"
            (click)="selectDay(day, $event)"
          >
            {{ day.date }}
          </button>
        </div>

        <!-- Optional time selection -->
        <div class="dp-time-row" *ngIf="showTime">
          <div class="dp-time-field">
            <label class="dp-time-label">Time</label>
            <app-select
              [options]="effectiveTimeOptions"
              [placeholder]="'Time'"
              (click)="$event.stopPropagation()"
              [ngModel]="selectedTime"
              (ngModelChange)="onTimeChange($event)"
            ></app-select>
          </div>
        </div>

        <!-- Footer -->
        <div class="dp-footer">
          <button type="button" class="dp-today-btn" (click)="goToToday($event)">Today</button>
        </div>
      </div>

      <span *ngIf="errorMessage" class="error-message">{{ errorMessage }}</span>
    </div>
  `,
  styles: [`
    .dp-wrapper {
      display: flex; flex-direction: column; gap: 0.5rem;
      width: 100%; position: relative;
    }

    .dp-label {
      font-weight: 500; font-size: 0.875rem; color: #1a202c;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .required-mark { color: #dc3545; margin-left: 0.25rem; }

    /* Trigger */
    .dp-trigger {
      display: flex; align-items: center; gap: 0.625rem;
      width: 100%; padding: 0.625rem 0.875rem;
      border: 1px solid var(--color-input-border); border-radius: 6px;
      font-size: 0.875rem; background: #ffffff; color: #1a202c;
      cursor: pointer; transition: all 0.2s; outline: none;
      user-select: none;
    }
    .dp-trigger:hover:not(.disabled) { border-color: var(--color-input-border-hover); }
    .dp-trigger:focus:not(.disabled),
    .dp-trigger.open { border-color: var(--color-input-border-focus); box-shadow: 0 0 0 3px var(--color-input-shadow-focus); }
    .dp-trigger.disabled { background: #f8f9fa; color: #94a3b8; cursor: not-allowed; }
    .dp-trigger.error { border-color: var(--color-input-error); }
    .dp-trigger.error:focus, .dp-trigger.error.open { box-shadow: 0 0 0 3px var(--color-input-error-shadow); }

    .dp-icon { width: 18px; height: 18px; color: #94a3b8; flex-shrink: 0; }
    .dp-trigger.has-value .dp-icon { color: #16A34A; }
    .dp-display { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dp-display.placeholder { color: #94a3b8; }
    .dp-clear {
      background: none; border: none; padding: 0.125rem; cursor: pointer;
      color: #94a3b8; display: flex; transition: color 0.15s;
    }
    .dp-clear:hover { color: #ef4444; }
    .dp-clear svg { width: 16px; height: 16px; }

    /* Dropdown */
    .dp-dropdown {
      position: absolute; top: 100%; left: 0;
      z-index: 50; margin-top: 4px;
      background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04);
      padding: 1rem; min-width: 280px;
      width: max-content;
    }

    /* Header */
    .dp-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 0.75rem;
    }
    .dp-month-year { font-size: 1rem; font-weight: 700; color: #0f172a; }
    .dp-nav { display: flex; gap: 0.25rem; }
    .dp-nav-btn {
      width: 32px; height: 32px; border-radius: 6px;
      border: 1px solid #e2e8f0; background: #ffffff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #475569; transition: all 0.15s;
    }
    .dp-nav-btn:hover { background: #f0fdf4; border-color: #bbf7d0; color: #16A34A; }
    .dp-nav-btn svg { width: 16px; height: 16px; }

    /* Day headers */
    .dp-day-headers {
      display: grid; grid-template-columns: repeat(7, 1fr);
      gap: 0; margin-bottom: 0.25rem;
    }
    .dp-day-header {
      text-align: center; font-size: 0.75rem; font-weight: 600;
      color: #94a3b8; padding: 0.25rem 0;
    }

    /* Day grid */
    .dp-grid {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
    }
    .dp-day {
      width: 36px; height: 36px; margin: 0 auto;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; color: #1a202c; border: none;
      background: transparent; border-radius: 8px; cursor: pointer;
      transition: all 0.1s; font-weight: 500;
    }
    .dp-day:hover:not(:disabled):not(.selected) { background: #f0fdf4; color: #16A34A; }
    .dp-day.other-month { color: #cbd5e1; }
    .dp-day.other-month:hover:not(:disabled):not(.selected) { color: #94a3b8; }
    .dp-day.today:not(.selected) {
      border: 1.5px solid #16A34A; color: #16A34A; font-weight: 700;
    }
    .dp-day.selected {
      background: #0f172a; color: #ffffff; font-weight: 700;
    }
    .dp-day.past { opacity: 0.4; cursor: not-allowed; }

    /* Time row */
    .dp-time-row {
      display: flex; gap: 0.5rem; margin-top: 0.75rem;
      padding-top: 0.75rem; border-top: 1px solid #f1f5f9;
    }
    .dp-time-field { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .dp-time-label { font-size: 0.7rem; font-weight: 600; color: #64748b; }

    /* Footer */
    .dp-footer {
      display: flex; justify-content: center;
      margin-top: 0.5rem; padding-top: 0.5rem;
      border-top: 1px solid #f1f5f9;
    }
    .dp-today-btn {
      background: none; border: none; font-size: 0.8rem; font-weight: 600;
      color: #16A34A; cursor: pointer; padding: 0.25rem 0.75rem;
      border-radius: 4px; transition: all 0.15s;
    }
    .dp-today-btn:hover { background: #f0fdf4; }

    .error-message { color: #dc3545; font-size: 0.75rem; }
  `]
})
export class DatePickerComponent implements ControlValueAccessor, OnInit {
  @Input() id = '';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() errorMessage = '';
  @Input() clearable = true;
  @Input() showTime = false;
  /** When true (default), past days and past times (when today is selected) are not selectable. */
  @Input() disablePast = true;

  value = '';       // ISO string: "2025-03-15T08:00" or "2025-03-15"
  isOpen = false;
  viewMonth = 0;    // 0-indexed
  viewYear = 2025;
  calendarDays: CalendarDay[] = [];
  selectedTime = '08:00';

  readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  readonly dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  private allTimeOptions: SelectOption[] = [];

  private onChangeFn = (value: string) => {};
  private onTouchedFn = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    const now = new Date();
    this.viewMonth = now.getMonth();
    this.viewYear = now.getFullYear();

    if (this.showTime) {
      this.allTimeOptions = this.generateTimeOptions();
    }
    this.buildCalendar();
  }

  // ─── Calendar rendering ────────────────────────────────────────────

  private buildCalendar(): void {
    const today = new Date();
    const selDate = this.value ? new Date(this.value) : null;

    const firstDay = new Date(this.viewYear, this.viewMonth, 1);
    const startWeekday = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();

    // Previous month fill
    const prevMonthDays = new Date(this.viewYear, this.viewMonth, 0).getDate();
    const days: CalendarDay[] = [];

    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = this.viewMonth - 1;
      const y = m < 0 ? this.viewYear - 1 : this.viewYear;
      const month = m < 0 ? 11 : m;
      days.push(this.makeDay(d, month, y, false, today, selDate));
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(this.makeDay(d, this.viewMonth, this.viewYear, true, today, selDate));
    }

    // Next month fill to 42 cells (6 rows)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = this.viewMonth + 1;
      const y = m > 11 ? this.viewYear + 1 : this.viewYear;
      const month = m > 11 ? 0 : m;
      days.push(this.makeDay(d, month, y, false, today, selDate));
    }

    this.calendarDays = days;
  }

  private makeDay(date: number, month: number, year: number, isCurrent: boolean, today: Date, sel: Date | null): CalendarDay {
    const d = new Date(year, month, date);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return {
      date, month, year,
      isCurrentMonth: isCurrent,
      isToday: d.getTime() === todayStart.getTime(),
      isSelected: sel ? (d.getDate() === sel.getDate() && d.getMonth() === sel.getMonth() && d.getFullYear() === sel.getFullYear()) : false,
      isPast: d < todayStart
    };
  }

  // ─── Navigation ────────────────────────────────────────────────────

  prevMonth(event: Event): void {
    event.stopPropagation();
    this.viewMonth--;
    if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
    this.buildCalendar();
  }

  nextMonth(event: Event): void {
    event.stopPropagation();
    this.viewMonth++;
    if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
    this.buildCalendar();
  }

  goToToday(event: Event): void {
    event.stopPropagation();
    const now = new Date();
    this.viewMonth = now.getMonth();
    this.viewYear = now.getFullYear();

    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    if (this.showTime) {
      const minutes = now.getMinutes();
      const h = minutes < 30 ? now.getHours() : now.getHours() + 1;
      const m = minutes < 30 ? 30 : 0;
      const hour = h >= 24 ? 23 : h;
      const min = h >= 24 ? 30 : m;
      this.selectedTime = `${pad(hour)}:${pad(min)}`;
      this.value = `${dateStr}T${this.selectedTime}`;
    } else {
      this.value = dateStr;
    }

    this.onChangeFn(this.value);
    this.buildCalendar();
  }

  // ─── Selection ─────────────────────────────────────────────────────

  selectDay(day: CalendarDay, event: Event): void {
    event.stopPropagation();
    if (day.isPast && this.disablePast) return;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${day.year}-${pad(day.month + 1)}-${pad(day.date)}`;

    let timeToUse = this.selectedTime;
    if (this.showTime && day.isToday && this.disablePast) {
      const next = this.nextTimeSlotFromNow();
      if (next) timeToUse = next;
      this.selectedTime = timeToUse;
    }

    if (this.showTime) {
      this.value = `${dateStr}T${timeToUse}`;
    } else {
      this.value = dateStr;
    }

    this.onChangeFn(this.value);
    this.viewMonth = day.month;
    this.viewYear = day.year;
    this.buildCalendar();

    if (!this.showTime) {
      this.isOpen = false;
    }
  }

  onTimeChange(time: string): void {
    if (this.value) {
      const datePart = this.value.split('T')[0];
      let timeToUse = time;
      if (this.showTime && this.disablePast && this.isSelectedDateToday()) {
        const next = this.nextTimeSlotFromNow();
        if (next && this.isTimeInPast(time)) {
          timeToUse = next;
        }
      }
      this.selectedTime = timeToUse;
      this.value = `${datePart}T${timeToUse}`;
      this.onChangeFn(this.value);
    } else {
      this.selectedTime = time;
    }
  }

  private isTimeInPast(timeStr: string): boolean {
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotMinutes = h * 60 + m;
    return slotMinutes < currentMinutes;
  }

  toggleCalendar(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Navigate to selected date's month if there's a value
      if (this.value) {
        const d = new Date(this.value);
        if (!isNaN(d.getTime())) {
          this.viewMonth = d.getMonth();
          this.viewYear = d.getFullYear();
          if (this.showTime) {
            const pad = (n: number) => n.toString().padStart(2, '0');
            let t = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
            if (this.disablePast && this.isSelectedDateToday()) {
              const next = this.nextTimeSlotFromNow();
              if (next) {
                t = next;
                const datePart = this.value.split('T')[0];
                this.value = `${datePart}T${t}`;
                this.onChangeFn(this.value);
              }
            }
            this.selectedTime = t;
          }
        }
      }
      this.buildCalendar();
    }
  }

  clearValue(event: Event): void {
    event.stopPropagation();
    this.value = '';
    this.onChangeFn(this.value);
  }

  // ─── Display ───────────────────────────────────────────────────────

  formatDisplay(val: string): string {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      if (this.showTime) {
        opts.hour = '2-digit';
        opts.minute = '2-digit';
      }
      return d.toLocaleString('en-US', opts);
    } catch {
      return val;
    }
  }

  // ─── Time options ──────────────────────────────────────────────────

  private generateTimeOptions(): SelectOption[] {
    const options: SelectOption[] = [];
    for (let h = 0; h < 24; h++) {
      const hour = h.toString().padStart(2, '0');
      options.push({ value: `${hour}:00`, label: `${hour}:00` });
      options.push({ value: `${hour}:30`, label: `${hour}:30` });
    }
    return options;
  }

  private isSelectedDateToday(): boolean {
    if (!this.value) return false;
    const d = new Date(this.value);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  }

  private nextTimeSlotFromNow(): string | null {
    const now = new Date();
    const min = now.getMinutes();
    const h = min < 30 ? now.getHours() : now.getHours() + 1;
    const m = min < 30 ? 30 : 0;
    if (h >= 24) return '23:30';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}`;
  }

  /** When disablePast and selected date is today, only show times from now onwards. */
  get effectiveTimeOptions(): SelectOption[] {
    if (!this.showTime || !this.disablePast || !this.value) return this.allTimeOptions;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const valDate = new Date(this.value);
    if (isNaN(valDate.getTime())) return this.allTimeOptions;
    const valDayStart = new Date(valDate.getFullYear(), valDate.getMonth(), valDate.getDate());
    if (valDayStart.getTime() !== todayStart.getTime()) return this.allTimeOptions;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return this.allTimeOptions.filter(opt => {
      const [h, m] = (opt.value as string).split(':').map(Number);
      const slotMinutes = h * 60 + m;
      return slotMinutes > currentMinutes;
    });
  }

  // ─── Click outside ─────────────────────────────────────────────────

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  // ─── ControlValueAccessor ──────────────────────────────────────────

  writeValue(value: string): void {
    this.value = value || '';
    if (this.value && this.showTime) {
      try {
        const d = new Date(this.value);
        if (!isNaN(d.getTime())) {
          const pad = (n: number) => n.toString().padStart(2, '0');
          let t = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
          if (this.disablePast && this.isSelectedDateToday()) {
            const next = this.nextTimeSlotFromNow();
            if (next) {
              t = next;
              const datePart = this.value.split('T')[0];
              this.value = `${datePart}T${t}`;
              this.onChangeFn(this.value);
            }
          }
          this.selectedTime = t;
        }
      } catch { /* ignore */ }
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
