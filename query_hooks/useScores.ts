import { useQuery } from '@tanstack/react-query';
import { PhaseScoresResponse, PhaseSummaryResponse, SessionScoresResponse, SessionSummaryResponse } from '../interfaces/training';
import { getPhaseScores, getPhaseSummary, getSessionScores, getSessionSummary } from '../services/apiClient';

export const SESSION_SCORES_QUERY_KEY = (sessionId: string) =>
  ['scores', 'session', sessionId] as const;

export const PHASE_SCORES_QUERY_KEY = (phaseId: string) =>
  ['scores', 'phase', phaseId] as const;

export const SESSION_SUMMARY_QUERY_KEY = (sessionId: string) =>
  ['scores', 'session', sessionId, 'summary'] as const;

export const PHASE_SUMMARY_QUERY_KEY = (phaseId: string) =>
  ['scores', 'phase', phaseId, 'summary'] as const;

export const useSessionScores = (sessionId?: string) =>
  useQuery<SessionScoresResponse>({
    queryKey: sessionId ? SESSION_SCORES_QUERY_KEY(sessionId) : ['scores', 'session'],
    queryFn: () => getSessionScores(sessionId as string),
    enabled: Boolean(sessionId),
  });

export const usePhaseScores = (phaseId?: string) =>
  useQuery<PhaseScoresResponse>({
    queryKey: phaseId ? PHASE_SCORES_QUERY_KEY(phaseId) : ['scores', 'phase'],
    queryFn: () => getPhaseScores(phaseId as string),
    enabled: Boolean(phaseId),
  });

export const useSessionSummary = (sessionId?: string) =>
  useQuery<SessionSummaryResponse>({
    queryKey: sessionId ? SESSION_SUMMARY_QUERY_KEY(sessionId) : ['scores', 'session', 'summary'],
    queryFn: () => getSessionSummary(sessionId as string),
    enabled: Boolean(sessionId),
  });

export const usePhaseSummary = (phaseId?: string) =>
  useQuery<PhaseSummaryResponse>({
    queryKey: phaseId ? PHASE_SUMMARY_QUERY_KEY(phaseId) : ['scores', 'phase', 'summary'],
    queryFn: () => getPhaseSummary(phaseId as string),
    enabled: Boolean(phaseId),
  });
