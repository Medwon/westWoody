import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypographyComponent } from '../../shared/components/typography/typography.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, TypographyComponent],
  template: `
    <footer class="footer">
      <div class="footer-container">
        <app-typography variant="body2" [muted]="true" class="footer-text">
          &copy; {{ currentYear }} Westwood. Все права защищены.
        </app-typography>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #ffffff;
      padding: 1.5rem 0;
      margin-top: auto;
      border-top: 1px solid #e5e7eb;
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      text-align: center;
    }

    .footer-text {
      color: #6b7280;
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}

