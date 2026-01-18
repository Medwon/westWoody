import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BonusType,
  CreateBonusTypeRequest,
  UpdateBonusTypeRequest,
  BonusTypeResponse,
  PreconfiguredBonusType
} from '../models/bonus-type.model';

@Injectable({
  providedIn: 'root'
})
export class BonusTypesService {
  private readonly apiUrl = `${environment.apiUrl}/bonus-types`;

  constructor(private http: HttpClient) {}

  // Get all bonus types
  getAllBonusTypes(): Observable<BonusTypeResponse[]> {
    return this.http.get<BonusTypeResponse[]>(this.apiUrl);
  }

  // Get active bonus types only
  getActiveBonusTypes(): Observable<BonusTypeResponse[]> {
    return this.http.get<BonusTypeResponse[]>(`${this.apiUrl}/active`);
  }

  // Get bonus type by ID
  getBonusTypeById(id: number): Observable<BonusTypeResponse> {
    return this.http.get<BonusTypeResponse>(`${this.apiUrl}/${id}`);
  }

  // Create bonus type
  createBonusType(data: CreateBonusTypeRequest): Observable<BonusTypeResponse> {
    return this.http.post<BonusTypeResponse>(this.apiUrl, data);
  }

  // Update bonus type
  updateBonusType(id: number, data: UpdateBonusTypeRequest): Observable<BonusTypeResponse> {
    return this.http.put<BonusTypeResponse>(`${this.apiUrl}/${id}`, data);
  }

  // Toggle bonus type enabled/disabled
  toggleBonusType(id: number, enabled: boolean): Observable<BonusTypeResponse> {
    return this.http.patch<BonusTypeResponse>(`${this.apiUrl}/${id}/toggle?enabled=${enabled}`, {});
  }

  // Delete bonus type
  deleteBonusType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get preconfigured bonus types
  getPreconfiguredBonusTypes(): Observable<PreconfiguredBonusType[]> {
    return this.http.get<PreconfiguredBonusType[]>(`${this.apiUrl}/preconfigured`);
  }

  // Get bonus types by flow (returns a single object, not an array)
  getBonusTypesByFlow(flow: string): Observable<BonusTypeResponse> {
    return this.http.get<BonusTypeResponse>(`${this.apiUrl}/flow/${flow}`);
  }
}
