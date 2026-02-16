import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { UsersService, UserStatus } from '../../../../core/services/users.service';
import { ToastService } from '../../../../core/services/toast.service';
import { User as ApiUser, UserRole, InviteUserRequest } from '../../../../core/models/user.model';
import { selectUserId } from '../../../../core/store/auth/auth.selectors';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { PaginatedTableWrapperComponent } from '../../../../shared/components/paginated-table-wrapper/paginated-table-wrapper.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { PhoneFormatPipe } from '../../../../shared/pipes/phone-format.pipe';

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
    ButtonComponent,
    PaginatedTableWrapperComponent,
    LoaderComponent
  ],
  template: `
    <div class="page-wrapper">
      <div class="users-container">
        <!-- Loading State -->
        <div class="page-loading-container" *ngIf="isLoading">
          <app-loader [visible]="true" [overlay]="false" type="logo" size="large"></app-loader>
        </div>
        
        <div *ngIf="!isLoading">
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

        <!-- Users Table with Pagination -->
        <app-paginated-table-wrapper
          [paginationEnabled]="false"
          [data]="filteredUsers"
          [defaultPageSize]="15"
          #paginatedTable>
          
          <!-- Desktop Table View -->
          <div class="table-container desktop-view">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Онлайн</th>
                  <th>Дата добавления</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of paginatedTable.paginatedData" [class.current-user-row]="isCurrentUser(user)">
                <td>
                  <div class="user-name-cell">
                    <a [routerLink]="getUserRoute(user)" class="user-name-link">
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
                  <div class="online-status-cell">
                    <div class="status-indicator" [class.online]="getUserStatus(user.id)?.isOnline" [class.offline]="!getUserStatus(user.id)?.isOnline">
                      <span class="status-dot"></span>
                      <span class="status-text">{{ getUserStatus(user.id)?.isOnline ? 'Онлайн' : 'Офлайн' }}</span>
                    </div>
                    <div class="last-seen" *ngIf="getUserStatus(user.id)?.lastSeenAt">
                      {{ formatLastSeen(getUserStatus(user.id)!.lastSeenAt) }}
                    </div>
                  </div>
                </td>
                <td>
                  <span class="user-date">{{ formatDate(user.createdAt) }}</span>
                </td>
                <td>
                  <div class="actions-cell">
                    <a [routerLink]="getUserRoute(user)" title="Просмотреть" class="action-link">
                      <app-button buttonType="ghost" size="small">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                      </app-button>
                    </a>
                    <ng-container *ngIf="user.status !== 'closed' && user.id !== currentUserId">
                      <app-button
                        buttonType="ghost"
                        size="small"
                        (onClick)="onLockClick(user)"
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
                        (onClick)="onDeleteClick(user)"
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

          <!-- Mobile Card View -->
          <div class="mobile-users-cards mobile-view" 
               (scroll)="onMobileScroll($event)"
               #mobileCardsContainer>
            <a [routerLink]="getUserRoute(user)" class="mobile-user-card" *ngFor="let user of mobileUsers" [class.current-user]="isCurrentUser(user)">
              <div class="card-header-section">
                <div class="card-avatar">
                  {{ getInitials(user) }}
                </div>
                <div class="card-header-info">
                  <div class="card-name">{{ user.firstName }} {{ user.lastName }}</div>
                  <div class="card-email">{{ user.email }}</div>
                </div>
                <div class="card-status-badge">
                  <app-badge 
                    [badgeType]="getStatusBadgeType(user.status)" 
                    size="small">
                    {{ getStatusLabel(user.status) }}
                  </app-badge>
                </div>
              </div>
              <div class="card-body-section">
                <div class="card-info-row">
                  <span class="info-label">Роль:</span>
                  <span class="info-value">{{ user.role }}</span>
                </div>
                <div class="card-info-row">
                  <span class="info-label">Статус:</span>
                  <div class="status-indicator-inline" [class.online]="getUserStatus(user.id)?.isOnline">
                    <span class="status-dot"></span>
                    <span class="status-text">{{ getUserStatus(user.id)?.isOnline ? 'Онлайн' : 'Офлайн' }}</span>
                  </div>
                </div>
                <div class="card-info-row" *ngIf="getUserStatus(user.id)?.lastSeenAt && !getUserStatus(user.id)?.isOnline">
                  <span class="info-label">Последний раз:</span>
                  <span class="info-value">{{ formatLastSeen(getUserStatus(user.id)!.lastSeenAt) }}</span>
                </div>
                <div class="card-info-row">
                  <span class="info-label">Дата регистрации:</span>
                  <span class="info-value">{{ formatDate(user.createdAt) }}</span>
                </div>
              </div>
            </a>
            
            <div class="mobile-loading" *ngIf="isLoadingMore">
              <app-loader></app-loader>
            </div>
          </div>
        </app-paginated-table-wrapper>
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
            placeholder="+7 (___) ___-__-__"
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
              <option value="SUDO">Супер администратор</option>
              <option value="ADMIN">Администратор</option>
              <option value="MANAGER">Менеджер</option>
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
            [disabled]="addUserForm.invalid || isInviting"
            [loading]="isInviting">
            Пригласить
          </app-button>
        </div>
      </form>
    </app-modal>

    <!-- Lock Confirmation Modal -->
    <app-modal 
      [visible]="isLockConfirmModalOpen" 
      [title]="lockConfirmTitle"
      (visibleChange)="isLockConfirmModalOpen = $event">
      <div class="modal-body">
        <div class="toggle-confirm-content">
          <div class="confirm-icon disable">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div class="confirm-description">
            <p class="confirm-text">{{ lockConfirmDescription }}</p>
          </div>
        </div>
        <div class="modal-actions">
          <app-button
            buttonType="ghost"
            (onClick)="cancelLock()">
            Отмена
          </app-button>
          <app-button
            buttonType="danger"
            (onClick)="confirmLock()">
            Заблокировать
          </app-button>
        </div>
      </div>
    </app-modal>

    <!-- Delete Confirmation Modal -->
    <app-modal 
      [visible]="isDeleteConfirmModalOpen" 
      [title]="deleteConfirmTitle"
      (visibleChange)="isDeleteConfirmModalOpen = $event">
      <div class="modal-body">
        <div class="toggle-confirm-content">
          <div class="confirm-icon delete">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2"/>
              <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div class="confirm-description">
            <p class="confirm-text">{{ deleteConfirmDescription }}</p>
          </div>
        </div>
        <div class="modal-actions">
          <app-button
            buttonType="ghost"
            (onClick)="cancelDelete()">
            Отмена
          </app-button>
          <app-button
            buttonType="danger"
            (onClick)="confirmDelete()">
            Удалить
          </app-button>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .page-wrapper {
      background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 50%, #f8fafc 100%);
      min-height: calc(100vh - 64px);
      padding: 2rem;
      margin: -2rem;
    }

    .users-container {
      max-width: 1400px;
      margin: 0 auto;
      position: relative;
      min-height: 400px;
    }

    .page-loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      width: 100%;
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
      background: #16A34A;
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
      background: #15803d;
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

    .users-table tbody tr.current-user-row {
      background: #f1f5f9;
      border-left: 3px solid #64748b;
    }

    .users-table tbody tr.current-user-row:hover {
      background: #e2e8f0;
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
      color: #16A34A;
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

    .online-status-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-indicator.online .status-dot {
      background: #16A34A;
      box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
    }

    .status-indicator.offline .status-dot {
      background: #94a3b8;
    }

    .status-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: #475569;
    }

    .status-indicator.online .status-text {
      color: #16A34A;
    }

    .last-seen {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.125rem;
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
      color: #16A34A;
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
      color: #16A34A;
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
      border-color: #16A34A;
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
      border-color: #16A34A;
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
      color: #16A34A;
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

    /* Confirmation Modal Styles */
    .toggle-confirm-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      padding: 1rem 0;
    }

    .confirm-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .confirm-icon.disable {
      background: #fef2f2;
      color: #dc2626;
    }

    .confirm-icon.delete {
      background: #fef2f2;
      color: #dc2626;
    }

    .confirm-icon svg {
      width: 32px;
      height: 32px;
    }

    .confirm-description {
      text-align: center;
    }

    .confirm-text {
      font-size: 0.9375rem;
      color: #475569;
      line-height: 1.6;
      margin: 0;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    /* Mobile Card View */
    .mobile-users-cards {
      display: none;
      flex-direction: column;
      gap: 1rem;
      max-height: calc(100vh - 300px);
      overflow-y: auto;
      padding: 0.5rem;
    }

    .mobile-user-card {
      background: white;
      border-radius: 16px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: all 0.2s ease;
    }

    .mobile-user-card:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .mobile-user-card.current-user {
      border: 2px solid #16A34A;
      background: #f0fdf4;
    }

    .card-header-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .card-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #16A34A 0%, #15803d 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1rem;
      color: white;
      flex-shrink: 0;
    }

    .card-header-info {
      flex: 1;
      min-width: 0;
    }

    .card-name {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-email {
      font-size: 0.875rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-status-badge {
      flex-shrink: 0;
    }

    .card-body-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e5e7eb;
    }

    .card-info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .card-info-row .info-label {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    .card-info-row .info-value {
      font-size: 0.875rem;
      color: #1f2937;
      font-weight: 600;
      text-align: right;
    }

    .status-indicator-inline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-indicator-inline .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #94a3b8;
      flex-shrink: 0;
    }

    .status-indicator-inline.online .status-dot {
      background: #16A34A;
      box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
    }

    .status-indicator-inline .status-text {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    .status-indicator-inline.online .status-text {
      color: #16A34A;
    }

    .mobile-loading {
      display: flex;
      justify-content: center;
      padding: 1rem;
    }

    @media (max-width: 768px) {
      .page-wrapper {
        margin: -1rem;
        padding: 1rem;
      }

      /* Hide desktop table on mobile */
      .desktop-view {
        display: none !important;
      }

      /* Show mobile cards */
      .mobile-view {
        display: flex !important;
      }

      .mobile-users-cards {
        max-height: calc(100vh - 250px);
      }
    }

    /* Hide mobile view on desktop */
    @media (min-width: 769px) {
      .mobile-view {
        display: none !important;
      }

      .desktop-view {
        display: block !important;
      }
    }
  `]
})
export class UsersPageComponent implements OnInit, OnDestroy {
  private pageHeaderService = inject(PageHeaderService);
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private toastService = inject(ToastService);
  private store = inject(Store);
  private destroy$ = new Subject<void>();

