import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { NumberFieldComponent } from '../../../../../shared/components/number-field/number-field.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CashbackType } from '../../../../../core/models/reward-program.model';

@Component({
  selector: 'app-step-tiers',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, InputComponent,
    NumberFieldComponent, ButtonComponent
  ],
  template: `
    <div class="step-form" [formGroup]="form">
      <div class="info-banner">
        <span class="info-banner-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 16V12M12 9h.01"/>
          </svg>
        </span>
        <p class="info-banner-text">
          Tiers are optional. They let you reward loyal customers with extra earning rates
          based on their accumulated spending. Tier progress resets when the program is closed.
        </p>
      </div>

      <!-- Context banner based on cashback type -->
      <div class="type-context-banner" *ngIf="cashbackType">
        <span class="ctx-icon">
          <svg *ngIf="isPercentage" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="2.5"/><circle cx="15" cy="15" r="2.5"/><path d="M5.5 18.5l13-13"/></svg>
          <svg *ngIf="!isPercentage" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </span>
        <div class="ctx-text" *ngIf="isPercentage">
          <strong>Percentage mode</strong> — each tier adds extra <strong>%</strong> on top of the base cashback rate.
          <span class="ctx-example">e.g. Base 5% + Silver tier 1% = customer earns 6%</span>
        </div>
        <div class="ctx-text" *ngIf="!isPercentage">
          <strong>Bonus Points mode</strong> — each tier adds <strong>extra points</strong> per spend threshold on top of the base earn rate.
          <span class="ctx-example">e.g. Base 1 pt per 1,000 + Silver tier +1 = customer earns 2 pts per 1,000</span>
        </div>
      </div>

      <div class="tiers-list" formArrayName="tiers">
        <div
          *ngFor="let tier of tiersArray.controls; let i = index"
          class="tier-card"
          [formGroupName]="i"
        >
          <div class="tier-header">
            <span class="tier-number">Tier {{ i + 1 }}</span>
            <button type="button" class="btn-remove" (click)="removeTier(i)" title="Remove tier">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="tier-fields">
            <div class="form-group">
              <app-input
                [id]="'tierName' + i"
                label="Tier name"
                placeholder="e.g. Bronze, Silver, Gold"
                formControlName="name"
                [required]="true"
                [errorMessage]="getTierError(i, 'name')"
              ></app-input>
            </div>

            <div class="form-row three-col">
              <div class="form-group">
                <app-number-field
                  [id]="'tierMin' + i"
                  label="Min spend"
                  placeholder="0"
                  formControlName="minAmount"
                  [min]="0"
                  [required]="true"
                  [errorMessage]="getTierError(i, 'minAmount')"
                ></app-number-field>
              </div>
              <div class="form-group">
                <app-number-field
                  [id]="'tierMax' + i"
                  label="Max spend"
                  placeholder="No limit"
                  formControlName="maxAmount"
                  [min]="0"
                  hint="Leave empty for unlimited"
                ></app-number-field>
              </div>
              <div class="form-group">
                <app-number-field
                  [id]="'tierExtra' + i"
                  [label]="extraEarningLabel"
                  [placeholder]="extraEarningPlaceholder"
                  formControlName="extraEarningPercent"
                  [min]="0"
                  [required]="true"
                  [hint]="extraEarningHint"
                  [errorMessage]="getTierError(i, 'extraEarningPercent')"
                ></app-number-field>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="add-tier-row">
        <app-button buttonType="primary" size="medium" (onClick)="addTier()">
          + Add tier
        </app-button>
      </div>

      <div class="empty-state" *ngIf="tiersArray.length === 0">
        <p class="empty-title">No tiers configured</p>
        <p class="empty-desc">All customers will earn at the base rate. Add tiers above to reward higher spenders.</p>
      </div>
    </div>
  `,
  styles: [`
    .step-form { display: flex; flex-direction: column; gap: 1rem; }

    /* Info banner: outlined icon (transparent inside, colored border), lighter blue border */
    .info-banner {
      display: flex; align-items: flex-start; gap: 0.75rem;
      padding: 1rem 1.25rem; border-radius: 8px;
      background: #f0f9ff; border: 1px solid #bae6fd;
    }
    .info-banner-icon {
      flex-shrink: 0; width: 24px; height: 24px;
      display: flex; align-items: center; justify-content: center;
      color: #0ea5e9;
    }
    .info-banner-icon svg { width: 22px; height: 22px; }
    .info-banner-text {
      margin: 0; font-size: 0.875rem; line-height: 1.5;
      color: #0f172a; font-weight: 600;
    }

    .tiers-list { display: flex; flex-direction: column; gap: 1rem; }
    .tier-card {
      border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 1rem 1.25rem; background: #fafbfc;
    }
    .tier-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 0.75rem;
    }
    .tier-number { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    .btn-remove {
      background: none; border: none; cursor: pointer; padding: 0.25rem;
      color: #94a3b8; transition: color 0.15s;
    }
    .btn-remove:hover { color: #ef4444; }
    .btn-remove svg { width: 18px; height: 18px; }
    .tier-fields { display: flex; flex-direction: column; gap: 0.75rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .form-row { display: flex; gap: 0.75rem; }
    .form-row.three-col > .form-group { flex: 1; }
    .add-tier-row { display: flex; }
    .empty-state { text-align: center; padding: 1.5rem 0; }
    .empty-title { font-size: 0.95rem; font-weight: 600; color: #64748b; margin: 0 0 0.25rem 0; }
    .empty-desc { font-size: 0.8rem; color: #94a3b8; margin: 0; }

    /* Context banner */
    .type-context-banner {
      display: flex; gap: 0.75rem; align-items: flex-start;
      padding: 0.875rem 1rem; border-radius: 8px;
      background: #f8fafc; border: 1px solid #e2e8f0;
    }
    .ctx-icon {
      flex-shrink: 0; width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      background: #dcfce7; border-radius: 8px; color: #16A34A;
    }
    .ctx-icon svg { width: 18px; height: 18px; }
    .ctx-text { font-size: 0.85rem; color: #475569; line-height: 1.5; }
    .ctx-example { display: block; font-size: 0.8rem; color: #94a3b8; margin-top: 0.15rem; }
  `]
})
export class StepTiersComponent {
  @Input() form!: FormGroup;

