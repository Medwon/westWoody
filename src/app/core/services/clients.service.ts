import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ClientSearchRequest {
  name?: string;
  phone?: string;
  email?: string;
  lastVisitFrom?: string | null;
  lastVisitTo?: string | null;
  tags?: string[];
  clientType?: 'INDIVIDUAL' | 'BUSINESS' | null;
  sortBy?: 'name' | 'createdAt' | 'lastVisit';
  sortDirection?: 'ASC' | 'DESC';
  page?: number;
  size?: number;
}

export interface ClientSearchResult {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string | null;
  clientType: 'INDIVIDUAL' | 'BUSINESS';
  tags: string[];
  totalSpent: number;
  transactionCount: number;
  bonusBalance: number;
  bonusUsed: number;
  lastVisit: string;
  createdAt: string;
}

export interface ClientSearchResponse {
  content: ClientSearchResult[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private readonly apiUrl = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) {}

  /**
   * Search clients with filters and pagination
   */
  searchClients(request: ClientSearchRequest): Observable<ClientSearchResponse> {
    return this.http.post<ClientSearchResponse>(`${this.apiUrl}/search`, request);
  }

  /**
   * Get all available tags
   */
  getTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tags`);
  }
}
