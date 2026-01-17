import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  private defaultPageSize = 15;
  private readonly pageSizeOptions = [2, 5, 10, 15, 25];

  constructor(private router: Router) {}

  getPageSizeOptions(): number[] {
    return this.pageSizeOptions;
  }

  getDefaultPageSize(): number {
    return this.defaultPageSize;
  }

  /**
   * Инициализирует параметры пагинации из query параметров роута
   */
  initFromRoute(route: ActivatedRoute, paginationKey: string = 'default'): PaginationParams {
    const pageParam = paginationKey === 'default' ? 'page' : `${paginationKey}Page`;
    const pageSizeParam = paginationKey === 'default' ? 'pageSize' : `${paginationKey}PageSize`;
    
    const page = parseInt(route.snapshot.queryParams[pageParam] || '1', 10);
    const pageSize = parseInt(route.snapshot.queryParams[pageSizeParam] || String(this.defaultPageSize), 10);
    
    return {
      page: isNaN(page) || page < 1 ? 1 : page,
      pageSize: this.pageSizeOptions.includes(pageSize) ? pageSize : this.defaultPageSize
    };
  }

  /**
   * Обновляет query параметры роута для пагинации
   */
  updateRoute(route: ActivatedRoute, page: number, pageSize: number, paginationKey: string = 'default'): void {
    // Получаем текущие query параметры
    const currentParams = { ...route.snapshot.queryParams };
    
    // Определяем имена параметров на основе ключа
    const pageParam = paginationKey === 'default' ? 'page' : `${paginationKey}Page`;
    const pageSizeParam = paginationKey === 'default' ? 'pageSize' : `${paginationKey}PageSize`;
    
    // Создаем новый объект query параметров, копируя все существующие параметры кроме параметров этой пагинации
    const queryParams: any = {};
    
    // Сохраняем все существующие параметры, кроме параметров этой пагинации
    Object.keys(currentParams).forEach(key => {
      if (key !== pageParam && key !== pageSizeParam) {
        queryParams[key] = currentParams[key];
      }
    });
    
    // Устанавливаем параметр page только если это не первая страница
    if (page > 1) {
      queryParams[pageParam] = page;
    }
    // Если page === 1, параметр не добавляется, что удалит его из URL
    
    // Устанавливаем параметр pageSize только если он отличается от дефолтного
    if (pageSize !== this.defaultPageSize) {
      queryParams[pageSizeParam] = pageSize;
    }
    // Если pageSize === default, параметр не добавляется, что удалит его из URL

    this.router.navigate([], {
      relativeTo: route,
      queryParams: queryParams,
      replaceUrl: true
    });
  }

  /**
   * Вычисляет данные для текущей страницы
   */
  getPaginatedData<T>(data: T[], page: number, pageSize: number): {
    paginatedData: T[];
    totalPages: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
  } {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      paginatedData,
      totalPages: totalPages || 1,
      totalItems,
      startIndex: startIndex + 1,
      endIndex
    };
  }
}
