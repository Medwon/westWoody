import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reward-program-configure-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `

      <div class="configure-page">
        <p class="back-link">
          <a routerLink="/reward-programs">← Программа вознаграждений</a>
        </p>
        <h1 class="page-title">Настройка: {{ typeLabel }}</h1>
        <p class="placeholder">Страница настройки будет загружаться динамически с бэкенда.</p>
        <p class="meta">Тип: {{ type }} · UUID: {{ uuid }}</p>
      </div>
  `,
  styles: [`
    // .page-wrapper { padding: 2rem; }
    .configure-page { max-width: 800px; margin: 0 auto; }
    .back-link { margin-bottom: 1rem; }
    .back-link a { color: #16A34A; text-decoration: none; font-weight: 500; }
    .page-title { font-size: 1.5rem; margin: 0 0 1rem 0; color: #0f172a; }
    .placeholder { color: #64748b; margin: 0 0 0.5rem 0; }
    .meta { font-size: 0.85rem; color: #94a3b8; margin: 0; }
  `]
})
export class RewardProgramConfigurePageComponent {
  type = '';
  uuid = '';
  typeLabel = '';

  private readonly typeLabels: Record<string, string> = {
    event: 'Event',
    welcome: 'Event', // legacy
    birthday: 'День рождения',
    referral: 'Реферальная программа',
    cashback: 'Кэшбэк'
  };

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.type = params['type'] ?? '';
      this.uuid = params['uuid'] ?? '';
      this.typeLabel = this.typeLabels[this.type] ?? this.type;
    });
  }
}
