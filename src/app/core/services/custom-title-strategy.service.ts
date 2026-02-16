import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CustomTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot): void {
    const title = this.buildTitle(routerState);
    if (title !== undefined) {
      this.title.setTitle(`Westwood - ${title}`);
    } else {
      // Fallback to route path
      const route = routerState.root;
      const titleFromPath = this.getTitleFromRoute(route);
      this.title.setTitle(`Westwood - ${titleFromPath}`);
    }
  }

  private getTitleFromRoute(route: any): string {
    // Get the deepest route
    while (route.firstChild) {
      route = route.firstChild;
    }

    const path = route.routeConfig?.path || '';
    
    // Map paths to titles
    const titleMap: Record<string, string> = {
      'home': 'Home',
      'clients': 'Clients',
      'payments': 'Payments',
      'users': 'Users',
      'profile': 'Profile',
      'bonus-program': 'Reward Program',
      'communications': 'Communications',
      'whatsapp': 'WhatsApp',
      'login': 'Login',
      'activation': 'Activation',
      'forgot-password': 'Forgot Password',
      'reset-password': 'Reset Password'
    };

    // Handle dynamic routes
    if (path.includes(':id')) {
      const routeData = route.snapshot?.data;
      if (routeData && routeData['title']) {
        return routeData['title'];
      }
      // Try to get from route params
      const params = route.snapshot?.params;
      if (params && params['id']) {
        if (path.startsWith('clients/')) {
          return 'Client';
        } else if (path.startsWith('users/')) {
          return 'User';
        }
      }
    }

    return titleMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
  }
}
