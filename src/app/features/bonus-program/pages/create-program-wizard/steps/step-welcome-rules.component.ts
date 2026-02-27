import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { NumberFieldComponent } from '../../../../../shared/components/number-field/number-field.component';
import { AlertComponent } from '../../../../../shared/components/alert/alert.component';
import { ClientsService, ClientBirthdayStatsResponse } from '../../../../../core/services/clients.service';

@Component({
  selector: 'app-step-welcome-rules',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectComponent, NumberFieldComponent, AlertComponent],
  template: `
    <div class="step-form" [formGroup]="form">
      <div class="form-group">
        <app-number-field
          id="bonusLifespanDays"
          label="Bonus lifespan (days)"
          placeholder="e.g. 90"
          formControlName="bonusLifespanDays"
          [min]="0"
          hint="Leave empty for bonuses that never expire."
        ></app-number-field>
      </div>

      <div class="form-group">
        <app-select
          id="grantTrigger"
          label="When to grant"
          placeholder="Select when to grant"
          formControlName="grantTrigger"
          [options]="grantTriggerOptions"
          [required]="true"
          [errorMessage]="getError('grantTrigger')"
        ></app-select>
        <p class="field-hint" *ngIf="form.get('grantTrigger')?.value === 'ON_JOIN'">
          Grant when the client is created in the app while this program is active.
        </p>
        <p class="field-hint" *ngIf="form.get('grantTrigger')?.value === 'ON_FIRST_PAY'">
          Grant when the client completes their first payment.
        </p>
        <p class="field-hint" *ngIf="form.get('grantTrigger')?.value === 'ON_BIRTHDAY'">
          Grant on each client's birthday (once per year). Only clients with a birthdate set will receive the bonus.
        </p>
      </div>

      <div class="form-group" *ngIf="form.get('grantTrigger')?.value === 'ON_BIRTHDAY'">
        <app-alert type="info" [dismissible]="false" class="birthday-stats">
          <ng-container *ngIf="birthdayStats !== null; else loadingOrError">
            <strong>{{ birthdayStats.withBirthdate }}</strong> client(s) have their birthdate filled.
            <strong>{{ birthdayStats.grantedThisYear }}</strong> will have their birthday (and be granted) after today this year.
          </ng-container>
          <ng-template #loadingOrError>
            <span *ngIf="birthdayStatsLoading">Loading stats…</span>
            <span *ngIf="birthdayStatsError">Could not load birthday stats.</span>
          </ng-template>
        </app-alert>
      </div>

      <div class="form-group" *ngIf="form.get('grantTrigger')?.value === 'ON_FIRST_PAY'">
        <app-select
          id="firstPayMode"
          label="On first payment"
          placeholder="Select mode"
          formControlName="firstPayMode"
          [options]="firstPayModeOptions"
          [required]="true"
          [errorMessage]="getError('firstPayMode')"
        ></app-select>
        <p class="field-hint" *ngIf="form.get('firstPayMode')?.value === 'WELCOME_ONLY'">
          Grant only the welcome bonus; do not grant cashback for that payment.
        </p>
        <p class="field-hint" *ngIf="form.get('firstPayMode')?.value === 'WELCOME_AND_CASHBACK'">
          Grant welcome bonus and also apply cashback as usual for that payment.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .step-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .field-hint { font-size: 0.8rem; color: #64748b; margin: 0.25rem 0 0 0; line-height: 1.4; }
    .birthday-stats { margin-top: 0.25rem; }
  `]
})
export class StepWelcomeRulesComponent implements OnInit {
  @Input() form!: FormGroup;

  private clientsService = inject(ClientsService);

  grantTriggerOptions: SelectOption[] = [
    { value: 'ON_JOIN', label: 'On client joining the program' },
    { value: 'ON_FIRST_PAY', label: 'On first payment' },
    { value: 'ON_BIRTHDAY', label: "On client's birthday" }
  ];

  birthdayStats: ClientBirthdayStatsResponse | null = null;
  birthdayStatsLoading = false;
  birthdayStatsError = false;

  ngOnInit(): void {
    this.form.get('grantTrigger')?.valueChanges.subscribe(trigger => {
      if (trigger === 'ON_BIRTHDAY') {
        this.loadBirthdayStats();
      } else {
        this.birthdayStats = null;
        this.birthdayStatsError = false;
      }
    });
    if (this.form.get('grantTrigger')?.value === 'ON_BIRTHDAY') {
      this.loadBirthdayStats();
    }
  }

  private loadBirthdayStats(): void {
    this.birthdayStatsLoading = true;
    this.birthdayStatsError = false;
    this.birthdayStats = null;
    this.clientsService.getBirthdayStats().subscribe({
      next: (res) => {
        this.birthdayStats = res;
        this.birthdayStatsLoading = false;
      },
      error: () => {
        this.birthdayStatsError = true;
        this.birthdayStatsLoading = false;
      }
    });
  }

  firstPayModeOptions: SelectOption[] = [
    { value: 'WELCOME_ONLY', label: 'Grant only welcome bonus' },
    { value: 'WELCOME_AND_CASHBACK', label: 'Grant alongside cashback program' }
  ];

  getError(field: string): string {
    const control = this.form.get(field);
    if (control && control.touched && control.invalid && control.errors?.['required']) {
      return 'This field is required';
    }
    return '';
  }
}
