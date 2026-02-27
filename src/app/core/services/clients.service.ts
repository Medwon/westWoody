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

export interface ClientDetails {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string | null;
  clientType: 'INDIVIDUAL' | 'BUSINESS';
  tags: string[];
  notes: string | null;
  dateOfBirth: string | null;
  referrerId: string | null;
  createdAt: string;
}

export interface UpdateClientRequest {
  phone?: string;
  name?: string;
  surname?: string | null;
  dateOfBirth?: string | null;
  notes?: string | null;
  tags?: string[];
  clientType?: 'INDIVIDUAL' | 'BUSINESS';
  referrerId?: string | null;
}

export interface UpdateClientNotesRequest {
  notes: string;
}

export interface UpdateClientTagsRequest {
  tags: string[];
}

export interface ClientBirthdayStatsResponse {
  withBirthdate: number;
  grantedThisYear: number;
}

export interface ClientByPhoneResponse {
  clientId: string;
  name: string;
  surname: string;
  comment: string | null;
  tags: string[];
  currentBonusBalance: number;
  clientType: 'INDIVIDUAL' | 'BUSINESS';
}

export interface CreateClientRequest {
  phone: string;
  name: string;
  surname?: string;
  dateOfBirth?: string | null;
  notes?: string | null;
  tags?: string[];
  clientType: 'INDIVIDUAL' | 'BUSINESS';
  referrerId?: string | null;
  email?: string | null;
}

export interface CreateClientResponse {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string | null;
  clientType: 'INDIVIDUAL' | 'BUSINESS';
  tags: string[];
  notes: string | null;
  dateOfBirth: string | null;
  referrerId: string | null;
  createdAt: string;
}

export interface FrequentClientDto {
  clientId: string;
  phone: string;
  name: string;
  surname: string | null;
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

  /**
   * Get client by ID
   */
  getClientById(clientId: string): Observable<ClientDetails> {
    return this.http.get<ClientDetails>(`${this.apiUrl}/${clientId}`);
  }

  /**
   * Update client information
   */
  updateClient(clientId: string, request: UpdateClientRequest): Observable<ClientDetails> {
    const url = `${this.apiUrl}/${clientId}`;
    console.log('=== UPDATE CLIENT REQUEST ===');
    console.log('URL:', url);
    console.log('Method: PUT');
    console.log('Client ID:', clientId);
    console.log('Full Request Payload:', JSON.stringify(request, null, 2));
    console.log('Request Payload (object):', request);
    console.log('============================');
    return this.http.put<ClientDetails>(url, request);
  }

  /**
   * Update client notes
   */
  updateClientNotes(clientId: string, request: UpdateClientNotesRequest): Observable<void> {
    const url = `${this.apiUrl}/${clientId}/notes`;
    console.log('=== UPDATE CLIENT NOTES REQUEST ===');
    console.log('URL:', url);
    console.log('Method: PUT');
    console.log('Client ID:', clientId);
    console.log('Full Request Payload:', JSON.stringify(request, null, 2));
    console.log('Request Payload (object):', request);
    console.log('===================================');
    return this.http.put<void>(url, request);
  }

  /**
   * Update client tags
   */
  updateClientTags(clientId: string, request: UpdateClientTagsRequest): Observable<void> {
    const url = `${this.apiUrl}/${clientId}/tags`;
    console.log('=== UPDATE CLIENT TAGS REQUEST ===');
    console.log('URL:', url);
    console.log('Method: PUT');
    console.log('Client ID:', clientId);
    console.log('Full Request Payload:', JSON.stringify(request, null, 2));
    console.log('Request Payload (object):', request);
    console.log('==================================');
    return this.http.put<void>(url, request);
  }

  /**
   * Get client by phone number
   */
  getClientByPhone(phoneNumber: string): Observable<ClientByPhoneResponse> {
    return this.http.get<ClientByPhoneResponse>(`${this.apiUrl}/phone/${encodeURIComponent(phoneNumber)}`);
  }

  /**
   * Create a new client
   */
  createClient(request: CreateClientRequest): Observable<CreateClientResponse> {
    console.log('=== CREATE CLIENT REQUEST ===');
    console.log('URL:', `${this.apiUrl}`);
    console.log('Method: POST');
    console.log('Full Request Payload:', JSON.stringify(request, null, 2));
    console.log('Request Payload (object):', request);
    console.log('============================');
    return this.http.post<CreateClientResponse>(this.apiUrl, request);
  }

  /**
   * Delete a client by ID
   */
  deleteClient(clientId: string): Observable<void> {
    console.log('=== DELETE CLIENT REQUEST ===');
    console.log('URL:', `${this.apiUrl}/${clientId}`);
    console.log('Method: DELETE');
    console.log('Client ID:', clientId);
    console.log('============================');
    return this.http.delete<void>(`${this.apiUrl}/${clientId}`);
  }

  /**
   * Get frequent clients (most transactions)
   */
  getFrequentClients(limit: number = 5): Observable<FrequentClientDto[]> {
    return this.http.get<FrequentClientDto[]>(`${this.apiUrl}/frequent?limit=${limit}`);
  }

  /**
   * Get birthday stats for event program: clients with birthdate set and how many will be granted this year (birthdays after today).
   */
  getBirthdayStats(): Observable<ClientBirthdayStatsResponse> {
    return this.http.get<ClientBirthdayStatsResponse>(`${this.apiUrl}/birthday-stats`);
  }

  /**
   * Search client by phone number for bonus management
   * Returns full client details in a unified format
   */
  searchClientByPhone(phoneNumber: string): Observable<{
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    type: 'individual' | 'business';
    tags: string[];
  } | null> {
    return new Observable(observer => {
      this.getClientByPhone(phoneNumber).subscribe({
        next: (response) => {
          // Convert ClientByPhoneResponse to the expected format
          observer.next({
            id: response.clientId,
            firstName: response.name,
            lastName: response.surname,
            phone: phoneNumber,
            email: null,
            type: response.clientType === 'BUSINESS' ? 'business' : 'individual',
            tags: response.tags || []
          });
          observer.complete();
        },
        error: (err) => {
          if (err.status === 404) {
            observer.next(null);
            observer.complete();
          } else {
            observer.error(err);
          }
        }
      });
    });
  }
}
