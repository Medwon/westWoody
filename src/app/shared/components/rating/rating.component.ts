import { Component, Input, Output, EventEmitter, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RatingComponent),
      multi: true
    }
  ],
  template: `
    <div class="rating" [class.readonly]="readonly">
      <span
        *ngFor="let star of stars; let i = index"
        class="rating-star"
        [class.active]="i < value"
        [class.hover]="i < hoverValue"
        (click)="onStarClick(i + 1)"
        (mouseenter)="onStarHover(i + 1)"
        (mouseleave)="onStarLeave()">
        ★
      </span>
      <span class="rating-value" *ngIf="showValue">{{ value }} / {{ max }}</span>
    </div>
  `,
  styles: [`
    .rating {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .rating-star {
      font-size: 1.5rem;
      color: #cbd5e1;
      cursor: pointer;
      transition: color 0.2s ease;
      user-select: none;
    }

    .rating:not(.readonly) .rating-star:hover {
      color: #fbbf24;
    }

    .rating-star.active {
      color: #fbbf24;
    }

    .rating-star.hover {
      color: #fbbf24;
    }

    .rating.readonly .rating-star {
      cursor: default;
    }

    .rating-value {
      margin-left: 0.5rem;
      font-size: 0.875rem;
      color: #64748b;
    }
  `]
})
export class RatingComponent implements ControlValueAccessor, OnInit {
  @Input() max = 5;
  @Input() readonly = false;
  @Input() showValue = false;

  @Output() ratingChange = new EventEmitter<number>();

  value = 0;
  hoverValue = 0;
  stars: number[] = [];

  private onChangeFn = (value: number) => {};
  private onTouchedFn = () => {};

  ngOnInit(): void {
    this.stars = Array(this.max).fill(0).map((_, i) => i);
  }

  onStarClick(rating: number): void {
    if (this.readonly) return;
    this.value = rating;
    this.onChangeFn(this.value);
    this.onTouchedFn();
    this.ratingChange.emit(this.value);
  }

  onStarHover(rating: number): void {
    if (this.readonly) return;
    this.hoverValue = rating;
  }

  onStarLeave(): void {
    this.hoverValue = 0;
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
    this.readonly = isDisabled;
  }
}

