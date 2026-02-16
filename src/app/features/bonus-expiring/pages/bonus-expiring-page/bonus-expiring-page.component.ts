import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BonusesService, BonusesExpiringSoon, ClientBonusExpiring, ExpiryGroup } from '../../../../core/services/bonuses.service';
import { MessageTemplatesService, MessageTemplate } from '../../../../core/services/message-templates.service';
import { MessagesService } from '../../../../core/services/messages.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { PhoneFormatPipe } from '../../../../shared/pipes/phone-format.pipe';

@Component({
  selector: 'app-bonus-expiring-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ModalComponent,
    ButtonComponent,
    LoaderComponent,
    PhoneFormatPipe
  ],
  template: `
    <div class="page-wrapper">
      <div class="page-content">
        <div class="page-loading-container" *ngIf="isLoading">
          <app-loader [visible]="true" [overlay]="false" type="logo" size="large"></app-loader>
        </div>

        <div *ngIf="!isLoading">
          <div class="empty-state" *ngIf="!data || data.clients.length === 0">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <p class="empty-title">Нет бонусов, истекающих в ближайшие 7 дней</p>
            <a routerLink="/home" class="back-link">На главную</a>
          </div>

          <div *ngIf="data && data.clients.length > 0" class="clients-list">
            <div class="client-block" *ngFor="let client of data.clients">
              <div class="client-header">
                <div class="client-info">
                  <a [routerLink]="['/clients', client.clientId]" class="client-name">{{ client.clientName }}</a>
                  <span class="client-phone">{{ client.phone | phoneFormat }}</span>
                </div>
              </div>
              <div class="groups-table-wrap">
                <table class="groups-table">
                  <thead>
                    <tr>
                      <th>Истекает</th>
                      <th>Осталось дней</th>
                      <th>Сумма (остаток)</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let group of client.expiryGroups" [class.expiring-soon]="group.daysLeft <= 3" [class.notified]="!!group.notifiedAt">
                      <td>{{ formatDate(group.expiryDate) }}</td>
                      <td>
                        <span class="days-badge" [class.urgent]="group.daysLeft <= 3">{{ group.daysLeft }} {{ daysText(group.daysLeft) }}</span>
                      </td>
                      <td>{{ formatAmount(group.totalRemainingAmount) }} ₸{{ group.items.length > 1 ? ' (' + group.items.length + ' начисл.)' : '' }}</td>
                      <td>
                        <span class="status-badge" [class.notified]="!!group.notifiedAt">{{ group.notifiedAt ? 'Уведомлён' : 'Нужно уведомить' }}</span>
                      </td>
                      <td>
                        <app-button
                          *ngIf="!group.notifiedAt"
                          buttonType="primary"
                          size="small"
                          (onClick)="openNotifyModal(client, group)">
                          <svg class="wa-icon" viewBox="0 0 24 24" fill="none">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor"/>
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="currentColor"/>
                          </svg>
                          WhatsApp
                        </app-button>
                        <span *ngIf="group.notifiedAt" class="notified-label">—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notify modal (for one expiry group) -->
    <app-modal
      [visible]="showNotifyModal"
      title="Уведомить о истечении бонусов"
      [showCloseButton]="true"
      (closed)="closeNotifyModal()">
      <div class="notify-content" *ngIf="selectedClient && selectedGroup">
        <div class="template-section" *ngIf="selectedTemplate">
          <label class="section-label">Шаблон сообщения</label>
          <div class="template-card">
            <h4 class="template-name">{{ selectedTemplate.name }}</h4>
            <p class="template-content">{{ selectedTemplate.content }}</p>
          </div>
        </div>
        <div class="template-not-found" *ngIf="!selectedTemplate && !loadingTemplate">
          <span>Шаблон типа BONUS_EXPIRY не найден. Создайте его в настройках.</span>
        </div>
        <div class="phone-section">
          <label class="section-label">Номер получателя</label>
          <div class="phone-display">{{ selectedClient.phone | phoneFormat }}</div>
        </div>
        <div class="group-info" *ngIf="selectedGroup">
          <span class="group-summary">Истекает {{ formatDate(selectedGroup.expiryDate) }} · {{ formatAmount(selectedGroup.totalRemainingAmount) }} ₸</span>
        </div>
        <div class="message-section" *ngIf="selectedTemplate">
          <label class="section-label">Содержимое сообщения</label>
          <div class="message-box">{{ populatedContent }}</div>
        </div>
        <div class="notify-actions">
          <app-button
            *ngIf="selectedTemplate"
            buttonType="primary"
            size="large"
            class="send-btn"
            (click)="sendAndOpenWhatsApp()"
            [disabled]="isSending">
            <svg class="wa-icon" viewBox="0 0 24 24" fill="none">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="currentColor"/>
            </svg>
            {{ isSending ? 'Отправка...' : 'Отправить в WhatsApp' }}
          </app-button>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .page-wrapper { min-height: 100%; margin: -2rem; padding: 2rem; background: #f8fafc; }
    .page-content { max-width: 900px; margin: 0 auto; }
    .page-loading-container { display: flex; justify-content: center; min-height: 40vh; align-items: center; }
    .empty-state { text-align: center; padding: 4rem 2rem; background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .empty-state svg { width: 64px; height: 64px; color: #94a3b8; margin-bottom: 1rem; }
    .empty-title { font-size: 1.125rem; color: #64748b; margin: 0 0 1.5rem 0; }
    .back-link { color: #16A34A; font-weight: 600; text-decoration: none; }
    .back-link:hover { text-decoration: underline; }
    .clients-list { display: flex; flex-direction: column; gap: 1.5rem; }
    .client-block { background: white; border-radius: 16px; padding: 1.25rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .client-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; }
    .client-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .client-name { font-size: 1.125rem; font-weight: 600; color: #0f172a; text-decoration: none; }
    .client-name:hover { color: #16A34A; }
    .client-phone { font-size: 0.875rem; color: #64748b; font-family: 'Courier New', monospace; }
    .wa-icon { width: 18px; height: 18px; }
    .groups-table-wrap { overflow-x: auto; }
    .groups-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .groups-table th { text-align: left; padding: 0.75rem; background: #f8fafc; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
    .groups-table td { padding: 0.75rem; border-bottom: 1px solid #f1f5f9; }
    .groups-table tr.expiring-soon { background: #fef3c7; }
    .groups-table tr.notified { background: #f0fdf4; }
    .days-badge { padding: 0.25rem 0.5rem; border-radius: 8px; background: #dcfce7; color: #166534; font-weight: 500; }
    .days-badge.urgent { background: #fef3c7; color: #92400e; }
    .status-badge { font-size: 0.8125rem; font-weight: 500; color: #92400e; }
    .status-badge.notified { color: #166534; }
    .notified-label { color: #94a3b8; font-size: 0.875rem; }
    .notify-content { display: flex; flex-direction: column; gap: 1.25rem; }
    .section-label { font-size: 0.875rem; font-weight: 600; color: #475569; display: block; margin-bottom: 0.5rem; }
    .template-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; }
    .template-name { margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600; color: #1f2937; }
    .template-content { margin: 0; font-size: 0.9375rem; color: #475569; white-space: pre-wrap; }
    .template-not-found { padding: 1rem; background: #fef3c7; border-radius: 12px; color: #92400e; font-size: 0.875rem; }
    .phone-display { padding: 0.75rem 1rem; background: #f8fafc; border-radius: 10px; font-family: 'Courier New', monospace; font-weight: 500; }
    .group-info { padding: 0.5rem 0; }
    .group-summary { font-size: 0.875rem; color: #64748b; }
    .message-box { padding: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 0.9375rem; white-space: pre-wrap; max-height: 200px; overflow-y: auto; }
    .notify-actions { margin-top: 0.5rem; }
    .send-btn { width: 100%; }
    .send-btn ::ng-deep button { width: 100%; justify-content: center; }
  `]
})
export class BonusExpiringPageComponent implements OnInit {
  private bonusesService = inject(BonusesService);
  private messageTemplatesService = inject(MessageTemplatesService);
  private messagesService = inject(MessagesService);
  private toastService = inject(ToastService);
  private pageHeaderService = inject(PageHeaderService);

