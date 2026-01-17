import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MessageRecord {
  id: string;
  clientId: string;
  clientName?: string;
  messageContent: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
  status: string;
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
  initiatedByUserId?: number;
  initiatedByUsername?: string;
}

export interface SendMessageRequest {
  clientId: string;
  messageContent: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
}

export interface SendMessageResponse {
  id: string;
  clientId: string;
  messageContent: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
  status: string;
  sentAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private readonly apiUrl = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient) {}

  /**
   * Send a message to a client
   * @param data - Message data including clientId, messageContent, and channel
   * @returns Observable with sent message response
   */
  sendMessage(data: SendMessageRequest): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(`${this.apiUrl}/send`, data);
  }

  /**
   * Get message records by channel
   * @param channel - Channel type: EMAIL, WHATSAPP, or SMS
   * @returns Observable with array of message records
   */
  getMessagesByChannel(channel: 'EMAIL' | 'WHATSAPP' | 'SMS'): Observable<MessageRecord[]> {
    return this.http.get<MessageRecord[]>(`${this.apiUrl}/channel/${channel}`);
  }
}
