import { useMutation } from '@tanstack/react-query';
import { TrainingConfiguration, TrainingContextResponse } from '../interfaces/training';
import { createTrainingContext } from '../services/apiClient';

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
