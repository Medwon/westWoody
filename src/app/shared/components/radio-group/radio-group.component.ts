import { Component, Input, forwardRef, QueryList, ContentChildren, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { RadioComponent } from '../radio/radio.component';

@Component({
  selector: 'app-radio-group',
  standalone: true,
  imports: [CommonModule, FormsModule, RadioComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true
    }
  ],
  template: `
    <div class="radio-group" [class.vertical]="vertical">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .radio-group {
      display: flex;
      flex-direction: row;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .radio-group.vertical {
      flex-direction: column;
    }
  `]
})
export class RadioGroupComponent implements ControlValueAccessor, AfterContentInit {
  @Input() name = `radio-group-${Math.random().toString(36).substr(2, 9)}`;
  @Input() vertical = false;

  @ContentChildren(RadioComponent) radios!: QueryList<RadioComponent>;

  private value: any;
  private onChangeFn = (value: any) => {};
  private onTouchedFn = () => {};

  ngAfterContentInit(): void {
    this.radios.forEach(radio => {
      radio.name = this.name;
      radio.registerOnChange((value) => {
        this.value = value;
        this.radios.forEach(r => r.writeValue(r.value === value));
        this.onChangeFn(value);
      });
    });
  }

  writeValue(value: any): void {
    this.value = value;
    if (this.radios) {
      this.radios.forEach(radio => {
        radio.writeValue(radio.value === value);
      });
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.radios) {
      this.radios.forEach(radio => {
        radio.setDisabledState(isDisabled);
      });
    }
  }
}

