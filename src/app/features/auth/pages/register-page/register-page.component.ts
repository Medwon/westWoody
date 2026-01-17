import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { register, clearError } from '../../../../core/store/auth/auth.actions';
import { selectIsLoading, selectAuthError } from '../../../../core/store/auth/auth.selectors';
import { RegisterRequest } from '../../../../core/models/user.model';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LinkComponent } from '../../../../shared/components/link/link.component';
import { AuthPromoPanelComponent } from '../../../../shared/components/auth-promo-panel/auth-promo-panel.component';

@Component({
  selector: 'app-register-page',
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
    <div class="register-page">
      <!-- Left Promotional Panel -->
      <app-auth-promo-panel></app-auth-promo-panel>

      <!-- Right Register Form Panel -->
      <div class="form-panel">
        <div class="form-content">
          <div class="form-header">
            <h2 class="brand-name">WestWood</h2>
            <h3 class="welcome-title">Создайте аккаунт</h3>
            <p class="login-prompt">
              Уже есть аккаунт?
              <app-link routerLink="/auth/login">
                <strong>Войти</strong>
              </app-link>
            </p>
          </div>

        <app-alert
          *ngIf="error$ | async as error"
          type="error"
          [title]="'Ошибка регистрации'"
          [dismissible]="true"
          (dismissed)="onClearError()"
          class="error-alert">
          {{ error }}
        </app-alert>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
          <div class="form-row">
            <app-input
              id="firstName"
              label="Имя"
              type="text"
              placeholder="Введите имя"
              formControlName="firstName"
              [errorMessage]="getErrorMessage('firstName')"
              [required]="true">
            </app-input>

            <app-input
              id="lastName"
              label="Фамилия"
              type="text"
              placeholder="Введите фамилию"
              formControlName="lastName"
              [errorMessage]="getErrorMessage('lastName')"
              [required]="true">
            </app-input>
          </div>

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

          <app-input
            id="confirmPassword"
            label="Подтвердите пароль"
            type="password"
            placeholder="Подтвердите пароль"
            formControlName="confirmPassword"
            [errorMessage]="getErrorMessage('confirmPassword')"
            [required]="true"
            [showPasswordToggle]="true">
          </app-input>

          <app-button
            buttonType="primary"
            type="submit"
            [disabled]="registerForm.invalid"
            [loading]="(isLoading$ | async) ?? false"
            class="submit-button">
            Зарегистрироваться
          </app-button>
        </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-page {
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
      overflow-y: auto;
    }

    .form-content {
      width: 100%;
      max-width: 416px;
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
      margin-bottom: 2.5rem;
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

    .login-prompt {
      font-size: 0.9375rem;
      color: #64748b;
      line-height: 1.6;
      margin: 0;
    }

    :host ::ng-deep .login-prompt app-link a {
      color: #1a202c;
      text-decoration: underline;
      font-weight: 600;
    }

    :host ::ng-deep .login-prompt app-link a strong {
      color: #0F0F10 !important;
    }

    .error-alert {
      margin-bottom: 1.5rem;
      animation: shake 0.5s ease-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    .submit-button {
      width: 100%;
      margin-top: 0.5rem;
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


    /* Responsive */
    @media (max-width: 1024px) {
      .register-page {
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
export class RegisterPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private destroy$ = new Subject<void>();

  registerForm: FormGroup;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.isLoading$ = this.store.select(selectIsLoading);
    this.error$ = this.store.select(selectAuthError);
  }

  ngOnInit(): void {
    // Clear any existing errors when entering the page
    this.store.dispatch(clearError());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const formValue = this.registerForm.value;
      const registerData: RegisterRequest = {
        email: formValue.email,
        password: formValue.password,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        roles: ['SUDO']
      };
      this.store.dispatch(register({ data: registerData }));
    }
  }

  onClearError(): void {
    this.store.dispatch(clearError());
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
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
      if (control.errors['passwordMismatch']) {
        return 'Пароли не совпадают';
      }
    }
    return '';
  }
}