  showAddUserModal = false;
  addUserForm: FormGroup;
  isLoading = true;
  isInviting = false;
  currentUserId: string | null = null;

  // Lock confirmation modal
  isLockConfirmModalOpen = false;
  pendingLockUser: User | null = null;
  lockConfirmTitle = '';
  lockConfirmDescription = '';

  // Delete confirmation modal
  isDeleteConfirmModalOpen = false;
  pendingDeleteUser: User | null = null;
  deleteConfirmTitle = '';
  deleteConfirmDescription = '';

  users: User[] = [];
  filteredUsers: User[] = [];
  mobileUsers: User[] = []; // For mobile infinite scroll
  userStatuses: Map<string, { isOnline: boolean; lastSeenAt: string | null }> = new Map();
  isLoadingMore = false;
  mobilePage = 0;
  mobilePageSize = 20; // Load more items per scroll on mobile
  hasMoreUsers = true;

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
    
    // Get current user ID
    this.store.select(selectUserId).pipe(
      takeUntil(this.destroy$)
    ).subscribe(userId => {
      this.currentUserId = userId ? String(userId) : null;
      // Re-sort users when currentUserId changes
      if (this.users.length > 0) {
        this.sortUsersWithCurrentUserFirst();
      }
    });
    
    this.loadUsers();
    
