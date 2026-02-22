import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RewardProgramType,
  RewardProgramSlot,
  CreateDraftResponse,
  RewardProgramResponse,
  RewardProgramListItem,
  SaveCashbackDraftRequest,
  LaunchCashbackProgramRequest,
  SaveWelcomeProgramDraftRequest,
  LaunchWelcomeProgramRequest,
  PagedTieredClientsResponse,
  ScheduleOverlapCheckResponse
} from '../models/reward-program.model';

const API = `${environment.apiUrl}/reward-programs`;

@Injectable({ providedIn: 'root' })
export class RewardProgramsService {

  constructor(private http: HttpClient) {}

  // ─── Slots & Draft Creation ──────────────────────────────────────

  getSlots(): Observable<RewardProgramSlot[]> {
    return this.http.get<RewardProgramSlot[]>(`${API}/slots`);
  }

  createDraft(type: RewardProgramType): Observable<CreateDraftResponse> {
    return this.http.post<CreateDraftResponse>(`${API}/draft`, { type });
  }

  // ─── Cashback Draft ──────────────────────────────────────────────

  saveCashbackDraft(uuid: string, data: SaveCashbackDraftRequest): Observable<RewardProgramResponse> {
    return this.http.put<RewardProgramResponse>(`${API}/${uuid}/cashback`, data);
  }

  saveWelcomeDraft(uuid: string, data: SaveWelcomeProgramDraftRequest): Observable<RewardProgramResponse> {
    return this.http.put<RewardProgramResponse>(`${API}/${uuid}/welcome`, data);
  }

  // ─── Get Program ─────────────────────────────────────────────────

  getProgram(uuid: string): Observable<RewardProgramResponse> {
    return this.http.get<RewardProgramResponse>(`${API}/${uuid}`);
  }

  getTieredClients(
    programUuid: string,
    page = 0,
    size = 20,
    tierName?: string,
    search?: string,
    searchPhone?: string,
    sort?: string
  ): Observable<PagedTieredClientsResponse> {
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (tierName) params['tierName'] = tierName;
    if (search) params['search'] = search;
    if (searchPhone) params['searchPhone'] = searchPhone;
    if (sort) params['sort'] = sort;
    return this.http.get<PagedTieredClientsResponse>(
      `${API}/${programUuid}/tiered-clients`,
      { params }
    );
  }

  // ─── List Programs ───────────────────────────────────────────────

  listPrograms(): Observable<RewardProgramListItem[]> {
    return this.http.get<RewardProgramListItem[]>(`${API}`);
  }

  checkScheduleOverlap(
    type: RewardProgramType,
    start: string,
    end: string | null,
    excludeUuid?: string | null
  ): Observable<ScheduleOverlapCheckResponse> {
    const params: Record<string, string> = { type, start };
    if (end != null) params['end'] = end;
    if (excludeUuid) params['excludeUuid'] = excludeUuid;
    return this.http.get<ScheduleOverlapCheckResponse>(`${API}/check-schedule-overlap`, { params });
  }

  // ─── Lifecycle ───────────────────────────────────────────────────

  launchCashbackProgram(uuid: string, data: LaunchCashbackProgramRequest): Observable<RewardProgramResponse> {
    return this.http.post<RewardProgramResponse>(`${API}/${uuid}/launch`, data);
  }

  launchWelcomeProgram(uuid: string, data: LaunchWelcomeProgramRequest): Observable<RewardProgramResponse> {
    return this.http.post<RewardProgramResponse>(`${API}/${uuid}/launch-welcome`, data);
  }

  deactivateProgram(uuid: string): Observable<RewardProgramResponse> {
    return this.http.post<RewardProgramResponse>(`${API}/${uuid}/deactivate`, {});
  }

  archiveProgram(uuid: string): Observable<RewardProgramResponse> {
    return this.http.post<RewardProgramResponse>(`${API}/${uuid}/archive`, {});
  }

  deleteProgram(uuid: string): Observable<void> {
    return this.http.delete<void>(`${API}/${uuid}`);
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
