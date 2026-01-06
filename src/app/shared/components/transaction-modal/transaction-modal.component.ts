import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';

interface Client {
  id: string;
  name: string;
  phone: string;
  balance: number;
  avatar?: string;
  type: 'individual' | 'business';
  tags?: string[];
  comment?: string;
}

interface TransactionResult {
  clientName: string;
  phone: string;
  amount: number;
  bonuses: number;
  isNewClient: boolean;
}

type ModalStep = 'search' | 'found' | 'new';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent
  ],
  template: `
    <app-modal
      [visible]="visible"
      title="Новая продажа"
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
            (keypress)="onSearchKeypress($event)">
          <button class="search-btn" (click)="handleSearch()">
            <svg viewBox="0 0 24 24" fill="none" class="search-icon">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="search-hint">
          <svg viewBox="0 0 24 24" fill="none" class="hint-icon">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Введите номер для поиска или создания клиента
        </div>
      </div>

      <!-- Step 2: Client Found -->
      <div class="step-found" *ngIf="currentStep === 'found' && foundClient">
        <div class="client-card">
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
          <div class="summary-row earned">
            <span class="summary-label">Будет начислено:</span>
            <span class="summary-value bonus">+{{ calculatedBonus }} бонусов</span>
          </div>
        </div>

        <button class="submit-btn" (click)="completeTransaction()" [disabled]="!purchaseAmount || purchaseAmount <= 0">
          Провести транзакцию
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
          <label class="input-label">ФИО Клиента</label>
          <input
            type="text"
            class="form-input"
            [(ngModel)]="newClientName"
            placeholder="Иван Иванов">
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

        <div class="form-group">
          <label class="input-label">Сумма первой покупки (₸)</label>
          <input
            type="number"
            class="form-input"
            [(ngModel)]="purchaseAmount"
            placeholder="0.00"
            min="1"
            (input)="calculateBonus()">
        </div>

        <!-- Summary for New Client -->
        <div class="transaction-summary">
          <div class="summary-row">
            <span class="summary-label">Сумма покупки:</span>
            <span class="summary-value">{{ purchaseAmount || 0 }} ₸</span>
          </div>
          <div class="summary-row total">
            <span class="summary-label">К оплате:</span>
            <span class="summary-value">{{ purchaseAmount || 0 }} ₸</span>
          </div>
          <div class="summary-row earned">
            <span class="summary-label">Будет начислено:</span>
            <span class="summary-value bonus">+{{ calculatedBonus }} бонусов</span>
          </div>
        </div>

        <button class="submit-btn" (click)="createAndComplete()" [disabled]="!newClientName || !purchaseAmount || purchaseAmount <= 0">
          Оплатить и создать
        </button>

        <button class="back-btn" (click)="goBack()">← Назад к поиску</button>
      </div>
    </app-modal>
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
      border-color: #15803d;
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
      background: #15803d;
      color: white;
      padding: 16px;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 1rem 0 2.5rem 0 ;
      animation: slideDown 0.3s ease;
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
      color: #166534;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
    }

    /* Client Comment */
    .client-comment {
      background: rgba(220, 252, 231, 0.9);
      color: #166534;
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

    .comment-text {
      display: inline;
    }

    .comment-more, .comment-less {
      color: #15803d;
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
      border-color: #15803d;
      box-shadow: 0 0 0 3px #dcfce7;
    }

    .form-input.disabled {
      background: #f1f5f9;
      color: #64748b;
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
      color: #166534;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tag-option:hover {
      background: #dcfce7;
      border-color: #86efac;
    }

    .tag-option.selected {
      background: #15803d;
      border-color: #15803d;
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
      border-color: #15803d;
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
      background: #15803d;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      transition: 0.2s;
    }

    .radio-input:checked + .radio-custom {
      border-color: #15803d;
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
      background: #15803d;
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
      color: #15803d;
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

    .summary-label {
      color: #64748b;
      font-size: 0.9rem;
    }

    .summary-value {
      font-weight: 600;
      color: #1f2937;
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
      color: #15803d;
    }

    .summary-row.earned .summary-value.bonus {
      color: #15803d;
    }

    /* Buttons */
    .submit-btn {
      width: 100%;
      background: #15803d;
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
      color: #15803d;
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
  `]
})
export class TransactionModalComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() transactionComplete = new EventEmitter<TransactionResult>();

  currentStep: ModalStep = 'search';
  searchPhone = '';
  foundClient: Client | null = null;
  purchaseAmount: number | null = null;
  calculatedBonus = 0;
  useBonuses = false;
  bonusesToUse = 0;
  newClientName = '';
  newClientType: 'individual' | 'business' = 'individual';
  newClientTags = '';
  newClientComment = '';
  isCommentExpanded = false;
  showTagsDropdown = false;
  
  // Список доступных тэгов
  availableTags: string[] = [
    'VIP',
    'Постоянный',
    'Новый',
    'Оптовик',
    'B2B',
    'Скидка 10%',
    'Скидка 20%',
    'День рождения',
    'Корпоративный',
    'Рекомендация'
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.toggleBodyScroll(changes['visible'].currentValue);
    }
  }

  ngOnDestroy(): void {
    this.toggleBodyScroll(false);
  }

  private toggleBodyScroll(disable: boolean): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = disable ? 'hidden' : '';
    }
  }
  newClientEmail = '';

  private readonly BONUS_RATE = 0.1;

  // Mock database
  private mockDB: Record<string, Client> = {
    '89001234567': { 
      id: '1', 
      name: 'Александр Петров', 
      phone: '89001234567', 
      balance: 450,
      type: 'individual',
      tags: ['VIP', 'Постоянный'],
      comment: 'Клиент предпочитает утренние визиты. Любит скидки на сезонные товары. Рекомендовал нас друзьям.'
    },
    '89998887766': { 
      id: '2', 
      name: 'Елена Смирнова', 
      phone: '89998887766', 
      balance: 1200,
      type: 'business',
      tags: ['Оптовик', 'B2B'],
      comment: 'Представитель компании "ТехноПром". Закупки каждый месяц.'
    },
    '777': { 
      id: '3', 
      name: 'Тестовый Клиент', 
      phone: '777', 
      balance: 5000,
      type: 'individual',
      tags: ['Новый'],
      comment: 'Тестовый комментарий для проверки функционала модального окна.'
    }
  };

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }

  onSearchKeypress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.handleSearch();
    }
  }

  handleSearch(): void {
    const cleanPhone = this.searchPhone.replace(/\D/g, '');
    
    if (cleanPhone.length < 3) {
      return;
    }

    const client = this.mockDB[cleanPhone] || this.mockDB[this.searchPhone];
    
    if (client) {
      this.foundClient = client;
      this.currentStep = 'found';
    } else {
      this.currentStep = 'new';
    }
  }

  calculateBonus(): void {
    // Если включена опция использования бонусов - новые не начисляются
    if (this.useBonuses) {
      this.calculatedBonus = 0;
    } else {
      this.calculatedBonus = Math.floor((this.purchaseAmount || 0) * this.BONUS_RATE);
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
    if (!this.foundClient || !this.purchaseAmount) return;

    const result: TransactionResult = {
      clientName: this.foundClient.name,
      phone: this.foundClient.phone,
      amount: this.purchaseAmount,
      bonuses: this.calculatedBonus,
      isNewClient: false
    };

    this.transactionComplete.emit(result);
    this.onClose();
  }

  createAndComplete(): void {
    if (!this.newClientName || !this.purchaseAmount) return;

    const result: TransactionResult = {
      clientName: this.newClientName,
      phone: this.searchPhone,
      amount: this.purchaseAmount,
      bonuses: this.calculatedBonus,
      isNewClient: true
    };

    this.transactionComplete.emit(result);
    this.onClose();
  }

  goBack(): void {
    this.currentStep = 'search';
    this.foundClient = null;
    this.purchaseAmount = null;
    this.calculatedBonus = 0;
    this.useBonuses = false;
    this.bonusesToUse = 0;
    this.newClientName = '';
    this.newClientEmail = '';
    this.newClientType = 'individual';
    this.newClientTags = '';
    this.newClientComment = '';
    this.isCommentExpanded = false;
    this.showTagsDropdown = false;
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
    this.newClientName = '';
    this.newClientEmail = '';
    this.newClientType = 'individual';
    this.newClientTags = '';
    this.newClientComment = '';
    this.isCommentExpanded = false;
    this.showTagsDropdown = false;
  }
}

