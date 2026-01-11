import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: 'invited' | 'active' | 'closed';
  createdAt: string;
}

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    BadgeComponent,
    ModalComponent,
    ButtonComponent
  ],
  template: `
    <div class="page-wrapper">
      <div class="users-container">
        <!-- Header with Add Button -->
        <div class="page-header-section">
          <app-button
            buttonType="primary"
            size="medium"
            (onClick)="openAddUserModal()">
            <svg viewBox="0 0 24 24" fill="none" class="btn-icon">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Добавить нового пользователя
          </app-button>
        </div>

        <!-- Users Table -->
        <div class="table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Дата добавления</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of filteredUsers">
                <td>
                  <div class="user-name-cell">
                    <a [routerLink]="['/users', user.id]" class="user-name-link">
                      <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
                    </a>
                  </div>
                </td>
                <td>
                  <span class="user-role">{{ user.role }}</span>
                </td>
                <td>
                  <app-badge 
                    [badgeType]="getStatusBadgeType(user.status)" 
                    size="medium">
                    {{ getStatusLabel(user.status) }}
                  </app-badge>
                </td>
                <td>
                  <span class="user-date">{{ formatDate(user.createdAt) }}</span>
                </td>
                <td>
                  <div class="actions-cell">
                    <a [routerLink]="['/users', user.id]" title="Просмотреть" class="action-link">
                      <app-button buttonType="ghost" size="small">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                      </app-button>
                    </a>
                    <ng-container *ngIf="user.status !== 'closed'">
                      <app-button
                        buttonType="ghost"
                        size="small"
                        (onClick)="closeUser(user)"
                        title="Закрыть профиль">
                        <svg viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/>
                          <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                      </app-button>
                    </ng-container>
                    <ng-container *ngIf="user.status === 'closed'">
                      <app-button
                        buttonType="ghost"
                        size="small"
                        (onClick)="deleteUser(user)"
                        title="Удалить">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="1.5"/>
                          <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                      </app-button>
                      <app-button
                        buttonType="ghost"
                        size="small"
                        (onClick)="activateUser(user)"
                        title="Активировать обратно">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </app-button>
                    </ng-container>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add User Modal -->
    <app-modal
      [visible]="showAddUserModal"
      title="Добавить нового пользователя"
      [showCloseButton]="true"
      (closed)="closeAddUserModal()">
      <form [formGroup]="addUserForm" (ngSubmit)="onSubmitAddUser()">
        <div class="form-group">
          <label class="form-label">
            Email
            <span class="required-mark">*</span>
          </label>
          <input
            type="email"
            formControlName="email"
            placeholder="user@example.com"
            class="form-input"
            [class.error]="addUserForm.get('email')?.invalid && addUserForm.get('email')?.touched">
          <span *ngIf="addUserForm.get('email')?.invalid && addUserForm.get('email')?.touched" class="error-message">
            {{ getErrorMessage('email') }}
          </span>
        </div>

        <div class="form-group">
          <label class="form-label">
            Номер телефона
            <span class="required-mark">*</span>
          </label>
          <input
            type="tel"
            formControlName="phoneNumber"
            placeholder="+7 (777) 123-45-67"
            class="form-input"
            [class.error]="addUserForm.get('phoneNumber')?.invalid && addUserForm.get('phoneNumber')?.touched">
          <span *ngIf="addUserForm.get('phoneNumber')?.invalid && addUserForm.get('phoneNumber')?.touched" class="error-message">
            {{ getErrorMessage('phoneNumber') }}
          </span>
        </div>

        <div class="form-group">
          <label class="form-label">
            Имя
            <span class="required-mark">*</span>
          </label>
          <input
            type="text"
            formControlName="firstName"
            placeholder="Иван"
            class="form-input"
            [class.error]="addUserForm.get('firstName')?.invalid && addUserForm.get('firstName')?.touched">
          <span *ngIf="addUserForm.get('firstName')?.invalid && addUserForm.get('firstName')?.touched" class="error-message">
            {{ getErrorMessage('firstName') }}
          </span>
        </div>

        <div class="form-group">
          <label class="form-label">
            Фамилия
            <span class="required-mark">*</span>
          </label>
          <input
            type="text"
            formControlName="lastName"
            placeholder="Иванов"
            class="form-input"
            [class.error]="addUserForm.get('lastName')?.invalid && addUserForm.get('lastName')?.touched">
          <span *ngIf="addUserForm.get('lastName')?.invalid && addUserForm.get('lastName')?.touched" class="error-message">
            {{ getErrorMessage('lastName') }}
          </span>
        </div>

        <div class="form-group">
          <label class="select-label">
            Роль
            <span class="required-mark">*</span>
          </label>
          <div class="select-wrapper">
            <select 
              formControlName="role" 
              class="form-select"
              [class.error]="addUserForm.get('role')?.invalid && addUserForm.get('role')?.touched">
              <option value="">Выберите роль</option>
              <option value="Администратор">Администратор</option>
              <option value="Менеджер">Менеджер</option>
              <option value="Кассир">Кассир</option>
              <option value="Оператор">Оператор</option>
            </select>
            <svg class="select-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span *ngIf="addUserForm.get('role')?.invalid && addUserForm.get('role')?.touched" class="error-message">
            Роль обязательна для заполнения
          </span>
        </div>

        <div class="modal-footer">
          <app-button
            buttonType="ghost"
            (onClick)="closeAddUserModal()">
            Отмена
          </app-button>
          <app-button
            buttonType="primary"
            type="submit"
            [disabled]="addUserForm.invalid">
            Пригласить
          </app-button>
        </div>
      </form>
    </app-modal>
  `,
  styles: [`
    .page-wrapper {
      background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 50%, #f8fafc 100%);
      min-height: calc(100vh - 64px);
      padding: 2rem;
    }

    .users-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header-section {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: flex-end;
    }

    .add-user-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #15803d;
      color: white;
      border: none;
      border-radius: 12px;
      padding: 0.75rem 1.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .add-user-btn:hover {
      background: #166534;
    }

    .add-user-btn svg {
      width: 18px;
      height: 18px;
    }

    .table-container {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
    }

    .users-table thead {
      background: #f8fafc;
    }

    .users-table th {
      padding: 1rem 1.5rem;
      text-align: left;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }

    .users-table td {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .users-table tbody tr:hover {
      background: #f8fafc;
    }

    .users-table tbody tr:last-child td {
      border-bottom: none;
    }

    .user-name-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-name-link {
      text-decoration: none;
      color: #1f2937;
      transition: color 0.2s;
      cursor: pointer;
    }

    .user-name-link:hover {
      color: #15803d;
    }

    .user-name {
      font-weight: 600;
      color: inherit;
    }

    .user-role {
      color: #475569;
      font-size: 0.9375rem;
    }

    .user-date {
      color: #64748b;
      font-size: 0.875rem;
    }

    .actions-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .action-link {
      display: inline-flex;
      text-decoration: none;
      color: inherit;
    }

    /* Стили для SVG внутри app-button */
    :host ::ng-deep app-button svg,
    app-button svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      display: block;
    }

    :host ::ng-deep app-button.size-small svg,
    app-button.size-small svg {
      width: 16px;
      height: 16px;
    }

    .btn-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      display: block;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      padding: 0;
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
    }

    .action-btn.view:hover {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #15803d;
    }

    .action-btn.lock:hover {
      background: #fef2f2;
      border-color: #fecaca;
      color: #dc2626;
    }

    .action-btn.delete:hover {
      background: #fef2f2;
      border-color: #fecaca;
      color: #dc2626;
    }

    .action-btn.activate:hover {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #15803d;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
    }

    .select-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 1rem;
      outline: none;
      transition: 0.2s;
    }

    .form-input:focus {
      border-color: #15803d;
      box-shadow: 0 0 0 3px #dcfce7;
    }

    .form-input.error {
      border-color: #dc2626;
    }

    .required-mark {
      color: #dc2626;
      margin-left: 0.25rem;
    }

    .select-wrapper {
      position: relative;
      width: 100%;
    }

    .form-select {
      width: 100%;
      padding: 12px 40px 12px 16px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 1rem;
      outline: none;
      transition: all 0.2s ease;
      background: white;
      color: #1f2937;
      appearance: none;
      cursor: pointer;
      font-weight: 500;
    }

    .form-select:hover {
      border-color: #94a3b8;
    }

    .form-select:focus {
      border-color: #15803d;
      box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
    }

    .form-select.error {
      border-color: #dc2626;
    }

    .form-select.error:focus {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .select-arrow {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      color: #64748b;
      pointer-events: none;
      transition: transform 0.2s ease;
    }

    .select-wrapper:hover .select-arrow {
      color: #475569;
    }

    .form-select:focus + .select-arrow {
      color: #15803d;
    }

    .form-select option {
      padding: 12px;
      font-weight: 500;
    }

    .form-select option:first-child {
      color: #94a3b8;
      font-weight: 400;
    }

    .error-message {
      display: block;
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 0.25rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }
  `]
})
export class UsersPageComponent implements OnInit {
  private pageHeaderService = inject(PageHeaderService);
  private fb = inject(FormBuilder);

