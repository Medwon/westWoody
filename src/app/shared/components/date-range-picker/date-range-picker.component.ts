import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface RangeCalendarDay {
  date: number;
  month: number; // 0-indexed
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  inRange: boolean;
  isStart: boolean;
  isEnd: boolean;
  isPast: boolean;
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="drp-wrapper">
      <label *ngIf="label" class="drp-label">
        {{ label }}
      </label>

      <div
        class="drp-trigger"
        [class.open]="isOpen"
        (click)="onTriggerClick($event)"
      >
        <div class="drp-input-wrap">
          <input
            type="text"
            class="drp-input"
            [value]="displayValue"
            [placeholder]="placeholder"
            (click)="$event.stopPropagation()"
            (input)="onInputChange($event)"
            (blur)="onInputBlur()"
            (keydown.enter)="onInputEnter($event)"
          />
        </div>
        <button
          *ngIf="(start || end)"
          type="button"
          class="drp-clear"
          (click)="clear($event)"
        >
          ×
        </button>
        <span class="drp-icon-wrap" aria-hidden="true">
          <svg class="drp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        </span>
      </div>

      <div class="dp-dropdown" *ngIf="isOpen">
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

        <div class="dp-day-headers">
          <span *ngFor="let d of dayHeaders" class="dp-day-header">{{ d }}</span>
        </div>

        <div class="dp-grid">
          <button
            *ngFor="let day of calendarDays"
            type="button"
            class="dp-day"
            [class.other-month]="!day.isCurrentMonth"
            [class.today]="day.isToday"
            [class.in-range]="day.inRange"
            [class.start]="day.isStart"
            [class.end]="day.isEnd"
            [class.past]="day.isPast && disablePast"
            [disabled]="day.isPast && disablePast"
            (click)="selectDay(day, $event)"
          >
            {{ day.date }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .drp-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      width: 100%;
      position: relative;
    }

    .drp-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .drp-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 0.875rem;
      border-radius: 10px;
      border: 1.5px solid var(--color-input-border, #e2e8f0);
      background: #f8fafc;
      cursor: pointer;
      min-width: 260px;
      transition: all 0.2s;
    }

    .drp-trigger.open {
      border-color: var(--color-input-border-focus, #22c55e);
      background: #ffffff;
      box-shadow: 0 0 0 3px var(--color-input-shadow-focus, rgba(34, 197, 94, 0.15));
    }

    .drp-input-wrap {
      flex: 1;
      min-width: 0;
    }

    .drp-input {
      width: 100%;
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.875rem;
      color: #0f172a;
    }

    .drp-input::placeholder {
      color: #94a3b8;
    }

    .drp-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .drp-icon {
      width: 18px;
      height: 18px;
    }

    .drp-clear {
      border: none;
      background: transparent;
      width: 18px;
      height: 18px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #94a3b8;
      cursor: pointer;
      padding: 0;
    }

    .drp-clear:hover {
      background: #e5e7eb;
      color: #64748b;
    }

    .dp-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 50;
      margin-top: 4px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04);
      padding: 1rem;
      min-width: 280px;
      width: max-content;
    }

    .dp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .dp-month-year {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .dp-nav {
      display: flex;
      gap: 0.25rem;
    }

    .dp-nav-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #475569;
      transition: all 0.15s;
    }

    .dp-nav-btn:hover {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #16A34A;
    }

    .dp-nav-btn svg {
      width: 16px;
      height: 16px;
    }

    .dp-day-headers {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0;
      margin-bottom: 0.25rem;
    }

    .dp-day-header {
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      padding: 0.25rem 0;
    }

    .dp-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }

    .dp-day {
      width: 36px;
      height: 36px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      border: none;
      background: transparent;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.1s;
      font-weight: 500;
      position: relative;
      z-index: 1;
    }

    .dp-day.other-month {
      color: #cbd5e1;
    }

    .dp-day.today:not(.start):not(.end):not(.in-range) {
      border: 1.5px solid #16A34A;
      color: #16A34A;
      font-weight: 700;
    }

    .dp-day.in-range {
      background: #dcfce7;
      color: #166534;
      border-radius: 0;
      width: 100%;
    }

    .dp-day.start,
    .dp-day.end {
      background: #16A34A;
      color: #ffffff;
      border-radius: 999px;
      width: 36px;
    }

    .dp-day.start.in-range,
    .dp-day.end.in-range {
      background: #16A34A;
      color: #ffffff;
    }

    .dp-day:hover:not(:disabled):not(.start):not(.end) {
      background: #f0fdf4;
      color: #16A34A;
    }

    .dp-day.past {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `]
})
export class DateRangePickerComponent implements OnInit {
  @Input() label = '';
  @Input() placeholder = 'Период';
  @Input() start = '';
  @Input() end = '';
  @Input() disablePast = false;

  @Output() startChange = new EventEmitter<string>();
  @Output() endChange = new EventEmitter<string>();

  isOpen = false;
  viewMonth = 0;
  viewYear = 2025;
  calendarDays: RangeCalendarDay[] = [];

  readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  readonly dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  constructor(private host: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const base = this.start ? new Date(this.start) : new Date();
    this.viewMonth = base.getMonth();
    this.viewYear = base.getFullYear();
    this.buildCalendar();
  }

  get displayValue(): string {
    if (this.start && this.end) {
      return `${this.formatDisplay(this.start)} – ${this.formatDisplay(this.end)}`;
    }
    if (this.start) {
      return this.formatDisplay(this.start);
    }
    return '';
  }

  private buildCalendar(): void {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDate = this.start ? new Date(this.start) : null;
    const endDate = this.end ? new Date(this.end) : null;

    const firstDay = new Date(this.viewYear, this.viewMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();

    const prevMonthDays = new Date(this.viewYear, this.viewMonth, 0).getDate();
    const days: RangeCalendarDay[] = [];

    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = this.viewMonth - 1;
      const y = m < 0 ? this.viewYear - 1 : this.viewYear;
      const month = m < 0 ? 11 : m;
      days.push(this.makeDay(d, month, y, false, todayStart, startDate, endDate));
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push(this.makeDay(d, this.viewMonth, this.viewYear, true, todayStart, startDate, endDate));
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = this.viewMonth + 1;
      const y = m > 11 ? this.viewYear + 1 : this.viewYear;
      const month = m > 11 ? 0 : m;
      days.push(this.makeDay(d, month, y, false, todayStart, startDate, endDate));
    }

    this.calendarDays = days;
  }

  private makeDay(
    date: number,
    month: number,
    year: number,
    isCurrent: boolean,
    todayStart: Date,
    startDate: Date | null,
    endDate: Date | null
  ): RangeCalendarDay {
    const d = new Date(year, month, date);
    const time = d.getTime();
    const inRange = startDate && endDate
      ? time >= this.startOfDay(startDate).getTime() && time <= this.startOfDay(endDate).getTime()
      : false;
    const isStart = !!startDate && this.isSameDay(d, startDate);
    const isEnd = !!endDate && this.isSameDay(d, endDate);

    return {
      date,
      month,
      year,
      isCurrentMonth: isCurrent,
      isToday: this.isSameDay(d, todayStart),
      inRange,
      isStart,
      isEnd,
      isPast: d < todayStart
    };
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  prevMonth(event: Event): void {
    event.stopPropagation();
    this.viewMonth--;
    if (this.viewMonth < 0) {
      this.viewMonth = 11;
      this.viewYear--;
    }
    this.buildCalendar();
  }

  nextMonth(event: Event): void {
    event.stopPropagation();
    this.viewMonth++;
    if (this.viewMonth > 11) {
      this.viewMonth = 0;
      this.viewYear++;
    }
    this.buildCalendar();
  }

  selectDay(day: RangeCalendarDay, event: Event): void {
    event.stopPropagation();
    const dateStr = this.toIso(day.year, day.month, day.date);

    if (this.disablePast) {
      const today = this.startOfDay(new Date());
      const clicked = new Date(day.year, day.month, day.date);
      if (clicked < today) {
        return;
      }
    }

    if (!this.start || (this.start && this.end)) {
      this.start = dateStr;
      this.end = '';
    } else if (this.start && !this.end) {
      const startDate = new Date(this.start);
      const clickedDate = new Date(dateStr);
      if (clickedDate < startDate) {
        this.end = this.start;
        this.start = dateStr;
      } else {
        this.end = dateStr;
      }
    }

    this.startChange.emit(this.start);
    this.endChange.emit(this.end);
    this.buildCalendar();

    if (this.start && this.end) {
      this.isOpen = false;
    }
  }

  onTriggerClick(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.buildCalendar();
    }
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.start = '';
    this.end = '';
    this.startChange.emit('');
    this.endChange.emit('');
    this.buildCalendar();
  }

  private toIso(year: number, monthZero: number, day: number): string {
    const m = (monthZero + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  private formatDisplay(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.parseInputValue(value);
  }

  onInputBlur(): void {
    // normalize current value back to formatted display
  }

  onInputEnter(event: Event): void {
    event.preventDefault();
    this.parseInputValue((event.target as HTMLInputElement).value);
    this.isOpen = false;
  }

  private parseInputValue(raw: string): void {
    const value = raw.trim();
    if (!value) {
      this.start = '';
      this.end = '';
      this.startChange.emit('');
      this.endChange.emit('');
      this.buildCalendar();
      return;
    }

    const parts = value.split(/[–-]/).map(p => p.trim()).filter(Boolean);
    const startStr = parts[0] ?? '';
    const endStr = parts[1] ?? '';

    const parsedStart = this.parseDate(startStr);
    const parsedEnd = endStr ? this.parseDate(endStr) : null;

    if (!parsedStart) {
      return;
    }

    if (parsedEnd && parsedEnd < parsedStart) {
      const tmp = parsedStart;
      this.start = this.toIso(tmp.getFullYear(), tmp.getMonth(), tmp.getDate());
      this.end = this.toIso(parsedEnd.getFullYear(), parsedEnd.getMonth(), parsedEnd.getDate());
    } else {
      this.start = this.toIso(parsedStart.getFullYear(), parsedStart.getMonth(), parsedStart.getDate());
      this.end = parsedEnd
        ? this.toIso(parsedEnd.getFullYear(), parsedEnd.getMonth(), parsedEnd.getDate())
        : '';
    }

    this.startChange.emit(this.start);
    this.endChange.emit(this.end);
    this.buildCalendar();
  }

  private parseDate(input: string): Date | null {
    const s = input.trim();
    if (!s) return null;
    // support DD.MM.YYYY
    const dotMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dotMatch) {
      const d = parseInt(dotMatch[1], 10);
      const m = parseInt(dotMatch[2], 10) - 1;
      const y = parseInt(dotMatch[3], 10);
      const date = new Date(y, m, d);
      if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
        return date;
      }
      return null;
    }
    // support YYYY-MM-DD
    const dashMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dashMatch) {
      const y = parseInt(dashMatch[1], 10);
      const m = parseInt(dashMatch[2], 10) - 1;
      const d = parseInt(dashMatch[3], 10);
      const date = new Date(y, m, d);
      if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
        return date;
      }
    }
    return null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }
}

