import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LinkComponent } from '../../../../shared/components/link/link.component';
import { TypographyComponent } from '../../../../shared/components/typography/typography.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CardComponent, InputComponent, ButtonComponent, LinkComponent, TypographyComponent],
  template: `
    <div class="register-page">
      <app-card [shadow]="true" class="register-card">
        <div class="register-header">
          <app-typography variant="h2">Регистрация</app-typography>
          <app-typography variant="body2" [muted]="true">
            Создайте новый аккаунт для доступа к системе
          </app-typography>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
          <app-input
            id="name"
            label="Имя"
            type="text"
            placeholder="Введите имя"
            formControlName="name"
            [errorMessage]="getErrorMessage('name')"
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
            [loading]="false"
            class="submit-button">
            Зарегистрироваться
          </app-button>

          <div class="login-link">
            <app-typography variant="body2" [muted]="true">
              Уже есть аккаунт?
              <app-link routerLink="/auth/login">Войти</app-link>
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .register-card {
      width: 100%;
      max-width: 450px;
    }

    .register-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .register-header app-typography:first-child {
      margin-bottom: 0.5rem;
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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
  `]
})
export class RegisterPageComponent {
  registerForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      console.log('Registration data:', this.registerForm.value);
    }
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

