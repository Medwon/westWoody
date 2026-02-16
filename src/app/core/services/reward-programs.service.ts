import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type RewardProgramType = 'WELCOME' | 'BIRTHDAY' | 'REFERRAL' | 'CASHBACK';

export type RewardProgramSlotStatus = 'NOT_CREATED' | 'DRAFT' | 'ACTIVE';

export interface RewardProgramSlot {
  type: RewardProgramType;
  status: RewardProgramSlotStatus;
  uuid: string | null;
}

export interface CreateDraftResponse {
  uuid: string;
  type: RewardProgramType;
  status: 'DRAFT' | 'ACTIVE';
}

const API = `${environment.apiUrl}/reward-programs`;

@Injectable({ providedIn: 'root' })
export class RewardProgramsService {

  constructor(private http: HttpClient) {}

  getSlots(): Observable<RewardProgramSlot[]> {
    return this.http.get<RewardProgramSlot[]>(`${API}/slots`);
  }

  createDraft(type: RewardProgramType): Observable<CreateDraftResponse> {
    return this.http.post<CreateDraftResponse>(`${API}/draft`, { type });
  }
}

/** URL path segment for route (lowercase). */
export function rewardProgramTypeToSlug(type: RewardProgramType): string {
  return type.toLowerCase();
}

export function slugToRewardProgramType(slug: string): RewardProgramType | null {
  const upper = slug?.toUpperCase();
  if (upper === 'WELCOME' || upper === 'BIRTHDAY' || upper === 'REFERRAL' || upper === 'CASHBACK') {
    return upper as RewardProgramType;
  }
  return null;
}
