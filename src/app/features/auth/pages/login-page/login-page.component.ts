import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { login, clearError } from '../../../../core/store/auth/auth.actions';
import { selectIsLoading, selectAuthError } from '../../../../core/store/auth/auth.selectors';
import { LoginRequest } from '../../../../core/models/user.model';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LinkComponent } from '../../../../shared/components/link/link.component';
import { AuthPromoPanelComponent } from '../../../../shared/components/auth-promo-panel/auth-promo-panel.component';

@Component({
  selector: 'app-login-page',
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
    <div class="login-page">
      <!-- Left Promotional Panel -->
      <app-auth-promo-panel></app-auth-promo-panel>

      <!-- Right Login Form Panel -->
      <div class="form-panel">
        <div class="form-content">
          <div class="form-header">
            <h2 class="brand-name">WestWood</h2>
            <h3 class="welcome-title">Добро пожаловать!</h3>
            <p class="register-prompt">
              Нет аккаунта?
              <app-link routerLink="/auth/register">
                <strong>Создайте аккаунт прямо сейчас</strong>
              </app-link>
            </p>
          </div>

        <!-- Session expired message -->
        <app-alert
          *ngIf="sessionExpired"
          type="warning"
          [title]="'Сессия истекла'"
          [dismissible]="true"
          (dismissed)="sessionExpired = false"
          class="warning-alert">
          Ваша сессия истекла. Пожалуйста, войдите снова.
        </app-alert>

        <app-alert
          *ngIf="error$ | async as error"
          type="error"
          [title]="'Ошибка входа'"
          [dismissible]="true"
          (dismissed)="onClearError()"
          class="error-alert">
          {{ error }}
        </app-alert>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <app-input
            id="email"
            label="Email"
            type="email"
            placeholder="Введите email"
            formControlName="email"
            [errorMessage]="getErrorMessage('email')"
            [required]="true">
          </app-input>

          <app-input
            id="password"
            label="Пароль"
            type="password"
            placeholder="Введите пароль"
            formControlName="password"
            [errorMessage]="getErrorMessage('password')"
            [required]="true"
            [showPasswordToggle]="true">
          </app-input>

          <app-button
            buttonType="primary"
            type="submit"
            [disabled]="loginForm.invalid"
            [loading]="(isLoading$ | async) ?? false"
            class="submit-button">
            Войти
          </app-button>

          <div class="forgot-password-link">
            <app-link routerLink="/auth/forgot-password">
              Забыл пароль? <strong>Нажмите здесь</strong>
            </app-link>
          </div>
        </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      min-height: 100vh;
      height: 100vh;
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
      margin-bottom: 1rem;
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

    .register-prompt {
      font-size: 0.9375rem;
      color: #64748b;
      line-height: 1.6;
      margin: -0.5rem 0 0 0;
    }

    :host ::ng-deep .register-prompt app-link a {
      color:#1a202c;
      text-decoration: underline;
      font-weight: 600;
    }

    :host ::ng-deep .register-prompt app-link a strong {
      color: #0F0F10 !important;
    }

    .warning-alert, .error-alert {
      margin-bottom: 1.5rem;
      animation: shake 0.5s ease-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }

    .login-form {
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


    .forgot-password-link {
      text-align: center;
      margin-top: 0.25rem;
    }

    :host ::ng-deep .forgot-password-link app-link a {
      color: #6b7280 !important;
      font-weight: 500;
      font-size: 0.875rem;
      transition: color 0.2s ease;
      text-decoration: none;
    }

    :host ::ng-deep .forgot-password-link app-link a strong {
      color: #0F0F10 !important;
      text-decoration: underline;
      font-weight: 600;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .login-page {
        flex-direction: column;
      }

      .form-panel {
        padding: 2rem;
      }
    }

    @media (max-width: 640px) {
      .form-panel {
        padding: 1.5rem;
      }

      .form-content {
        max-width: 100%;
      }
    }
  `]
})
export class LoginPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  loginForm: FormGroup;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
  sessionExpired = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.isLoading$ = this.store.select(selectIsLoading);
    this.error$ = this.store.select(selectAuthError);
  }

  ngOnInit(): void {
    // Check for query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['sessionExpired'] || params['expired']) {
        this.sessionExpired = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const credentials: LoginRequest = this.loginForm.value;
      this.store.dispatch(login({ credentials }));
    }
  }

  onClearError(): void {
    this.store.dispatch(clearError());
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Это поле обязательно для заполнения';
      }
      if (control.errors['email']) {
        return 'Неверный формат email';
      }
      if (control.errors['minlength']) {
        return `Минимальная длина: ${control.errors['minlength'].requiredLength} символов`;
      }
    }
    return '';
  }
}
