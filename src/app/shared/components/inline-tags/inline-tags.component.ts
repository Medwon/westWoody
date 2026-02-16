import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TagsChangeEvent {
  tags: string[];
  removedTag?: string;
}

@Component({
  selector: 'app-inline-tags',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inline-tags">
      <div class="tags-header">
        <span class="tags-label" *ngIf="label">{{ label }}</span>
        <button
          type="button"
          class="edit-icon-btn"
          (click)="isEditing = !isEditing"
          [class.active]="isEditing"
          [attr.aria-label]="isEditing ? 'Скрыть добавление тега' : 'Добавить тег'">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="tags-row">
        <span
          *ngFor="let tag of tags; let i = index"
          class="tag-pill">
          <span class="tag-text">{{ tag }}</span>
          <button
            type="button"
            class="tag-remove"
            (click)="removeTag(i)"
            aria-label="Удалить тег">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </span>
        <ng-container *ngIf="isEditing">
          <span
            *ngIf="!isAddingTag"
            class="add-tag-trigger"
            (click)="startAddTag()">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Добавить тег
          </span>
          <span *ngIf="isAddingTag" class="tag-pill tag-input-pill">
            <input
              #addTagInput
              type="text"
              [(ngModel)]="newTagValue"
              (keydown.enter)="commitAddTag()"
              (keydown.escape)="cancelAddTag()"
              (blur)="commitAddTag()"
              (focus)="showDropdown = true"
              placeholder="Тег..."
              class="tag-input"
              maxlength="50">
          </span>
        </ng-container>
      </div>
      <!-- Dropdown: same as create-client modal - list of tags not on client -->
      <div class="tags-dropdown" *ngIf="showDropdown && getFilteredAvailable().length > 0">
        <div class="tags-dropdown-header">
          <span>Популярные тэги</span>
          <button type="button" class="tags-dropdown-close" (click)="showDropdown = false">×</button>
        </div>
        <div class="tags-dropdown-list">
          <button
            type="button"
            class="tag-option"
            *ngFor="let tag of getFilteredAvailable()"
            (mousedown)="addFromDropdown(tag); $event.preventDefault()">
            {{ tag }}
          </button>
        </div>
      </div>
      <p class="no-tags" *ngIf="tags.length === 0 && !isAddingTag">Нет тегов</p>
    </div>
  `,
  styles: [`
    .inline-tags {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      position: relative;
    }

    .tags-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .tags-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
    }

    .edit-icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: none;
      background: transparent;
      color: #64748b;
      border-radius: 6px;
      cursor: pointer;
      transition: color 0.12s ease, background 0.12s ease;
    }

    .edit-icon-btn:hover {
      background: #f1f5f9;
      color: #16A34A;
    }

    .edit-icon-btn.active {
      background: #f0fdf4;
      color: #16A34A;
    }

    .edit-icon-btn svg {
      width: 16px;
      height: 16px;
    }

    .tags-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem;
    }

    .tag-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem 0.25rem 0.65rem;
      background: #dcfce7;
      color: #16A34A;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 500;
      transition: background 0.1s ease, box-shadow 0.1s ease;
    }

    .tag-pill:hover .tag-remove {
      opacity: 1;
    }

    .tag-text {
      line-height: 1.2;
    }

    .tag-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 0;
      border: none;
      background: transparent;
      color: #16A34A;
      border-radius: 50%;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.1s ease, background 0.1s ease;
    }

    .tag-remove:hover {
      opacity: 1;
      background: rgba(22, 163, 74, 0.2);
    }

    .tag-remove svg {
      width: 10px;
      height: 10px;
    }

    .add-tag-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.5rem;
      color: #64748b;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      border-radius: 9999px;
      border: 1px dashed #cbd5e1;
      background: transparent;
      transition: border-color 0.12s ease, color 0.12s ease, background 0.12s ease;
    }

    .add-tag-trigger:hover {
      border-color: #16A34A;
      color: #16A34A;
      background: #f0fdf4;
    }

    .add-tag-trigger svg {
      width: 14px;
      height: 14px;
    }

    .tag-input-pill {
      padding: 0.2rem 0.5rem;
      background: #fff;
      border: 1px solid #e2e8f0;
    }

    .tag-input {
      width: 6rem;
      min-width: 4rem;
      padding: 0.1rem 0;
      border: none;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #1e293b;
      background: transparent;
      outline: none;
    }

    .tag-input::placeholder {
      color: #94a3b8;
    }

    .tags-dropdown {
      margin-top: 6px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      z-index: 50;
    }

    .tags-dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }

    .tags-dropdown-close {
      background: none;
      border: none;
      font-size: 1.1rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .tags-dropdown-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px;
      max-height: 140px;
      overflow-y: auto;
    }

    .tag-option {
      display: inline-flex;
      align-items: center;
      padding: 5px 10px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #15803d;
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .tag-option:hover {
      background: #dcfce7;
      border-color: #86efac;
    }

    .no-tags {
      margin: 0;
      font-size: 0.8125rem;
      color: #94a3b8;
      font-style: italic;
    }
  `]
})
export class InlineTagsComponent implements AfterViewChecked {
  @Input() tags: string[] = [];
  @Input() availableTags: string[] = [];
  @Input() label = '';

  @Output() tagsChange = new EventEmitter<TagsChangeEvent>();

  @ViewChild('addTagInput') addTagInputRef?: ElementRef<HTMLInputElement>;

  isEditing = false;
  isAddingTag = false;
  showDropdown = false;
  newTagValue = '';
  private shouldFocusAddInput = false;

  ngAfterViewChecked(): void {
    if (this.shouldFocusAddInput && this.addTagInputRef?.nativeElement) {
      this.shouldFocusAddInput = false;
      this.addTagInputRef.nativeElement.focus();
    }
  }

  getFilteredAvailable(): string[] {
    if (!this.availableTags?.length) return [];
    const set = new Set(this.tags.map(t => t.toLowerCase()));
    return this.availableTags.filter(t => !set.has(t.toLowerCase()));
  }

  removeTag(index: number): void {
    const removed = this.tags[index];
    const next = this.tags.filter((_, i) => i !== index);
    this.tagsChange.emit({ tags: next, removedTag: removed });
  }

  startAddTag(): void {
    this.isAddingTag = true;
    this.showDropdown = true;
    this.newTagValue = '';
    this.shouldFocusAddInput = true;
  }

  commitAddTag(): void {
    const value = this.newTagValue?.trim();
    this.isAddingTag = false;
    this.showDropdown = false;
    this.newTagValue = '';
    if (!value) return;
    const normalized = value.slice(0, 50);
    if (this.tags.some(t => t.toLowerCase() === normalized.toLowerCase())) return;
    this.tagsChange.emit({ tags: [...this.tags, normalized] });
  }

  cancelAddTag(): void {
    this.isAddingTag = false;
    this.showDropdown = false;
    this.newTagValue = '';
  }

  addFromDropdown(tag: string): void {
    if (this.tags.some(t => t.toLowerCase() === tag.toLowerCase())) return;
    this.tagsChange.emit({ tags: [...this.tags, tag] });
  }
}
