import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../../../../core/store/app.state';
import { register, clearError } from '../../../../core/store/auth/auth.actions';
import { selectIsLoading, selectAuthError } from '../../../../core/store/auth/auth.selectors';
import { RegisterRequest } from '../../../../core/models/user.model';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LinkComponent } from '../../../../shared/components/link/link.component';
import { TypographyComponent } from '../../../../shared/components/typography/typography.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule, 
    CardComponent, 
    AlertComponent,
    InputComponent, 
    ButtonComponent, 
    LinkComponent, 
    TypographyComponent
  ],
  template: `
    <div class="register-page">
      <app-card [shadow]="true" class="register-card">
        <div class="register-header">
          <div class="logo">
            <svg viewBox="0 0 24 24" fill="none" class="logo-icon">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.8"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="logo-text">WestWood</span>
          </div>
          <app-typography variant="h2">Регистрация</app-typography>
          <app-typography variant="body2" [muted]="true">
            Создайте новый аккаунт для доступа к системе
          </app-typography>
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
            id="username"
            label="Имя пользователя"
            type="text"
            placeholder="Введите имя пользователя"
            formControlName="username"
            [errorMessage]="getErrorMessage('username')"
            [required]="true">
          </app-input>

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
            [required]="true">
          </app-input>

          <app-input
            id="confirmPassword"
            label="Подтвердите пароль"
            type="password"
            placeholder="Подтвердите пароль"
            formControlName="confirmPassword"
            [errorMessage]="getErrorMessage('confirmPassword')"
            [required]="true">
          </app-input>

          <app-button
            buttonType="primary"
            type="submit"
            [disabled]="registerForm.invalid"
            [loading]="(isLoading$ | async) ?? false"
            class="submit-button">
            Зарегистрироваться
          </app-button>

          <div class="login-link">
            <app-typography variant="body2" [muted]="true">
              Уже есть аккаунт?
              <app-link routerLink="/auth/login"> Войти</app-link>
            </app-typography>
          </div>
        </form>
      </app-card>
    </div>
  `,
  styles: [`
    .register-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #15803d 0%, #166534 100%);
      padding: 2rem;
    }

    .register-card {
      width: 100%;
      max-width: 500px;
    }

    .register-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      color: #15803d;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a202c;
      letter-spacing: -0.02em;
    }

    .register-header app-typography:first-of-type {
      margin-bottom: 0.5rem;
    }

    .error-alert {
      margin-bottom: 1.5rem;
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 500px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    .submit-button {
      width: 100%;
      margin-top: 0.5rem;
    }

    .login-link {
      text-align: center;
      margin-top: 1rem;
    }

    :host ::ng-deep .submit-button button {
      width: 100%;
    }

    :host ::ng-deep .login-link a {
      color: #15803d;
      font-weight: 600;
    }
  `]
})
export class RegisterPageComponent implements OnDestroy {
  registerForm: FormGroup;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.isLoading$ = this.store.select(selectIsLoading);
    this.error$ = this.store.select(selectAuthError);
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
        username: formValue.username,
        email: formValue.email,
        password: formValue.password,
        firstName: formValue.firstName,
        lastName: formValue.lastName
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
