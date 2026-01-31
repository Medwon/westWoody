import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';
import { BadgeComponent } from '../badge/badge.component';
import { PaymentsService, PaymentTransactionDto, UpdatePaymentMethodRequest, PaymentSearchResult } from '../../../core/services/payments.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-payment-view-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent, ButtonComponent, BadgeComponent],
  template: `
    <app-modal
      [visible]="visible"
      title="Детали платежа"
      [showCloseButton]="true"
      [size]="'large'"
      (closed)="onClose()">
      
      <div class="payment-view-content" *ngIf="paymentData">
        <!-- Header Section -->
        <div class="payment-header">
          <div class="payment-id-section">
            <span class="payment-id-label">ID платежа</span>
            <span class="payment-id-value">{{ paymentData.txId }}</span>
          </div>
          <div class="payment-status">
            <app-badge 
              [badgeType]="getStatusBadgeType()" 
              size="medium"
              [icon]="getStatusIcon()">
              {{ getStatusLabel() }}
            </app-badge>
          </div>
        </div>

        <!-- Main Info Grid -->
        <div class="payment-info-grid">
          <!-- Left Column -->
          <div class="info-column">
            <div class="info-section">
              <h3 class="section-title">Информация о платеже</h3>
              
              <div class="info-item">
                <span class="info-label">Сумма</span>
                <span class="info-value amount">{{ formatAmount(paymentData.amount) }} ₸</span>
              </div>

              <div class="info-item">
                <span class="info-label">Способ оплаты</span>
                <div class="payment-method-section">
                  <app-badge 
                    *ngIf="!isEditingPaymentMethod"
                    badgeType="paymentMethod" 
                    size="medium"
                    [paymentMethod]="getPaymentMethodForBadge()">
                  </app-badge>
                  <div class="method-selector" *ngIf="isEditingPaymentMethod">
                    <select [(ngModel)]="selectedPaymentMethod" class="method-select">
                      <option value="CASH">Наличные</option>
                      <option value="CARD">Карта</option>
                      <option value="TRANSFER">Перевод</option>
                    </select>
                    <div class="method-actions">
                      <button class="method-btn save" (click)="savePaymentMethod()" [disabled]="isSaving">
                        {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
                      </button>
                      <button class="method-btn cancel" (click)="cancelEditPaymentMethod()">Отмена</button>
                    </div>
                  </div>
                  <button class="edit-method-btn" *ngIf="!isEditingPaymentMethod && !isSaving" (click)="startEditPaymentMethod()">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Изменить
                  </button>
                </div>
              </div>

              <div class="info-item">
                <span class="info-label">Бонусы</span>
                <div class="bonus-info-section">
                  <!-- Revoked bonuses (show revoked badge instead of granted) -->
                  <ng-container *ngIf="paymentData.bonusRevocations && paymentData.bonusRevocations.length > 0">
                    <div class="bonus-item revoked" *ngFor="let revocation of paymentData.bonusRevocations">
                      <app-badge badgeType="danger" size="small" icon="refund">
                        Отозвано: -{{ formatAmount(revocation.bonusAmount) }}
                      </app-badge>
                      <span class="revoke-reason">({{ getRevokeReasonLabel(revocation.revokeReason) }})</span>
                    </div>
                  </ng-container>
                  <!-- Active granted bonuses (only show if not revoked) -->
                  <ng-container *ngIf="!paymentData.bonusRevocations || paymentData.bonusRevocations.length === 0">
                    <div class="bonus-item" *ngIf="bonusInfo && bonusInfo.bonusGranted > 0">
                      <app-badge badgeType="bonusGranted" size="small" icon="star">
                        Начислено: +{{ formatAmount(bonusInfo.bonusGranted) }}
                      </app-badge>
                    </div>
                  </ng-container>
                  <!-- Used bonuses -->
                  <div class="bonus-item" *ngIf="bonusInfo && bonusInfo.bonusUsed > 0">
                    <app-badge badgeType="bonusUsed" size="small" icon="check">
                      Использовано: -{{ formatAmount(bonusInfo.bonusUsed) }}
                    </app-badge>
                  </div>
                  <!-- No bonuses -->
                  <span class="bonus-none" *ngIf="(!bonusInfo || (bonusInfo.bonusGranted === 0 && bonusInfo.bonusUsed === 0)) && (!paymentData.bonusRevocations || paymentData.bonusRevocations.length === 0)">Нет бонусов</span>
                </div>
              </div>

              <div class="info-item" *ngIf="paymentData.notes">
                <span class="info-label">Заметки</span>
                <span class="info-value notes">{{ paymentData.notes }}</span>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="info-column">
            <div class="info-section">
              <h3 class="section-title">Информация о клиенте</h3>
              
              <div class="info-item">
                <span class="info-label">Клиент</span>
                <a [routerLink]="['/clients', paymentData.clientId]" class="info-value link">
                  {{ paymentData.clientName }}
                </a>
              </div>

              <div class="info-item" *ngIf="bonusInfo?.clientPhone">
                <span class="info-label">Телефон</span>
                <span class="info-value">{{ bonusInfo?.clientPhone }}</span>
              </div>

              <div class="info-item" *ngIf="bonusInfo?.clientEmail">
                <span class="info-label">Email</span>
                <span class="info-value">{{ bonusInfo?.clientEmail }}</span>
              </div>
            </div>

            <div class="info-section">
              <h3 class="section-title">Дополнительная информация</h3>
              
              <div class="info-item">
                <span class="info-label">Инициатор</span>
                <a [routerLink]="['/users', paymentData.enteredByUserId]" class="info-value link" *ngIf="paymentData.enteredByUserId">
                  {{ paymentData.enteredByUsername }}
                </a>
                <span class="info-value" *ngIf="!paymentData.enteredByUserId">{{ paymentData.enteredByUsername || 'Не указан' }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Дата создания</span>
                <span class="info-value">{{ formatDate(paymentData.createdAt) }}</span>
              </div>

              <div class="info-item" *ngIf="paymentData.updatedAt && paymentData.updatedAt !== paymentData.createdAt">
                <span class="info-label">Последнее обновление</span>
                <span class="info-value">{{ formatDate(paymentData.updatedAt) }}</span>
              </div>

              <div class="info-item" *ngIf="paymentData.refundedPaymentTxId">
                <span class="info-label">Возврат платежа</span>
                <span class="info-value refund-link" (click)="openRefundedPayment(paymentData.refundedPaymentTxId!)">
                  {{ paymentData.refundedPaymentTxId }}
                </span>
              </div>
            </div>

          </div>
        </div>

        <!-- Actions Section -->
        <div class="actions-section" *ngIf="canShowActions()">
          <div class="actions-divider"></div>
          
          <div class="actions-buttons">
            <button class="action-btn delete-btn" (click)="toggleDeleteConfirmation()" [disabled]="isDeleting || isRefunding">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Удалить платеж</span>
            </button>
            
            <button class="action-btn refund-btn" (click)="toggleRefundConfirmation()" [disabled]="isDeleting || isRefunding" *ngIf="canRefund()">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 10h10a5 5 0 010 10H9M3 10l4-4M3 10l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Возврат платежа</span>
            </button>
          </div>

          <!-- Delete Confirmation Area -->
          <div class="confirmation-area delete-confirmation" *ngIf="showDeleteConfirmation">
            <div class="confirmation-warning">
              <svg viewBox="0 0 24 24" fill="none" class="warning-icon">
                <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2"/>
              </svg>
              <div class="warning-text">
                <strong>Вы уверены, что хотите удалить этот платеж?</strong>
                <p *ngIf="isCompletedPayment() && hasGrantedBonuses()">
                  Бонусные транзакции, начисленные за этот платеж, также будут удалены.
                </p>
                <p *ngIf="isRefundPayment()">
                  Оригинальный платеж и все связанные бонусные транзакции также будут удалены.
                </p>
                <p *ngIf="isRefundedPayment()">
                  Транзакция возврата и все связанные бонусные транзакции также будут удалены.
                </p>
                <p>Это действие нельзя отменить.</p>
              </div>
            </div>
            <div class="delete-confirm-input">
              <label>Введите <strong>удалить</strong> для подтверждения:</label>
              <input 
                type="text" 
                [(ngModel)]="deleteConfirmText" 
                placeholder="удалить"
                class="confirm-text-input"
                (keyup.enter)="confirmDelete()">
            </div>
            <div class="confirmation-actions">
              <button class="confirm-btn danger" (click)="confirmDelete()" [disabled]="isDeleting || !isDeleteConfirmValid()">
                {{ isDeleting ? 'Удаление...' : 'Удалить' }}
              </button>
              <button class="confirm-btn cancel" (click)="cancelDeleteConfirmation()" [disabled]="isDeleting">
                Отмена
              </button>
            </div>
          </div>

          <!-- Refund Confirmation Area -->
          <div class="confirmation-area refund-confirmation" *ngIf="showRefundConfirmation">
            <div class="refund-form">
              <label class="refund-label">Причина возврата (необязательно)</label>
              <textarea 
                class="refund-input"
                [(ngModel)]="refundNotes"
                placeholder="Укажите причину возврата..."
                rows="2"></textarea>
            </div>
            <div class="confirmation-actions">
              <button class="confirm-btn warning" (click)="confirmRefund()" [disabled]="isRefunding">
                {{ isRefunding ? 'Возврат...' : 'Подтвердить возврат' }}
              </button>
              <button class="confirm-btn cancel" (click)="showRefundConfirmation = false" [disabled]="isRefunding">
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="loading-state" *ngIf="isLoading">
        <div class="loader"></div>
        <span>Загрузка данных...</span>
      </div>
    </app-modal>
  `,
  styles: [`
    .payment-view-content {
      padding: 0;
    }

    .payment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 2px solid #f1f5f9;
      margin-bottom: 2rem;
    }

    .payment-id-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .payment-id-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .payment-id-value {
      font-family: 'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      letter-spacing: 0.5px;
    }

    .payment-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      padding: 0 1.5rem 1.5rem;
    }

    .info-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0.5rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .info-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .info-value {
      font-size: 1rem;
      color: #1f2937;
      font-weight: 500;
    }

    .info-value.amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: #16A34A;
    }

    .info-value.link {
      color: #16A34A;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.2s;
    }

    .info-value.link:hover {
      color: #14532d;
      text-decoration: underline;
    }

    .info-value.refund-link {
      color: #dc2626;
      cursor: pointer;
      text-decoration: underline;
    }

    .info-value.refund-link:hover {
      color: #991b1b;
    }

    .info-value.notes {
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .revocations-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .revocation-item {
      padding: 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      border-left: 4px solid #dc2626;
    }

    .revocation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .revocation-amount {
      font-size: 1.125rem;
      font-weight: 600;
      color: #dc2626;
    }

    .revocation-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .revocation-badge.revoked {
      background: #fee2e2;
      color: #991b1b;
    }

    .revocation-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .revocation-detail-item {
      display: flex;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .revocation-detail-item .detail-label {
      color: #64748b;
      font-weight: 500;
      min-width: 120px;
    }

    .revocation-detail-item .detail-value {
      color: #1e293b;
      flex: 1;
    }

    .revocation-detail-item .detail-value.refund-link {
      color: #dc2626;
      cursor: pointer;
      text-decoration: underline;
    }

    .revocation-detail-item .detail-value.refund-link:hover {
      color: #991b1b;
    }

    .payment-method-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }


    .edit-method-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .edit-method-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #1f2937;
    }

    .edit-method-btn svg {
      width: 12px;
      height: 12px;
    }

    .method-selector {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
    }

    .method-select {
      padding: 0.75rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
      color: #1f2937;
      cursor: pointer;
      transition: all 0.2s;
    }

    .method-select:focus {
      outline: none;
      border-color: #16A34A;
      box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
    }

    .method-actions {
      display: flex;
      gap: 0.5rem;
    }

    .method-btn {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .method-btn.save {
      background: #16A34A;
      color: white;
    }

    .method-btn.save:hover:not(:disabled) {
      background: #14532d;
    }

    .method-btn.save:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .method-btn.cancel {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    .method-btn.cancel:hover {
      background: #e2e8f0;
    }

    .bonus-info-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .bonus-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bonus-item.revoked {
      flex-direction: row;
    }

    .revoke-reason {
      font-size: 0.75rem;
      color: #dc2626;
      font-style: italic;
    }

    .bonus-none {
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;
      color: #64748b;
    }

    .loader {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #16A34A;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Actions Section */
    .actions-section {
      margin-top: 1rem;
      padding: 0 1.5rem 1.5rem;
    }

    .actions-divider {
      height: 2px;
      background: #f1f5f9;
      margin-bottom: 1.5rem;
    }

    .actions-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: 1.5px solid transparent;
    }

    .action-btn svg {
      width: 15px;
      height: 15px;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-btn.delete-btn {
      background: #fef2f2;
      color: #dc2626;
      border-color: #fecaca;
    }

    .action-btn.delete-btn:hover:not(:disabled) {
      background: #fee2e2;
      border-color: #f87171;
    }

    .action-btn.refund-btn {
      background: #fefce8;
      color: #ca8a04;
      border-color: #fef08a;
    }

    .action-btn.refund-btn:hover:not(:disabled) {
      background: #fef9c3;
      border-color: #facc15;
    }

    /* Confirmation Areas */
    .confirmation-area {
      margin-top: 1.5rem;
      padding: 1.25rem;
      border-radius: 12px;
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .delete-confirmation {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .refund-confirmation {
      background: #fefce8;
      border: 1px solid #fef08a;
    }

    .confirmation-warning {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .warning-icon {
      width: 24px;
      height: 24px;
      color: #dc2626;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .refund-confirmation .warning-icon {
      color: #ca8a04;
    }

    .warning-text {
      flex: 1;
    }

    .warning-text strong {
      display: block;
      color: #991b1b;
      margin-bottom: 0.5rem;
    }

    .refund-confirmation .warning-text strong {
      color: #854d0e;
    }

    .warning-text p {
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
      color: #b91c1c;
    }

    .refund-confirmation .warning-text p {
      color: #a16207;
    }

    .delete-confirm-input {
      margin-bottom: 1rem;
    }

    .delete-confirm-input label {
      display: block;
      font-size: 0.875rem;
      color: #991b1b;
      margin-bottom: 0.5rem;
    }

    .delete-confirm-input label strong {
      font-weight: 700;
      color: #7f1d1d;
    }

    .confirm-text-input {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid #fecaca;
      border-radius: 6px;
      font-size: 0.875rem;
      font-family: inherit;
      background: white;
    }

    .confirm-text-input:focus {
      outline: none;
      border-color: #f87171;
      box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.15);
    }

    .refund-form {
      margin-bottom: 1.25rem;
    }

    .refund-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #854d0e;
      margin-bottom: 0.5rem;
    }

    .refund-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #fef08a;
      border-radius: 8px;
      font-size: 0.875rem;
      font-family: inherit;
      resize: vertical;
      background: white;
    }

    .refund-input:focus {
      outline: none;
      border-color: #facc15;
      box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.2);
    }

    .confirmation-actions {
      display: flex;
      gap: 0.75rem;
    }

    .confirm-btn {
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .confirm-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .confirm-btn.danger {
      background: #dc2626;
      color: white;
    }

    .confirm-btn.danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .confirm-btn.warning {
      background: #ca8a04;
      color: white;
    }

    .confirm-btn.warning:hover:not(:disabled) {
      background: #a16207;
    }

    .confirm-btn.cancel {
      background: white;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    .confirm-btn.cancel:hover:not(:disabled) {
      background: #f8fafc;
    }

    @media (max-width: 768px) {
      .payment-info-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        padding: 0 1rem 1rem;
      }

      .payment-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .actions-section {
        padding: 0 1rem 1rem;
      }

      .actions-buttons {
        flex-direction: column;
      }

      .action-btn {
        width: 100%;
        justify-content: center;
      }

      .confirmation-actions {
        flex-direction: column;
      }

      .confirm-btn {
        width: 100%;
      }
    }
  `]
})
export class PaymentViewModalComponent implements OnInit, OnChanges {
  private paymentsService = inject(PaymentsService);
  private toastService = inject(ToastService);

