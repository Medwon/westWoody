import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CardComponent } from '../card/card.component';
import { InputComponent } from '../input/input.component';
import { ButtonComponent } from '../button/button.component';
import { TypographyComponent } from '../typography/typography.component';
import { AlertComponent } from '../alert/alert.component';
import { BadgeComponent } from '../badge/badge.component';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { DividerComponent } from '../divider/divider.component';
import { ModalComponent } from '../modal/modal.component';
import { WhatsappPreviewComponent } from '../whatsapp-preview/whatsapp-preview.component';
import { EmailPreviewComponent } from '../email-preview/email-preview.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'bonus_accrued' | 'bonus_expiration';
  content: string;
  subject?: string; // For email
  createdAt: Date;
}

@Component({
  selector: 'app-invitation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CardComponent,
    InputComponent,
    ButtonComponent,
    TypographyComponent,
    AlertComponent,
    BadgeComponent,
    IconButtonComponent,
    DividerComponent,
    ModalComponent,
    WhatsappPreviewComponent,
    EmailPreviewComponent
  ],
  template: `
    <div class="invitation-form-wrapper">
      <!-- Templates Section -->
      <div class="templates-section">
        <div class="templates-header">
          <h3 class="templates-title">Шаблоны сообщений</h3>
          <app-button
            buttonType="primary"
            size="medium"
            (onClick)="openCreateTemplateModal()">
            <span class="btn-content">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Создать новый вид сообщения
            </span>
          </app-button>
        </div>

        <div class="templates-grid">
          <div 
            class="template-card" 
            *ngFor="let template of messageTemplates"
            (click)="selectTemplate(template)">
            <div class="template-header">
              <span class="template-name">{{ template.name }}</span>
            </div>
            <p class="template-preview">{{ getTemplatePreview(template.content) }}</p>
            <div class="template-actions">
              <button class="template-action-btn" (click)="editTemplate(template, $event)" title="Редактировать">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </button>
              <button class="template-action-btn" (click)="deleteTemplate(template.id, $event)" title="Удалить">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="template-card empty" *ngIf="messageTemplates.length === 0">
            <svg viewBox="0 0 24 24" fill="none" class="empty-icon">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <p class="empty-text">Нет шаблонов сообщений</p>
            <p class="empty-hint">Создайте первый шаблон для быстрой отправки</p>
          </div>
        </div>
      </div>

      <!-- Collapsible Form Section -->
      <div class="collapsible-section">
        <div class="collapsed-view" *ngIf="isFormCollapsed" (click)="toggleFormCollapse()">
          <div class="collapsed-content">
            <div class="collapsed-icon" [innerHTML]="getSafeIconSvg()" [style.background]="getIconGradient()"></div>
            <div class="collapsed-info">
              <span class="collapsed-title">{{ title }}</span>
              <span class="collapsed-preview">{{ getCollapsedPreview() }}</span>
            </div>
            <button class="expand-btn">
              <svg viewBox="0 0 24 24" fill="none" [class.rotated]="!isFormCollapsed">
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="expanded-view" *ngIf="!isFormCollapsed">
          <div class="view-header" (click)="toggleFormCollapse()">
            <div class="view-header-content">
              <div class="icon-wrapper" [innerHTML]="getSafeIconSvg()" [style.background]="getIconGradient()"></div>
              <div class="header-text">
                <h2 class="panel-title">{{ title }}</h2>
                <p class="panel-subtitle">{{ subtitle }}</p>
              </div>
            </div>
            <button class="collapse-btn">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <div class="expanded-content">
            <app-card [shadow]="true" class="left-panel">
              <!-- Alerts -->
              <app-alert
                *ngIf="successMessage"
                type="success"
                [title]="'Успешно'"
                [dismissible]="true"
                (dismissed)="successMessage = ''"
                class="alert-spacing">
                {{ successMessage }}
              </app-alert>

              <app-alert
                *ngIf="errorMessage"
                type="error"
                [title]="'Ошибка'"
                [dismissible]="true"
                (dismissed)="errorMessage = ''"
                class="alert-spacing">
                {{ errorMessage }}
              </app-alert>

              <form [formGroup]="form" (ngSubmit)="onFormSubmit()" class="form-content">
                <!-- Subject Input (only for email) -->
                <app-input
                  *ngIf="invitationType === 'email'"
                  id="subject"
                  label="Тема письма"
                  type="text"
                  placeholder="Приглашение в Westwood"
                  formControlName="subject"
                  prefix="📋">
                </app-input>

                <!-- Message Textarea -->
                <div class="textarea-group">
                  <div class="label-row">
                    <app-typography variant="body2" [medium]="true">
                      {{ invitationType === 'email' ? 'Текст письма' : 'Текст приглашения' }}
                    </app-typography>
                    <app-typography variant="caption" [muted]="true">
                      {{ getMessageLength() }}/{{ invitationType === 'email' ? '1000' : '500' }}
                    </app-typography>
                  </div>
                  <div class="textarea-wrapper" [attr.data-type]="invitationType">
                    <div 
                      #messageContentEditable
                      class="message-textarea-editable"
                      contenteditable="true"
                      (input)="onMessageInput($event)"
                      (keydown)="onMessageKeydown($event)"
                      (click)="onMessageClick()"
                      (blur)="onMessageBlur($event)"
                      [attr.data-type]="invitationType"
                      [attr.placeholder]="invitationType === 'email' ? 'Напишите персональное приглашение...' : 'Напишите персональное приглашение...'">
                    </div>
                    <div class="variables-dropdown" *ngIf="showMessageVariablesDropdown" [style.top.px]="messageDropdownPosition.top" [style.left.px]="messageDropdownPosition.left">
                      <div class="variables-dropdown-header">
                        <span>Переменные</span>
                        <button type="button" class="variables-dropdown-close" (click)="closeMessageVariablesDropdown()">×</button>
                      </div>
                      <div class="variables-dropdown-list">
                        <button 
                          type="button"
                          class="variable-option" 
                          *ngFor="let variable of filteredMessageVariables"
                          (click)="selectMessageVariable(variable)"
                          [class.highlighted]="highlightedMessageVariableIndex === filteredMessageVariables.indexOf(variable)">
                          <span class="variable-name">{{ getVariableDisplayName(variable.name) }}</span>
                          <span class="variable-desc">{{ variable.description }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <app-divider [spaced]="true"></app-divider>

                <!-- Submit Button -->
                <app-button
                  [buttonType]="invitationType === 'email' ? 'primary' : 'success'"
                  type="submit"
                  [disabled]="form.invalid || isSending"
                  [loading]="isSending"
                  size="large"
                  class="submit-btn">
                  <span class="btn-content">
                    <ng-container [ngSwitch]="invitationType">
                      <svg *ngSwitchCase="'whatsapp'" viewBox="0 0 24 24" fill="none" class="wa-icon">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor"/>
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="currentColor"/>
                      </svg>
                      <svg *ngSwitchDefault viewBox="0 0 24 24" fill="none" class="email-icon">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </ng-container>
                    {{ isSending ? (invitationType === 'email' ? 'Отправка...' : 'Открываем WhatsApp...') : (invitationType === 'email' ? 'Отправить Email' : 'Отправить в WhatsApp') }}
                  </span>
                </app-button>
              </form>
            </app-card>

            <!-- Preview Section -->
            <div class="preview-section">
              <div class="section-title">
                <svg viewBox="0 0 24 24" fill="none" class="title-icon" [style.color]="iconColor">
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <h3 class="section-heading">Предпросмотр</h3>
              </div>
              <p class="section-description">{{ previewDescription }}</p>

              <ng-container [ngSwitch]="invitationType">
                <app-whatsapp-preview
                  *ngSwitchCase="'whatsapp'"
                  [contactName]="getPreviewContactName()"
                  [avatarLetter]="getPreviewAvatarLetter()"
                  [message]="getPreviewMessage()"
                  [showInputBar]="true"
                  [noShadow]="true"
                  class="preview-component">
                </app-whatsapp-preview>
                <app-email-preview
                  *ngSwitchDefault
                  [recipientEmail]="getPreviewEmail()"
                  [message]="getPreviewMessage()"
                  [activationLink]="'https://westwood.app/activate?token=xxx'"
                  [buttonText]="'Activate Account'"
                  [expirationDays]="7"
                  [senderEmail]="'noreply@westwood.app'"
                  class="preview-component">
                </app-email-preview>
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Template Modal -->
    <app-modal
      [visible]="showCreateTemplateModal"
      title="Создать новый вид сообщения"
      [showCloseButton]="true"
      [showFooter]="true"
      (closed)="closeCreateTemplateModal()"
      size="large">
      
      <div class="template-form">
        <div class="form-group">
          <label class="form-label" [attr.data-type]="invitationType">Название сообщения</label>
            <input 
            type="text" 
            [(ngModel)]="newTemplate.name"
            placeholder="Например: Приветственное сообщение"
            class="form-input"
            [attr.data-type]="invitationType">
        </div>

        <div class="form-group">
          <label class="form-label" [attr.data-type]="invitationType">Тип сообщения</label>
          <div class="type-dropdown-wrapper">
            <select 
              [(ngModel)]="newTemplate.type"
              class="type-dropdown"
              [attr.data-type]="invitationType">
              <option value="bonus_accrued">Начисленные бонусы</option>
              <option value="bonus_expiration">Срок истечения бонусов</option>
            </select>
            <svg class="dropdown-arrow" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <div class="form-group" *ngIf="invitationType === 'email'">
          <label class="form-label" [attr.data-type]="invitationType">Тема письма</label>
            <input 
            type="text" 
            [(ngModel)]="newTemplate.subject"
            placeholder="Приглашение в Westwood"
            class="form-input"
            [attr.data-type]="invitationType">
        </div>

        <div class="form-group">
          <label class="form-label" [attr.data-type]="invitationType">Контент сообщения</label>
          <div class="textarea-wrapper" [attr.data-type]="invitationType">
            <div 
              #contentEditable
              class="form-textarea-editable"
              contenteditable="true"
              (input)="onContentInput($event)"
              (keydown)="onContentKeydown($event)"
              (click)="onContentClick()"
              (blur)="onContentBlur($event)"
              [attr.data-type]="invitationType"
              [attr.placeholder]="'Введите текст сообщения...'">
            </div>
            <div class="variables-dropdown" *ngIf="showVariablesDropdown" [style.top.px]="dropdownPosition.top" [style.left.px]="dropdownPosition.left">
              <div class="variables-dropdown-header">
                <span>Переменные</span>
                <button type="button" class="variables-dropdown-close" (click)="closeVariablesDropdown()">×</button>
              </div>
              <div class="variables-dropdown-list">
                <button 
                  type="button"
                  class="variable-option" 
                  *ngFor="let variable of filteredVariables"
                  (click)="selectVariable(variable)"
                  [class.highlighted]="highlightedVariableIndex === filteredVariables.indexOf(variable)">
                  <span class="variable-name">{{ getVariableDisplayName(variable.name) }}</span>
                  <span class="variable-desc">{{ variable.description }}</span>
                </button>
              </div>
            </div>
          </div>
          <div class="char-count">{{ getPlainTextContent().length }}/{{ invitationType === 'email' ? '1000' : '500' }}</div>
        </div>

        <div class="form-group">
          <label class="form-label" [attr.data-type]="invitationType">Предпросмотр</label>
          <div class="preview-box" [attr.data-type]="invitationType">
            <ng-container [ngSwitch]="invitationType">
              <app-whatsapp-preview
                *ngSwitchCase="'whatsapp'"
                [contactName]="'Получатель'"
                [avatarLetter]="'П'"
                [message]="newTemplate.content || 'Текст сообщения...'"
                [showInputBar]="true"
                [noShadow]="true">
              </app-whatsapp-preview>
              <app-email-preview
                *ngSwitchDefault
                [recipientEmail]="'email@example.com'"
                [message]="newTemplate.content || 'Текст письма...'"
                [activationLink]="'https://westwood.app/activate?token=xxx'"
                [buttonText]="'Activate Account'"
                [expirationDays]="7"
                [senderEmail]="'noreply@westwood.app'">
              </app-email-preview>
            </ng-container>
          </div>
        </div>
      </div>

      <ng-container modalFooter>
        <div class="modal-footer">
          <app-button
            buttonType="secondary"
            size="medium"
            (onClick)="closeCreateTemplateModal()">
            Отмена
          </app-button>
          <app-button
            [buttonType]="invitationType === 'email' ? 'primary' : 'success'"
            size="medium"
            [disabled]="!newTemplate.name || !newTemplate.content || (invitationType === 'email' && !newTemplate.subject)"
            (onClick)="saveTemplate()">
            Сохранить шаблон
          </app-button>
        </div>
      </ng-container>
    </app-modal>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    /* Collapsible Section */
    .collapsible-section {
      background: white;
      border-radius: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .collapsed-view {
      padding: 1.25rem 1.5rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .collapsed-view:hover {
      background: #f8fafc;
    }

    .collapsed-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .collapsed-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .collapsed-icon ::ng-deep svg {
      width: 20px;
      height: 20px;
      color: white;
    }

    .collapsed-icon ::ng-deep svg path {
      fill: white;
    }

    .collapsed-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .collapsed-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
    }

    .collapsed-preview {
      font-size: 0.875rem;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .expand-btn {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }

    .expand-btn svg {
      width: 20px;
      height: 20px;
      transition: transform 0.2s;
    }

    .expand-btn svg.rotated {
      transform: rotate(180deg);
    }

    .view-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.2s;
    }

    .view-header:hover {
      background: #f8fafc;
    }

    .view-header-content {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
    }

    .collapse-btn {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .collapse-btn svg {
      width: 20px;
      height: 20px;
    }

    .expanded-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      padding: 2rem;
    }

    .icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-wrapper ::ng-deep svg {
      width: 28px;
      height: 28px;
      color: white;
    }

    .icon-wrapper ::ng-deep svg path {
      fill: white;
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .panel-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .panel-subtitle {
      font-size: 0.9375rem;
      color: #64748b;
      margin: 0;
    }

    .alert-spacing {
      margin-bottom: 1.5rem;
    }

    /* Left Panel */
    .left-panel {
      display: flex;
      flex-direction: column;
      border-radius: 24px !important;
    }

    :host ::ng-deep .left-panel .card-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: 2rem !important;
    }

    /* Form */
    .form-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .textarea-group {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .message-textarea {
      flex: 1;
      width: 100%;
      min-height: 120px;
      padding: 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-family: inherit;
      resize: none;
      transition: all 0.2s ease;
      background-color: #ffffff;
      color: #1a202c;
      line-height: 1.6;
    }

    .message-textarea:focus {
      outline: none;
    }

    .message-textarea[data-type="whatsapp"]:focus {
      border-color: #25D366;
      box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.15);
    }

    .message-textarea[data-type="email"]:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .message-textarea::placeholder {
      color: #94a3b8;
    }

    .message-textarea-editable {
      flex: 1;
      width: 100%;
      min-height: 120px;
      padding: 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-family: inherit;
      background-color: #ffffff;
      color: #1a202c;
      line-height: 1.6;
      outline: none;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .message-textarea-editable:empty:before {
      content: attr(placeholder);
      color: #94a3b8;
      pointer-events: none;
    }

    .message-textarea-editable:focus {
      outline: none;
    }

    .message-textarea-editable[data-type="whatsapp"]:focus {
      border-color: #25D366;
      box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.15);
    }

    .message-textarea-editable[data-type="email"]:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    /* Submit Button */
    .submit-btn {
      width: 100%;
    }

    :host ::ng-deep .submit-btn button {
      width: 100%;
      border-radius: 12px !important;
      padding: 1rem 1.5rem !important;
    }

    :host ::ng-deep .submit-btn button:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    .btn-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .wa-icon, .email-icon {
      width: 22px;
      height: 22px;
    }

    /* Preview Section */
    .preview-section {
      background: white;
      border-radius: 24px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-bottom: 0.25rem;
    }

    .title-icon {
      width: 22px;
      height: 22px;
    }

    .section-heading {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .section-description {
      font-size: 0.875rem;
      color: #9ca3af;
      margin: 0 0 1.25rem 0;
    }

    .preview-component {
      flex: 1;
      display: block;
    }

    /* Templates Section */
    .templates-section {
      background: white;
      border-radius: 24px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      margin-bottom: 2rem;
    }

    .templates-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .templates-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .template-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .template-card:hover {
      background: #f1f5f9;
      border-color: #25D366;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(37, 211, 102, 0.15);
    }

    .template-card.empty {
      text-align: center;
      padding: 3rem 1.5rem;
      cursor: default;
      border-style: dashed;
    }

    .template-card.empty:hover {
      transform: none;
      border-color: #e2e8f0;
    }

    .template-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .template-name {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
    }

    .template-preview {
      font-size: 0.875rem;
      color: #64748b;
      line-height: 1.5;
      margin: 0 0 0.75rem 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .template-actions {
      display: flex;
      gap: 0.5rem;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .template-card:hover .template-actions {
      opacity: 1;
    }

    .template-action-btn {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.4rem;
      cursor: pointer;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .template-action-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #1f2937;
    }

    .template-action-btn svg {
      width: 16px;
      height: 16px;
    }

    .empty-icon {
      width: 48px;
      height: 48px;
      color: #d1d5db;
      margin: 0 auto 1rem;
    }

    .empty-text {
      font-size: 0.9375rem;
      color: #64748b;
      margin: 0 0 0.25rem 0;
      font-weight: 500;
    }

    .empty-hint {
      font-size: 0.8125rem;
      color: #94a3b8;
      margin: 0;
    }

    /* Modal Styles */
    .template-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      padding: 0.5rem 0;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .form-label {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-label::before {
      content: '';
      width: 3px;
      height: 16px;
      border-radius: 2px;
    }

    .form-label[data-type="whatsapp"]::before {
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
    }

    .form-label[data-type="email"]::before {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    }

    .form-input {
      padding: 0.875rem 1.125rem;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 0.9375rem;
      background: #ffffff;
      color: #1f2937;
      transition: all 0.2s;
      font-family: inherit;
    }

    .form-input::placeholder {
      color: #94a3b8;
    }

    .form-input:focus {
      outline: none;
      background: #f0fdf4;
      box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
    }

    .form-input[data-type="whatsapp"]:focus {
      border-color: #25D366;
      background: #f0fdf4;
      box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
    }

    .form-input[data-type="email"]:focus {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .type-dropdown-wrapper {
      position: relative;
    }

    .type-dropdown {
      width: 100%;
      padding: 0.875rem 3rem 0.875rem 1.125rem;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 0.9375rem;
      background: #ffffff;
      color: #1f2937;
      transition: all 0.2s;
      font-family: inherit;
      appearance: none;
      cursor: pointer;
    }

    .type-dropdown:focus {
      outline: none;
      box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
    }

    .type-dropdown[data-type="whatsapp"]:focus {
      border-color: #25D366;
      background: #f0fdf4;
      box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
    }

    .type-dropdown[data-type="email"]:focus {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .type-dropdown:hover {
      border-color: #cbd5e1;
    }

    .dropdown-arrow {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      color: #64748b;
      pointer-events: none;
      transition: transform 0.2s;
    }

    .type-dropdown[data-type="whatsapp"]:focus + .dropdown-arrow {
      color: #25D366;
    }

    .type-dropdown[data-type="email"]:focus + .dropdown-arrow {
      color: #3b82f6;
    }

    .textarea-wrapper {
      position: relative;
      width: 100%;
    }

    .form-textarea {
      width: 100%;
      padding: 1rem 1.125rem;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-family: inherit;
      resize: vertical;
      background: #ffffff;
      color: #1f2937;
      line-height: 1.6;
      transition: all 0.2s;
      min-height: 150px;
    }

    .form-textarea:focus {
      outline: none;
      box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
    }

    .form-textarea[data-type="whatsapp"]:focus {
      border-color: #25D366;
      background: #f0fdf4;
      box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
    }

    .form-textarea[data-type="email"]:focus {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .form-textarea-editable {
      width: 100%;
      padding: 1rem 1.125rem;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-family: inherit;
      background: #ffffff;
      color: #1f2937;
      line-height: 1.6;
      transition: all 0.2s;
      min-height: 150px;
      outline: none;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .form-textarea-editable:empty:before {
      content: attr(placeholder);
      color: #94a3b8;
      pointer-events: none;
    }

    .form-textarea-editable:focus {
      box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
    }

    .form-textarea-editable[data-type="whatsapp"]:focus {
      border-color: #25D366;
      background: #f0fdf4;
      box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
    }

    .form-textarea-editable[data-type="email"]:focus {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .variable-tag {
      color: #16a34a !important;
      font-style: italic !important;
      font-weight: 500 !important;
      font-family: 'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace !important;
      background: rgba(34, 197, 94, 0.08) !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      border: 1px solid rgba(34, 197, 94, 0.2) !important;
      display: inline !important;
    }

    :host ::ng-deep .variable-tag {
      color:rgb(22, 158, 163) !important;
      font-style: italic !important;
      font-weight: 500 !important;
      font-family: 'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace !important;
      background: rgba(22, 158, 163, 0.2) !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      border: 1px solid rgba(34, 197, 94, 0.2) !important;
      display: inline !important;
    }

    .variables-dropdown {
      position: absolute;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      min-width: 280px;
      max-width: 400px;
      max-height: 300px;
      overflow: hidden;
      margin-top: 4px;
    }

    .variables-dropdown-header {
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

    .variables-dropdown-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      transition: color 0.15s;
    }

    .variables-dropdown-close:hover {
      color: #64748b;
    }

    .variables-dropdown-list {
      max-height: 250px;
      overflow-y: auto;
      padding: 4px;
    }

    .variable-option {
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 100%;
      padding: 10px 14px;
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s;
      border-radius: 8px;
    }

    .variable-option:hover,
    .variable-option.highlighted {
      background: #f0fdf4;
    }

    .variable-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #16a34a;
      font-family: 'Courier New', monospace;
    }

    .variable-desc {
      font-size: 0.75rem;
      color: #64748b;
    }

    .char-count {
      font-size: 0.75rem;
      color: #94a3b8;
      text-align: right;
      margin-top: 0.25rem;
    }

    .preview-box {
      border-radius: 16px;
      padding: 1.5rem;
      max-height: 450px;
      overflow-y: auto;
    }

    .preview-box[data-type="whatsapp"] {
      background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
      border: 2px solid #dcfce7;
      box-shadow: 0 2px 8px rgba(37, 211, 102, 0.08);
    }

    .preview-box[data-type="email"] {
      background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
      border: 2px solid #dbeafe;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.875rem;
      padding: 1.25rem 0 0 0;
      border-top: 2px solid #f1f5f9;
      margin-top: 0.5rem;
    }

    :host ::ng-deep .modal-footer app-button button {
      padding: 0.75rem 1.5rem !important;
      font-weight: 600 !important;
      border-radius: 10px !important;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .expanded-content {
        grid-template-columns: 1fr;
      }

      .templates-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      }
    }

    @media (max-width: 768px) {
      .expanded-content {
        padding: 1rem;
      }

      .templates-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .templates-grid {
        grid-template-columns: 1fr;
      }

      :host ::ng-deep .left-panel .card-body {
        padding: 1.5rem !important;
      }
    }
  `]
})
export class InvitationFormComponent implements AfterViewInit {
  @ViewChild('contentEditable', { static: false }) contentEditableRef!: ElementRef<HTMLElement>;
  @ViewChild('messageContentEditable', { static: false }) messageContentEditableRef!: ElementRef<HTMLElement>;
  @Input() invitationType: 'whatsapp' | 'email' = 'whatsapp';
  @Input() form!: FormGroup;
  @Input() title = 'Пригласи друга';
  @Input() subtitle = '';
  @Input() iconSvg: string | SafeHtml = '';
  @Input() iconColor = '#25D366';
  @Input() previewDescription = '';
  @Input() messageTemplates: MessageTemplate[] = [];
  @Input() isSending = false;
  @Input() successMessage = '';
  @Input() errorMessage = '';
  @Output() formSubmit = new EventEmitter<void>();
  @Output() templateSelected = new EventEmitter<MessageTemplate>();
  @Output() templateCreated = new EventEmitter<MessageTemplate>();
  @Output() templateUpdated = new EventEmitter<MessageTemplate>();
  @Output() templateDeleted = new EventEmitter<string>();

