export interface MeteoConditions {
  condition: string;
  vis: string;
  qnh: string;
  windDirection: string;
  windSpeed: string;
  wind?: string;
}

export interface TrainingConfiguration {
  route: string;
  meteo: MeteoConditions;
  scenario_id: string;
}

export interface TrainingContextRequest {
  context: TrainingConfiguration;
}

export interface TrainingContextResponse {
  trainingSessionId: string;
  context: TrainingConfiguration;
}

export interface TrainingSession {
  trainingSessionId: string;
  context: TrainingConfiguration;
  createdAt: string;
}

export interface PhaseScore {
  id: string;
  phase_id: string;
  score: number;
  created_at: string;
  session_id?: string;
}

export interface PhaseAverage {
  average_score: number;
  score_count: number;
}

export interface SessionScoresResponse {
  session_id: string;
  overall_average: number;
  total_scores: number;
  phase_averages: Record<string, PhaseAverage>;
  scores: PhaseScore[];
}

export interface PhaseScoresResponse {
  phase_id: string;
  average_score: number;
  total_scores: number;
  scores: PhaseScore[];
}

export interface PhaseScoreDetail {
  id: string;
  session_id: string;
  score: number;
  feedback: string;
  created_at: string;
}

export interface PhaseSummaryResponse {
  phase_id: string;
  average_score: number;
  total_scores: number;
  scores: PhaseScoreDetail[];
  summary: string;
}

export interface SessionPhaseData {
  phase_id: string;
  average_score: number;
  scores: Array<{
    score: number;
    feedback: string;
    created_at: string;
  }>;
}

export interface SessionSummaryResponse {
  session_id: string;
  overall_average: number;
  total_evaluations: number;
  phases: SessionPhaseData[];
  summary: string;
}

export interface AllPhasesScoresResponse {
  phases: Record<string, PhaseScoresResponse>;
}
