import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found-state',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <!-- Beautiful SVG Illustration -->
        <div class="illustration">
          <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Background circle -->
            <circle cx="200" cy="150" r="120" fill="url(#bgGradient)" opacity="0.1"/>
            
            <!-- Floating elements -->
            <circle cx="80" cy="60" r="8" fill="#22c55e" opacity="0.3" class="float-1"/>
            <circle cx="320" cy="80" r="6" fill="#16A34A" opacity="0.4" class="float-2"/>
            <circle cx="60" cy="200" r="5" fill="#86efac" opacity="0.5" class="float-3"/>
            <circle cx="340" cy="220" r="7" fill="#22c55e" opacity="0.3" class="float-4"/>
            
            <!-- Main document/folder illustration -->
            <g class="main-illustration">
              <!-- Shadow -->
              <ellipse cx="200" cy="260" rx="80" ry="15" fill="#e2e8f0" opacity="0.5"/>
              
              <!-- Folder back -->
              <path d="M100 100 L100 220 C100 230 108 238 118 238 L282 238 C292 238 300 230 300 220 L300 100 Z" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="2"/>
              
              <!-- Folder tab -->
              <path d="M100 100 L100 85 C100 75 108 68 118 68 L165 68 C175 68 180 75 185 85 L200 100 L100 100 Z" fill="#dcfce7" stroke="#bbf7d0" stroke-width="2"/>
              
              <!-- Magnifying glass -->
              <g class="magnifier">
                <circle cx="230" cy="150" r="45" fill="white" stroke="#16A34A" stroke-width="4"/>
                <line x1="262" y1="182" x2="295" y2="215" stroke="#16A34A" stroke-width="6" stroke-linecap="round"/>
                <circle cx="230" cy="150" r="35" fill="none" stroke="#dcfce7" stroke-width="2"/>
                
                <!-- Question mark inside magnifier -->
                <text x="230" y="165" font-family="system-ui, sans-serif" font-size="40" font-weight="700" fill="#16A34A" text-anchor="middle">?</text>
              </g>
              
              <!-- Decorative lines (documents) -->
              <g opacity="0.6">
                <rect x="120" y="120" width="60" height="6" rx="3" fill="#bbf7d0"/>
                <rect x="120" y="135" width="45" height="6" rx="3" fill="#dcfce7"/>
                <rect x="120" y="180" width="50" height="6" rx="3" fill="#bbf7d0"/>
                <rect x="120" y="195" width="35" height="6" rx="3" fill="#dcfce7"/>
              </g>
            </g>
            
            <!-- Stars/sparkles -->
            <g class="sparkles">
              <path d="M55 120 L58 128 L66 131 L58 134 L55 142 L52 134 L44 131 L52 128 Z" fill="#fbbf24" class="sparkle-1"/>
              <path d="M340 140 L342 146 L348 148 L342 150 L340 156 L338 150 L332 148 L338 146 Z" fill="#22c55e" class="sparkle-2"/>
              <path d="M90 240 L92 245 L97 247 L92 249 L90 254 L88 249 L83 247 L88 245 Z" fill="#86efac" class="sparkle-3"/>
            </g>
            
            <defs>
              <linearGradient id="bgGradient" x1="80" y1="30" x2="320" y2="270">
                <stop offset="0%" stop-color="#22c55e"/>
                <stop offset="100%" stop-color="#16A34A"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <!-- Text content -->
        <h2 class="title">{{ title }}</h2>
        <p class="description">{{ description }}</p>
        
        <!-- Action button -->
        <a [routerLink]="backLink" class="back-button">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ backText }}
        </a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      min-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 50%, #f8fafc 100%);
      margin: -2rem;
    }

    .not-found-content {
      text-align: center;
      max-width: 500px;
    }

    .illustration {
      width: 100%;
      max-width: 400px;
      margin: 0 auto 2rem;
    }

    .illustration svg {
      width: 100%;
      height: auto;
    }

    /* Floating animations */
    .float-1 {
      animation: float 4s ease-in-out infinite;
    }

    .float-2 {
      animation: float 5s ease-in-out infinite 0.5s;
    }

    .float-3 {
      animation: float 4.5s ease-in-out infinite 1s;
    }

    .float-4 {
      animation: float 5.5s ease-in-out infinite 0.3s;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    /* Main illustration subtle animation */
    .main-illustration {
      animation: breathe 3s ease-in-out infinite;
      transform-origin: center;
    }

    @keyframes breathe {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.02);
      }
    }

    /* Magnifier hover effect */
    .magnifier {
      transition: transform 0.3s ease;
    }

    .illustration:hover .magnifier {
      transform: rotate(-5deg) scale(1.05);
    }

    /* Sparkle animations */
    .sparkle-1 {
      animation: sparkle 2s ease-in-out infinite;
    }

    .sparkle-2 {
      animation: sparkle 2.5s ease-in-out infinite 0.3s;
    }

    .sparkle-3 {
      animation: sparkle 2.2s ease-in-out infinite 0.6s;
    }

    @keyframes sparkle {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.5;
        transform: scale(0.8);
      }
    }

    .title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 0.75rem;
    }

    .description {
      font-size: 1rem;
      color: #64748b;
      margin: 0 0 2rem;
      line-height: 1.6;
    }

    .back-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #16A34A 0%, #22c55e 100%);
      color: white;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3);
    }

    .back-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);
    }

    .back-button svg {
      width: 18px;
      height: 18px;
    }

    @media (max-width: 480px) {
      .title {
        font-size: 1.5rem;
      }

      .description {
        font-size: 0.9375rem;
      }

      .illustration {
        max-width: 300px;
      }
    }
  `]
})
export class NotFoundStateComponent {
  @Input() title = 'Ничего не найдено';
  @Input() description = 'К сожалению, запрашиваемая информация не найдена или была удалена.';
  @Input() backLink = '/';
  @Input() backText = 'Вернуться назад';
}