  isFormCollapsed = false;
  showCreateTemplateModal = false;
  editingTemplateId: string | null = null;

  newTemplate: MessageTemplate = {
    id: '',
    name: '',
    type: 'bonus_accrued',
    content: '',
    createdAt: new Date()
  };

  // Variables dropdown for template modal
  showVariablesDropdown = false;
  highlightedVariableIndex = 0;
  dropdownPosition = { top: 0, left: 0 };
  currentBracePosition = -1;

  // Variables dropdown for message textarea
  showMessageVariablesDropdown = false;
  highlightedMessageVariableIndex = 0;
  messageDropdownPosition = { top: 0, left: 0 };
  currentMessageBracePosition = -1;

  availableVariables = [
    { name: 'clientName', description: 'Имя клиента' },
    { name: 'clientBonus', description: 'Бонусы клиента' },
    { name: 'clientPhone', description: 'Телефон клиента' },
    { name: 'clientBonusExp', description: 'Срок истечения бонусов' },
    { name: 'clientEmail', description: 'Email клиента' },
    { name: 'clientTotalAmount', description: 'Общая сумма покупок' },
    { name: 'clientTotalTransactions', description: 'Количество транзакций' },
    { name: 'clientLastVisit', description: 'Последний визит' }
  ];

  filteredVariables: typeof this.availableVariables = [];
  filteredMessageVariables: typeof this.availableVariables = [];

