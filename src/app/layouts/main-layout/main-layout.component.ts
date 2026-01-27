import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { PageHeaderComponent } from '../page-header/page-header.component';
import { MobileHeaderComponent } from '../mobile-header/mobile-header.component';
import { TransactionModalComponent } from '../../shared/components/transaction-modal/transaction-modal.component';
import { TransactionModalService } from '../../core/services/transaction-modal.service';
import { MessageTemplate } from '../../shared/components/invitation-form/invitation-form.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent, PageHeaderComponent, MobileHeaderComponent, TransactionModalComponent],
  template: `
    <div class="main-layout">
      <!-- Mobile Header (only visible on mobile) -->
      <app-mobile-header 
        [logoText]="'WestWood'"
        (menuClick)="onMobileMenuClick()">
      </app-mobile-header>
      
      <app-sidebar #sidebar (collapsedChange)="onSidebarCollapsed($event)" (closedChange)="onSidebarClosed($event)">
        <div class="main-content-wrapper">
          <app-page-header></app-page-header>
          <main class="main-content">
            <ng-content></ng-content>
          </main>
        </div>
      </app-sidebar>
    </div>

    <!-- Global Transaction Modal -->
    <app-transaction-modal
      [visible]="(transactionModalService.visible$ | async) ?? false"
      [welcomeMessageTemplates]="welcomeMessageTemplates"
      (visibleChange)="transactionModalService.close()"
      (transactionComplete)="onTransactionComplete($event)"
      (messageSent)="onMessageSent($event)">
    </app-transaction-modal>
  `,
  styles: [`
    .main-layout {
      min-height: 100vh;
      display: flex;
      overflow-x: hidden;
      width: 100%;
    }

    .main-content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      padding: 0 2rem;
      background-color: #f9fafb;
    }

    app-page-header {
      display: block;
      background-color: #f9fafb;
    }

    .main-content {
      flex: 1;
      background-color: #f9fafb;
    }

    @media (max-width: 768px) {
      .main-content-wrapper {
        padding: 0 1rem;
        padding-top: 80px; /* Account for fixed mobile header + extra spacing */
      }

      app-page-header {
        padding-top: 0.5rem; /* Additional spacing for page header */
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  isSidebarCollapsed = false;
  isSidebarClosed = false;
  
  transactionModalService = inject(TransactionModalService);
  welcomeMessageTemplates: MessageTemplate[] = [];

  ngOnInit(): void {
    this.loadWelcomeMessageTemplates();
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  onSidebarClosed(closed: boolean): void {
    this.isSidebarClosed = closed;
  }

  onMobileMenuClick(): void {
    if (this.sidebar) {
      this.sidebar.openSidebar();
    }
  }

  onTransactionComplete(result: any): void {
    console.log('Transaction completed:', result);
    // Emit to service so pages can subscribe and reload data
    this.transactionModalService.emitTransactionComplete(result);
  }

  onMessageSent(event: { phone: string; message: string }): void {
    console.log('Message sent:', event);
    // Здесь можно добавить логику отправки сообщения через WhatsApp API
    // Например, открыть WhatsApp Web с предзаполненным сообщением
    const encodedMessage = encodeURIComponent(event.message);
    const whatsappUrl = `https://wa.me/${event.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  private loadWelcomeMessageTemplates(): void {
    try {
      const templatesJson = localStorage.getItem('whatsapp_message_templates');
      if (templatesJson) {
        const templates = JSON.parse(templatesJson);
        // Convert date strings back to Date objects
        this.welcomeMessageTemplates = templates.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt)
        }));
      } else {
        // Default welcome template if none exist
        this.welcomeMessageTemplates = [{
          id: 'default',
          name: 'Приветственное сообщение',
          type: 'bonus_accrued',
          content: 'Добро пожаловать, {clientName}! Спасибо за покупку. Вам начислено {clientBonus} бонусов.',
          createdAt: new Date()
        }];
      }
    } catch (e) {
      console.error('Failed to load templates', e);
      this.welcomeMessageTemplates = [];
    }
  }

  getHeaderMarginLeft(): number {
    // На мобильных устройствах (когда sidebar закрыт), header не имеет отступа
    if (this.isSidebarClosed && window.innerWidth < 769) {
      return 0;
    }
    // На десктопе учитываем состояние sidebar
    if (this.isSidebarClosed) {
      return 64; // На десктопе закрытый sidebar становится свернутым (64px)
    }
    return this.isSidebarCollapsed ? 64 : 240;
  }
}

