import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-promo-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="promo-panel">
      <div class="promo-content">
        <div class="promo-logo">
          <svg viewBox="0 0 24 24" fill="none" class="logo-icon">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.9"/>
            <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="promo-title">
          <span class="title-greeting">Привет,</span>
          <span class="title-brand">WestWood!<span class="wave-emoji">👋🏻</span></span>
        </h1>
        <p class="promo-text">
          Забудьте о ручном управлении бонусами и акциями.
          Автоматизируйте программу лояльности, увеличьте возврат клиентов и зарабатывайте больше — без лишних усилий.
        </p>
        <div class="promo-footer">
          <span>© 2026 WestWood. Все права защищены.</span>
        </div>
      </div>
      <div class="promo-background">
        <div class="noise-overlay"></div>
        <svg viewBox="0 0 400 600" class="bg-pattern" preserveAspectRatio="none">
          <path d="M0,100 Q200,50 400,100 T400,300 Q200,250 0,300 T0,500" stroke="rgba(255,255,255,0.25)" stroke-width="2" fill="none"/>
          <path d="M0,150 Q200,100 400,150 T400,350 Q200,300 0,350 T0,550" stroke="rgba(255,255,255,0.2)" stroke-width="2" fill="none"/>
          <path d="M0,200 Q200,150 400,200 T400,400 Q200,350 0,400 T0,600" stroke="rgba(255,255,255,0.15)" stroke-width="2" fill="none"/>
          <path d="M0,50 Q200,0 400,50 T400,250 Q200,200 0,250 T0,450" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" fill="none"/>
          <path d="M0,250 Q200,200 400,250 T400,450 Q200,400 0,450 T0,650" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" fill="none"/>
        </svg>
      </div>
    </div>
  `,
  styles: [`
    :host {
      flex: 0 0 55%;
      display: block;
    }

    .promo-panel {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #16A34A 0%, #15803d 50%, #14532d 100%);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      min-height: 100vh;
    }

    .promo-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .noise-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      opacity: 0.08;
      pointer-events: none;
    }

    .bg-pattern {
      width: 100%;
      height: 100%;
      opacity: 0.6;
    }

    .promo-content {
      position: relative;
      z-index: 1;
      color: white;
      max-width: 610px;
      margin-top: -100px;
    }

    .promo-logo {
      margin-bottom: 2rem;
    }

    .promo-logo .logo-icon {
      width: 96px;
      height: 96px;
      color: white;
    }

    .promo-title {
      margin: 0 0 2rem 0;
      line-height: 1.1;
    }

    .title-greeting {
      display: block;
      font-size: 4rem;
      font-weight: 800;
    }

    .title-brand {
      display: block;
      font-size: 4rem;
      font-weight: 800;
    }

    .wave-emoji {
      display: inline-block;
    }

    .promo-text {
      font-size: 1.25rem;
      line-height: 1.2;
      opacity: 0.95;
      margin: 0 0 4rem 0;
    }

    .promo-footer {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      :host {
        flex: 0 0 auto;
      }

      .promo-panel {
        min-height: 300px;
        padding: 2rem;
      }

      .title-greeting,
      .title-brand {
        font-size: 2.5rem;
      }

      .promo-text {
        font-size: 1.1rem;
        margin-bottom: 2rem;
      }
    }

    @media (max-width: 640px) {
      .promo-panel {
        padding: 1.5rem;
        min-height: 250px;
      }

      .title-greeting,
      .title-brand {
        font-size: 2rem;
      }

      .promo-text {
        font-size: 1rem;
      }
    }
  `]
})
export class AuthPromoPanelComponent {
}