  isLoading = true;
  data: BonusesExpiringSoon | null = null;

  showNotifyModal = false;
  selectedClient: ClientBonusExpiring | null = null;
  selectedGroup: ExpiryGroup | null = null;
  selectedTemplate: MessageTemplate | null = null;
  populatedContent = '';
  loadingTemplate = false;
  isSending = false;

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Бонусы истекают скоро', [
      { label: 'Главная', route: '/home' },
      { label: 'Бонусы истекают скоро' }
    ]);
    this.loadData();
  }

  loadData(): void {
    this.bonusesService.getBonusesExpiringSoon().subscribe({
      next: (d) => {
        this.data = d;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  formatAmount(amount: number): string {
    return typeof amount === 'number' ? amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  daysText(days: number): string {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
  }

  openNotifyModal(client: ClientBonusExpiring, group: ExpiryGroup): void {
    this.selectedClient = client;
    this.selectedGroup = group;
    this.showNotifyModal = true;
    this.selectedTemplate = null;
    this.populatedContent = '';
    this.loadingTemplate = true;
    this.messageTemplatesService.getAllTemplates('BONUS_EXPIRY').subscribe({
      next: (templates) => {
        this.loadingTemplate = false;
        if (templates && templates.length > 0) {
          this.selectedTemplate = templates[0];
          this.messageTemplatesService.getPopulatedTemplate('BONUS_EXPIRY', client.clientId, undefined, group.expiryDate).subscribe({
            next: (pop) => {
              this.populatedContent = pop.populatedContent;
            },
            error: () => {
              this.populatedContent = this.selectedTemplate?.content ?? '';
            }
          });
        }
      },
      error: () => {
        this.loadingTemplate = false;
      }
    });
  }

  closeNotifyModal(): void {
    this.showNotifyModal = false;
    this.selectedClient = null;
    this.selectedGroup = null;
    this.selectedTemplate = null;
    this.populatedContent = '';
    this.isSending = false;
  }

  sendAndOpenWhatsApp(): void {
    if (!this.selectedClient || !this.selectedGroup || this.isSending) return;
    const message = this.populatedContent || this.selectedTemplate?.content || '';
    if (!message) {
      this.toastService.error('Нет текста сообщения');
      return;
    }
    this.isSending = true;
    const clientId = this.selectedClient.clientId;
    const expiryDate = this.selectedGroup.expiryDate;
    this.messagesService.sendMessage({
      clientId,
      messageContent: message,
      channel: 'WHATSAPP'
    }).subscribe({
      next: (response) => {
        this.bonusesService.recordBonusExpiryNotified({
          clientId,
          expiryDate,
          messageRecordId: response.id != null ? Number(response.id) : undefined
        }).subscribe({
          next: () => {
            this.openWhatsAppWeb(this.selectedClient!.phone, message);
            this.toastService.success('Сообщение записано, открывается WhatsApp');
            this.loadData();
            this.closeNotifyModal();
          },
          error: (err) => {
            this.toastService.error(err.error?.message || 'Ошибка при записи уведомления');
          }
        });
        this.isSending = false;
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Ошибка при отправке');
        this.isSending = false;
      }
    });
  }

  private openWhatsAppWeb(phone: string, message: string): void {
    let clean = phone.replace(/[\s\-\(\)\+]/g, '');
    if (clean.startsWith('8')) clean = '7' + clean.substring(1);
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
}
