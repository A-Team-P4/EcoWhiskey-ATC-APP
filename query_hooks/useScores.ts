import { useQuery } from '@tanstack/react-query';
import { AllPhasesScoresResponse, PhaseScoresResponse, PhaseSummaryResponse, SessionScoresResponse, SessionSummaryResponse } from '../interfaces/training';
import { getAllPhasesScores, getPhaseScores, getPhaseSummary, getSessionScores, getSessionSummary } from '../services/apiClient';

export const SESSION_SCORES_QUERY_KEY = (sessionId: string) =>
  ['scores', 'session', sessionId] as const;

export const PHASE_SCORES_QUERY_KEY = (phaseId: string, userId?: string) =>
  ['scores', 'phase', phaseId, userId ?? 'me'] as const;

export const SESSION_SUMMARY_QUERY_KEY = (sessionId: string) =>
  ['scores', 'session', sessionId, 'summary'] as const;

export const PHASE_SUMMARY_QUERY_KEY = (phaseId: string, userId?: string) =>
  ['scores', 'phase', phaseId, 'summary', userId ?? 'me'] as const;

export const useSessionScores = (sessionId?: string) =>
  useQuery<SessionScoresResponse>({
    queryKey: sessionId ? SESSION_SCORES_QUERY_KEY(sessionId) : ['scores', 'session'],
    queryFn: () => getSessionScores(sessionId as string),
    enabled: Boolean(sessionId),
  });

export const usePhaseScores = (phaseId?: string, userId?: string) =>
  useQuery<PhaseScoresResponse>({
    queryKey: phaseId ? PHASE_SCORES_QUERY_KEY(phaseId, userId) : ['scores', 'phase'],
    queryFn: () => getPhaseScores(phaseId as string, userId),
    enabled: Boolean(phaseId),
  });

export const useSessionSummary = (sessionId?: string) =>
  useQuery<SessionSummaryResponse>({
    queryKey: sessionId ? SESSION_SUMMARY_QUERY_KEY(sessionId) : ['scores', 'session', 'summary'],
    queryFn: () => getSessionSummary(sessionId as string),
    enabled: Boolean(sessionId),
  });

export const usePhaseSummary = (phaseId?: string, userId?: string) =>
  useQuery<PhaseSummaryResponse>({
    queryKey: phaseId
      ? PHASE_SUMMARY_QUERY_KEY(phaseId, userId)
      : ['scores', 'phase', 'summary'],
    queryFn: () => getPhaseSummary(phaseId as string, userId),
    enabled: Boolean(phaseId),
  });

interface AllPhasesScoresOptions {
  phaseIds?: string[];
  userId?: string;
}

export const ALL_PHASES_SCORES_QUERY_KEY = (phaseIds?: string[], userId?: string) =>
  ['scores', 'phases', 'all', phaseIds?.join(',') || 'all', userId ?? 'me'] as const;

export const useAllPhasesScores = (options?: AllPhasesScoresOptions) =>
  useQuery<AllPhasesScoresResponse>({
    queryKey: ALL_PHASES_SCORES_QUERY_KEY(options?.phaseIds, options?.userId),
    queryFn: () => getAllPhasesScores(options?.phaseIds, options?.userId),
  });
