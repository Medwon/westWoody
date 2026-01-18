import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout, catchError, of } from 'rxjs';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';
import { DialogComponent } from '../dialog/dialog.component';
import { ClientsService, ClientByPhoneResponse, CreateClientRequest } from '../../../core/services/clients.service';
import { PaymentsService, DraftPaymentResponse } from '../../../core/services/payments.service';
import { MessageTemplatesService } from '../../../core/services/message-templates.service';
import { MessagesService } from '../../../core/services/messages.service';
import { BonusTypesService } from '../../../core/services/bonus-types.service';
import { BonusTypeResponse } from '../../../core/models/bonus-type.model';
import { ToastService } from '../../../core/services/toast.service';

interface Client {
  id: string;
  name: string;
  phone: string;
  balance: number;
  avatar?: string;
  type: 'individual' | 'business';
  tags?: string[];
  comment?: string;
  surname?: string;
}

interface TransactionResult {
  clientName: string;
  phone: string;
  amount: number;
  bonuses: number;
  isNewClient: boolean;
}

type ModalStep = 'search' | 'found' | 'new' | 'notify';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    DialogComponent
  ],
  template: `
    <app-modal
      [visible]="visible"
      [title]="getModalTitle()"
      [showCloseButton]="true"
      (closed)="onClose()">
      
      <!-- Step 1: Search -->
      <div class="step-search" *ngIf="currentStep === 'search'">
        <label class="input-label">Введите номер телефона</label>
        <div class="search-row">
          <input
            type="tel"
            class="search-input"
            [(ngModel)]="searchPhone"
            placeholder="8 900 000 00 00"
            [disabled]="isLoading"
            (keypress)="onSearchKeypress($event)">
          <button class="search-btn" (click)="handleSearch()" [disabled]="isLoading">
            <svg viewBox="0 0 24 24" fill="none" class="search-icon">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="search-hint" *ngIf="!isLoading">
          <svg viewBox="0 0 24 24" fill="none" class="hint-icon">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Введите номер для поиска или создания клиента
        </div>
        <div class="loading-indicator" *ngIf="isLoading && currentStep === 'search'">
          <span>Поиск клиента...</span>
        </div>
      </div>

      <!-- Step 2: Client Found -->
      <div class="step-found" *ngIf="currentStep === 'found' && foundClient">
        <div class="client-card" [class.business-client]="foundClient.type === 'business'">
          <div class="client-card-header">
            <div class="client-avatar">
              {{ getInitials(foundClient.name) }}
            </div>
            <div class="client-info">
              <div class="client-name">{{ foundClient.name }}</div>
              <div class="client-bonus-row">
                <div class="client-bonus">
                  <svg viewBox="0 0 24 24" fill="none" class="star-icon">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                  </svg>
                  {{ foundClient.balance }} бонусов
                </div>
                <div class="client-type-badge">
                  <svg viewBox="0 0 24 24" fill="none" class="type-icon">
                    <path *ngIf="foundClient.type === 'business'" d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 4h4v3h-4V4z" fill="currentColor"/>
                    <path *ngIf="foundClient.type === 'individual'" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                  </svg>
                  <span>{{ foundClient.type === 'business' ? 'Бизнес' : 'Индивидуальный' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div class="client-tags" *ngIf="foundClient.tags && foundClient.tags.length > 0">
            <span class="client-tag" *ngFor="let tag of foundClient.tags">{{ tag }}</span>
          </div>

          <!-- Comment -->
          <div class="client-comment" *ngIf="foundClient.comment" (click)="toggleComment()">
            <span class="comment-text">{{ isCommentExpanded ? foundClient.comment : getTruncatedComment(foundClient.comment) }}</span>
            <span class="comment-more" *ngIf="!isCommentExpanded && foundClient.comment.length > 50">ещё...</span>
            <span class="comment-less" *ngIf="isCommentExpanded">свернуть</span>
          </div>
        </div>

        <div class="form-group">
          <label class="input-label">Сумма покупки (₸)</label>
          <input
            type="number"
            class="form-input"
            [(ngModel)]="purchaseAmount"
            placeholder="0.00"
            min="1"
            (input)="onAmountChange()">
        </div>

        <!-- Use Bonuses Toggle -->
        <div class="use-bonus-toggle" *ngIf="foundClient && foundClient.balance > 0">
          <label class="toggle-label">
            <input
              type="checkbox"
              [(ngModel)]="useBonuses"
              (change)="onUseBonusesChange()"
              class="toggle-checkbox">
            <span class="toggle-switch"></span>
            <span class="toggle-text">Использовать бонусы</span>
          </label>
          <span class="available-bonus">Доступно: {{ foundClient.balance }}</span>
        </div>

        <!-- Bonus Input -->
        <div class="form-group bonus-input-group" *ngIf="useBonuses && foundClient">
          <label class="input-label">Списать бонусов</label>
          <input
            type="number"
            class="form-input"
            [(ngModel)]="bonusesToUse"
            [max]="getMaxBonuses()"
            min="0"
            (input)="onBonusesChange()"
            placeholder="0">
          <div class="bonus-hint">
            Максимум: {{ getMaxBonuses() }} бонусов (до 50% от суммы)
          </div>
        </div>

        <!-- Summary -->
        <div class="transaction-summary">
          <div class="summary-row payment-id">
            <span class="summary-label">ID платежа:</span>
            <span class="summary-value id-value">#{{ paymentId || '—' }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Сумма покупки:</span>
            <span class="summary-value">{{ purchaseAmount || 0 }} ₸</span>
          </div>
          <div class="summary-row discount" *ngIf="useBonuses && bonusesToUse > 0">
            <span class="summary-label">Скидка бонусами:</span>
            <span class="summary-value">−{{ bonusesToUse }} ₸</span>
          </div>
          <div class="summary-row total">
            <span class="summary-label">К оплате:</span>
            <span class="summary-value">{{ getFinalAmount() }} ₸</span>
          </div>
          <div class="summary-row earned" *ngIf="!useBonuses">
            <span class="summary-label">Будет начислено:</span>
            <span class="summary-value bonus">+{{ calculatedBonus }} бонусов</span>
          </div>
          <div class="bonus-warning" *ngIf="useBonuses">
            <svg viewBox="0 0 24 24" fill="none" class="warning-icon">
              <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>При использовании бонусов новые бонусы не начисляются</span>
          </div>
        </div>

        <button class="submit-btn" (click)="completeTransaction()" [disabled]="!purchaseAmount || purchaseAmount <= 0 || isLoading">
          {{ isLoading ? 'Обработка...' : 'Провести транзакцию' }}
        </button>

        <button class="back-btn" (click)="goBack()">← Назад к поиску</button>
      </div>

      <!-- Step 3: New Client -->
      <div class="step-new" *ngIf="currentStep === 'new'">
        <div class="alert-box">
          <svg viewBox="0 0 24 24" fill="none" class="alert-icon">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Клиент не найден. Создание нового профиля.
        </div>

        <div class="form-group">
          <label class="input-label">Телефон</label>
          <input type="text" class="form-input disabled" [value]="searchPhone" disabled>
        </div>

        <div class="form-group">
          <label class="input-label">{{ newClientType === 'business' ? 'Название клиента' : 'Имя' }}</label>
          <input
            type="text"
            class="form-input"
            [(ngModel)]="newClientName"
            [placeholder]="newClientType === 'business' ? 'ТОО «Клиент»' : 'Иван'">
        </div>

        <div class="form-group" *ngIf="newClientType === 'individual'">
          <label class="input-label">Фамилия (необязательно)</label>
          <input
            type="text"
            class="form-input"
            [(ngModel)]="newClientSurname"
            placeholder="Иванов">
        </div>

        <div class="form-group" *ngIf="newClientType === 'individual'">
          <label class="input-label">Дата рождения (необязательно)</label>
          <input
            type="date"
            class="form-input"
            [(ngModel)]="newClientBirthday">
        </div>

        <div class="form-group">
          <label class="input-label">Email (необязательно)</label>
          <input
            type="email"
            class="form-input"
            [(ngModel)]="newClientEmail"
            placeholder="client@mail.ru">
        </div>

        <!-- Client Type Radio -->
        <div class="form-group">
          <label class="input-label">Тип клиента</label>
          <div class="radio-group">
            <label class="radio-label">
              <input
                type="radio"
                name="clientType"
                value="individual"
                [(ngModel)]="newClientType"
                class="radio-input">
              <span class="radio-custom"></span>
              <span class="radio-text">Индивидуальный</span>
            </label>
            <label class="radio-label">
              <input
                type="radio"
                name="clientType"
                value="business"
                [(ngModel)]="newClientType"
                class="radio-input">
              <span class="radio-custom"></span>
              <span class="radio-text">Бизнес</span>
            </label>
          </div>
        </div>

        <!-- Tags -->
        <div class="form-group">
          <label class="input-label">Тэги</label>
          <input
            type="text"
            class="form-input"
            [(ngModel)]="newClientTags"
            placeholder="VIP, постоянный, новый..."
            (focus)="showTagsDropdown = true">
          <div class="input-hint">Введите тэги через запятую или выберите из списка</div>
          
          <!-- Tags Dropdown -->
          <div class="tags-dropdown" *ngIf="showTagsDropdown && availableTags.length > 0">
            <div class="tags-dropdown-header">
              <span>Популярные тэги</span>
              <button type="button" class="tags-dropdown-close" (click)="showTagsDropdown = false">×</button>
            </div>
            <div class="tags-dropdown-list">
              <button 
                type="button"
                class="tag-option" 
                *ngFor="let tag of availableTags"
                (click)="addTag(tag)"
                [class.selected]="isTagSelected(tag)">
                {{ tag }}
                <span class="tag-check" *ngIf="isTagSelected(tag)">✓</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Comment -->
        <div class="form-group">
          <label class="input-label">Комментарий (необязательно)</label>
          <textarea
            class="form-textarea"
            [(ngModel)]="newClientComment"
            placeholder="Заметки о клиенте..."
            rows="3"></textarea>
        </div>

        <button class="submit-btn" (click)="createClient()" [disabled]="!newClientName || isLoading">
          {{ isLoading ? 'Создание...' : 'Создать клиента' }}
        </button>

        <button class="back-btn" (click)="goBack()">← Назад к поиску</button>
      </div>

      <!-- Step 4: Notify -->
      <div class="step-notify" *ngIf="currentStep === 'notify'">
        <div class="send-message-content">
          <!-- Selected Template -->
          <div class="template-section" *ngIf="selectedWelcomeTemplate">
            <label class="template-section-label">Выбранный шаблон</label>
            <div class="template-card-display">
              <div class="template-card-header">
                <div class="template-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </div>
                <div class="template-info">
                  <h4 class="template-name-display">{{ selectedWelcomeTemplate.name }}</h4>
                  <span class="template-type-badge">{{ selectedWelcomeTemplate.type === 'bonus_accrued' ? 'Начисленные бонусы' : 'Срок истечения бонусов' }}</span>
                </div>
              </div>
              <div class="template-content-display">
                <p class="template-content-text">{{ selectedWelcomeTemplate.content }}</p>
              </div>
            </div>
          </div>

          <!-- Phone Number -->
          <div class="phone-section">
            <label class="phone-label">Номер телефона получателя</label>
            <div class="phone-display">
              <svg viewBox="0 0 24 24" fill="none" class="phone-icon">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span class="phone-number">{{ getPhoneForMessage() }}</span>
            </div>
          </div>

          <!-- Message Content -->
          <div class="message-content-section">
            <label class="message-content-label">Содержимое сообщения</label>
            <div class="message-content-box">
              <p class="message-text">{{ getFormattedMessage() }}</p>
            </div>
          </div>
        </div>

        <div class="notify-actions">
          <app-button 
            buttonType="primary"  
            size="large"
            class="send-message-btn"
            (click)="sendWelcomeMessage()" 
            [disabled]="isSendingMessage">
            <svg viewBox="0 0 24 24" fill="none" class="whatsapp-icon">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="currentColor"/>
            </svg>
            {{ isSendingMessage ? 'Отправка...' : 'Отправить в WhatsApp' }}
          </app-button>
        </div>
      </div>
    </app-modal>

    <!-- Confirmation Dialog - Outside main modal for proper z-index -->
    <app-dialog
      [visible]="showCancelConfirmation"
      title="Подтверждение"
      message="Вы уверены, что хотите отменить создание платежа? Черновик платежа будет удален."
      confirmLabel="Да, отменить"
      cancelLabel="Нет"
      [dismissible]="false"
      (confirmed)="confirmCancel()"
      (cancelled)="showCancelConfirmation = false">
    </app-dialog>
  `,
  styles: [`
    /* Search Step */
    .input-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
    }

    .search-row {
      display: flex;
      gap: 10px;
    }

    .search-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 1rem;
      outline: none;
      transition: 0.2s;
    }

    .search-input:focus {
      border-color: #16A34A;
      box-shadow: 0 0 0 3px #dcfce7;
    }

    .search-btn {
      background: #e2e8f0;
      border: none;
      padding: 0 16px;
      border-radius: 10px;
      cursor: pointer;
      transition: 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .search-btn:hover {
      background: #cbd5e1;
    }

    .search-icon {
      width: 20px;
      height: 20px;
      color: #64748b;
    }

    .search-hint {
      margin-top: 1rem;
      color: #64748b;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .hint-icon {
      width: 16px;
      height: 16px;
    }

    /* Client Card */
    .client-card {
      background: #16A34A;
      color: white;
      padding: 16px;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 1rem 0 2.5rem 0 ;
      animation: slideDown 0.3s ease;
    }

    .client-card.business-client {
      background: #2563eb;
    }

    .client-card-header {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .client-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .client-info {
      flex: 1;
    }

    .client-name {
      font-weight: 700;
      font-size: 1.1rem;
    }

    .client-bonus-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .client-bonus {
      background: #facc15;
      color: #713f12;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .client-type-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .type-icon {
      width: 14px;
      height: 14px;
      color: white;
    }

    /* Client Tags */
    .client-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .client-tag {
      background: rgba(220, 252, 231, 0.9);
      color: #15803d;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
    }

    .client-card.business-client .client-tag {
      background: rgba(219, 234, 254, 0.9);
      color: #1e40af;
    }

    /* Client Comment */
    .client-comment {
      background: rgba(220, 252, 231, 0.9);
      color: #15803d;
      font-size: 0.8rem;
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.2s;
      line-height: 1.4;
    }

    .client-comment:hover {
      background: rgba(220, 252, 231, 1);
    }

    .client-card.business-client .client-comment {
      background: rgba(219, 234, 254, 0.9);
      color: #1e40af;
    }

    .client-card.business-client .client-comment:hover {
      background: rgba(219, 234, 254, 1);
    }

    .comment-text {
      display: inline;
    }

    .comment-more, .comment-less {
      color: #16A34A;
      font-weight: 600;
      margin-left: 4px;
    }

    .star-icon {
      width: 12px;
      height: 12px;
    }

    .check-icon {
      width: 24px;
      height: 24px;
      opacity: 0.5;
    }

    /* Alert Box */
    .alert-box {
      background: #fff7ed;
      border: 1px solid #fdba74;
      color: #9a3412;
      padding: 12px;
      border-radius: 12px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 1.5rem;
      animation: slideDown 0.3s ease;
    }

    .alert-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    /* Form */
    .form-group {
      margin-bottom: 1rem;
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

    .form-input.disabled {
      background: #f1f5f9;
      color: #64748b;
    }

    .form-input[type="date"] {
      font-family: inherit;
      color: #1f2937;
    }

    .form-input[type="date"]::-webkit-calendar-picker-indicator {
      cursor: pointer;
      opacity: 0.6;
    }

    .form-input[type="date"]::-webkit-calendar-picker-indicator:hover {
      opacity: 1;
    }

    .input-hint {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }

    /* Tags Dropdown */
    .tags-dropdown {
      margin-top: 8px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .tags-dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
    }

    .tags-dropdown-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .tags-dropdown-close:hover {
      color: #64748b;
    }

    .tags-dropdown-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px;
      max-height: 150px;
      overflow-y: auto;
    }

    .tag-option {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #15803d;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tag-option:hover {
      background: #dcfce7;
      border-color: #86efac;
    }

    .tag-option.selected {
      background: #16A34A;
      border-color: #16A34A;
      color: white;
    }

    .tag-check {
      font-size: 0.7rem;
    }

    /* Textarea */
    .form-textarea {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 1rem;
      font-family: inherit;
      outline: none;
      transition: 0.2s;
      resize: vertical;
      min-height: 80px;
    }

    .form-textarea:focus {
      border-color: #16A34A;
      box-shadow: 0 0 0 3px #dcfce7;
    }

    /* Radio Group */
    .radio-group {
      display: flex;
      gap: 1.5rem;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      color: #374151;
    }

    .radio-input {
      display: none;
    }

    .radio-custom {
      width: 20px;
      height: 20px;
      border: 2px solid #cbd5e1;
      border-radius: 50%;
      position: relative;
      transition: 0.2s;
    }

    .radio-custom::after {
      content: '';
      position: absolute;
      width: 10px;
      height: 10px;
      background: #16A34A;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      transition: 0.2s;
    }

    .radio-input:checked + .radio-custom {
      border-color: #16A34A;
    }

    .radio-input:checked + .radio-custom::after {
      transform: translate(-50%, -50%) scale(1);
    }

    .radio-text {
      font-weight: 500;
    }

    /* Use Bonus Toggle */
    .use-bonus-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 12px;
      margin-bottom: 1rem;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }

    .toggle-checkbox {
      display: none;
    }

    .toggle-switch {
      width: 44px;
      height: 24px;
      background: #cbd5e1;
      border-radius: 12px;
      position: relative;
      transition: 0.2s;
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }

    .toggle-checkbox:checked + .toggle-switch {
      background: #16A34A;
    }

    .toggle-checkbox:checked + .toggle-switch::after {
      left: 22px;
    }

    .toggle-text {
      font-weight: 500;
      color: #1f2937;
    }

    .available-bonus {
      font-size: 0.85rem;
      color: #16A34A;
      font-weight: 600;
    }

    /* Bonus Input */
    .bonus-input-group {
      animation: slideDown 0.2s ease;
    }

    .bonus-hint {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 0.5rem;
    }

    /* Transaction Summary */
    .transaction-summary {
      background: #f8fafc;
      border-radius: 12px;
      padding: 1rem;
      margin: 1.5rem 0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }

    .summary-row:not(:last-child) {
      border-bottom: 1px solid #e2e8f0;
    }

    .summary-row.payment-id {
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 0.5rem;
    }

    .summary-label {
      color: #64748b;
      font-size: 0.9rem;
    }

    .summary-value {
      font-weight: 600;
      color: #1f2937;
    }

    .summary-value.id-value {
      font-family: 'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 0.85rem;
      color: #475569;
      letter-spacing: 0.5px;
      background: #f1f5f9;
      padding: 0.375rem 0.75rem;
      border-radius: 8px;
      font-weight: 700;
      border: 1px solid #e2e8f0;
    }

    .summary-row.discount .summary-value {
      color: #dc2626;
    }

    .summary-row.total {
      padding-top: 0.75rem;
    }

    .summary-row.total .summary-label {
      font-weight: 600;
      color: #1f2937;
    }

    .summary-row.total .summary-value {
      font-size: 1.25rem;
      color: #16A34A;
    }

    .summary-row.earned .summary-value.bonus {
      color: #16A34A;
    }

    .bonus-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 0.75rem;
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: #92400e;
    }

    .bonus-warning .warning-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      stroke: #f59e0b;
    }

    /* Buttons */
    .submit-btn {
      width: 100%;
      background: #16A34A;
      color: white;
      padding: 14px;
      border: none;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      font-size: 1rem;
      transition: 0.2s;
    }

    .submit-btn:hover:not(:disabled) {
      background: #14532d;
    }

    .submit-btn:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .back-btn {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      margin-top: 12px;
      font-size: 0.85rem;
      width: 100%;
      text-align: center;
      padding: 8px;
    }

    .back-btn:hover {
      color: #16A34A;
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

    /* Send Message Modal Styles */
    .send-message-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      padding: 0.5rem 0;
    }
      .send-message-btn {
      width: 100%;
      display: block;
    }

    /* Растягиваем кнопку ВНУТРИ компонента */
    .send-message-btn ::ng-deep button {
      width: 100% !important;
      justify-content: center; /* Чтобы текст и иконка были по центру */
    }

    .template-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .template-section-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
    }

    .template-card-display {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      transition: all 0.2s;
    }

    .template-card-display:hover {
      border-color: #25D366;
      box-shadow: 0 2px 8px rgba(37, 211, 102, 0.1);
    }

    .template-card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .template-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .template-icon svg {
      width: 20px;
      height: 20px;
      color: #16a34a;
    }

    .template-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .template-name-display {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .template-type-badge {
      font-size: 0.75rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      display: inline-block;
      width: fit-content;
    }

    .template-content-display {
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .template-content-text {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: #1f2937;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .phone-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .phone-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
    }

    .phone-display {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }

    .phone-icon {
      width: 20px;
      height: 20px;
      color: #16A34A;
      flex-shrink: 0;
    }

    .phone-number {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      font-family: 'Courier New', monospace;
    }

    .message-content-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .message-content-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
    }

    .message-content-box {
      padding: 1.25rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      max-height: 300px;
      overflow-y: auto;
    }

    .message-text {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: #1f2937;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .message-text :deep(.variable-tag) {
      color: rgb(22, 158, 163) !important;
      font-style: italic !important;
      font-weight: 500 !important;
      font-family: 'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace !important;
      background: rgba(22, 158, 163, 0.2) !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      border: 1px solid rgba(22, 158, 163, 0.3) !important;
      display: inline !important;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.875rem;
      padding: 1.25rem 0 0 0;
      border-top: 2px solid #f1f5f9;
      margin-top: 0.5rem;
    }

    .btn-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .send-icon {
      width: 18px;
      height: 18px;
    }

    /* Notify Step */
    .step-notify {
      animation: slideDown 0.3s ease;
    }

    .notify-actions {
      margin-top: 1.5rem;
    }

    .send-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: #25D366;
    }

    .send-btn:hover:not(:disabled) {
      background: #128C7E;
    }

    .whatsapp-icon {
      width: 20px;
      height: 20px;
    }

    .loading-indicator {
      margin-top: 1rem;
      text-align: center;
      color: #64748b;
      font-size: 0.9rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
    }
  `]
})
export class TransactionModalComponent implements OnChanges, OnDestroy {
  private clientsService = inject(ClientsService);
  private paymentsService = inject(PaymentsService);
  private messageTemplatesService = inject(MessageTemplatesService);
  private messagesService = inject(MessagesService);
  private bonusTypesService = inject(BonusTypesService);
  private toastService = inject(ToastService);

