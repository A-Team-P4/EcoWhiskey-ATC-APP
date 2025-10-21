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
  objectives: string[];
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
