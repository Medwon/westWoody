import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

interface BonusRule {
  id: string;
  icon: string;
  title: string;
  description: string;
  value: number;
  unit: string;
  label: string;
  active: boolean;
  expirationDays: number; // Через сколько дней сгорают бонусы (0 = бессрочно)
}

@Component({
  selector: 'app-bonus-program-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent
  ],
  template: `
    <div class="page-wrapper">
      <div class="bonus-program">
        <!-- Config Grid -->
        <div class="config-grid">
          <!-- Bonus Cards -->
          <div 
            class="config-card" 
            *ngFor="let rule of bonusRules"
            [class.active-config]="rule.active">
            
            <div class="config-header">
              <div class="config-icon" [innerHTML]="getIcon(rule.icon)"></div>
              <label class="switch">
                <input 
                  type="checkbox" 
                  [checked]="rule.active"
                  (change)="toggleBonus(rule)">
                <span class="slider"></span>
              </label>
            </div>
            
            <div class="config-title">{{ rule.title }}</div>
            <div class="config-desc">{{ rule.description }}</div>
            
            <div class="config-footer">
              <div class="config-values">
                <div class="config-value">
                  {{ rule.value }}<span>{{ rule.unit }}</span>
                </div>
                <div class="config-expiration" *ngIf="rule.expirationDays > 0">
                  <svg viewBox="0 0 24 24" fill="none" class="expiration-icon">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  {{ rule.expirationDays }} дн.
                </div>
                <div class="config-expiration forever" *ngIf="rule.expirationDays === 0">
                  <svg viewBox="0 0 24 24" fill="none" class="expiration-icon">
                    <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  бессрочно
                </div>
              </div>
              <button class="btn-config-card" (click)="openSettingsModal(rule)">
                Настроить
              </button>
            </div>
          </div>

          <!-- Add New Card -->
          <div class="config-card-add" (click)="openAddModal()">
            <svg viewBox="0 0 24 24" fill="none" class="add-icon">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="add-text">Добавить бонус</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <app-modal 
      [visible]="isSettingsModalOpen" 
      [title]="'Настройка: ' + (selectedRule?.title || '')"
      (visibleChange)="isSettingsModalOpen = $event">
      <div class="modal-body" *ngIf="selectedRule">
        <div class="modal-description">
          Укажите новое значение для этого типа бонусов. Изменения вступят в силу для всех будущих транзакций.
        </div>
        
        <div class="form-group">
          <label class="input-label">{{ selectedRule.label }}</label>
          <input 
            type="number" 
            class="form-input"
            [(ngModel)]="editValue"
            min="0"
            placeholder="0">
        </div>

        <div class="form-group">
          <label class="input-label">Срок действия бонусов</label>
          <div class="expiration-input">
            <input 
              type="number" 
              class="form-input"
              [(ngModel)]="editExpirationDays"
              min="0"
              placeholder="0">
            <span class="expiration-suffix">дней</span>
          </div>
          <div class="input-hint">0 = бессрочные бонусы</div>
        </div>

        <div class="modal-actions">
          <button class="submit-btn" (click)="saveSettings()">
            Сохранить изменения
          </button>
          <button class="delete-btn" (click)="deleteBonus()">
            <svg viewBox="0 0 24 24" fill="none" class="delete-icon">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            Удалить бонус
          </button>
        </div>
      </div>
    </app-modal>

    <!-- Add New Bonus Modal -->
    <app-modal 
      [visible]="isAddModalOpen" 
      title="Добавить новый бонус"
      (visibleChange)="isAddModalOpen = $event">
      <div class="modal-body">
        <div class="modal-description">
          Создайте новый тип бонуса для вашей программы лояльности.
        </div>
        
        <div class="form-group">
          <label class="input-label">Название бонуса</label>
          <input 
            type="text" 
            class="form-input"
            [(ngModel)]="newBonus.title"
            placeholder="Например: Бонус выходного дня">
        </div>

        <div class="form-group">
          <label class="input-label">Описание</label>
          <textarea 
            class="form-textarea"
            [(ngModel)]="newBonus.description"
            placeholder="Краткое описание условий..."
            rows="3"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="input-label">Значение</label>
            <input 
              type="number" 
              class="form-input"
              [(ngModel)]="newBonus.value"
              min="0"
              placeholder="0">
          </div>
          <div class="form-group">
            <label class="input-label">Единица</label>
            <div class="unit-selector">
              <button 
                type="button"
                class="unit-option"
                [class.selected]="newBonus.unit === '%'"
                (click)="newBonus.unit = '%'">
                <span class="unit-icon">%</span>
                <span class="unit-text">Процент</span>
              </button>
              <button 
                type="button"
                class="unit-option"
                [class.selected]="newBonus.unit === 'баллов'"
                (click)="newBonus.unit = 'баллов'">
                <svg viewBox="0 0 24 24" fill="none" class="unit-icon-svg">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                </svg>
                <span class="unit-text">Баллы</span>
              </button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="input-label">Срок действия бонусов</label>
          <div class="expiration-input">
            <input 
              type="number" 
              class="form-input"
              [(ngModel)]="newBonus.expirationDays"
              min="0"
              placeholder="0">
            <span class="expiration-suffix">дней</span>
          </div>
          <div class="input-hint">0 = бессрочные бонусы</div>
        </div>

        <div class="form-group">
          <label class="input-label">Иконка</label>
          <div class="icon-selector">
            <button 
              *ngFor="let icon of availableIcons"
              class="icon-option"
              [class.selected]="newBonus.icon === icon.id"
              (click)="newBonus.icon = icon.id"
              [innerHTML]="getSafeHtml(icon.svg)">
            </button>
          </div>
        </div>

        <button 
          class="submit-btn" 
          (click)="addNewBonus()"
          [disabled]="!newBonus.title || !newBonus.value">
          Создать бонус
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .page-wrapper {
      min-height: 100%;
      margin: -2rem;
      padding: 2rem;
      background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 50%, #f8fafc 100%);
    }

    .bonus-program {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Config Grid */
    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    /* Config Card */
    .config-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: 0.3s;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .config-card:hover {
      border-color: #15803d;
      transform: translateY(-3px);
    }

    .config-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: #cbd5e1;
      transition: 0.3s;
    }

    .config-card.active-config::before {
      background: #15803d;
    }

    /* Config Header */
    .config-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .config-icon {
      width: 42px;
      height: 42px;
      background: #f1f5f9;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: 0.3s;
    }

    .config-icon svg {
      width: 20px;
      height: 20px;
      color: #64748b;
    }

    .config-card.active-config .config-icon {
      background: #dcfce7;
    }

    .config-card.active-config .config-icon svg {
      color: #15803d;
    }

    /* Switch */
    .switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 26px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #cbd5e1;
      transition: 0.4s;
      border-radius: 34px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #15803d;
    }

    input:checked + .slider:before {
      transform: translateX(21px);
    }

    /* Config Content */
    .config-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #0f172a;
    }

    .config-desc {
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 1.5rem;
      min-height: 40px;
      flex-grow: 1;
      line-height: 1.5;
    }

    /* Config Footer */
    .config-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px dashed #e2e8f0;
      margin-top: auto;
    }

    .config-values {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .config-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
    }

    .config-value span {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
      margin-left: 2px;
    }

    .config-expiration {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }

    .config-expiration.forever {
      color: #15803d;
    }

    .expiration-icon {
      width: 12px;
      height: 12px;
    }

    .btn-config-card {
      background: transparent;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: 0.2s;
      font-size: 0.85rem;
    }

    .btn-config-card:hover {
      border-color: #15803d;
      color: #15803d;
      background: #dcfce7;
    }

    .config-card:not(.active-config) .config-value,
    .config-card:not(.active-config) .btn-config-card {
      opacity: 0.5;
      pointer-events: none;
      filter: grayscale(1);
    }

    /* Add Card */
    .config-card-add {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: 0.3s;
      min-height: 250px;
      color: #94a3b8;
    }

    .config-card-add:hover {
      border-color: #15803d;
      color: #15803d;
      background: #dcfce7;
      transform: translateY(-3px);
    }

    .add-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }

    .add-text {
      font-weight: 600;
      font-size: 1rem;
    }

    /* Modal Styles */
    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .modal-description {
      color: #64748b;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .input-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #475569;
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

    .expiration-input {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .expiration-input .form-input {
      flex: 1;
    }

    .expiration-suffix {
      font-size: 0.9rem;
      color: #64748b;
      font-weight: 500;
      white-space: nowrap;
    }

    .input-hint {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 4px;
    }

    /* Unit Selector */
    .unit-selector {
      display: flex;
      gap: 6px;
    }

    .unit-option {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 46px;
      padding: 0 12px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .unit-option:hover {
      border-color: #15803d;
      background: #f0fdf4;
    }

    .unit-option.selected {
      border-color: #15803d;
      background: #dcfce7;
    }

    .unit-icon {
      font-size: 1rem;
      font-weight: 700;
      color: #64748b;
      transition: color 0.2s;
    }

    .unit-option.selected .unit-icon {
      color: #15803d;
    }

    .unit-icon-svg {
      width: 16px;
      height: 16px;
      color: #64748b;
      transition: color 0.2s;
    }

    .unit-option.selected .unit-icon-svg {
      color: #15803d;
    }

    .unit-text {
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      transition: color 0.2s;
    }

    .unit-option.selected .unit-text {
      color: #15803d;
    }

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

    /* Icon Selector */
    .icon-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .icon-option {
      width: 40px;
      height: 40px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: 0.2s;
    }

    .icon-option:hover {
      border-color: #15803d;
      background: #f0fdf4;
    }

    .icon-option.selected {
      border-color: #15803d;
      background: #dcfce7;
    }

    .icon-option svg {
      width: 18px;
      height: 18px;
      color: #64748b;
    }

    .icon-option.selected svg {
      color: #15803d;
    }

    .modal-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 0.5rem;
    }

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

    .submit-btn:hover {
      background: #14532d;
    }

    .delete-btn {
      width: 100%;
      background: transparent;
      color: #dc2626;
      padding: 12px;
      border: 1px solid #fecaca;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.9rem;
      transition: 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .delete-btn:hover {
      background: #fef2f2;
      border-color: #dc2626;
    }

    .delete-icon {
      width: 18px;
      height: 18px;
    }

    .submit-btn:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .page-wrapper {
        margin: -1rem;
        padding: 1rem;
      }

      .config-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class BonusProgramPageComponent implements OnInit {
  private pageHeaderService = inject(PageHeaderService);
  private sanitizer = inject(DomSanitizer);

  bonusRules: BonusRule[] = [
    {
      id: 'cashback',
      icon: 'wallet',
      title: 'Базовый Кэшбек',
      description: 'Процент от суммы чека, возвращаемый клиенту в виде баллов.',
      value: 10,
      unit: '%',
      label: 'Процент начисления',
      active: true,
      expirationDays: 90
    },
    {
      id: 'welcome',
      icon: 'party',
      title: 'Приветственный',
      description: 'Начисляется единоразово при регистрации нового клиента.',
      value: 500,
      unit: 'баллов',
      label: 'Количество баллов',
      active: true,
      expirationDays: 30
    },
    {
      id: 'birthday',
      icon: 'cake',
      title: 'День Рождения',
      description: 'Подарочные баллы в день рождения клиента.',
      value: 1000,
      unit: 'баллов',
      label: 'Количество баллов',
      active: false,
      expirationDays: 14
    },
    {
      id: 'referral',
      icon: 'share',
      title: 'Приведи друга',
      description: 'Бонус за каждого приглашенного нового клиента.',
      value: 300,
      unit: 'баллов',
      label: 'Награда за друга',
      active: false,
      expirationDays: 60
    }
  ];

  availableIcons = [
    { 
      id: 'wallet', 
      svg: '<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.2"/><path d="M16 12h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M2 10h20" stroke="currentColor" stroke-width="1.2"/></svg>' 
    },
    { 
      id: 'party', 
      svg: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6L12 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>' 
    },
    { 
      id: 'cake', 
      svg: '<svg viewBox="0 0 24 24" fill="none"><path d="M20 21H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1z" stroke="currentColor" stroke-width="1.2"/><path d="M3 16h18" stroke="currentColor" stroke-width="1.2"/><path d="M12 12V9m-4 3V10m8 2V10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/><circle cx="16" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/></svg>' 
    },
    { 
      id: 'share', 
      svg: '<svg viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="1.2"/><circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.2"/><circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M8.5 13.5l7 4M15.5 6.5l-7 4" stroke="currentColor" stroke-width="1.2"/></svg>' 
    },
    { 
      id: 'gift', 
      svg: '<svg viewBox="0 0 24 24" fill="none"><path d="M20 12v9H4v-9" stroke="currentColor" stroke-width="1.2"/><rect x="2" y="7" width="20" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M12 22V7" stroke="currentColor" stroke-width="1.2"/><path d="M12 7c-2-2-4-2.5-4-4.5a2 2 0 0 1 4 0c0 1.5-2 2-4 4.5" stroke="currentColor" stroke-width="1.2"/><path d="M12 7c2-2 4-2.5 4-4.5a2 2 0 0 0-4 0c0 1.5 2 2 4 4.5" stroke="currentColor" stroke-width="1.2"/></svg>' 
    },
    { 
      id: 'percent', 
      svg: '<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="2" stroke="currentColor" stroke-width="1.2"/><circle cx="15" cy="15" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M5 19L19 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' 
    },
    { 
      id: 'heart', 
      svg: '<svg viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="1.2"/></svg>' 
    },
    { 
      id: 'trophy', 
      svg: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" stroke="currentColor" stroke-width="1.2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" stroke="currentColor" stroke-width="1.2"/><path d="M12 15a6 6 0 0 0 6-6V3H6v6a6 6 0 0 0 6 6z" stroke="currentColor" stroke-width="1.2"/><path d="M12 15v3m-4 3h8m-6 0v-3m4 3v-3" stroke="currentColor" stroke-width="1.2"/></svg>' 
    }
  ];

  isSettingsModalOpen = false;
  isAddModalOpen = false;
  selectedRule: BonusRule | null = null;
  editValue = 0;
  editExpirationDays = 0;

  newBonus = {
    title: '',
    description: '',
    value: 0,
    unit: 'баллов',
    icon: 'gift',
    expirationDays: 30
  };

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Бонусная программа', [
      { label: 'Главная', route: '/home' },
      { label: 'Бонусная программа' }
    ]);
  }

  getIcon(iconId: string): SafeHtml {
    const icon = this.availableIcons.find(i => i.id === iconId);
    const svg = icon ? icon.svg : '';
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  toggleBonus(rule: BonusRule): void {
    rule.active = !rule.active;
  }

  openSettingsModal(rule: BonusRule): void {
    this.selectedRule = rule;
    this.editValue = rule.value;
    this.editExpirationDays = rule.expirationDays;
    this.isSettingsModalOpen = true;
  }

  saveSettings(): void {
    if (this.selectedRule && this.editValue >= 0) {
      this.selectedRule.value = this.editValue;
      this.selectedRule.expirationDays = this.editExpirationDays;
      this.isSettingsModalOpen = false;
    }
  }

  deleteBonus(): void {
    if (this.selectedRule) {
      const index = this.bonusRules.findIndex(r => r.id === this.selectedRule!.id);
      if (index !== -1) {
        this.bonusRules.splice(index, 1);
      }
      this.isSettingsModalOpen = false;
      this.selectedRule = null;
    }
  }

  openAddModal(): void {
    this.newBonus = {
      title: '',
      description: '',
      value: 0,
      unit: 'баллов',
      icon: 'gift',
      expirationDays: 30
    };
    this.isAddModalOpen = true;
  }

  addNewBonus(): void {
    if (!this.newBonus.title || !this.newBonus.value) return;

    const newRule: BonusRule = {
      id: 'custom-' + Date.now(),
      icon: this.newBonus.icon,
      title: this.newBonus.title,
      description: this.newBonus.description || 'Пользовательский бонус',
      value: this.newBonus.value,
      unit: this.newBonus.unit,
      label: this.newBonus.unit === '%' ? 'Процент начисления' : 'Количество баллов',
      active: true,
      expirationDays: this.newBonus.expirationDays
    };

    this.bonusRules.push(newRule);
    this.isAddModalOpen = false;
  }
}