  @Input() visible = false;
  @Input() paymentTxId: string | null = null;
  @Input() paymentSearchResult: PaymentSearchResult | null = null; // Optional: if we already have search result data
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() paymentUpdated = new EventEmitter<void>();
  @Output() paymentDeleted = new EventEmitter<string>();
  @Output() refundedPaymentClick = new EventEmitter<string>();

  paymentData: PaymentTransactionDto | null = null;
  bonusInfo: PaymentSearchResult | null = null;
  isLoading = false;
  isEditingPaymentMethod = false;
  selectedPaymentMethod: 'CASH' | 'CARD' | 'TRANSFER' = 'CASH';
  isSaving = false;

  // Delete/Refund actions
  showDeleteConfirmation = false;
  showRefundConfirmation = false;
  isDeleting = false;
  isRefunding = false;
  refundNotes = '';
  deleteConfirmText = '';

  ngOnInit(): void {
    if (this.paymentSearchResult) {
      this.loadPaymentFromSearchResult();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && changes['visible'].currentValue && this.paymentTxId) {
      this.loadPayment();
    }
    if (changes['paymentSearchResult'] && changes['paymentSearchResult'].currentValue) {
      this.loadPaymentFromSearchResult();
    }
  }

  loadPayment(): void {
    if (!this.paymentTxId) return;

    this.isLoading = true;
    this.paymentsService.getPaymentByTxId(this.paymentTxId).subscribe({
      next: (payment) => {
        this.paymentData = payment;
        this.selectedPaymentMethod = (payment.paymentMethod || 'CASH') as 'CASH' | 'CARD' | 'TRANSFER';
        this.isLoading = false;
        // Try to load bonus info if we have search result
        if (this.paymentSearchResult && this.paymentSearchResult.txId === payment.txId) {
          this.bonusInfo = this.paymentSearchResult;
        }
      },
      error: (err) => {
        this.toastService.error('Ошибка при загрузке платежа');
        console.error('Error loading payment:', err);
        this.isLoading = false;
      }
    });
  }

