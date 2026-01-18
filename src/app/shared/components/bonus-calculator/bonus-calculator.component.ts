import { Component, Input, signal, computed, OnChanges, SimpleChanges, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SliderComponent } from '../slider/slider.component';
import { ModalComponent } from '../modal/modal.component';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ToastService } from '../../../core/services/toast.service';

interface CalculatorStatus {
  type: 'danger' | 'warning' | 'excellent' | 'low-motivation';
  title: string;
  description: string;
}

@Component({
  selector: 'app-bonus-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, SliderComponent, ModalComponent],
  template: `
    <div class="calculator-wrapper">
      <div *ngIf="isLoading()" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p class="loading-text">Загрузка данных...</p>
      </div>
      <div class="calculator-header">
        <div class="header-icon">
         <svg style="width: 100px; height: 100px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><style>.cls-1{fill:#1d384d}</style></defs><g id="icons_without_caption" data-name="icons without caption"><g id="CALCULATOR"><path class="cls-1" d="M169.67 201.83H86.33a18.48 18.48 0 0 1-18.46-18.46V72.63a18.48 18.48 0 0 1 18.46-18.46h83.34a18.48 18.48 0 0 1 18.46 18.46v110.74a18.48 18.48 0 0 1-18.46 18.46zM86.33 58.17a14.47 14.47 0 0 0-14.46 14.46v110.74a14.47 14.47 0 0 0 14.46 14.46h83.34a14.48 14.48 0 0 0 14.46-14.46V72.63a14.47 14.47 0 0 0-14.46-14.46z"/><path class="cls-1" d="M97.16 148.06a12 12 0 1 1 12-12 12 12 0 0 1-12 12zm0-19.91a8 8 0 1 0 8 8 8 8 0 0 0-8-8zM128.86 148.06a12 12 0 1 1 12-12 12 12 0 0 1-12 12zm0-19.91a8 8 0 1 0 8 8 8 8 0 0 0-8-8zM97.16 181.29a12 12 0 1 1 12-12 12 12 0 0 1-12 12zm0-19.91a8 8 0 1 0 8 8 8 8 0 0 0-8-8.01zM128.86 181.29a12 12 0 1 1 12-12 12 12 0 0 1-12 12zm0-19.91a8 8 0 1 0 8 8 8 8 0 0 0-8-8.01zM160.56 148.06a12 12 0 1 1 12-12 12 12 0 0 1-12 12zm0-19.91a8 8 0 1 0 8 8 8 8 0 0 0-8-8zM160.56 181.29a12 12 0 1 1 12-12 12 12 0 0 1-12 12zm0-19.91a8 8 0 1 0 8 8 8 8 0 0 0-8-8.01zM172.52 105.89H85.2V73.34h87.32zm-83.32-4h79.32V77.34H89.2z"/></g></g></svg>
        </div>
        <h2 class="calculator-title">Калькулятор безопасности бонусной программы</h2>
        <p class="calculator-subtitle">
          Настройте параметры программы и узнайте, насколько безопасна ваша конфигурация
        </p>
      </div>

      <div class="calculator-content">
        <!-- Main Layout: Sliders Left, Financial Right -->
        <div class="main-layout">
          <!-- Left: Input Section -->
          <div class="input-section">
            <div class="fixed-values">
              <div class="fixed-value-item">
                <div class="fixed-icon revenue-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              <div class="fixed-content">
                <span class="fixed-label">Месячная выручка</span>
                <span class="fixed-value">{{ formatCurrency(monthlyRevenueSignal()) }} ₸</span>
              </div>
            </div>
            <div class="fixed-value-item">
              <div class="fixed-icon check-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="fixed-content">
                <span class="fixed-label">Средний чек</span>
                <span class="fixed-value">{{ formatCurrency(averageCheckSignal()) }} ₸</span>
              </div>
              </div>
            </div>

            <div class="slider-group">
            <div class="slider-item">
              <div class="slider-header">
                <div class="slider-title-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="slider-title-icon">
                    <circle cx="9" cy="9" r="2" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="15" cy="15" r="2" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M5 19L19 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <label class="slider-label-text">Процент начисления (кэшбек)</label>
                </div>
                <span class="slider-value-display">{{ earnPercent() }}%</span>
              </div>
              <div class="slider-container-wrapper">
                <app-slider
                  [(ngModel)]="earnPercentValue"
                  [min]="1"
                  [max]="20"
                  [step]="0.5"
                  [showValue]="false">
                </app-slider>
              </div>
              <div class="slider-range">
                <span>1%</span>
                <span>20%</span>
              </div>
            </div>

            <div class="slider-item">
              <div class="slider-header">
                <div class="slider-title-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="slider-title-icon">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <label class="slider-label-text">Максимальный процент оплаты бонусами</label>
                </div>
                <span class="slider-value-display">{{ burnLimitPercent() }}%</span>
              </div>
              <div class="slider-container-wrapper">
                <app-slider
                  [(ngModel)]="burnLimitPercentValue"
                  [min]="10"
                  [max]="100"
                  [step]="2.5"
                  [showValue]="false">
                </app-slider>
              </div>
              <div class="slider-range">
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          </div>

          <!-- Right: Financial Breakdown -->
          <div class="financial-breakdown">
            <div class="breakdown-header">
              <div class="breakdown-header-left">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="breakdown-header-icon">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h3 class="breakdown-title">Финансовые показатели</h3>
              </div>
              <button class="help-button" (click)="openFinancialHelpModal()" type="button" aria-label="Помощь">
                <svg width="40px" height="40px" viewBox="-2 0 10 10" id="meteor-icon-kit__regular-questionmark-s" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 3C2 3.5523 1.5523 4 1 4C0.44772 4 0 3.5523 0 3C0 1.44772 1.4477 0 3 0C4.5523 0 6 1.44772 6 3C6 4.285 5.5004 4.8678 4.4472 5.3944C4.0004 5.6178 4 5.6183 4 6C4 6.5523 3.5523 7 3 7C2.4477 7 2 6.5523 2 6C2 4.715 2.4996 4.1322 3.5528 3.6056C3.9996 3.3822 4 3.3817 4 3C4 2.55228 3.4477 2 3 2C2.5523 2 2 2.55228 2 3zM3 10C2.4477 10 2 9.5523 2 9C2 8.4477 2.4477 8 3 8C3.5523 8 4 8.4477 4 9C4 9.5523 3.5523 10 3 10z" fill="#758CA3"/></svg>
              </button>
            </div>
            <div class="breakdown-items">
              <div class="breakdown-item">
                <div class="breakdown-item-content">
                  <div class="breakdown-icon-wrapper gift-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                      <path d="M20 12v9H4v-9" stroke="currentColor" stroke-width="1.5"/>
                      <rect x="2" y="7" width="20" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M12 22V7" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                  </div>
                  <div class="breakdown-text">
                    <span class="breakdown-label">Дарим с каждого чека</span>
                    <span class="breakdown-value">{{ formatCurrency(giftPerClient()) }} ₸</span>
                  </div>
                </div>
              </div>
              <div class="breakdown-item">
                <div class="breakdown-item-content">
                  <div class="breakdown-icon-wrapper fund-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div class="breakdown-text">
                    <span class="breakdown-label">Фонд бонусов за месяц</span>
                    <span class="breakdown-value">{{ formatCurrency(totalLiability()) }} ₸</span>
                  </div>
                </div>
              </div>
              <div class="breakdown-item highlight">
                <div class="breakdown-item-content">
                  <div class="breakdown-icon-wrapper shield-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="shield-icon">
                      <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                  </div>
                  <div class="breakdown-text">
                    <span class="breakdown-label">Гарантированная выручка с чека</span>
                    <div class="breakdown-value-group">
                      <span class="breakdown-value highlight-value">{{ formatCurrency(guaranteedCash()) }} ₸</span>
                      <span class="breakdown-difference" [class.positive]="guaranteedCashDifference() >= 0" [class.negative]="guaranteedCashDifference() < 0">
                        {{ guaranteedCashDifference() >= 0 ? '+' : '' }}{{ formatCurrency(guaranteedCashDifference()) }} ₸
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vulnerability Score Indicator -->
        <div class="vulnerability-score-section">
          <div class="score-header">
            <div class="score-header-left">
              <span class="score-label">Индекс уязвимости</span>
            </div>
            <div class="score-header-right">
              <button class="help-button" (click)="openScoreHelpModal()" type="button" aria-label="Помощь">
                <svg width="40px" height="40px" viewBox="-2 0 10 10" id="meteor-icon-kit__regular-questionmark-s" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 3C2 3.5523 1.5523 4 1 4C0.44772 4 0 3.5523 0 3C0 1.44772 1.4477 0 3 0C4.5523 0 6 1.44772 6 3C6 4.285 5.5004 4.8678 4.4472 5.3944C4.0004 5.6178 4 5.6183 4 6C4 6.5523 3.5523 7 3 7C2.4477 7 2 6.5523 2 6C2 4.715 2.4996 4.1322 3.5528 3.6056C3.9996 3.3822 4 3.3817 4 3C4 2.55228 3.4477 2 3 2C2.5523 2 2 2.55228 2 3zM3 10C2.4477 10 2 9.5523 2 9C2 8.4477 2.4477 8 3 8C3.5523 8 4 8.4477 4 9C4 9.5523 3.5523 10 3 10z" fill="#758CA3"/></svg>
              </button>
              <div class="score-badge" [class]="'score-' + scoreLevel()">
                <span class="score-value">{{ formatScore(vulnerabilityScore()) }}</span>
              </div>
            </div>
          </div>
          <div class="score-bar">
            <div class="score-bar-fill" [class]="'score-' + scoreLevel()" [style.width.%]="scorePercentage()"></div>
          </div>
          <div class="score-thresholds">
            <span class="threshold-item" [class.active]="scoreLevel() === 'excellent'">
              <span class="threshold-dot excellent"></span>
              <span class="threshold-label">Безопасно (≤30)</span>
            </span>
            <span class="threshold-item" [class.active]="scoreLevel() === 'warning'">
              <span class="threshold-dot warning"></span>
              <span class="threshold-label">Внимание (31-60)</span>
            </span>
            <span class="threshold-item" [class.active]="scoreLevel() === 'danger'">
              <span class="threshold-dot danger"></span>
              <span class="threshold-label">Опасно (>60)</span>
            </span>
          </div>
        </div>

        <!-- Result Card -->
        <div class="result-card" [class]="'status-' + status().type">
          <div class="result-icon-wrapper">
            <div class="result-icon">
              <svg *ngIf="status().type === 'danger'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <svg *ngIf="status().type === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2"/>
                <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <svg *ngIf="status().type === 'excellent'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" stroke="currentColor" stroke-width="2"/>
              </svg>
              <svg *ngIf="status().type === 'low-motivation'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
          <div class="result-content">
            <h3 class="result-title">{{ status().title }}</h3>
            <p class="result-description">{{ status().description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Financial Help Modal -->
    <app-modal
      [visible]="isFinancialHelpModalOpen"
      title="Финансовые показатели"
      [showCloseButton]="true"
      (visibleChange)="isFinancialHelpModalOpen = $event">
      <div class="help-modal-content">
        <div class="help-item">
          <h4 class="help-item-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="help-item-icon">
              <path d="M20 12v9H4v-9" stroke="currentColor" stroke-width="1.5"/>
              <rect x="2" y="7" width="20" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12 22V7" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            Дарим с каждого чека
          </h4>
          <p class="help-item-description">
            Сумма денег, которую вы отдаете клиенту в виде бонусов при каждой транзакции. 
            Рассчитывается как: <strong>Средний чек × Процент начисления</strong>.
          </p>
        </div>

        <div class="help-item">
          <h4 class="help-item-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="help-item-icon">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Фонд бонусов за месяц
          </h4>
          <p class="help-item-description">
            Общая сумма виртуальных денег (бонусов), которую вы выпускаете за месяц. 
            Это ваш потенциальный риск. Рассчитывается как: <strong>Месячная выручка × Процент начисления</strong>.
          </p>
        </div>

        <div class="help-item highlight">
          <h4 class="help-item-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="help-item-icon">
              <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            Гарантированная выручка с чека
          </h4>
          <p class="help-item-description">
            Минимальная сумма реальных денег, которую вы получите с каждого заказа, независимо от того, 
            сколько бонусов потратит клиент. Это ваша защита от кассового разрыва.
            <br><br>
            Рассчитывается как: <strong>Средний чек × (1 - Максимальный процент оплаты бонусами)</strong>.
            <br><br>
            <strong>Разница</strong> показывает, насколько гарантированная выручка отличается от среднего чека. 
            Отрицательное значение означает, что вы теряете часть выручки.
          </p>
        </div>
      </div>
    </app-modal>

    <!-- Score Help Modal -->
    <app-modal
      [visible]="isScoreHelpModalOpen"
      title="Индекс уязвимости"
      [showCloseButton]="true"
      (visibleChange)="isScoreHelpModalOpen = $event">
      <div class="help-modal-content">
        <div class="help-item">
          <h4 class="help-item-title">Что это такое?</h4>
          <p class="help-item-description">
            Индекс уязвимости показывает, насколько ваша бонусная программа подвержена риску кассового разрыва. 
            Чем выше индекс, тем больше риск потерять живые деньги.
          </p>
        </div>

        <div class="help-item">
          <h4 class="help-item-title">Как рассчитывается?</h4>
          <div class="help-item-description">
            <p>Формула: <strong>Максимальный процент оплаты бонусами × (1 + Процент начисления / 10)</strong></p>
            <p>Индекс учитывает:</p>
            <ul class="help-list">
              <li><strong>Максимальный процент оплаты бонусами</strong> — прямой риск потери выручки</li>
              <li><strong>Процент начисления</strong> — чем выше кэшбек, тем чаще клиенты тратят бонусы</li>
            </ul>
          </div>
        </div>

        <div class="help-item">
          <h4 class="help-item-title">Уровни риска</h4>
          <div class="help-levels">
            <div class="help-level excellent">
              <div class="help-level-header">
                <span class="help-level-dot excellent"></span>
                <strong>Безопасно (≤30)</strong>
              </div>
              <p>Ваша гарантированная выручка под защитой. Риски минимальны.</p>
            </div>
            <div class="help-level warning">
              <div class="help-level-header">
                <span class="help-level-dot warning"></span>
                <strong>Внимание (31-60)</strong>
              </div>
              <p>Умеренный риск. Убедитесь, что ваша маржа выше 30%.</p>
            </div>
            <div class="help-level danger">
              <div class="help-level-header">
                <span class="help-level-dot danger"></span>
                <strong>Опасно (>60)</strong>
              </div>
              <p>Критический риск! Угроза кассового разрыва. Срочно пересмотрите настройки.</p>
            </div>
          </div>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .calculator-wrapper {
      position: relative;
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin-top: 2rem;
      transition: all 0.3s ease;
    }

    .calculator-wrapper:hover {
      box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
    }

    .calculator-header {
      margin-bottom: 2.5rem;
      position: relative;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .header-icon svg {
      width: 28px;
      height: 28px;
      color: #16A34A;
    }

    .calculator-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.02em;
    }

    .calculator-subtitle {
      font-size: 0.95rem;
      color: #64748b;
      margin: 0;
      line-height: 1.6;
    }

    .calculator-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .main-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    /* Input Section */
    .input-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .fixed-values {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }

    .fixed-value-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
    }

    .fixed-value-item:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    //   transform: translateY(-1px);
    }

    .fixed-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .fixed-icon.revenue-icon {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      color: #2563eb;
    }

    .fixed-icon.check-icon {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #16A34A;
    }

    .fixed-icon svg {
      width: 24px;
      height: 24px;
    }

    .fixed-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .fixed-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .fixed-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .slider-group {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .slider-item {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.5rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
    }

    .slider-item:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .slider-title-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .slider-title-icon {
      width: 20px;
      height: 20px;
      color: #16A34A;
      flex-shrink: 0;
    }

    .slider-label-text {
      font-size: 0.95rem;
      font-weight: 600;
      color: #475569;
    }

    .slider-value-display {
      font-size: 1.5rem;
      font-weight: 700;
      color: #16A34A;
      letter-spacing: -0.02em;
    }

    .slider-container-wrapper {
      padding: 0.5rem 0;
    }

    .slider-container-wrapper ::ng-deep .slider {
      height: 8px;
      background: #e2e8f0;
    }

    .slider-container-wrapper ::ng-deep .slider::-webkit-slider-thumb {
      width: 24px;
      height: 24px;
      background: #16A34A;
      box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
      transition: all 0.2s ease;
    }

    .slider-container-wrapper ::ng-deep .slider::-webkit-slider-thumb:hover {
      background: #15803d;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
    //   transform: scale(1.1);
    }

    .slider-container-wrapper ::ng-deep .slider::-moz-range-thumb {
      width: 24px;
      height: 24px;
      background: #16A34A;
      border: none;
      box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
      transition: all 0.2s ease;
    }

    .slider-container-wrapper ::ng-deep .slider::-moz-range-thumb:hover {
      background: #15803d;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
    //   transform: scale(1.1);
    }

    .slider-range {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
    }

    /* Result Card */
    .result-card {
      padding: 1.75rem;
      border-radius: 14px;
      display: flex;
      gap: 1.25rem;
      align-items: flex-start;
      border: 2px solid;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .result-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: currentColor;
      opacity: 0.3;
    }

    .result-card.status-danger {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border-color: #fecaca;
      color: #991b1b;
    }

    .result-card.status-warning {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border-color: #fde68a;
      color: #92400e;
    }

    .result-card.status-excellent {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-color: #bbf7d0;
      color: #15803d;
    }

    .result-card.status-low-motivation {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-color: #cbd5e1;
      color: #64748b;
    }

    .result-icon-wrapper {
      flex-shrink: 0;
    }

    .result-icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.8);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .result-icon svg {
      width: 28px;
      height: 28px;
    }

    .result-content {
      flex: 1;
    }

    .result-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }

    .result-description {
      font-size: 0.9rem;
      line-height: 1.6;
      margin: 0;
      opacity: 0.9;
    }

    /* Financial Breakdown */
    .financial-breakdown {
      background: #f8fafc;
      border-radius: 14px;
      padding: 1.75rem;
      border: 1px solid #e2e8f0;
    }

    .breakdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .breakdown-header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .breakdown-header-icon {
      width: 24px;
      height: 24px;
      color: #16A34A;
    }

    .breakdown-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .breakdown-items {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .breakdown-item {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
      overflow: hidden;
    }

    .breakdown-item:hover {
      border-color: #cbd5e1;
    //   transform: translateY(-1px);
    //   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .breakdown-item.highlight {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border-color: #86efac;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
    }

    .breakdown-item.highlight:hover {
      box-shadow: 0 6px 16px rgba(22, 163, 74, 0.25);
    //   transform: translateY(-2px);
    }

    .breakdown-item-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
    }

    .breakdown-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .breakdown-icon-wrapper.gift-icon {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #d97706;
    }

    .breakdown-icon-wrapper.fund-icon {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      color: #2563eb;
    }

    .breakdown-icon-wrapper.shield-icon-wrapper {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #16A34A;
    }

    .breakdown-icon-wrapper svg {
      width: 24px;
      height: 24px;
    }

    .breakdown-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .breakdown-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .breakdown-item.highlight .breakdown-label {
      color: #15803d;
    }

    .shield-icon {
      width: 24px;
      height: 24px;
    }

    .breakdown-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .breakdown-item.highlight .breakdown-value {
      color: #15803d;
      font-size: 1.75rem;
    }

    .breakdown-value-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      align-items: start;
    }

    .breakdown-difference {
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }

    .breakdown-difference.positive {
      color: #15803d;
      background: rgba(22, 163, 74, 0.1);
    }

    .breakdown-difference.negative {
      color: #dc2626;
    //   background: rgba(220, 38, 38, 0.1);
    }

    /* Vulnerability Score Section */
    .vulnerability-score-section {
      background: #f8fafc;
      border-radius: 14px;
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      margin-top: 1rem;
    }

    .score-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .score-header-left {
      display: flex;
      align-items: center;
    }

    .score-header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .score-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .score-badge {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }

    .score-badge.score-excellent {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #15803d;
    }

    .score-badge.score-warning {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #92400e;
    }

    .score-badge.score-danger {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      color: #991b1b;
    }

    .score-value {
      display: inline-block;
    }

    .score-bar {
      width: 100%;
      height: 12px;
      background: #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 1rem;
      position: relative;
    }

    .score-bar-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.3s ease, background 0.3s ease;
    }

    .score-bar-fill.score-excellent {
      background: linear-gradient(90deg, #16A34A 0%, #22c55e 100%);
    }

    .score-bar-fill.score-warning {
      background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
    }

    .score-bar-fill.score-danger {
      background: linear-gradient(90deg, #dc2626 0%, #ef4444 100%);
    }

    .score-thresholds {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .threshold-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      font-size: 0.8rem;
      color: #64748b;
      transition: all 0.2s ease;
    }

    .threshold-item.active {
      color: #0f172a;
      font-weight: 600;
    }

    .threshold-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .threshold-dot.excellent {
      background: #16A34A;
    }

    .threshold-dot.warning {
      background: #f59e0b;
    }

    .threshold-dot.danger {
      background: #dc2626;
    }

      .threshold-label {
        white-space: nowrap;
      }

      /* Loading Overlay */
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        border-radius: 16px;
        z-index: 10;
      }

      .loading-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e2e8f0;
        border-top-color: #16A34A;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .loading-text {
        font-size: 0.9rem;
        color: #64748b;
        font-weight: 500;
        margin: 0;
      }

    /* Help Button */
    .help-button {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid #cbd5e1;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #64748b;
      flex-shrink: 0;
    }

    .help-button:hover {
      background: #f8fafc;
      border-color: #16A34A;
      color: #16A34A;
    //   transform: scale(1.1);
    }

    .help-button svg {
      width: 16px;
      height: 16px;
    }

    /* Help Modal Content */
    .help-modal-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 0.5rem 0;
    }

    .help-item {
      padding: 1rem;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }

    .help-item.highlight {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border-color: #86efac;
    }

    .help-item-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.75rem 0;
    }

    .help-item-icon {
      width: 20px;
      height: 20px;
      color: #16A34A;
      flex-shrink: 0;
    }

    .help-item-description {
      font-size: 0.9rem;
      line-height: 1.6;
      color: #475569;
      margin: 0;
    }

    .help-item-description strong {
      color: #0f172a;
      font-weight: 600;
    }

    .help-list {
      margin: 0.75rem 0 0 0;
      padding-left: 1.5rem;
      color: #475569;
    }

    .help-list li {
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }

    .help-levels {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 0.75rem;
    }

    .help-level {
      padding: 1rem;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .help-level.excellent {
      border-left: 4px solid #16A34A;
    }

    .help-level.warning {
      border-left: 4px solid #f59e0b;
    }

    .help-level.danger {
      border-left: 4px solid #dc2626;
    }

    .help-level-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
    }

    .help-level-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .help-level-dot.excellent {
      background: #16A34A;
    }

    .help-level-dot.warning {
      background: #f59e0b;
    }

    .help-level-dot.danger {
      background: #dc2626;
    }

    .help-level p {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
      line-height: 1.5;
    }

    @media (max-width: 1024px) {
      .main-layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .calculator-wrapper {
        padding: 1.5rem;
      }

      .calculator-title {
        font-size: 1.5rem;
      }

      .fixed-values {
        grid-template-columns: 1fr;
      }

      .fixed-value-item {
        flex-direction: column;
        text-align: center;
      }

      .slider-item {
        padding: 1.25rem;
      }

      .slider-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .result-card {
        flex-direction: column;
        text-align: center;
        padding: 1.5rem;
      }

      .result-icon-wrapper {
        margin: 0 auto;
      }

      .breakdown-item-content {
        flex-direction: column;
        text-align: center;
      }

      .breakdown-value-group {
        align-items: center;
      }

      .score-thresholds {
        flex-direction: column;
        gap: 0.5rem;
      }

      .threshold-item {
        justify-content: flex-start;
      }
    }
  `]
})
export class BonusCalculatorComponent implements OnInit, OnDestroy {
  // Inputs are optional - if not provided, will fetch from API
  @Input() monthlyRevenue?: number;
  @Input() averageCheck?: number;