  private fb = new FormBuilder();

  get tiersArray(): FormArray {
    return this.form.get('tiers') as FormArray;
  }

  get cashbackType(): CashbackType | null {
    return this.form.get('cashbackType')?.value || null;
  }

  get isPercentage(): boolean {
    return this.cashbackType === 'PERCENTAGE';
  }

  get extraEarningLabel(): string {
    return this.isPercentage ? 'Extra earning (%)' : 'Extra points';
  }

  get extraEarningPlaceholder(): string {
    return this.isPercentage ? 'e.g. 2' : 'e.g. 1';
  }

  get extraEarningHint(): string {
    return this.isPercentage
      ? 'Added on top of the base % rate'
      : 'Extra points per spend threshold';
  }

  addTier(): void {
    const nextSort = this.tiersArray.length;
    this.tiersArray.push(this.fb.group({
      name: ['', Validators.required],
      minAmount: [0, [Validators.required, Validators.min(0)]],
      maxAmount: [null],
      extraEarningPercent: [0, [Validators.required, Validators.min(0)]],
      sortOrder: [nextSort]
    }));
  }

  removeTier(index: number): void {
    this.tiersArray.removeAt(index);
    this.tiersArray.controls.forEach((ctrl, i) => {
      ctrl.get('sortOrder')?.setValue(i);
    });
  }

  getTierError(tierIndex: number, field: string): string {
    const control = this.tiersArray.at(tierIndex)?.get(field);
    if (control && control.touched && control.invalid) {
      if (control.errors?.['required']) return 'Required';
      if (control.errors?.['min']) return `Min ${control.errors['min'].min}`;
    }
    return '';
  }
}
