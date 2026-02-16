import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MessageTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMessageTemplateRequest {
  name: string;
  type: string;
  content: string;
}

export interface UpdateMessageTemplateRequest {
  name?: string;
  type?: string;
  content?: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageTemplatesService {
  private readonly apiUrl = `${environment.apiUrl}/message-templates`;

  constructor(private http: HttpClient) {}

  /**
   * Get all message templates
   * @param type - Optional filter by template type
   * @returns Observable with array of message templates
   */
  getAllTemplates(type?: string): Observable<MessageTemplate[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<MessageTemplate[]>(this.apiUrl, { params });
  }

  /**
   * Get message template by ID
   * @param id - Template ID
   * @returns Observable with message template
   */
  getTemplateById(id: string): Observable<MessageTemplate> {
    return this.http.get<MessageTemplate>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new message template
   * @param data - Template data
   * @returns Observable with created message template
   */
  createTemplate(data: CreateMessageTemplateRequest): Observable<MessageTemplate> {
    return this.http.post<MessageTemplate>(this.apiUrl, data);
  }

  /**
   * Update message template
   * @param id - Template ID
   * @param data - Updated template data
   * @returns Observable with updated message template
   */
  updateTemplate(id: string, data: UpdateMessageTemplateRequest): Observable<MessageTemplate> {
    return this.http.put<MessageTemplate>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete message template
   * @param id - Template ID
   * @returns Observable with void
   */
  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get populated message template with variables replaced
   * @param type - Template type
   * @param clientId - Client UUID
   * @param paymentTxId - Optional payment transaction ID
   * @returns Observable with populated template content
   */
  getPopulatedTemplate(
    type: string,
    clientId: string,
    paymentTxId?: string,
    expiryDate?: string // YYYY-MM-DD for BONUS_EXPIRY (resolve vars for that date)
  ): Observable<{ id: number; name: string; type: string; populatedContent: string }> {
    let params = new HttpParams()
      .set('type', type)
      .set('clientId', clientId);
    
    if (paymentTxId) {
      params = params.set('paymentTxId', paymentTxId);
    }
    if (expiryDate) {
      params = params.set('expiryDate', expiryDate);
    }
    
    return this.http.get<{ id: number; name: string; type: string; populatedContent: string }>(`${this.apiUrl}/populated`, { params });
  }

  /**
   * Get available template variables
   * @returns Observable with array of template variables
   */
  getTemplateVariables(): Observable<TemplateVariable[]> {
    return this.http.get<TemplateVariable[]>(`${this.apiUrl}/variables`);
  }

  /**
   * Get available template types
   * @returns Observable with array of template types with display names
   */
  getTemplateTypes(): Observable<Array<{ type: string; displayName: string }>> {
    return this.http.get<Array<{ type: string; displayName: string }>>(`${this.apiUrl}/types`);
  }
}