  showAddUserModal = false;
  addUserForm: FormGroup;

  // Mock data
  users: User[] = [
    {
      id: '1',
      firstName: 'Иван',
      lastName: 'Иванов',
      email: 'ivan@example.com',
      phoneNumber: '+7 (777) 123-45-67',
      role: 'Администратор',
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      firstName: 'Мария',
      lastName: 'Петрова',
      email: 'maria@example.com',
      phoneNumber: '+7 (777) 234-56-78',
      role: 'Менеджер',
      status: 'active',
      createdAt: '2024-02-20'
    },
    {
      id: '3',
      firstName: 'Алексей',
      lastName: 'Сидоров',
      email: 'alexey@example.com',
      phoneNumber: '+7 (777) 345-67-89',
      role: 'Кассир',
      status: 'invited',
      createdAt: '2024-03-10'
    },
    {
      id: '4',
      firstName: 'Елена',
      lastName: 'Козлова',
      email: 'elena@example.com',
      phoneNumber: '+7 (777) 456-78-90',
      role: 'Оператор',
      status: 'closed',
      createdAt: '2024-01-05'
    }
  ];

  filteredUsers: User[] = [];

  constructor() {
    this.addUserForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      role: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Пользователи', [
      { label: 'Главная', route: '/home' },
      { label: 'Пользователи' }
    ]);
    this.filteredUsers = [...this.users];
  }

  openAddUserModal(): void {
    this.showAddUserModal = true;
    this.addUserForm.reset();
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.addUserForm.reset();
  }

  onSubmitAddUser(): void {
    if (this.addUserForm.valid) {
      const newUser: User = {
        id: Date.now().toString(),
        ...this.addUserForm.value,
        status: 'invited',
        createdAt: new Date().toISOString().split('T')[0]
      };
      this.users.push(newUser);
      this.filteredUsers = [...this.users];
      this.closeAddUserModal();
    } else {
      Object.keys(this.addUserForm.controls).forEach(key => {
        this.addUserForm.get(key)?.markAsTouched();
      });
    }
  }

  getErrorMessage(fieldName: string): string {
    const control = this.addUserForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'Это поле обязательно для заполнения';
    }
    if (control?.hasError('email')) {
      return 'Введите корректный email';
    }
    return '';
  }

  getStatusBadgeType(status: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
    switch (status) {
      case 'active':
        return 'success';
      case 'invited':
        return 'warning';
      case 'closed':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'invited':
        return 'Приглашен';
      case 'active':
        return 'Активный';
      case 'closed':
        return 'Закрытый';
      default:
        return status;
    }
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }


  closeUser(user: User): void {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index].status = 'closed';
      this.filteredUsers = [...this.users];
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Вы уверены, что хотите удалить пользователя ${user.firstName} ${user.lastName}?`)) {
      this.users = this.users.filter(u => u.id !== user.id);
      this.filteredUsers = [...this.users];
    }
  }

  activateUser(user: User): void {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index].status = 'active';
      this.filteredUsers = [...this.users];
    }
  }
}