  monthlyRevenueSignal = signal<number>(0);
  averageCheckSignal = signal<number>(0);
  
  isLoading = signal<boolean>(false);
  
  private analyticsService = inject(AnalyticsService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private navigationSubscription?: Subscription;

  ngOnInit(): void {
    // If inputs are provided, use them; otherwise fetch from API
    if (this.monthlyRevenue !== undefined && this.averageCheck !== undefined) {
      this.monthlyRevenueSignal.set(this.monthlyRevenue);
      this.averageCheckSignal.set(this.averageCheck);
    } else {
      this.loadAnalyticsData();
      
      // Subscribe to navigation events to refresh data when returning to the page
      this.navigationSubscription = this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          // Only reload if we're on the bonus-program page
          if (event.urlAfterRedirects?.includes('/bonus-program')) {
            this.loadAnalyticsData();
          }
        });
    }
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  loadAnalyticsData(): void {
    this.isLoading.set(true);
    
    // Fetch both endpoints in parallel
    forkJoin({
      revenue: this.analyticsService.getMonthlyRevenue(),
      averageCheck: this.analyticsService.getAverageCheck('MONTHLY')
    }).subscribe({
      next: (responses) => {
        // Use 'amount' field from API response, with fallback to 'revenue' for backward compatibility
        if (responses.revenue.amount !== undefined && responses.revenue.amount !== null) {
          this.monthlyRevenueSignal.set(responses.revenue.amount);
        } else if (responses.revenue.revenue !== undefined && responses.revenue.revenue !== null) {
          this.monthlyRevenueSignal.set(responses.revenue.revenue); // Fallback
        }
        // Use 'amount' field from API response, with fallback to 'averageCheck' for backward compatibility
        if (responses.averageCheck.amount !== undefined && responses.averageCheck.amount !== null) {
          this.averageCheckSignal.set(responses.averageCheck.amount);
        } else if (responses.averageCheck.averageCheck !== undefined && responses.averageCheck.averageCheck !== null) {
          this.averageCheckSignal.set(responses.averageCheck.averageCheck); // Fallback
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка загрузки аналитических данных';
        this.toastService.error(errorMessage);
        this.isLoading.set(false);
      }
    });
  }

  isFinancialHelpModalOpen = false;
  isScoreHelpModalOpen = false;

  earnPercent = signal<number>(5);
  burnLimitPercent = signal<number>(50);

  get earnPercentValue(): number {
    return this.earnPercent();
  }

  set earnPercentValue(value: number) {
    this.earnPercent.set(value);
  }

  get burnLimitPercentValue(): number {
    return this.burnLimitPercent();
  }

  set burnLimitPercentValue(value: number) {
    this.burnLimitPercent.set(value);
  }

  // Calculated metrics
  giftPerClient = computed(() => {
    return this.averageCheckSignal() * (this.earnPercent() / 100);
  });

  totalLiability = computed(() => {
    return this.monthlyRevenueSignal() * (this.earnPercent() / 100);
  });

  guaranteedCash = computed(() => {
    return this.averageCheckSignal() * (1 - (this.burnLimitPercent() / 100));
  });

  guaranteedCashDifference = computed(() => {
    return this.guaranteedCash() - this.averageCheckSignal();
  });

  vulnerabilityScore = computed(() => {
    const burnLimit = this.burnLimitPercent();
    const earnPercent = this.earnPercent();
    return burnLimit * (1 + (earnPercent / 10));
  });

  scoreLevel = computed<'excellent' | 'warning' | 'danger'>(() => {
    const score = this.vulnerabilityScore();
    if (score <= 30) return 'excellent';
    if (score > 30 && score <= 60) return 'warning';
    return 'danger';
  });

  scorePercentage = computed(() => {
    const score = this.vulnerabilityScore();
    // Максимальное значение для визуализации - 100
    return Math.min((score / 100) * 100, 100);
  });

  status = computed<CalculatorStatus>(() => {
    const earnPercentValue = this.earnPercent();
    const score = this.vulnerabilityScore();

    // Special Edge Case: Low Motivation
    if (earnPercentValue < 3) {
      return {
        type: 'low-motivation',
        title: 'Слабая мотивация',
        description: 'Процент начисления слишком низкий, чтобы мотивировать клиентов возвращаться.'
      };
    }

    // Level 1: EXCELLENT
    if (score <= 30) {
      return {
        type: 'excellent',
        title: 'Отличный баланс',
        description: 'Отличный баланс. Ваша гарантированная выручка под защитой. Риски минимальны.'
      };
    }

    // Level 2: CAUTION
    if (score > 30 && score <= 60) {
      return {
        type: 'warning',
        title: 'Внимание',
        description: 'Умеренный риск. Вы разрешаете списывать ощутимую часть чека. Убедитесь, что ваша маржа выше 30%.'
      };
    }

    // Level 3: DANGER
    return {
      type: 'danger',
      title: 'Опасно',
      description: 'Критический риск! Угроза кассового разрыва. Вы теряете слишком много живых денег с заказа.'
    };
  });

  formatCurrency(value: number): string {
    return Math.round(value).toLocaleString('ru-RU');
  }

  formatScore(value: number): string {
    return value.toFixed(1);
  }

  openFinancialHelpModal(): void {
    this.isFinancialHelpModalOpen = true;
  }

  openScoreHelpModal(): void {
    this.isScoreHelpModalOpen = true;
  }
}