  loadPaymentFromSearchResult(): void {
    if (!this.paymentSearchResult) return;

    this.bonusInfo = this.paymentSearchResult;
    // Load full payment data
    if (this.paymentSearchResult.txId) {
      this.paymentTxId = this.paymentSearchResult.txId;
      this.loadPayment();
    }
  }

  startEditPaymentMethod(): void {
    this.isEditingPaymentMethod = true;
    this.selectedPaymentMethod = (this.paymentData?.paymentMethod || 'CASH') as 'CASH' | 'CARD' | 'TRANSFER';
  }

  cancelEditPaymentMethod(): void {
    this.isEditingPaymentMethod = false;
    this.selectedPaymentMethod = (this.paymentData?.paymentMethod || 'CASH') as 'CASH' | 'CARD' | 'TRANSFER';
  }

  savePaymentMethod(): void {
    if (!this.paymentData || !this.paymentTxId) return;

    this.isSaving = true;
    const request: UpdatePaymentMethodRequest = {
      paymentMethod: this.selectedPaymentMethod
    };

    this.paymentsService.updatePaymentMethod(this.paymentTxId, request).subscribe({
      next: (updated) => {
        this.paymentData = updated;
        this.isEditingPaymentMethod = false;
        this.isSaving = false;
        this.toastService.success('Способ оплаты обновлен');
        this.paymentUpdated.emit();
      },
      error: (err) => {
        this.toastService.error('Ошибка при обновлении способа оплаты');
        console.error('Error updating payment method:', err);
        this.isSaving = false;
      }
    });
  }