    // Refresh statuses every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.users.length > 0) {
          this.loadUserStatuses();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.usersService.getUsers().subscribe({
      next: (apiUsers) => {
        this.users = apiUsers.map(user => this.mapApiUserToUser(user));
        this.sortUsersWithCurrentUserFirst();
        // Reset mobile users on initial load
        this.mobileUsers = [...this.filteredUsers];
        this.mobilePage = 0;
        this.hasMoreUsers = true;
        this.loadUserStatuses();
        this.isLoading = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка загрузки пользователей';
        this.toastService.error(errorMessage);
        this.isLoading = false;
      }
    });
  }

  loadMoreMobileUsers(): void {
    if (this.isLoadingMore || !this.hasMoreUsers) {
      return;
    }

    this.isLoadingMore = true;
    const startIndex = (this.mobilePage + 1) * this.mobilePageSize;
    const endIndex = startIndex + this.mobilePageSize;
    const moreUsers = this.filteredUsers.slice(startIndex, endIndex);
    
    if (moreUsers.length > 0) {
      this.mobileUsers = [...this.mobileUsers, ...moreUsers];
      this.mobilePage++;
      this.hasMoreUsers = endIndex < this.filteredUsers.length;
    } else {
      this.hasMoreUsers = false;
    }
    
    this.isLoadingMore = false;
  }

  onMobileScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    // Load more when user scrolls to 80% of the content
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      this.loadMoreMobileUsers();
    }
  }

  getInitials(user: User): string {
    const first = user.firstName?.charAt(0)?.toUpperCase() || '';
    const last = user.lastName?.charAt(0)?.toUpperCase() || '';
    return (first + last) || '?';
  }

  loadUserStatuses(): void {
    this.usersService.getAllUsersStatus().subscribe({
      next: (statuses) => {
        this.userStatuses.clear();
        statuses.forEach(status => {
          this.userStatuses.set(status.userId, {
            isOnline: status.isOnline,
            lastSeenAt: status.lastSeenAt
          });
        });
      },
      error: (err) => {
        console.error('Error loading user statuses:', err);
      }
    });
  }

  getUserStatus(userId: string): { isOnline: boolean; lastSeenAt: string | null } | null {
    return this.userStatuses.get(userId) || null;
  }

  formatLastSeen(lastSeenAt: string | null): string {
    if (!lastSeenAt) {
      return 'Никогда';
    }
    
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Только что';
    }
    if (diffMins < 60) {
      return `${diffMins} мин назад`;
    }
    if (diffHours < 24) {
      return `${diffHours} ч назад`;
    }
    if (diffDays < 7) {
      return `${diffDays} дн назад`;
    }
    
    return lastSeen.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  sortUsersWithCurrentUserFirst(): void {
    if (!this.currentUserId) {
      this.filteredUsers = [...this.users];
      this.mobileUsers = [...this.filteredUsers];
      return;
    }

    const currentUser = this.users.find(u => u.id === this.currentUserId);
    const otherUsers = this.users.filter(u => u.id !== this.currentUserId);

    if (currentUser) {
      this.filteredUsers = [currentUser, ...otherUsers];
    } else {
      this.filteredUsers = [...this.users];
    }
    
    // Update mobile users
    this.mobileUsers = [...this.filteredUsers.slice(0, this.mobilePageSize)];
    this.mobilePage = 0;
    this.hasMoreUsers = this.filteredUsers.length > this.mobilePageSize;
  }

  isCurrentUser(user: User): boolean {
    return this.currentUserId !== null && user.id === this.currentUserId;
  }

  mapApiUserToUser(apiUser: ApiUser): User {
    return {
      id: apiUser.id,
      firstName: apiUser.firstName,
      lastName: apiUser.lastName,
      email: apiUser.email,
      phoneNumber: apiUser.phone || '—',
      role: this.getRoleLabel(apiUser.roles),
      status: this.mapAccountStatusToStatus(apiUser.accountStatus, apiUser.active),
      createdAt: apiUser.createdAt || ''
    };
  }

  mapAccountStatusToStatus(accountStatus?: string, active?: boolean): 'invited' | 'active' | 'closed' {
    if (accountStatus === 'PENDING_ACTIVATION') {
      return 'invited';
    }
    if (accountStatus === 'LOCKED' || active === false) {
      return 'closed';
    }
    return 'active';
  }

  getRoleLabel(roles: UserRole[]): string {
    if (roles.includes('SUDO')) return 'Супер администратор';
    if (roles.includes('ADMIN')) return 'Администратор';
    if (roles.includes('MANAGER')) return 'Менеджер';
    return roles.join(', ');
  }

  openAddUserModal(): void {
    this.showAddUserModal = true;
    this.addUserForm.reset();
    this.isInviting = false;
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.addUserForm.reset();
    this.isInviting = false;
  }

  onSubmitAddUser(): void {
    if (this.addUserForm.valid && !this.isInviting) {
      this.isInviting = true;
      const formValue = this.addUserForm.value;
      const inviteData: InviteUserRequest = {
        email: formValue.email,
        phone: formValue.phoneNumber, // Map phoneNumber to phone
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        role: formValue.role as UserRole
      };

      console.log('[UsersPage] Inviting user with data:', inviteData);

      this.usersService.inviteUser(inviteData).subscribe({
        next: (response) => {
          console.log('[UsersPage] Invite success:', response);
          this.toastService.success('Пользователь успешно приглашен');
          this.closeAddUserModal();
          this.loadUsers(); // Reload users list
        },
        error: (err) => {
          console.error('[UsersPage] Invite error:', err);
          const errorMessage = err.error?.message || err.error?.errors || 'Ошибка приглашения пользователя';
          this.toastService.error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
          // Не сбрасываем isInviting при ошибке, чтобы кнопка оставалась заблокированной
        }
      });
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


  onLockClick(user: User): void {
    this.pendingLockUser = user;
    this.lockConfirmTitle = `Заблокировать пользователя "${user.firstName} ${user.lastName}"?`;
    this.lockConfirmDescription = `При блокировке пользователь ${user.firstName} ${user.lastName} (${user.email}) потеряет доступ к системе. Его профиль будет закрыт, и он не сможет выполнять операции в системе. Вы сможете разблокировать пользователя позже или удалить его профиль.`;
    this.isLockConfirmModalOpen = true;
  }

  confirmLock(): void {
    if (this.pendingLockUser) {
      this.usersService.lockUser(this.pendingLockUser.id).subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(u => u.id === this.pendingLockUser!.id);
          if (index !== -1) {
            this.users[index] = this.mapApiUserToUser(updatedUser);
            this.sortUsersWithCurrentUserFirst();
          }
          this.toastService.success('Пользователь успешно заблокирован');
          this.isLockConfirmModalOpen = false;
          this.pendingLockUser = null;
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Ошибка при блокировке пользователя';
          this.toastService.error(errorMessage);
        }
      });
    }
  }

  cancelLock(): void {
    this.isLockConfirmModalOpen = false;
    this.pendingLockUser = null;
  }

  onDeleteClick(user: User): void {
    this.pendingDeleteUser = user;
    this.deleteConfirmTitle = `Удалить заблокированных пользователей?`;
    this.deleteConfirmDescription = `Вы уверены, что хотите удалить всех заблокированных пользователей? Это действие нельзя отменить. Все данные заблокированных пользователей будут безвозвратно удалены из системы.`;
    this.isDeleteConfirmModalOpen = true;
  }

  confirmDelete(): void {
    if (this.pendingDeleteUser) {
      this.usersService.deleteLockedUsers().subscribe({
        next: (response) => {
          this.toastService.success(`Успешно удалено пользователей: ${response.deletedCount}`);
          this.loadUsers(); // Reload users list to reflect changes
          this.isDeleteConfirmModalOpen = false;
          this.pendingDeleteUser = null;
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Ошибка при удалении заблокированных пользователей';
          this.toastService.error(errorMessage);
        }
      });
    }
  }

  cancelDelete(): void {
    this.isDeleteConfirmModalOpen = false;
    this.pendingDeleteUser = null;
  }

  activateUser(user: User): void {
    this.usersService.unlockUser(user.id).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = this.mapApiUserToUser(updatedUser);
          this.sortUsersWithCurrentUserFirst();
        }
        this.toastService.success('Пользователь успешно разблокирован');
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при разблокировке пользователя';
        this.toastService.error(errorMessage);
      }
    });
  }

  getUserRoute(user: User): string[] {
    // If user clicks on themselves, go to account page, otherwise to user details
    if (this.currentUserId && user.id === this.currentUserId) {
      return ['/profile'];
    }
    return ['/users', user.id];
  }
}