  constructor(private sanitizer: DomSanitizer) {}

  ngAfterViewInit(): void {
    // Initialize contenteditable when view is ready
    if (this.contentEditableRef) {
      this.updateContentEditable();
    }
  }

  getSafeIconSvg(): SafeHtml {
    if (typeof this.iconSvg === 'string') {
      return this.sanitizer.bypassSecurityTrustHtml(this.iconSvg);
    }
    return this.iconSvg || this.sanitizer.bypassSecurityTrustHtml('');
  }

  toggleFormCollapse(): void {
    this.isFormCollapsed = !this.isFormCollapsed;
  }

  getCollapsedPreview(): string {
    const message = this.form.get('message')?.value || '';
    if (!message) return 'Текст сообщения не введён';
    const words = message.split(/\s+/).slice(0, 8).join(' ');
    return words + (message.split(/\s+/).length > 8 ? '...' : '');
  }

  onFormSubmit(): void {
    this.formSubmit.emit();
  }

  getVariableDisplayName(variableName: string): string {
    // Remove curly braces if present
    return variableName.replace(/[{}]/g, '');
  }

  getTemplatePreview(content: string): string {
    const words = content.split(/\s+/).slice(0, 10).join(' ');
    return words + (content.split(/\s+/).length > 10 ? '...' : '');
  }