  @Input() visible = false;
  @Input() welcomeMessageTemplates: any[] = []; // Шаблоны приветственных сообщений
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() transactionComplete = new EventEmitter<TransactionResult>();
  @Output() messageSent = new EventEmitter<{ phone: string; message: string }>();

  currentStep: ModalStep = 'search';
  searchPhone = '';
  foundClient: Client | null = null;
  purchaseAmount: number | null = null;
  calculatedBonus = 0;
  useBonuses = false;
  bonusesToUse = 0;
  paymentId: string | null = null;
  draftPayment: DraftPaymentResponse | null = null;
  isLoading = false;
  bonusPercentage: number | null = null; // Bonus percentage from API
  newClientName = '';
  newClientSurname = '';
  newClientType: 'individual' | 'business' = 'individual';
  newClientTags = '';
  newClientComment = '';
  newClientEmail = '';
  newClientBirthday = '';
  isCommentExpanded = false;
  showTagsDropdown = false;

  // Send message
  isSendingMessage = false;
  pendingTransactionResult: TransactionResult | null = null;
  selectedWelcomeTemplate: any = null;
  populatedMessageContent = '';
  
  // Track if current client was just created (for transaction result)
  isNewlyCreatedClient = false;
  
  // Список доступных тэгов из API
  availableTags: string[] = [];

