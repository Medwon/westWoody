import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

export interface PageHeaderData {
  title: string;
  breadcrumbs: BreadcrumbItem[];
}

@Injectable({
  providedIn: 'root'
})
export class PageHeaderService {
  private headerDataSubject = new BehaviorSubject<PageHeaderData>({
    title: '',
    breadcrumbs: []
  });

  headerData$: Observable<PageHeaderData> = this.headerDataSubject.asObservable();

  setPageHeader(title: string, breadcrumbs: BreadcrumbItem[]): void {
    this.headerDataSubject.next({ title, breadcrumbs });
  }

  setTitle(title: string): void {
    const current = this.headerDataSubject.value;
    this.headerDataSubject.next({ ...current, title });
  }

  setBreadcrumbs(breadcrumbs: BreadcrumbItem[]): void {
    const current = this.headerDataSubject.value;
    this.headerDataSubject.next({ ...current, breadcrumbs });
  }

  clear(): void {
    this.headerDataSubject.next({ title: '', breadcrumbs: [] });
  }
}