  selectTemplate(template: MessageTemplate): void {
    this.form.patchValue({
      message: template.content
    });
    if (this.invitationType === 'email' && template.subject) {
      this.form.patchValue({
        subject: template.subject
      });
    }
    this.templateSelected.emit(template);
    this.isFormCollapsed = false;
    
    // Update message contenteditable
    setTimeout(() => {
      this.updateMessageContentEditable();
    }, 100);
  }

  openCreateTemplateModal(): void {
    this.newTemplate = {
      id: '',
      name: '',
      type: 'bonus_accrued',
      content: '',
      subject: this.invitationType === 'email' ? '' : undefined,
      createdAt: new Date()
    };
    this.editingTemplateId = null;
    this.showCreateTemplateModal = true;
    this.closeVariablesDropdown();
    
    // Update contenteditable after modal opens
    setTimeout(() => {
      this.updateContentEditable();
    }, 100);
  }

  closeCreateTemplateModal(): void {
    this.showCreateTemplateModal = false;
    this.editingTemplateId = null;
    this.closeVariablesDropdown();
  }

  saveTemplate(): void {
    // Sync content from contenteditable before saving
    if (this.contentEditableRef) {
      const element = this.contentEditableRef.nativeElement;
      this.newTemplate.content = this.getPlainTextFromElement(element);
    }
    
    if (!this.newTemplate.name || !this.newTemplate.content) return;
    if (this.invitationType === 'email' && !this.newTemplate.subject) return;

    if (this.editingTemplateId) {
      const template: MessageTemplate = {
        ...this.newTemplate,
        id: this.editingTemplateId
      };
      this.templateUpdated.emit(template);
    } else {
      const template: MessageTemplate = {
        ...this.newTemplate,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      this.templateCreated.emit(template);
    }

    this.closeCreateTemplateModal();
  }

  editTemplate(template: MessageTemplate, event: Event): void {
    event.stopPropagation();
    this.newTemplate = { ...template };
    this.editingTemplateId = template.id;
    this.showCreateTemplateModal = true;
    this.closeVariablesDropdown();
    
    // Update contenteditable after modal opens
    setTimeout(() => {
      this.updateContentEditable();
    }, 100);
  }

  deleteTemplate(templateId: string, event: Event): void {
    event.stopPropagation();
    this.templateDeleted.emit(templateId);
  }

  getPreviewMessage(): string {
    return this.form.get('message')?.value || 'Текст сообщения...';
  }

  getPreviewContactName(): string {
    return 'Получатель';
  }

  getPreviewAvatarLetter(): string {
    return 'П';
  }

  getPreviewEmail(): string {
    return 'email@example.com';
  }

  getIconGradient(): string {
    if (this.invitationType === 'email') {
      return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    }
    return 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)';
  }

