import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-link',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a
      [routerLink]="routerLink"
      [href]="href"
      [target]="target"
      [class]="getClasses()">
      <ng-content></ng-content>
    </a>
  `,
  styles: [`
    a {
      color: #007bff;
      text-decoration: none;
      transition: color 0.2s ease;
      cursor: pointer;
    }

    a:hover {
      color: #0056b3;
      text-decoration: underline;
    }

    a.underline {
      text-decoration: underline;
    }

    a.no-underline:hover {
      text-decoration: none;
    }
  `]
})
export class LinkComponent {
  @Input() routerLink?: string | any[];
  @Input() href?: string;
  @Input() target?: string;
  @Input() underline = false;
  @Input() noUnderline = false;

  getClasses(): string {
    const classes: string[] = [];
    if (this.underline) classes.push('underline');
    if (this.noUnderline) classes.push('no-underline');
    return classes.join(' ');
  }
}

