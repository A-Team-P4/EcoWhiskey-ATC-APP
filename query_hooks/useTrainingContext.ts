import { useMutation, useQuery } from '@tanstack/react-query';
import { TrainingConfiguration, TrainingContextResponse, TrainingSession } from '../interfaces/training';
import { createTrainingContext, getTrainingContextHistory } from '../services/apiClient';

export const useCreateTrainingContext = () => {
  return useMutation<TrainingContextResponse, unknown, TrainingConfiguration>({
    mutationFn: (config) => createTrainingContext(config),
    onSuccess: (data) => {
      console.log('✅ Training context created:', data);
      console.log('📝 Training Session ID:', data.trainingSessionId);
    },
    onError: (error) => {
      console.error('❌ Failed to create training context:', error);
    },
  });
};

export const TRAINING_HISTORY_QUERY_KEY = (userId: string) =>
  ['training_context', 'history', userId] as const;

export const useTrainingContextHistory = (userId?: string) =>
  useQuery<TrainingSession[]>({
    queryKey: userId ? TRAINING_HISTORY_QUERY_KEY(userId) : ['training_context', 'history'],
    queryFn: () => getTrainingContextHistory(userId as string),
    enabled: Boolean(userId),
  });