  // Variables dropdown methods
  private formatTimeout: any = null;
  private isFormatting = false;
  private lastFormattedContent = '';
  private messageFormatTimeout: any = null;
  private isMessageFormatting = false;
  private lastFormattedMessageContent = '';

  onContentInput(event: Event): void {
    const target = event.target as HTMLElement;
    const text = this.getPlainTextFromElement(target);
    this.newTemplate.content = text;
    
    // Don't format if we're currently formatting to avoid cursor issues
    if (this.isFormatting) {
      return;
    }
    
    // Clear any pending format operation
    if (this.formatTimeout) {
      clearTimeout(this.formatTimeout);
    }
    
    // Check if '{{' was just typed or user is typing after '{{'
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textBeforeCursor = this.getTextBeforeCursor(target, range);
      
      // Find the last '{{' that doesn't have a matching '}}'
      const lastDoubleBraceIndex = textBeforeCursor.lastIndexOf('{{');
      if (lastDoubleBraceIndex !== -1) {
        const textAfterBrace = textBeforeCursor.substring(lastDoubleBraceIndex + 2);
        if (!textAfterBrace.includes('}}')) {
          // Show dropdown
          this.currentBracePosition = lastDoubleBraceIndex;
          this.showVariablesDropdown = true;
          
          // Filter variables based on typed text after '{{'
          const searchText = textAfterBrace.toLowerCase();
          this.filteredVariables = this.availableVariables.filter(v => 
            v.name.toLowerCase().includes(searchText) || 
            v.description.toLowerCase().includes(searchText)
          );
          
          // If no matches, show all
          if (this.filteredVariables.length === 0) {
            this.filteredVariables = [...this.availableVariables];
          }
          
          this.highlightedVariableIndex = 0;
          this.updateDropdownPosition(target, range);
          // Format content to show variables styled (with delay to avoid cursor issues)
          this.formatTimeout = setTimeout(() => this.formatContentWithVariables(target), 150);
          return;
        }
      }
    }
    
    // Hide dropdown if '}}' is typed or no '{{' found
    const hasOpenDoubleBrace = text.includes('{{') && !text.match(/\{\{[^}]*$/);
    if (!hasOpenDoubleBrace) {
      this.closeVariablesDropdown();
    }
    
    // Format content to show variables styled (with delay to avoid cursor issues during fast typing)
    // Only format if content actually changed
    if (text !== this.lastFormattedContent) {
      this.formatTimeout = setTimeout(() => this.formatContentWithVariables(target), 200);
    }
  }

