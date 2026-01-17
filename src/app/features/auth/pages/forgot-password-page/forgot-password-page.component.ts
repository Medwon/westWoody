import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { forgotPassword, clearError, forgotPasswordSuccess } from '../../../../core/store/auth/auth.actions';
import { selectIsLoading, selectAuthError } from '../../../../core/store/auth/auth.selectors';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LinkComponent } from '../../../../shared/components/link/link.component';
import { AuthPromoPanelComponent } from '../../../../shared/components/auth-promo-panel/auth-promo-panel.component';
import { authMobileStyles } from '../../../../shared/styles/auth-mobile.styles';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AlertComponent,
    InputComponent,
    ButtonComponent,
    LinkComponent,
    AuthPromoPanelComponent
  ],
  template: `
    <div class="forgot-password-page auth-page">
      <!-- Left Promotional Panel -->
      <app-auth-promo-panel class="promo-panel-desktop"></app-auth-promo-panel>

      <!-- Right Forgot Password Form Panel -->
      <div class="form-panel">
        <div class="form-content">
          <div class="form-header">
            <h2 class="brand-name">WestWood</h2>
            <h3 class="welcome-title">Смена пароля</h3>
            <p class="back-to-login-prompt">
              <app-link routerLink="/auth/login">
                <strong>← Назад к логину</strong>
              </app-link>
            </p>
          </div>

          <app-alert
            *ngIf="successMessage"
            type="success"
            [title]="'Успешно'"
            [dismissible]="true"
            (dismissed)="successMessage = ''"
            class="success-alert">
            {{ successMessage }}
          </app-alert>

          <app-alert
            *ngIf="error$ | async as error"
            type="error"
            [title]="'Ошибка'"
            [dismissible]="true"
            (dismissed)="onClearError()"
            class="error-alert">
            {{ error }}
          </app-alert>

          <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="forgot-password-form auth-form">
            <app-input
              id="email"
              label="Email"
              type="email"
              placeholder="Введите email"
              formControlName="email"
              [errorMessage]="getErrorMessage('email')"
              [required]="true">
            </app-input>

            <app-button
              buttonType="primary"
              type="submit"
              [disabled]="forgotPasswordForm.invalid"
              [loading]="(isLoading$ | async) ?? false"
              class="submit-button">
              Подтвердить
            </app-button>
          </form>

        <div class="form-footer">
          <span>© 2026 WestWood. Все права защищены.</span>
        </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-page {
      display: flex;
      min-height: 100vh;
      background: #F5F6F8;
    }

    /* Right Form Panel */
    .form-panel {
      flex: 0 0 45%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: #ffffff;
    }

    .form-content {
      width: 100%;
      max-width: 360px;
      animation: slideUp 0.5s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .form-header {
      margin-bottom: 2rem;
    }

    .brand-name {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 0.75rem 0;
      letter-spacing: -0.02em;
    }

    .welcome-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 1rem 0;
    }

    .back-to-login-prompt {
      font-size: 0.9375rem;
      color: #64748b;
      line-height: 1.6;
      margin: -0.5rem 0 0 0;
    }

    :host ::ng-deep .back-to-login-prompt app-link a {
      color: #1a202c;
      text-decoration: underline;
      font-weight: 600;
    }

    :host ::ng-deep .back-to-login-prompt app-link a strong {
      color: #0F0F10 !important;
    }

    .success-alert,
    .error-alert {
      margin-bottom: 1.5rem;
      animation: shake 0.5s ease-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }

    .forgot-password-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .submit-button {
      width: 100%;
      margin-top: 0.25rem;
    }

    :host ::ng-deep .submit-button button {
      width: 100%;
      padding: 0.875rem 1.5rem !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      border-radius: 4px !important;
      background-color: #0F0F10 !important;
      color: white !important;
      transition: all 0.2s ease !important;
    }

    ${authMobileStyles}
  `]
})
export class ForgotPasswordPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private actions$ = inject(Actions);
  private destroy$ = new Subject<void>();

  forgotPasswordForm: FormGroup;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
  successMessage = '';

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.isLoading$ = this.store.select(selectIsLoading);
    this.error$ = this.store.select(selectAuthError);
  }

  ngOnInit(): void {
    // Clear any existing errors when entering the page
    this.store.dispatch(clearError());
    this.successMessage = '';

    // Subscribe to success action
    this.actions$.pipe(
      ofType(forgotPasswordSuccess),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const email = this.forgotPasswordForm.value.email;
      this.successMessage = `На адрес ${email} было отправлено сообщение для сброса пароля. Пожалуйста, проверьте вашу почту.`;
    });

    // Subscribe to error changes
    this.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      if (error) {
        this.successMessage = '';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.successMessage = '';
      const formValue = this.forgotPasswordForm.value;
      
      console.log('[ForgotPasswordPage] Requesting password reset for email:', formValue.email);

      // Dispatch action - effect will handle API call, state update, and show toast
      this.store.dispatch(forgotPassword({ data: { email: formValue.email } }));
    } else {
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        this.forgotPasswordForm.get(key)?.markAsTouched();
      });
    }
  }

  onClearError(): void {
    this.store.dispatch(clearError());
  }

  getErrorMessage(controlName: string): string {
    const control = this.forgotPasswordForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Это поле обязательно для заполнения';
      }
      if (control.errors['email']) {
        return 'Неверный формат email';
      }
    }
    return '';
  }
}
