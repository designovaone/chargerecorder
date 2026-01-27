/**
 * Core data types for the Charge Recorder application.
 */

export interface ChargingSession {
  id: number;
  start_percentage: number;
  start_time: string;
  end_percentage: number | null;
  end_time: string | null;
}

export type SessionType = 'start' | 'end';

export interface SessionRequest {
  percentage: number;
  type: SessionType;
}

export interface StatusResponse {
  status: 'charging' | 'idle';
  start_percentage?: number;
  start_time?: string;
}

export interface UnlockRequest {
  phrase: string;
}

export interface UnlockResponse {
  success: boolean;
  message: string;
}

export interface SessionsResponse {
  sessions: ChargingSession[];
}

export interface SessionResponse {
  message: string;
  session: ChargingSession;
}

export interface ErrorResponse {
  detail: string;
}