  onContentKeydown(event: KeyboardEvent): void {
    if (this.showVariablesDropdown) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.highlightedVariableIndex = Math.min(
          this.highlightedVariableIndex + 1,
          this.filteredVariables.length - 1
        );
        // Scroll to highlighted item
        this.scrollToHighlightedVariable();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.highlightedVariableIndex = Math.max(this.highlightedVariableIndex - 1, 0);
        // Scroll to highlighted item
        this.scrollToHighlightedVariable();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this.filteredVariables[this.highlightedVariableIndex]) {
          this.selectVariable(this.filteredVariables[this.highlightedVariableIndex]);
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.closeVariablesDropdown();
      } else if (event.key === '}') {
        // Close dropdown when '}' is typed (second closing brace)
        const target = event.target as HTMLElement;
        const text = this.getPlainTextFromElement(target);
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const textBeforeCursor = this.getTextBeforeCursor(target, range);
          // Check if we already have one '}' before cursor
          if (textBeforeCursor.endsWith('}')) {
            // This is the second '}', close dropdown
            event.preventDefault();
            this.closeVariablesDropdown();
          }
        }
      }
    }
  }

  scrollToHighlightedVariable(): void {
    // Scroll dropdown to show highlighted item
    setTimeout(() => {
      const dropdown = document.querySelector('.variables-dropdown-list');
      const highlighted = document.querySelector('.variable-option.highlighted');
      if (dropdown && highlighted) {
        highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  updateMessageContentEditable(): void {
    if (this.messageContentEditableRef) {
      const element = this.messageContentEditableRef.nativeElement;
      const messageValue = this.form.get('message')?.value || '';
      if (messageValue) {
        // Reset formatting state
        this.isMessageFormatting = false;
        this.lastFormattedMessageContent = '';
        // Use formatMessageWithVariables which handles HTML properly
        this.formatMessageWithVariables(element);
      } else {
        element.innerHTML = '';
        this.lastFormattedMessageContent = '';
      }
    }
  }

  onContentClick(): void {
    // Keep dropdown open if clicking in contenteditable
    // It will be closed by other handlers if needed
  }

  onContentBlur(event: FocusEvent): void {
    // Close dropdown when losing focus, but only if not clicking on dropdown
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget && !relatedTarget.closest('.variables-dropdown')) {
      setTimeout(() => {
        if (document.activeElement !== this.contentEditableRef?.nativeElement) {
          this.closeVariablesDropdown();
        }
      }, 200);
    }
  }

  updateDropdownPosition(element: HTMLElement, range: Range): void {
    const rect = range.getBoundingClientRect();
    const parentRect = element.getBoundingClientRect();
    const scrollTop = element.scrollTop || 0;
    const scrollLeft = element.scrollLeft || 0;
    
    this.dropdownPosition = {
      top: rect.bottom - parentRect.top + scrollTop + 5,
      left: rect.left - parentRect.left + scrollLeft
    };
  }

  selectVariable(variable: typeof this.availableVariables[0]): void {
    const target = this.contentEditableRef?.nativeElement || document.querySelector('.form-textarea-editable') as HTMLElement;
    if (!target) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const text = this.getPlainTextFromElement(target);
    
    // Find the position of the last '{{'
    const textBeforeCursor = this.getTextBeforeCursor(target, range);
    const lastDoubleBraceIndex = textBeforeCursor.lastIndexOf('{{');
    
    if (lastDoubleBraceIndex === -1) {
      this.closeVariablesDropdown();
      return;
    }
    
    // Get cursor position in plain text
    const cursorPos = this.getCursorPosition(target, range);
    
    // Find what's between '{{' and cursor - this is what user typed
    const textAfterBrace = textBeforeCursor.substring(lastDoubleBraceIndex + 2);
    
    // Build new content: everything before '{{' + '{{' + variable name + '}}' + everything after cursor
    const beforeBrace = text.substring(0, lastDoubleBraceIndex + 2);
    const afterCursor = text.substring(cursorPos);
    const newContent = beforeBrace + variable.name + '}}' + afterCursor;
    
    // Update content model
    this.newTemplate.content = newContent;
    
    // Format and update element - this will apply styling to variables
    this.formatContentWithVariables(target);
    
    // Move cursor after the inserted variable (after the closing '}}')
    setTimeout(() => {
      const newCursorPos = lastDoubleBraceIndex + 2 + variable.name.length + 2; // position after '}}'
      this.setCursorPosition(target, newCursorPos);
    }, 20);
    
    this.closeVariablesDropdown();
  }

  closeVariablesDropdown(): void {
    this.showVariablesDropdown = false;
    this.highlightedVariableIndex = 0;
    this.currentBracePosition = -1;
  }

  getFormattedContent(): string {
    if (!this.newTemplate.content) return '';
    
    // Replace {variable} with styled spans
    return this.newTemplate.content.replace(
      /\{(\w+)\}/g,
      '<span class="variable-tag">{$1}</span>'
    );
  }

  formatContentWithVariables(element: HTMLElement): void {
    // Prevent recursive formatting
    if (this.isFormatting) {
      return;
    }
    
    this.isFormatting = true;
    
    const text = this.newTemplate.content || this.getPlainTextFromElement(element);
    if (!text) {
      element.innerHTML = '';
      this.lastFormattedContent = '';
      this.isFormatting = false;
      return;
    }
    
    // Don't format if content hasn't changed
    if (text === this.lastFormattedContent) {
      this.isFormatting = false;
      return;
    }
    
    // Save cursor position and selection state before formatting
    const selection = window.getSelection();
    let cursorPosition = 0;
    let isFocused = document.activeElement === element;
    
    if (selection && selection.rangeCount > 0 && isFocused) {
      try {
        const range = selection.getRangeAt(0);
        cursorPosition = this.getCursorPosition(element, range);
      } catch (e) {
        // If we can't get cursor position, use text length as fallback
        cursorPosition = text.length;
      }
    }
    
    // Replace complete {{variable}} patterns with styled spans
    // Use a more robust regex that handles edge cases
    // Split text by variables, escape non-variable parts, then reassemble
    const parts: string[] = [];
    let lastIndex = 0;
    const variableRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    let match;
    
    while ((match = variableRegex.exec(text)) !== null) {
      // Add text before variable (escaped)
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        parts.push(this.escapeHtml(beforeText));
      }
      
      // Add variable as styled span (with both opening and closing double braces)
      parts.push(`<span class="variable-tag">{{${match[1]}}}</span>`);
      lastIndex = variableRegex.lastIndex;
    }
    
    // Add remaining text (escaped)
    if (lastIndex < text.length) {
      parts.push(this.escapeHtml(text.substring(lastIndex)));
    }
    
    const html = parts.length > 0 ? parts.join('') : this.escapeHtml(text);
    
    // Only update if HTML actually changed to avoid unnecessary DOM manipulation
    if (element.innerHTML !== html) {
      // Update HTML
      element.innerHTML = html;
      this.lastFormattedContent = text;
      
      // Restore cursor position after formatting (only if element was focused)
      if (selection && isFocused && cursorPosition >= 0) {
        // Use requestAnimationFrame for better performance and to ensure DOM is updated
        requestAnimationFrame(() => {
          // Double-check element is still focused and cursor position is valid
          if (document.activeElement === element && cursorPosition <= text.length) {
            this.setCursorPosition(element, cursorPosition);
          }
          this.isFormatting = false;
        });
      } else {
        this.isFormatting = false;
      }
    } else {
      this.lastFormattedContent = text;
      this.isFormatting = false;
    }
  }

  getPlainTextFromElement(element: HTMLElement): string {
    // Get plain text, ignoring HTML tags
    return element.innerText || element.textContent || '';
  }

  getTextBeforeCursor(element: HTMLElement, range: Range): string {
    const text = this.getPlainTextFromElement(element);
    const cursorPos = this.getCursorPosition(element, range);
    return text.substring(0, cursorPos);
  }

  getTextAfterCursor(element: HTMLElement, range: Range): string {
    const text = this.getPlainTextFromElement(element);
    const cursorPos = this.getCursorPosition(element, range);
    return text.substring(cursorPos);
  }

  getCursorPosition(element: HTMLElement, range: Range): number {
    // Create a range from start of element to cursor
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    // Get the text content up to cursor (this handles HTML correctly)
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(preCaretRange.cloneContents());
    return tempDiv.textContent?.length || 0;
  }

  setCursorPosition(element: HTMLElement, position: number): void {
    const selection = window.getSelection();
    if (!selection) return;
    
    // Make sure element is focused
    if (document.activeElement !== element) {
      element.focus();
    }
    
    // Get all text nodes in the element
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentPos = 0;
    let targetNode: Text | null = null;
    let targetOffset = 0;
    
    let node: Node | null;
    while (node = walker.nextNode()) {
      const textLength = node.textContent?.length || 0;
      if (currentPos + textLength >= position) {
        targetNode = node as Text;
        targetOffset = position - currentPos;
        break;
      }
      currentPos += textLength;
    }
    
    // If we didn't find a node, place at the end
    if (!targetNode) {
      const lastNode = this.getLastTextNode(element);
      if (lastNode) {
        targetNode = lastNode;
        targetOffset = lastNode.textContent?.length || 0;
      } else {
        // No text nodes, create one
        const textNode = document.createTextNode('');
        element.appendChild(textNode);
        targetNode = textNode;
        targetOffset = 0;
      }
    }
    
    if (targetNode) {
      try {
        const newRange = document.createRange();
        const maxOffset = targetNode.textContent?.length || 0;
        const offset = Math.max(0, Math.min(targetOffset, maxOffset));
        newRange.setStart(targetNode, offset);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Scroll into view if needed
        const rect = newRange.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          targetNode.parentElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      } catch (e) {
        // If setting cursor fails, just focus the element
        console.warn('Failed to set cursor position:', e);
        element.focus();
      }
    }
  }

  getLastTextNode(element: HTMLElement): Text | null {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let lastNode: Text | null = null;
    let node: Node | null;
    while (node = walker.nextNode()) {
      lastNode = node as Text;
    }
    
    return lastNode;
  }

  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  findTextNodeAtPosition(element: HTMLElement, position: number): Text | null {
    let currentPos = 0;
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    while (node = walker.nextNode()) {
      const textLength = node.textContent?.length || 0;
      if (currentPos + textLength >= position) {
        return node as Text;
      }
      currentPos += textLength;
    }
    
    return null;
  }

  getPlainTextContent(): string {
    return this.newTemplate.content || '';
  }

  getPlainTextFromHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.innerText || div.textContent || '';
  }

  updateContentEditable(): void {
    if (this.contentEditableRef) {
      const element = this.contentEditableRef.nativeElement;
      if (this.newTemplate.content) {
        // Reset formatting state
        this.isFormatting = false;
        this.lastFormattedContent = '';
        // Use formatContentWithVariables which handles HTML properly
        this.formatContentWithVariables(element);
      } else {
        element.innerHTML = '';
        this.lastFormattedContent = '';
      }
    }
  }

  // Message textarea methods
  getMessageLength(): number {
    if (this.messageContentEditableRef) {
      return this.getPlainTextFromElement(this.messageContentEditableRef.nativeElement).length;
    }
    return this.form.get('message')?.value?.length || 0;
  }

  onMessageInput(event: Event): void {
    const target = event.target as HTMLElement;
    const text = this.getPlainTextFromElement(target);
    this.form.patchValue({ message: text });
    
    // Don't format if we're currently formatting to avoid cursor issues
    if (this.isMessageFormatting) {
      return;
    }
    
    // Clear any pending format operation
    if (this.messageFormatTimeout) {
      clearTimeout(this.messageFormatTimeout);
    }
    
    // Check if '{{' was just typed or user is typing after '{{'
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textBeforeCursor = this.getTextBeforeCursor(target, range);
      
      // Find the last '{{' that doesn't have a matching '}}'
      const lastDoubleBraceIndex = textBeforeCursor.lastIndexOf('{{');
      if (lastDoubleBraceIndex !== -1) {
        const textAfterBrace = textBeforeCursor.substring(lastDoubleBraceIndex + 2);
        if (!textAfterBrace.includes('}}')) {
          // Show dropdown
          this.currentMessageBracePosition = lastDoubleBraceIndex;
          this.showMessageVariablesDropdown = true;
          
          // Filter variables based on typed text after '{{'
          const searchText = textAfterBrace.toLowerCase();
          this.filteredMessageVariables = this.availableVariables.filter(v => 
            v.name.toLowerCase().includes(searchText) || 
            v.description.toLowerCase().includes(searchText)
          );
          
          // If no matches, show all
          if (this.filteredMessageVariables.length === 0) {
            this.filteredMessageVariables = [...this.availableVariables];
          }
          
          this.highlightedMessageVariableIndex = 0;
          this.updateMessageDropdownPosition(target, range);
          // Format content to show variables styled (with delay to avoid cursor issues)
          this.messageFormatTimeout = setTimeout(() => this.formatMessageWithVariables(target), 150);
          return;
        }
      }
    }
    
    // Hide dropdown if '}}' is typed or no '{{' found
    const hasOpenDoubleBrace = text.includes('{{') && !text.match(/\{\{[^}]*$/);
    if (!hasOpenDoubleBrace) {
      this.closeMessageVariablesDropdown();
    }
    
    // Format content to show variables styled (with delay to avoid cursor issues during fast typing)
    // Only format if content actually changed
    if (text !== this.lastFormattedMessageContent) {
      this.messageFormatTimeout = setTimeout(() => this.formatMessageWithVariables(target), 200);
    }
  }

  onMessageKeydown(event: KeyboardEvent): void {
    if (this.showMessageVariablesDropdown) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.highlightedMessageVariableIndex = Math.min(
          this.highlightedMessageVariableIndex + 1,
          this.filteredMessageVariables.length - 1
        );
        this.scrollToHighlightedMessageVariable();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.highlightedMessageVariableIndex = Math.max(this.highlightedMessageVariableIndex - 1, 0);
        this.scrollToHighlightedMessageVariable();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this.filteredMessageVariables[this.highlightedMessageVariableIndex]) {
          this.selectMessageVariable(this.filteredMessageVariables[this.highlightedMessageVariableIndex]);
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.closeMessageVariablesDropdown();
      } else if (event.key === '}') {
        // Close dropdown when '}' is typed (second closing brace)
        const target = event.target as HTMLElement;
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const textBeforeCursor = this.getTextBeforeCursor(target, range);
          // Check if we already have one '}' before cursor
          if (textBeforeCursor.endsWith('}')) {
            // This is the second '}', close dropdown
            event.preventDefault();
            this.closeMessageVariablesDropdown();
          }
        }
      }
    }
  }

  onMessageClick(): void {
    // Keep dropdown open if clicking in contenteditable
  }

  onMessageBlur(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget && !relatedTarget.closest('.variables-dropdown')) {
      setTimeout(() => {
        if (document.activeElement !== this.messageContentEditableRef?.nativeElement) {
          this.closeMessageVariablesDropdown();
        }
      }, 200);
    }
  }

  updateMessageDropdownPosition(element: HTMLElement, range: Range): void {
    const rect = range.getBoundingClientRect();
    const parentRect = element.getBoundingClientRect();
    const scrollTop = element.scrollTop || 0;
    const scrollLeft = element.scrollLeft || 0;
    
    this.messageDropdownPosition = {
      top: rect.bottom - parentRect.top + scrollTop + 5,
      left: rect.left - parentRect.left + scrollLeft
    };
  }

  selectMessageVariable(variable: typeof this.availableVariables[0]): void {
    const target = this.messageContentEditableRef?.nativeElement;
    if (!target) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const text = this.getPlainTextFromElement(target);
    
    // Find the position of the last '{{'
    const textBeforeCursor = this.getTextBeforeCursor(target, range);
    const lastDoubleBraceIndex = textBeforeCursor.lastIndexOf('{{');
    
    if (lastDoubleBraceIndex === -1) {
      this.closeMessageVariablesDropdown();
      return;
    }
    
    // Get cursor position in plain text
    const cursorPos = this.getCursorPosition(target, range);
    
    // Build new content: everything before '{{' + '{{' + variable name + '}}' + everything after cursor
    const beforeBrace = text.substring(0, lastDoubleBraceIndex + 2);
    const afterCursor = text.substring(cursorPos);
    const newContent = beforeBrace + variable.name + '}}' + afterCursor;
    
    // Update form
    this.form.patchValue({ message: newContent });
    
    // Format and update element
    this.formatMessageWithVariables(target);
    
    // Move cursor after the inserted variable (after the closing '}}')
    setTimeout(() => {
      const newCursorPos = lastDoubleBraceIndex + 2 + variable.name.length + 2;
      this.setCursorPosition(target, newCursorPos);
    }, 20);
    
    this.closeMessageVariablesDropdown();
  }

  closeMessageVariablesDropdown(): void {
    this.showMessageVariablesDropdown = false;
    this.highlightedMessageVariableIndex = 0;
    this.currentMessageBracePosition = -1;
  }

  formatMessageWithVariables(element: HTMLElement): void {
    if (this.isMessageFormatting) {
      return;
    }
    
    this.isMessageFormatting = true;
    
    const text = this.form.get('message')?.value || this.getPlainTextFromElement(element);
    if (!text) {
      element.innerHTML = '';
      this.lastFormattedMessageContent = '';
      this.isMessageFormatting = false;
      return;
    }
    
    if (text === this.lastFormattedMessageContent) {
      this.isMessageFormatting = false;
      return;
    }
    
    const selection = window.getSelection();
    let cursorPosition = 0;
    let isFocused = document.activeElement === element;
    
    if (selection && selection.rangeCount > 0 && isFocused) {
      try {
        const range = selection.getRangeAt(0);
        cursorPosition = this.getCursorPosition(element, range);
      } catch (e) {
        cursorPosition = text.length;
      }
    }
    
    // Replace complete {{variable}} patterns with styled spans
    const parts: string[] = [];
    let lastIndex = 0;
    const variableRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    let match;
    
    while ((match = variableRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        parts.push(this.escapeHtml(beforeText));
      }
      parts.push(`<span class="variable-tag">{{${match[1]}}}</span>`);
      lastIndex = variableRegex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push(this.escapeHtml(text.substring(lastIndex)));
    }
    
    const html = parts.length > 0 ? parts.join('') : this.escapeHtml(text);
    
    if (element.innerHTML !== html) {
      element.innerHTML = html;
      this.lastFormattedMessageContent = text;
      
      if (selection && isFocused && cursorPosition >= 0) {
        requestAnimationFrame(() => {
          if (document.activeElement === element && cursorPosition <= text.length) {
            this.setCursorPosition(element, cursorPosition);
          }
          this.isMessageFormatting = false;
        });
      } else {
        this.isMessageFormatting = false;
      }
    } else {
      this.lastFormattedMessageContent = text;
      this.isMessageFormatting = false;
    }
  }

  scrollToHighlightedMessageVariable(): void {
    setTimeout(() => {
      const dropdown = document.querySelector('.variables-dropdown');
      const highlighted = document.querySelector('.variable-option.highlighted');
      if (dropdown && highlighted) {
        highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }
}

