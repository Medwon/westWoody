import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { BonusTypesService } from '../../../../core/services/bonus-types.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BonusCalculatorComponent } from '../../../../shared/components/bonus-calculator/bonus-calculator.component';
import { BonusTypeResponse, BonusIconType as BackendIconType, BonusTypeType, PreconfiguredBonusType } from '../../../../core/models/bonus-type.model';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

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
    ModalComponent,
    ButtonComponent,
    BonusCalculatorComponent,
    LoaderComponent
  ],
  template: `
    <div class="page-wrapper">
      <div class="bonus-program">
        <!-- Loading State -->
        <div class="page-loading-container" *ngIf="isLoading">
          <app-loader [visible]="true" [overlay]="false" type="logo" size="large"></app-loader>
        </div>

        <!-- Config Grid -->
        <div class="config-grid" *ngIf="!isLoading">
          <!-- Bonus Cards -->
          <div 
            class="config-card" 
            *ngFor="let rule of bonusRules"
            [class.active-config]="rule.active">
            
            <div class="config-header">
              <div class="config-icon">
                <ng-container [ngSwitch]="rule.icon">
                  <svg *ngSwitchCase="'wallet'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M16 12h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                    <path d="M2 10h20" stroke="currentColor" stroke-width="1.2"/>
                  </svg>
                  <svg *ngSwitchCase="'party'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6L12 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                  </svg>
                  <svg *ngSwitchCase="'cake'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1z" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M3 16h18" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M12 12V9m-4 3V10m8 2V10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                    <circle cx="8" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/>
                    <circle cx="12" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/>
                    <circle cx="16" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/>
                  </svg>
                  <svg *ngSwitchCase="'share'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                    <circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="1.2"/>
                    <circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.2"/>
                    <circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M8.5 13.5l7 4M15.5 6.5l-7 4" stroke="currentColor" stroke-width="1.2"/>
                  </svg>
                  <svg *ngSwitchCase="'gift'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                    <path d="M20 12v9H4v-9" stroke="currentColor" stroke-width="1.2"/>
                    <rect x="2" y="7" width="20" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M12 22V7" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M12 7c-2-2-4-2.5-4-4.5a2 2 0 0 1 4 0c0 1.5-2 2-4 4.5" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M12 7c2-2 4-2.5 4-4.5a2 2 0 0 0-4 0c0 1.5 2 2 4 4.5" stroke="currentColor" stroke-width="1.2"/>
                  </svg>
                  <svg *ngSwitchCase="'percent'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="9" r="2" stroke="currentColor" stroke-width="1.2"/>
                    <circle cx="15" cy="15" r="2" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M5 19L19 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  </svg>
                  <svg *ngSwitchCase="'heart'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="1.2"/>
                  </svg>
                  <svg *ngSwitchCase="'trophy'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M12 15a6 6 0 0 0 6-6V3H6v6a6 6 0 0 0 6 6z" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M12 15v3m-4 3h8m-6 0v-3m4 3v-3" stroke="currentColor" stroke-width="1.2"/>
                  </svg>
                </ng-container>
              </div>
              <label class="switch">
                <input 
                  type="checkbox" 
                  [checked]="rule.active"
                  (click)="onToggleClick(rule, $event)">
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
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="expiration-icon">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  {{ rule.expirationDays }} дн.
                </div>
                <div class="config-expiration forever" *ngIf="rule.expirationDays === 0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="expiration-icon">
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="add-icon">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="add-text">Добавить бонус</span>
          </div>
        </div>

        <!-- Bonus Calculator -->
        <app-bonus-calculator>
        </app-bonus-calculator>
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

        <div class="form-group">
          <label class="input-label">Иконка</label>
          <div class="icon-selector">
            <button 
              *ngFor="let icon of availableIcons"
              class="icon-option"
              [class.selected]="editIcon === icon.id"
              (click)="editIcon = icon.id">
              <ng-container [ngSwitch]="icon.id">
                <svg *ngSwitchCase="'wallet'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M16 12h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  <path d="M2 10h20" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                <svg *ngSwitchCase="'party'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6L12 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                </svg>
                <svg *ngSwitchCase="'cake'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1z" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M3 16h18" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M12 12V9m-4 3V10m8 2V10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  <circle cx="8" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="12" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="16" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                <svg *ngSwitchCase="'share'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M8.5 13.5l7 4M15.5 6.5l-7 4" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                <svg *ngSwitchCase="'gift'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M20 12v9H4v-9" stroke="currentColor" stroke-width="1.2"/>
                  <rect x="2" y="7" width="20" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M12 22V7" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M12 7c-2-2-4-2.5-4-4.5a2 2 0 0 1 4 0c0 1.5-2 2-4 4.5" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M12 7c2-2 4-2.5 4-4.5a2 2 0 0 0-4 0c0 1.5 2 2 4 4.5" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                <svg *ngSwitchCase="'percent'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="9" r="2" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="15" cy="15" r="2" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M5 19L19 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
                <svg *ngSwitchCase="'heart'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                <svg *ngSwitchCase="'trophy'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M12 15a6 6 0 0 0 6-6V3H6v6a6 6 0 0 0 6 6z" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M12 15v3m-4 3h8m-6 0v-3m4 3v-3" stroke="currentColor" stroke-width="1.2"/>
                </svg>
              </ng-container>
            </button>
          </div>
        </div>

        <div class="modal-actions">
          <button class="submit-btn" (click)="saveSettings()">
            Сохранить изменения
          </button>
          <button class="delete-btn" (click)="openDeleteModal()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="delete-icon">
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
          <label class="input-label">
            Тип бонуса
            <span class="required-mark">*</span>
          </label>
          <div class="select-wrapper">
            <select 
              class="form-select"
              [(ngModel)]="newBonus.type"
              [disabled]="isLoadingPreconfiguredTypes">
              <option value="">Выберите тип бонуса</option>
              <option *ngFor="let preType of preconfiguredTypes" [value]="preType.type">
                {{ preType.displayName }}
              </option>
            </select>
            <svg class="select-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="unit-icon-svg">
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
              (click)="newBonus.icon = icon.id">
              <ng-container [ngSwitch]="icon.id">
                <svg *ngSwitchCase="'wallet'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M16 12h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  <path d="M2 10h20" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                <svg *ngSwitchCase="'party'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6L12 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                </svg>
                <svg *ngSwitchCase="'cake'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1z" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M3 16h18" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M12 12V9m-4 3V10m8 2V10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  <circle cx="8" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="12" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="16" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                <svg *ngSwitchCase="'share'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M8.5 13.5l7 4M15.5 6.5l-7 4" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                <svg *ngSwitchCase="'gift'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M20 12v9H4v-9" stroke="currentColor" stroke-width="1.2"/>
                  <rect x="2" y="7" width="20" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M12 22V7" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M12 7c-2-2-4-2.5-4-4.5a2 2 0 0 1 4 0c0 1.5-2 2-4 4.5" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M12 7c2-2 4-2.5 4-4.5a2 2 0 0 0-4 0c0 1.5 2 2 4 4.5" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                <svg *ngSwitchCase="'percent'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="9" r="2" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="15" cy="15" r="2" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M5 19L19 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
                <svg *ngSwitchCase="'heart'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                <svg *ngSwitchCase="'trophy'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M12 15a6 6 0 0 0 6-6V3H6v6a6 6 0 0 0 6 6z" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M12 15v3m-4 3h8m-6 0v-3m4 3v-3" stroke="currentColor" stroke-width="1.2"/>
                </svg>
              </ng-container>
            </button>
          </div>
        </div>

        <button 
          class="submit-btn" 
          (click)="addNewBonus()"
          [disabled]="!newBonus.title || !newBonus.value || !newBonus.type">
          Создать бонус
        </button>
      </div>
    </app-modal>

    <!-- Toggle Confirmation Modal -->
    <app-modal 
      [visible]="isToggleConfirmModalOpen" 
      [title]="toggleConfirmTitle"
      (visibleChange)="isToggleConfirmModalOpen = $event">
      <div class="modal-body">
        <div class="toggle-confirm-content">
          <div class="confirm-icon" [class.enable]="pendingToggleState" [class.disable]="!pendingToggleState">
            <svg *ngIf="pendingToggleState" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg *ngIf="!pendingToggleState" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="confirm-description">
            <p class="confirm-text">{{ toggleConfirmDescription }}</p>
          </div>
        </div>
        <div class="modal-actions">
          <app-button
            buttonType="ghost"
            (onClick)="cancelToggle()">
            Отмена
          </app-button>
          <app-button
            [buttonType]="pendingToggleState ? 'primary' : 'danger'"
            (onClick)="confirmToggle()">
            {{ pendingToggleState ? 'Включить' : 'Отключить' }}
          </app-button>
        </div>
      </div>
    </app-modal>

    <!-- Delete Bonus Confirmation Modal -->
    <div class="delete-modal-overlay" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
      <div class="delete-modal" (click)="$event.stopPropagation()">
        <!-- Step 1: Initial confirmation -->
        <div class="delete-modal-content" *ngIf="deleteStep === 1">
          <div class="delete-modal-icon warning">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="delete-modal-title">Удалить бонус?</h3>
          <p class="delete-modal-description">
            Вы уверены, что хотите удалить бонус <strong>{{ selectedRule?.title }}</strong>?<br>
            Это действие нельзя отменить. Бонусная программа перестанет работать для всех будущих транзакций.
          </p>
          <div class="delete-modal-actions">
            <button class="delete-modal-btn cancel" (click)="closeDeleteModal()">Отмена</button>
            <button class="delete-modal-btn confirm" (click)="proceedToDeleteStep2()">Да, удалить</button>
          </div>
        </div>

        <!-- Step 2: Type confirmation word -->
        <div class="delete-modal-content" *ngIf="deleteStep === 2">
          <div class="delete-modal-icon danger">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="delete-modal-title">Подтвердите удаление</h3>
          <p class="delete-modal-description">
            Для подтверждения удаления введите слово <strong class="confirm-word">удалить</strong>
          </p>
          <input 
            type="text" 
            class="delete-confirm-input"
            [(ngModel)]="deleteConfirmationWord"
            placeholder="Введите слово для подтверждения"
            (keydown.enter)="confirmDeleteBonus()">
          <div class="delete-modal-actions">
            <button class="delete-modal-btn cancel" (click)="closeDeleteModal()">Отмена</button>
            <button 
              class="delete-modal-btn delete" 
              [disabled]="deleteConfirmationWord !== 'удалить' || isDeletingBonus"
              (click)="confirmDeleteBonus()">
              <span *ngIf="!isDeletingBonus">Удалить навсегда</span>
              <span *ngIf="isDeletingBonus">Удаление...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
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
      border-color: #16A34A;
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
      background: #16A34A;
    }

    /* Config Header */
    .config-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .config-icon {
      width: 48px;
      height: 48px;
      background: #f1f5f9;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: 0.3s;
    }

    .config-icon svg {
      width: 24px;
      height: 24px;
      color: #475569;
      display: block;
    }

    .config-card.active-config .config-icon {
      background: #dcfce7;
    }

    .config-card.active-config .config-icon svg {
      color: #16A34A;
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
      background-color: #16A34A;
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
      color: #16A34A;
    }

    .expiration-icon {
      width: 12px;
      height: 12px;
      display: block;
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
      border-color: #16A34A;
      color: #16A34A;
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
      border-color: #16A34A;
      color: #16A34A;
      background: #dcfce7;
      transform: translateY(-3px);
    }

    .add-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      display: block;
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
      border-color: #16A34A;
      box-shadow: 0 0 0 3px #dcfce7;
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
      transition: 0.2s;
      background: white;
      appearance: none;
      cursor: pointer;
    }

    .form-select:focus {
      border-color: #16A34A;
      box-shadow: 0 0 0 3px #dcfce7;
    }

    .form-select:disabled {
      background: #f1f5f9;
      cursor: not-allowed;
      opacity: 0.6;
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
    }

    .required-mark {
      color: #ef4444;
      margin-left: 4px;
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
      border-color: #16A34A;
      background: #f0fdf4;
    }

    .unit-option.selected {
      border-color: #16A34A;
      background: #dcfce7;
    }

    .unit-icon {
      font-size: 1rem;
      font-weight: 700;
      color: #64748b;
      transition: color 0.2s;
    }

    .unit-option.selected .unit-icon {
      color: #16A34A;
    }

    .unit-icon-svg {
      width: 16px;
      height: 16px;
      color: #64748b;
      transition: color 0.2s;
      display: block;
    }

    .unit-option.selected .unit-icon-svg {
      color: #16A34A;
    }

    .unit-text {
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      transition: color 0.2s;
    }

    .unit-option.selected .unit-text {
      color: #16A34A;
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
      border-color: #16A34A;
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
      border-color: #16A34A;
      background: #f0fdf4;
    }

    .icon-option.selected {
      border-color: #16A34A;
      background: #dcfce7;
    }

    .icon-option svg {
      width: 20px;
      height: 20px;
      color: #475569;
      display: block;
    }

    .icon-option.selected svg {
      color: #16A34A;
    }

    .modal-actions {
      display: flex;
      flex-direction: row;
      justify-content: right;
      gap: 10px;
      margin-top: 0.5rem;
    }

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
      display: block;
    }

    .submit-btn:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
    }

    /* Toggle Confirmation Modal */
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
      flex-shrink: 0;
    }

    .confirm-icon.enable {
      background: #dcfce7;
      color: #16A34A;
    }

    .confirm-icon.disable {
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
      font-size: 1rem;
      line-height: 1.6;
      color: #475569;
      margin: 0;
    }

    .page-loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      width: 100%;
    }

    /* Delete Modal Styles */
    .delete-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .delete-modal {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      max-width: 420px;
      width: 90%;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .delete-modal-content {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .delete-modal-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .delete-modal-icon.warning {
      background: #fef3c7;
      color: #d97706;
    }

    .delete-modal-icon.danger {
      background: #fee2e2;
      color: #dc2626;
    }

    .delete-modal-icon svg {
      width: 32px;
      height: 32px;
    }

    .delete-modal-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0.75rem;
    }

    .delete-modal-description {
      font-size: 0.9rem;
      color: #6b7280;
      line-height: 1.6;
      margin: 0 0 1.5rem;
    }

    .delete-modal-description strong {
      color: #1f2937;
    }

    .confirm-word {
      color: #dc2626;
      background: #fee2e2;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.95rem;
    }

    .delete-confirm-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 1rem;
      font-family: inherit;
      text-align: center;
      margin-bottom: 1.5rem;
      transition: all 0.2s ease;
    }

    .delete-confirm-input:focus {
      outline: none;
      border-color: #dc2626;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .delete-confirm-input::placeholder {
      color: #9ca3af;
    }

    .delete-modal-actions {
      display: flex;
      gap: 0.75rem;
      width: 100%;
    }

    .delete-modal-btn {
      flex: 1;
      padding: 0.875rem 1.5rem;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .delete-modal-btn.cancel {
      background: #f3f4f6;
      color: #6b7280;
    }

    .delete-modal-btn.cancel:hover {
      background: #e5e7eb;
      color: #374151;
    }

    .delete-modal-btn.confirm {
      background: #fef3c7;
      color: #d97706;
    }

    .delete-modal-btn.confirm:hover {
      background: #fde68a;
      color: #b45309;
    }

    .delete-modal-btn.delete {
      background: #dc2626;
      color: white;
    }

    .delete-modal-btn.delete:hover:not(:disabled) {
      background: #b91c1c;
    }

    .delete-modal-btn.delete:disabled {
      background: #fca5a5;
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
  private bonusTypesService = inject(BonusTypesService);
  private toastService = inject(ToastService);

  isLoading = true;
  bonusRules: BonusRule[] = [];

  availableIcons = [
    { 
      id: 'wallet', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.2"/><path d="M16 12h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M2 10h20" stroke="currentColor" stroke-width="1.2"/></svg>' 
    },
    { 
      id: 'party', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6L12 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>' 
    },
    { 
      id: 'cake', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M20 21H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1z" stroke="currentColor" stroke-width="1.2"/><path d="M3 16h18" stroke="currentColor" stroke-width="1.2"/><path d="M12 12V9m-4 3V10m8 2V10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/><circle cx="16" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/></svg>' 
    },
    { 
      id: 'share', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="1.2"/><circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.2"/><circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M8.5 13.5l7 4M15.5 6.5l-7 4" stroke="currentColor" stroke-width="1.2"/></svg>' 
    },
    { 
      id: 'gift', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M20 12v9H4v-9" stroke="currentColor" stroke-width="1.2"/><rect x="2" y="7" width="20" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M12 22V7" stroke="currentColor" stroke-width="1.2"/><path d="M12 7c-2-2-4-2.5-4-4.5a2 2 0 0 1 4 0c0 1.5-2 2-4 4.5" stroke="currentColor" stroke-width="1.2"/><path d="M12 7c2-2 4-2.5 4-4.5a2 2 0 0 0-4 0c0 1.5 2 2 4 4.5" stroke="currentColor" stroke-width="1.2"/></svg>' 
    },
    { 
      id: 'percent', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="2" stroke="currentColor" stroke-width="1.2"/><circle cx="15" cy="15" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M5 19L19 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' 
    },
    { 
      id: 'heart', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="1.2"/></svg>' 
    },
    { 
      id: 'trophy', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" stroke="currentColor" stroke-width="1.2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" stroke="currentColor" stroke-width="1.2"/><path d="M12 15a6 6 0 0 0 6-6V3H6v6a6 6 0 0 0 6 6z" stroke="currentColor" stroke-width="1.2"/><path d="M12 15v3m-4 3h8m-6 0v-3m4 3v-3" stroke="currentColor" stroke-width="1.2"/></svg>' 
    }
  ];

  isSettingsModalOpen = false;
  isAddModalOpen = false;
  isToggleConfirmModalOpen = false;
  selectedRule: BonusRule | null = null;
  pendingToggleRule: BonusRule | null = null;
  pendingToggleState = false;
  toggleConfirmTitle = '';
  toggleConfirmDescription = '';

  // Delete confirmation modal
  showDeleteModal = false;
  deleteStep: 1 | 2 = 1;
  deleteConfirmationWord = '';
  isDeletingBonus = false;
  editValue = 0;
  editExpirationDays = 0;
  editIcon = 'gift';

  preconfiguredTypes: PreconfiguredBonusType[] = [];
  isLoadingPreconfiguredTypes = false;

  newBonus = {
    title: '',
    description: '',
    value: 0,
    unit: 'баллов',
    icon: 'gift',
    expirationDays: 30,
    type: '' as BonusTypeType | ''
  };

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Бонусная программа', [
      { label: 'Главная', route: '/home' },
      { label: 'Бонусная программа' }
    ]);
    this.loadBonusTypes();
    this.loadPreconfiguredTypes();
  }

  loadPreconfiguredTypes(): void {
    this.isLoadingPreconfiguredTypes = true;
    this.bonusTypesService.getPreconfiguredBonusTypes().subscribe({
      next: (types) => {
        this.preconfiguredTypes = types;
        this.isLoadingPreconfiguredTypes = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка загрузки предустановленных типов бонусов';
        this.toastService.error(errorMessage);
        this.isLoadingPreconfiguredTypes = false;
      }
    });
  }

  loadBonusTypes(): void {
    this.isLoading = true;
    this.bonusTypesService.getAllBonusTypes().subscribe({
      next: (bonusTypes) => {
        this.bonusRules = bonusTypes.map(bt => this.mapBonusTypeToRule(bt));
        this.isLoading = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка загрузки типов бонусов';
        this.toastService.error(errorMessage);
        this.isLoading = false;
      }
    });
  }

  // Map backend BonusTypeResponse to frontend BonusRule
  mapBonusTypeToRule(bonusType: BonusTypeResponse): BonusRule {
    const value = bonusType.bonusPercentage ?? bonusType.bonusAmount ?? 0;
    const unit = bonusType.bonusPercentage ? '%' : 'баллов';
    const label = bonusType.bonusPercentage ? 'Процент начисления' : 'Количество баллов';
    const icon = this.mapBackendIconToFrontend(bonusType.iconType);

    return {
      id: bonusType.id.toString(),
      icon: icon,
      title: bonusType.name,
      description: bonusType.description,
      value: value,
      unit: unit,
      label: label,
      active: bonusType.enabled,
      expirationDays: bonusType.expirationDays
    };
  }

  // Map backend icon type (UPPERCASE) to frontend icon (lowercase)
  mapBackendIconToFrontend(backendIcon: BackendIconType | null | undefined): string {
    if (!backendIcon) {
      return 'gift'; // Default icon if iconType is null/undefined
    }
    return backendIcon.toLowerCase();
  }

  // Map frontend icon (lowercase) to backend icon type (UPPERCASE)
  mapFrontendIconToBackend(frontendIcon: string | null | undefined): BackendIconType {
    if (!frontendIcon) {
      return 'GIFT'; // Default icon type if frontendIcon is null/undefined
    }
    return frontendIcon.toUpperCase() as BackendIconType;
  }

  // Map frontend BonusRule to backend CreateBonusTypeRequest
  mapRuleToCreateRequest(rule: Partial<BonusRule>, type: BonusTypeType = 'BASIC_CASHBACK'): any {
    const isPercentage = rule.unit === '%';
    const request: any = {
      name: rule.title || '',
      type: type,
      expirationDays: rule.expirationDays ?? 30,
      description: rule.description || '',
      iconType: this.mapFrontendIconToBackend(rule.icon || 'gift')
    };

    if (isPercentage) {
      request.bonusPercentage = rule.value ?? 0;
    } else {
      request.bonusAmount = rule.value ?? 0;
    }

    return request;
  }


  onToggleClick(rule: BonusRule, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.target as HTMLInputElement;
    const currentState = rule.active;
    const newState = !currentState;
    
    this.pendingToggleRule = rule;
    this.pendingToggleState = newState;
    
    if (newState) {
      this.toggleConfirmTitle = `Включить "${rule.title}"?`;
      this.toggleConfirmDescription = `При включении этого бонуса клиенты смогут получать ${rule.value}${rule.unit === '%' ? '%' : ' ' + rule.unit} при каждой транзакции. Бонусная программа начнет работать для всех будущих покупок.`;
    } else {
      this.toggleConfirmTitle = `Отключить "${rule.title}"?`;
      this.toggleConfirmDescription = `При отключении этого бонуса клиенты больше не будут получать ${rule.value}${rule.unit === '%' ? '%' : ' ' + rule.unit} при транзакциях. Программа перестанет начислять бонусы для всех будущих покупок. Существующие накопленные бонусы клиентов останутся без изменений.`;
    }
    
    this.isToggleConfirmModalOpen = true;
  }

  confirmToggle(): void {
    if (this.pendingToggleRule) {
      const bonusTypeId = parseInt(this.pendingToggleRule.id);
      this.bonusTypesService.toggleBonusType(bonusTypeId, this.pendingToggleState).subscribe({
        next: (updatedBonusType) => {
          // Reload all bonus types to ensure we have the latest state
          this.loadBonusTypes();
          this.toastService.success(
            this.pendingToggleState ? 'Бонус успешно включен' : 'Бонус успешно отключен'
          );
          this.isToggleConfirmModalOpen = false;
          this.pendingToggleRule = null;
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Ошибка при изменении статуса бонуса';
          this.toastService.error(errorMessage);
        }
      });
    }
  }

  cancelToggle(): void {
    // Восстанавливаем исходное состояние checkbox
    if (this.pendingToggleRule) {
      // Состояние уже не изменилось, так как мы предотвратили изменение
      this.pendingToggleRule = null;
    }
    this.isToggleConfirmModalOpen = false;
  }

  openSettingsModal(rule: BonusRule): void {
    this.selectedRule = rule;
    this.editValue = rule.value;
    this.editExpirationDays = rule.expirationDays;
    this.editIcon = rule.icon;
    this.isSettingsModalOpen = true;
  }

  saveSettings(): void {
    if (this.selectedRule && this.editValue >= 0) {
      const bonusTypeId = parseInt(this.selectedRule.id);
      const isPercentage = this.selectedRule.unit === '%';
      const updateData: any = {
        name: this.selectedRule.title,
        enabled: this.selectedRule.active,
        description: this.selectedRule.description || '',
        expirationDays: this.editExpirationDays,
        iconType: this.mapFrontendIconToBackend(this.editIcon)
      };

      if (isPercentage) {
        updateData.bonusPercentage = this.editValue;
      } else {
        updateData.bonusAmount = this.editValue;
      }

      this.bonusTypesService.updateBonusType(bonusTypeId, updateData).subscribe({
        next: (updatedBonusType) => {
          const index = this.bonusRules.findIndex(r => r.id === this.selectedRule!.id);
          if (index !== -1) {
            this.bonusRules[index] = this.mapBonusTypeToRule(updatedBonusType);
          }
          this.toastService.success('Настройки бонуса успешно сохранены');
          this.isSettingsModalOpen = false;
          this.selectedRule = null;
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Ошибка при сохранении настроек';
          this.toastService.error(errorMessage);
        }
      });
    }
  }

  // Delete confirmation modal methods
  openDeleteModal(): void {
    this.showDeleteModal = true;
    this.deleteStep = 1;
    this.deleteConfirmationWord = '';
    this.isDeletingBonus = false;
    // Close the settings modal but keep the selectedRule
    this.isSettingsModalOpen = false;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteStep = 1;
    this.deleteConfirmationWord = '';
    this.isDeletingBonus = false;
  }

  proceedToDeleteStep2(): void {
    this.deleteStep = 2;
  }

  confirmDeleteBonus(): void {
    if (this.deleteConfirmationWord !== 'удалить') {
      this.toastService.error('Введите слово "удалить" для подтверждения');
      return;
    }

    if (this.selectedRule) {
      this.isDeletingBonus = true;
      const bonusTypeId = parseInt(this.selectedRule.id);
      this.bonusTypesService.deleteBonusType(bonusTypeId).subscribe({
        next: () => {
          const index = this.bonusRules.findIndex(r => r.id === this.selectedRule!.id);
          if (index !== -1) {
            this.bonusRules.splice(index, 1);
          }
          this.toastService.success('Бонус успешно удален');
          this.closeDeleteModal();
          this.selectedRule = null;
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Ошибка при удалении бонуса';
          this.toastService.error(errorMessage);
          this.isDeletingBonus = false;
        }
      });
    }
  }

  // Legacy method - now redirects to modal
  deleteBonus(): void {
    this.openDeleteModal();
  }

  openAddModal(): void {
    this.newBonus = {
      title: '',
      description: '',
      value: 0,
      unit: 'баллов',
      icon: 'gift',
      expirationDays: 30,
      type: '' as BonusTypeType | ''
    };
    this.isAddModalOpen = true;
  }

  addNewBonus(): void {
    if (!this.newBonus.title || !this.newBonus.value || !this.newBonus.type) return;

    const isPercentage = this.newBonus.unit === '%';
    const createData: any = {
      name: this.newBonus.title,
      type: this.newBonus.type as BonusTypeType,
      expirationDays: this.newBonus.expirationDays,
      description: this.newBonus.description || 'Пользовательский бонус',
      iconType: this.mapFrontendIconToBackend(this.newBonus.icon)
    };

    if (isPercentage) {
      createData.bonusPercentage = this.newBonus.value;
    } else {
      createData.bonusAmount = this.newBonus.value;
    }

    this.bonusTypesService.createBonusType(createData).subscribe({
      next: (createdBonusType) => {
        const newRule = this.mapBonusTypeToRule(createdBonusType);
        this.bonusRules.push(newRule);
        this.toastService.success('Бонус успешно создан');
        this.isAddModalOpen = false;
        this.newBonus = {
          title: '',
          description: '',
          value: 0,
          unit: 'баллов',
          icon: 'gift',
          expirationDays: 30,
          type: '' as BonusTypeType | ''
        };
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при создании бонуса';
        this.toastService.error(errorMessage);
      }
    });
  }
}