  openRefundedPayment(txId: string): void {
    this.refundedPaymentClick.emit(txId);
  }

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.isEditingPaymentMethod = false;
    this.showDeleteConfirmation = false;
    this.showRefundConfirmation = false;
    this.refundNotes = '';
    this.deleteConfirmText = '';
  }

  // Actions logic
  canShowActions(): boolean {
    if (!this.paymentData) return false;
    // Show actions for all payments (COMPLETED, REFUND, REFUNDED)
    return true;
  }

  isRefundedPayment(): boolean {
    if (!this.paymentData) return false;
    return this.paymentData.status?.toUpperCase() === 'REFUNDED';
  }

  canRefund(): boolean {
    if (!this.paymentData) return false;
    // Can only refund completed payments (not refund transactions or already refunded)
    return this.isCompletedPayment();
  }

  isCompletedPayment(): boolean {
    if (!this.paymentData) return false;
    return this.paymentData.status?.toUpperCase() === 'COMPLETED';
  }

  isRefundPayment(): boolean {
    if (!this.paymentData) return false;
    return this.paymentData.status?.toUpperCase() === 'REFUND';
  }

  hasGrantedBonuses(): boolean {
    if (!this.bonusInfo) return false;
    return this.bonusInfo.bonusGranted > 0;
  }

  toggleDeleteConfirmation(): void {
    this.showDeleteConfirmation = !this.showDeleteConfirmation;
    this.showRefundConfirmation = false;
    if (!this.showDeleteConfirmation) {
      this.deleteConfirmText = '';
    }
  }

  cancelDeleteConfirmation(): void {
    this.showDeleteConfirmation = false;
    this.deleteConfirmText = '';
  }

  isDeleteConfirmValid(): boolean {
    return this.deleteConfirmText.toLowerCase().trim() === 'удалить';
  }

  toggleRefundConfirmation(): void {
    this.showRefundConfirmation = !this.showRefundConfirmation;
    this.showDeleteConfirmation = false;
  }

  confirmDelete(): void {
    if (!this.paymentData?.txId || !this.isDeleteConfirmValid()) return;

    this.isDeleting = true;
    this.paymentsService.deletePayment(this.paymentData.txId).subscribe({
      next: () => {
        this.toastService.success('Платеж успешно удален');
        this.paymentDeleted.emit(this.paymentData!.txId);
        this.isDeleting = false;
        this.deleteConfirmText = '';
        this.onClose();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при удалении платежа';
        this.toastService.error(errorMessage);
        this.isDeleting = false;
      }
    });
  }

  confirmRefund(): void {
    if (!this.paymentData?.txId) return;

    this.isRefunding = true;
    this.paymentsService.refundPayment(this.paymentData.txId, { notes: this.refundNotes }).subscribe({
      next: () => {
        this.toastService.success('Платеж успешно возвращен');
        this.paymentUpdated.emit();
        this.isRefunding = false;
        this.showRefundConfirmation = false;
        this.refundNotes = '';
        // Reload payment data to show updated status
        this.loadPayment();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при возврате платежа';
        this.toastService.error(errorMessage);
        this.isRefunding = false;
      }
    });
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getPaymentMethodForBadge(): 'CASH' | 'CARD' | 'TRANSFER' | null {
    if (!this.paymentData?.paymentMethod) return null;
    const method = this.paymentData.paymentMethod.toUpperCase();
    if (method === 'CASH' || method === 'CARD' || method === 'TRANSFER') {
      return method as 'CASH' | 'CARD' | 'TRANSFER';
    }
    return null;
  }

  getPaymentMethodLabel(method: string | null | undefined): string {
    if (!method) return 'Не указан';
    const labels: Record<string, string> = {
      'CASH': 'Наличные',
      'CARD': 'Карта',
      'TRANSFER': 'Перевод'
    };
    return labels[method.toUpperCase()] || method;
  }

  getRevokeReasonLabel(reason: string | null | undefined): string {
    if (!reason) return 'Не указана';
    const labels: Record<string, string> = {
      'PAYMENT_REFUND': 'Возврат платежа',
      'EXPIRED': 'Истек срок действия',
      'MANUAL': 'Ручной отзыв'
    };
    return labels[reason] || reason;
  }

  getStatusLabel(): string {
    if (!this.paymentData) return '';
    const status = this.paymentData.status;
    if (status === 'COMPLETED') return 'Оплачено';
    if (status === 'PENDING') return 'В ожидании';
    if (status === 'CANCELLED') return 'Отменено';
    if (status === 'REFUNDED') return 'Возвращено';
    return status;
  }

  getStatusBadgeType(): 'payment' | 'refund' {
    if (!this.paymentData) return 'payment';
    const status = this.paymentData.status;
    if (status === 'REFUNDED') return 'refund';
    return 'payment';
  }

  getStatusIcon(): 'payment' | 'refund' | null {
    if (!this.paymentData) return 'payment';
    const status = this.paymentData.status;
    if (status === 'REFUNDED') return 'refund';
    return 'payment';
  }
}