  // Cancel confirmation
  showCancelConfirmation = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.toggleBodyScroll(changes['visible'].currentValue);
      if (changes['visible'].currentValue) {
        this.loadAvailableTags();
      }
    }
  }

  loadAvailableTags(): void {
    this.clientsService.getTags().subscribe({
      next: (tags) => {
        this.availableTags = Array.isArray(tags) ? tags : [];
      },
      error: (err) => {
        console.error('Error loading tags:', err);
        this.availableTags = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.toggleBodyScroll(false);
  }

  private toggleBodyScroll(disable: boolean): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = disable ? 'hidden' : '';
    }
  }


  getModalTitle(): string {
    switch (this.currentStep) {
      case 'search':
        return 'Новая продажа';
      case 'found':
        return 'Оформление покупки';
      case 'new':
        return 'Новый клиент';
      case 'notify':
        return 'Уведомить клиента';
      default:
        return 'Новая продажа';
    }
  }

  onClose(): void {
    // Show confirmation if draft payment exists AND we're on payment creation steps (found, new)
    // NOT on notify step - payment is already completed there
    const isPaymentCreationStep = this.currentStep === 'found' || this.currentStep === 'new';
    if (this.draftPayment && isPaymentCreationStep) {
      this.showCancelConfirmation = true;
    } else {
      this.closeModal();
    }
  }

  confirmCancel(): void {
    // If we're on notify step, payment is already completed, just go back to found step
    if (this.currentStep === 'notify') {
      this.showCancelConfirmation = false;
      this.currentStep = 'found';
      return;
    }

    // For other steps, delete draft payment if it exists
    if (this.draftPayment) {
      // Delete draft payment
      this.paymentsService.deleteDraftPayment(this.draftPayment.txId).subscribe({
        next: () => {
          this.toastService.success('Черновик платежа удален');
          this.showCancelConfirmation = false;
          this.closeModal();
        },
        error: (err) => {
          console.error('Error deleting draft payment:', err);
          const errorMessage = err.error?.message || 'Ошибка при удалении черновика платежа';
          this.toastService.error(errorMessage);
          // Close modal anyway
          this.showCancelConfirmation = false;
          this.closeModal();
        }
      });
    } else {
      this.showCancelConfirmation = false;
      this.closeModal();
    }
  }

  closeModal(): void {
    // Reset all form state first
    this.resetForm();
    // Then update visibility and emit change
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onSearchKeypress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.handleSearch();
    }
  }

  handleSearch(): void {
    const cleanPhone = this.searchPhone.trim();
    
    if (cleanPhone.length < 3) {
      this.toastService.error('Введите корректный номер телефона');
      return;
    }

    this.isLoading = true;
    
    // Search client by phone
    this.clientsService.getClientByPhone(cleanPhone).subscribe({
      next: (response) => {
        // Client found - map to Client interface
        this.foundClient = {
          id: response.clientId,
          name: response.name,
          surname: response.surname || '',
          phone: cleanPhone,
          balance: response.currentBonusBalance || 0, // Use currentBonusBalance from API
          type: response.clientType === 'BUSINESS' ? 'business' : 'individual', // Use clientType from API
          tags: response.tags || [],
          comment: response.comment || undefined
        };
        this.isNewlyCreatedClient = false;
        // Keep isLoading = true, createDraftPayment will handle it
        // Create draft payment directly (no need to load balance separately)
        this.createDraftPayment();
      },
      error: (err) => {
        // Client not found (404) - show create client form
        if (err.status === 404) {
          this.isLoading = false;
          this.currentStep = 'new';
        } else {
          const errorMessage = err.error?.message || 'Ошибка при поиске клиента';
          this.toastService.error(errorMessage);
          this.isLoading = false;
        }
      }
    });
  }

  createDraftPayment(): void {
    if (!this.foundClient) {
      console.error('createDraftPayment called but foundClient is null');
      this.isLoading = false;
      return;
    }
    
    this.isLoading = true;
    console.log('Loading bonus configuration for new_payment flow...');
    
    // Load bonus configuration for new_payment flow with timeout and error handling
    this.bonusTypesService.getBonusTypesByFlow('new_payment')
      .pipe(
        timeout(5000), // 5 second timeout
        catchError((err) => {
          console.warn('Error or timeout loading bonus configuration, continuing with default:', err);
          // Return null on error so we can continue
          return of(null as BonusTypeResponse | null);
        })
      )
      .subscribe({
        next: (bonusType) => {
          console.log('Bonus type loaded:', bonusType);
          
          // API returns a single object, check if it's enabled and has bonusPercentage
          if (bonusType && bonusType.enabled && bonusType.bonusPercentage !== null && bonusType.bonusPercentage !== undefined) {
            // Convert percentage to decimal (e.g., 3.00 -> 0.03)
            this.bonusPercentage = bonusType.bonusPercentage / 100;
            console.log('Using bonus percentage:', bonusType.bonusPercentage, '% (', this.bonusPercentage, 'as decimal)');
          } else {
            // Fallback to 0 if bonus type is disabled or has no percentage
            this.bonusPercentage = 0;
            console.log('Bonus type is disabled or has no percentage, using 0%');
          }
          
          // Create draft payment after bonus config is loaded
          console.log('Creating draft payment for client:', this.foundClient!.id);
          this.paymentsService.createDraftPayment({ clientId: this.foundClient!.id }).subscribe({
            next: (draft) => {
              console.log('Draft payment created:', draft);
              this.draftPayment = draft;
              this.paymentId = draft.txId;
              this.currentStep = 'found';
              this.isLoading = false;
              // Recalculate bonus with new percentage
              this.calculateBonus();
            },
            error: (err) => {
              console.error('Error creating draft payment:', err);
              const errorMessage = err.error?.message || 'Ошибка при создании черновика платежа';
              this.toastService.error(errorMessage);
              this.isLoading = false;
            }
          });
        },
        error: (err) => {
          // This should not happen due to catchError, but just in case
          console.error('Unexpected error in bonus config subscription:', err);
          this.bonusPercentage = 0;
          // Still try to create draft payment
          this.paymentsService.createDraftPayment({ clientId: this.foundClient!.id }).subscribe({
            next: (draft) => {
              this.draftPayment = draft;
              this.paymentId = draft.txId;
              this.currentStep = 'found';
              this.isLoading = false;
              this.calculateBonus();
            },
            error: (err) => {
              const errorMessage = err.error?.message || 'Ошибка при создании черновика платежа';
              this.toastService.error(errorMessage);
              this.isLoading = false;
            }
          });
        }
      });
  }

  calculateBonus(): void {
    // Если включена опция использования бонусов - новые не начисляются
    if (this.useBonuses) {
      this.calculatedBonus = 0;
    } else {
      // Use bonusPercentage from API (already converted to decimal, e.g., 0.03 for 3%)
      const rate = this.bonusPercentage ?? 0;
      this.calculatedBonus = Math.floor((this.purchaseAmount || 0) * rate);
    }
  }

  onAmountChange(): void {
    this.validateBonuses();
    this.calculateBonus();
  }

  onUseBonusesChange(): void {
    if (!this.useBonuses) {
      this.bonusesToUse = 0;
    }
    this.calculateBonus();
  }

  onBonusesChange(): void {
    this.validateBonuses();
    this.calculateBonus();
  }

  validateBonuses(): void {
    const max = this.getMaxBonuses();
    if (this.bonusesToUse > max) {
      this.bonusesToUse = max;
    }
    if (this.bonusesToUse < 0) {
      this.bonusesToUse = 0;
    }
  }

  getMaxBonuses(): number {
    if (!this.foundClient || !this.purchaseAmount) return 0;
    // Максимум 50% от суммы покупки или доступный баланс бонусов
    const maxFromPurchase = Math.floor(this.purchaseAmount * 0.5);
    return Math.min(this.foundClient.balance, maxFromPurchase);
  }

  getFinalAmount(): number {
    const amount = this.purchaseAmount || 0;
    const discount = this.useBonuses ? this.bonusesToUse : 0;
    return Math.max(0, amount - discount);
  }

  completeTransaction(): void {
    if (!this.foundClient || !this.purchaseAmount || !this.draftPayment) {
      this.toastService.error('Заполните все обязательные поля');
      return;
    }

    this.isLoading = true;

    // Prepare complete payment request
    const completeRequest = {
      originalAmount: this.purchaseAmount,
      bonusAmountUsed: this.useBonuses && this.bonusesToUse > 0 ? this.bonusesToUse : null,
      notes: 'Payment for services'
    };

    console.log('=== COMPLETE PAYMENT REQUEST ===');
    console.log('Payment TX ID:', this.draftPayment.txId);
    console.log('Full Request Payload:', JSON.stringify(completeRequest, null, 2));
    console.log('================================');

    this.paymentsService.completePayment(this.draftPayment.txId, completeRequest).subscribe({
      next: () => {
        const result: TransactionResult = {
          clientName: this.foundClient!.name,
          phone: this.foundClient!.phone,
          amount: this.purchaseAmount!,
          bonuses: this.calculatedBonus,
          isNewClient: this.isNewlyCreatedClient
        };

        // Save transaction result
        this.pendingTransactionResult = result;
        this.isLoading = false;

        // If bonuses were used, skip notification step (no new bonuses granted)
        if (this.useBonuses && this.bonusesToUse > 0) {
          this.finishTransaction();
        } else {
          // Open send message modal only if bonuses were not used (new bonuses granted)
          this.openSendMessageModal();
        }
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при завершении платежа';
        this.toastService.error(errorMessage);
        this.isLoading = false;
      }
    });
  }

  createClient(): void {
    if (!this.newClientName) {
      this.toastService.error('Введите имя клиента');
      return;
    }

    this.isLoading = true;

    // Parse tags from comma-separated string
    const tags = this.newClientTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Split name into name and surname if individual
    let name = this.newClientName;
    let surname = this.newClientSurname;
    if (this.newClientType === 'individual' && !surname) {
      const nameParts = this.newClientName.trim().split(/\s+/);
      if (nameParts.length > 1) {
        name = nameParts[0];
        surname = nameParts.slice(1).join(' ');
      }
    }

    const createRequest: CreateClientRequest = {
      phone: this.searchPhone.trim(),
      name: name,
      surname: surname || undefined,
      dateOfBirth: this.newClientBirthday || null,
      notes: this.newClientComment || null,
      tags: tags.length > 0 ? tags : undefined,
      clientType: this.newClientType === 'business' ? 'BUSINESS' : 'INDIVIDUAL',
      referrerId: null,
      email: this.newClientEmail || null
    };

    console.log('=== CREATE CLIENT REQUEST ===');
    console.log('Full Request Payload:', JSON.stringify(createRequest, null, 2));
    console.log('============================');

    this.clientsService.createClient(createRequest).subscribe({
      next: (createdClient) => {
        // Map created client to Client interface
        this.foundClient = {
          id: createdClient.id,
          name: createdClient.name,
          surname: createdClient.surname || '',
          phone: createdClient.phone,
          balance: 0, // Will be loaded from bonus balance endpoint (should be 0 for new client)
          type: createdClient.clientType === 'BUSINESS' ? 'business' : 'individual',
          tags: createdClient.tags || [],
          comment: createdClient.notes || undefined
        };
        this.isNewlyCreatedClient = true;
        // Keep isLoading = true, createDraftPayment will handle it
        // Create draft payment directly (new client has 0 balance)
        this.createDraftPayment();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при создании клиента';
        this.toastService.error(errorMessage);
        this.isLoading = false;
      }
    });
  }

  openSendMessageModal(): void {
    if (!this.foundClient || !this.draftPayment) return;

    this.isLoading = true;
    const templateType = 'BASIC_CASHBACK_BONUS_GRANT';

    // Load template by type
    this.messageTemplatesService.getAllTemplates(templateType).subscribe({
      next: (templates) => {
        if (templates && templates.length > 0) {
          this.selectedWelcomeTemplate = templates[0];
          
          // Get populated message content
          if (!this.draftPayment) {
            this.isLoading = false;
            this.toastService.error('Ошибка: черновик платежа не найден');
            return;
          }
          
          this.messageTemplatesService.getPopulatedTemplate(
            templateType,
            this.foundClient!.id,
            this.draftPayment.txId
          ).subscribe({
            next: (populated) => {
              this.populatedMessageContent = populated.content;
              this.isLoading = false;
              this.currentStep = 'notify';
            },
            error: (err) => {
              console.error('Error loading populated template:', err);
              // Fallback to manual formatting
              this.populatedMessageContent = this.getFormattedMessage();
              this.isLoading = false;
              this.currentStep = 'notify';
            }
          });
        } else {
          // No template found, use default
          this.selectedWelcomeTemplate = {
            id: 'default',
            name: 'Приветственное сообщение',
            type: templateType,
            content: 'Добро пожаловать, {clientName}! Спасибо за покупку. Вам начислено {clientBonus} бонусов.'
          };
          this.populatedMessageContent = this.getFormattedMessage();
          this.isLoading = false;
          this.currentStep = 'notify';
        }
      },
      error: (err) => {
        console.error('Error loading template:', err);
        // Use default template
        this.selectedWelcomeTemplate = {
          id: 'default',
          name: 'Приветственное сообщение',
          type: templateType,
          content: 'Добро пожаловать, {clientName}! Спасибо за покупку. Вам начислено {clientBonus} бонусов.'
        };
        this.populatedMessageContent = this.getFormattedMessage();
        this.isLoading = false;
        this.currentStep = 'notify';
      }
    });
  }

  goBackFromNotify(): void {
    // Simply go back to found step without confirmation
    // Payment is already completed, just return to payment step
    this.currentStep = 'found';
  }

  private finishTransaction(): void {
    this.isSendingMessage = false;
    if (this.pendingTransactionResult) {
      const result = this.pendingTransactionResult;
      this.pendingTransactionResult = null;
      this.transactionComplete.emit(result);
      this.onClose();
    }
  }

  getClientNameForMessage(): string {
    if (this.pendingTransactionResult) {
      return this.pendingTransactionResult.clientName;
    }
    return this.foundClient?.name || this.newClientName || 'Клиент';
  }

  getAvatarLetterForMessage(): string {
    const name = this.getClientNameForMessage();
    return name ? name[0].toUpperCase() : 'К';
  }

  getPhoneForMessage(): string {
    if (this.pendingTransactionResult) {
      return this.pendingTransactionResult.phone;
    }
    return this.foundClient?.phone || this.searchPhone || '';
  }

  getFormattedMessage(): string {
    // Use populated message content if available
    if (this.populatedMessageContent) {
      return this.populatedMessageContent;
    }

    if (!this.selectedWelcomeTemplate) {
      return 'Добро пожаловать! Спасибо за покупку.';
    }

    let message = this.selectedWelcomeTemplate.content || '';
    const clientName = this.getClientNameForMessage();
    const phone = this.getPhoneForMessage();
    
    // Replace variables in message
    // Format: {variableName} (single braces, as used in templates)
    message = message.replace(/\{clientName\}/g, clientName);
    message = message.replace(/\{clientPhone\}/g, phone);
    message = message.replace(/\{clientBonus\}/g, String(this.pendingTransactionResult?.bonuses || 0));
    message = message.replace(/\{clientBonusExp\}/g, '30 дней');
    message = message.replace(/\{clientEmail\}/g, '');
    message = message.replace(/\{clientTotalAmount\}/g, String(this.pendingTransactionResult?.amount || 0));
    message = message.replace(/\{clientTotalTransactions\}/g, '1');
    message = message.replace(/\{clientLastVisit\}/g, 'Сегодня');

    // Remove any HTML tags from the message (from variable tags)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = message;
    message = tempDiv.textContent || tempDiv.innerText || message;

    return message;
  }

  sendWelcomeMessage(): void {
    if (this.isSendingMessage || !this.foundClient) return;

    const phone = this.getPhoneForMessage();
    const message = this.getFormattedMessage();

    if (!phone || !message) {
      this.toastService.error('Не указан номер телефона или сообщение');
      return;
    }

    this.isSendingMessage = true;

    // Send message via API to record it
    this.messagesService.sendMessage({
      clientId: this.foundClient.id,
      messageContent: message,
      channel: 'WHATSAPP'
    }).subscribe({
      next: () => {
        // Open WhatsApp Web with phone and message
        this.openWhatsAppWeb(phone, message);
        
        this.toastService.success('Сообщение записано, открывается WhatsApp');
        this.messageSent.emit({ phone, message });
        this.finishTransaction();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при отправке сообщения';
        this.toastService.error(errorMessage);
        this.isSendingMessage = false;
      }
    });
  }

  private openWhatsAppWeb(phone: string, message: string): void {
    // Clean phone number - remove spaces, dashes, parentheses, and leading +
    let cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // If phone starts with 8, replace with 7 (Kazakhstan/Russia format)
    if (cleanPhone.startsWith('8')) {
      cleanPhone = '7' + cleanPhone.substring(1);
    }
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp Web URL
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  goBack(): void {
    // Show confirmation if draft payment exists AND we're on payment creation steps (found, new, notify)
    const isPaymentCreationStep = this.currentStep === 'found' || this.currentStep === 'new' || this.currentStep === 'notify';
    if (this.draftPayment && isPaymentCreationStep) {
      this.showCancelConfirmation = true;
    } else {
      this.resetToSearch();
    }
  }

  resetToSearch(): void {
    this.currentStep = 'search';
    this.foundClient = null;
    this.purchaseAmount = null;
    this.calculatedBonus = 0;
    this.useBonuses = false;
    this.bonusesToUse = 0;
    this.draftPayment = null;
    this.paymentId = null;
    this.bonusPercentage = null;
    this.newClientName = '';
    this.newClientSurname = '';
    this.newClientEmail = '';
    this.newClientBirthday = '';
    this.newClientType = 'individual';
    this.newClientTags = '';
    this.newClientComment = '';
    this.isCommentExpanded = false;
    this.showTagsDropdown = false;
    this.isNewlyCreatedClient = false;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  toggleComment(): void {
    this.isCommentExpanded = !this.isCommentExpanded;
  }

  getTruncatedComment(comment: string): string {
    const maxLength = 50;
    if (comment.length <= maxLength) {
      return comment;
    }
    return comment.substring(0, maxLength).trim() + '...';
  }

  addTag(tag: string): void {
    const currentTags = this.newClientTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    if (currentTags.includes(tag)) {
      // Удаляем тэг если уже есть
      const index = currentTags.indexOf(tag);
      currentTags.splice(index, 1);
    } else {
      // Добавляем тэг
      currentTags.push(tag);
    }
    
    this.newClientTags = currentTags.join(', ');
  }

  isTagSelected(tag: string): boolean {
    const currentTags = this.newClientTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    return currentTags.includes(tag);
  }

  private resetForm(): void {
    this.currentStep = 'search';
    this.searchPhone = '';
    this.foundClient = null;
    this.purchaseAmount = null;
    this.calculatedBonus = 0;
    this.useBonuses = false;
    this.bonusesToUse = 0;
    this.paymentId = null;
    this.draftPayment = null;
    this.bonusPercentage = null;
    this.newClientName = '';
    this.newClientSurname = '';
    this.newClientEmail = '';
    this.newClientBirthday = '';
    this.newClientType = 'individual';
    this.newClientTags = '';
    this.newClientComment = '';
    this.isCommentExpanded = false;
    this.showTagsDropdown = false;
    this.pendingTransactionResult = null;
    this.selectedWelcomeTemplate = null;
    this.populatedMessageContent = '';
    this.isSendingMessage = false;
    this.isNewlyCreatedClient = false;
    this.isLoading = false;
    this.showCancelConfirmation = false;
  }
}

