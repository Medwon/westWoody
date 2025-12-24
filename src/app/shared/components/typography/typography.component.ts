import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';

@Component({
  selector: 'app-typography',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container [ngSwitch]="variant">
      <h1 *ngSwitchCase="'h1'" [class]="getClasses()"><ng-content></ng-content></h1>
      <h2 *ngSwitchCase="'h2'" [class]="getClasses()"><ng-content></ng-content></h2>
      <h3 *ngSwitchCase="'h3'" [class]="getClasses()"><ng-content></ng-content></h3>
      <h4 *ngSwitchCase="'h4'" [class]="getClasses()"><ng-content></ng-content></h4>
      <h5 *ngSwitchCase="'h5'" [class]="getClasses()"><ng-content></ng-content></h5>
      <h6 *ngSwitchCase="'h6'" [class]="getClasses()"><ng-content></ng-content></h6>
      <p *ngSwitchCase="'body1'" [class]="getClasses()"><ng-content></ng-content></p>
      <p *ngSwitchCase="'body2'" [class]="getClasses()"><ng-content></ng-content></p>
      <span *ngSwitchCase="'caption'" [class]="getClasses()"><ng-content></ng-content></span>
      <span *ngSwitchCase="'overline'" [class]="getClasses()"><ng-content></ng-content></span>
    </ng-container>
  `,
  styles: [`
    h1, h2, h3, h4, h5, h6, p, span {
      margin: 0;
      padding: 0;
    }

    :host h1 {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1.2;
    }

    :host h2 {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1.3;
    }

    :host h3 {
      font-size: 1.75rem;
      font-weight: 600;
      line-height: 1.4;
    }

    :host h4 {
      font-size: 1.5rem;
      font-weight: 600;
      line-height: 1.4;
    }

    :host h5 {
      font-size: 1.25rem;
      font-weight: 600;
      line-height: 1.5;
    }

    :host h6 {
      font-size: 1.125rem;
      font-weight: 600;
      line-height: 1.5;
    }

    :host p.body1 {
      font-size: 1rem;
      font-weight: 400;
      line-height: 1.6;
    }

    :host p.body2 {
      font-size: 0.875rem;
      font-weight: 400;
      line-height: 1.6;
    }

    :host span.caption {
      font-size: 0.75rem;
      font-weight: 400;
      line-height: 1.5;
    }

    :host span.overline {
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1.5;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .no-wrap {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bold {
      font-weight: 700;
    }

    .medium {
      font-weight: 500;
    }

    .muted {
      color: #64748b;
    }
  `]
})
export class TypographyComponent {
  @Input() variant: TypographyVariant = 'body1';
  @Input() noWrap = false;
  @Input() bold = false;
  @Input() medium = false;
  @Input() muted = false;

  getClasses(): string {
    const classes: string[] = [this.variant];
    if (this.noWrap) classes.push('no-wrap');
    if (this.bold) classes.push('bold');
    if (this.medium) classes.push('medium');
    if (this.muted) classes.push('muted');
    return classes.join(' ');
  }
}

