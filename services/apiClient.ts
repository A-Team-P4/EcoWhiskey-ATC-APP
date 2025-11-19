// services/api.ts
import {
  GroupCreateRequest,
  GroupListParams,
  GroupMemberAddRequest,
  GroupMembershipResponse,
  GroupResponse,
  GroupUpdateRequest,
} from '@/interfaces/group';
import { TrainingConfiguration, TrainingSession } from '@/interfaces/training';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { notifyAuthTokenChange } from '@/lib/authTokenEvents';
import {
  AuthResponse,
  ChangePasswordPayload,
  LoginCredentials,
  RegistrationData,
  SchoolCreateRequest,
  SchoolResponse,
  SchoolUpdateRequest,
  SchoolsResponse,
  SuccessResponse,
  UpdateUserPayload,
  UpdateUserSchoolPayload,
  User,
} from '../interfaces/user';


const getBaseURL = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'web') {
     
      return 'http://localhost:8000';
    } else if (Platform.OS === 'android') {

      return 'http://10.0.2.2:8000';
    } else {
      
      return 'http://200.105.99.71:8000'; //Aqui pongan su IP si estan usando IOS
    }
  } else {
    // Production mode
    return 'https://your-production-api.com/api';
  }
};

const API_BASE_URL = getBaseURL();


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (__DEV__) {
      console.log(`🚀 API: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`📍 Base URL: ${API_BASE_URL}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(` SUCCESS API: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      console.error(` ERROR API:`, error.response?.data || error.message);
      if (error.message === 'Network Error') {
        console.error(`dY"O Network Error - Check if backend is running at ${API_BASE_URL}`);
      }
    }

    // Handle common errors
    if (error.response?.status === 401) {
      // Token expired or invalid - clear all auth data
      try {
        await AsyncStorage.multiRemove(['@auth_token', '@user_id', '@auth_user']);
      } catch (storageError) {
        console.warn('Failed to clear auth data after 401', storageError);
      } finally {
        notifyAuthTokenChange(false);
      }
    }

    return Promise.reject(error);
  }
);

// Registration function
export const registerUser = async (userData: RegistrationData) => {
  const response = await apiClient.post('/users', userData);
  return response.data;
};

// Login function
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me');
  return response.data;
};

export const getUserById = async (userId: string): Promise<User> => {
  const response = await apiClient.get<User>(`/users/${userId}`);
  return response.data;
};

export const getSchools = async (): Promise<SchoolsResponse> => {
  const response = await apiClient.get<SchoolsResponse>('/schools');
  return response.data;
};

export const getSchoolById = async (schoolId: string): Promise<SchoolResponse> => {
  const response = await apiClient.get<SchoolResponse>(`/schools/${schoolId}`);
  return response.data;
};

export const getStudentsBySchool = async (
  schoolId: string | number
): Promise<User[]> => {
  const response = await apiClient.get<User[]>(`/schools/${schoolId}/students`);
  return response.data;
};

export const createSchool = async (
  payload: SchoolCreateRequest
): Promise<SchoolResponse> => {
  const response = await apiClient.post<SchoolResponse>('/schools', payload);
  return response.data;
};

export const updateSchool = async (
  schoolId: string,
  payload: SchoolUpdateRequest
): Promise<SchoolResponse> => {
  const response = await apiClient.patch<SchoolResponse>(`/schools/${schoolId}`, payload);
  return response.data;
};

export const deleteSchool = async (schoolId: string): Promise<SuccessResponse> => {
  const response = await apiClient.delete<SuccessResponse>(`/schools/${schoolId}`);
  return response.data;
};

export const getGroups = async (
  params?: GroupListParams
): Promise<GroupResponse[]> => {
  const response = await apiClient.get<GroupResponse[]>('/groups', { params });
  return response.data;
};

export const getGroupById = async (groupId: string): Promise<GroupResponse> => {
  const response = await apiClient.get<GroupResponse>(`/groups/${groupId}`);
  return response.data;
};

export const createGroup = async (
  payload: GroupCreateRequest
): Promise<GroupResponse> => {
  const response = await apiClient.post<GroupResponse>('/groups', payload);
  return response.data;
};

export const updateGroup = async (
  groupId: string,
  payload: GroupUpdateRequest
): Promise<GroupResponse> => {
  const response = await apiClient.patch<GroupResponse>(`/groups/${groupId}`, payload);
  return response.data;
};

export const deleteGroup = async (groupId: string): Promise<SuccessResponse> => {
  const response = await apiClient.delete<SuccessResponse>(`/groups/${groupId}`);
  return response.data;
};

export const getGroupMembers = async (
  groupId: string
): Promise<GroupMembershipResponse[]> => {
  const response = await apiClient.get<GroupMembershipResponse[]>(
    `/groups/${groupId}/members`
  );
  return response.data;
};

export const addGroupMember = async (
  groupId: string,
  payload: GroupMemberAddRequest
): Promise<GroupMembershipResponse> => {
  const response = await apiClient.post<GroupMembershipResponse>(
    `/groups/${groupId}/members`,
    payload
  );
  return response.data;
};

export const acceptGroupMembership = async (
  groupId: string,
  membershipId: string
): Promise<GroupMembershipResponse> => {
  const response = await apiClient.post<GroupMembershipResponse>(
    `/groups/${groupId}/memberships/${membershipId}/accept`
  );
  return response.data;
};

export const removeGroupMember = async (
  groupId: string,
  userId: string
): Promise<SuccessResponse> => {
  const response = await apiClient.delete<SuccessResponse>(
    `/groups/${groupId}/members/${userId}`
  );
  return response.data;
};

export const updateUserProfile = async (userId: string, payload: UpdateUserPayload): Promise<User> => {
  const response = await apiClient.put<User>(`/users/${userId}`, payload);
  return response.data;
};

export const updateUserSchool = async (
  userId: string,
  payload: UpdateUserSchoolPayload
): Promise<User> => {
  const response = await apiClient.patch<User>(`/users/${userId}/school`, payload);
  return response.data;
};

export const changeUserPassword = async (
  userId: string,
  payload: ChangePasswordPayload
): Promise<SuccessResponse> => {
  const response = await apiClient.post<SuccessResponse>(`/users/${userId}/password`, payload);
  return response.data;
};

export const requestPasswordReset = async (email: string): Promise<SuccessResponse> => {
  const response = await apiClient.post<SuccessResponse>('/auth/forgot-password', { email });
  return response.data;
};



// Audio interaction function
export const sendAudioForAnalysis = async (audioUri: string, sessionId: string, frequency: string) => {
  console.log('🎤 [AUDIO API] Preparing to send audio for analysis:');
  console.log('🎤 [AUDIO API] Session ID:', sessionId);
  console.log('🎤 [AUDIO API] Frequency:', frequency);
  console.log('🎤 [AUDIO API] Audio file name:', 'recording.mp3');
  console.log('🎤 [AUDIO API] Audio file URI:', audioUri);
  console.log('🎤 [AUDIO API] Endpoint:', '/audio/analyze');
  console.log('🎤 [AUDIO API] Full URL:', `${API_BASE_URL}/audio/analyze`);

  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('frequency',frequency);

  if (Platform.OS === 'web') {
    // On web, fetch the blob and create a proper File object
    const response = await fetch(audioUri);
    const blob = await response.blob();
    const file = new File([blob], 'recording.mp3', { type: 'audio/mpeg' });
    formData.append('audio_file', file);
  } else {
    // On mobile, use the React Native format
    formData.append('audio_file', {
      uri: audioUri,
      name: 'recording.mp3',
      type: 'audio/mpeg',
    } as any);
  }

  try {
    const response = await apiClient.post('/audio/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    console.log('✅ [AUDIO API] Audio analysis completed successfully');
    console.log('✅ [AUDIO API] Status:', response.status);
    console.log('✅ [AUDIO API] Response data structure:');
    console.log('✅ [AUDIO API] - session_id:', response.data.session_id);
    console.log('✅ [AUDIO API] - frequency:', response.data.frequency);
    console.log('✅ [AUDIO API] - audio_url:', response.data.audio_url);
    console.log('✅ [AUDIO API] - controller_text:', response.data.controller_text);
    console.log('✅ [AUDIO API] - feedback:', response.data.feedback);
    console.log('✅ [AUDIO API] - session_completed:', response.data.session_completed);
    console.log('✅ [AUDIO API] Full response:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    console.error('❌ [AUDIO API] Error analyzing audio');
    console.error('❌ [AUDIO API] Error status:', error.response?.status);
    console.error('❌ [AUDIO API] Error message:', error.message);
    console.error('❌ [AUDIO API] Error response:', error.response?.data);
    throw error;
  }
};

// Create training context
export const createTrainingContext = async (config: TrainingConfiguration) => {
  const response = await apiClient.post('/training_context', {
    context: config
  });
  return response.data;
};

export const getTrainingContextHistory = async (userId: string): Promise<TrainingSession[]> => {
  console.log('📋 [HISTORY API] Requesting training context history');
  console.log('📋 [HISTORY API] User ID:', userId);
  console.log('📋 [HISTORY API] Endpoint:', `/training_context/history/${userId}`);
  console.log('📋 [HISTORY API] Full URL:', `${API_BASE_URL}/training_context/history/${userId}`);

  try {
    const response = await apiClient.get<TrainingSession[]>(`/training_context/history/${userId}`);

    console.log('✅ [HISTORY API] Training context history response received');
    console.log('✅ [HISTORY API] Status:', response.status);
    console.log('✅ [HISTORY API] User ID:', userId);
    console.log('✅ [HISTORY API] Number of sessions:', response.data?.length || 0);
    console.log('✅ [HISTORY API] Full Response:', JSON.stringify(response, null, 2));
    console.log('✅ [HISTORY API] Response data:', JSON.stringify(response.data, null, 2));

    // Log individual session details if available
    if (response.data && response.data.length > 0) {
      response.data.forEach((session, index) => {
        console.log(`✅ [HISTORY API] Session ${index + 1}:`, {
          trainingSessionId: session.trainingSessionId,
          createdAt: session.createdAt,
          route: session.context?.route,
          scenario_id: session.context?.scenario_id,
        });
      });
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ [HISTORY API] Error fetching training context history');
    console.error('❌ [HISTORY API] Error status:', error.response?.status);
    console.error('❌ [HISTORY API] Error message:', error.message);
    console.error('❌ [HISTORY API] Error response:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
};

// Get last controller turn for a training session
export interface LastControllerTurnResponse {
  frequency: string;
  controller_text: string;
  feedback: string;
  session_completed: boolean;
}

export const getLastControllerTurn = async (sessionId: string): Promise<LastControllerTurnResponse> => {
  console.log('🔄 [TRAINING API] Fetching last controller turn');
  console.log('🔄 [TRAINING API] Session ID:', sessionId);
  console.log('🔄 [TRAINING API] Endpoint:', `/training_context/last-controller-turn/${sessionId}`);
  console.log('🔄 [TRAINING API] Full URL:', `${API_BASE_URL}/training_context/last-controller-turn/${sessionId}`);

  try {
    const response = await apiClient.get<LastControllerTurnResponse>(`/training_context/last-controller-turn/${sessionId}`);

    console.log('✅ [TRAINING API] Last controller turn fetched successfully');
    console.log('✅ [TRAINING API] Status:', response.status);
    console.log('✅ [TRAINING API] Session ID:', sessionId);
    console.log('✅ [TRAINING API] Response:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    console.error('❌ [TRAINING API] Error fetching last controller turn');
    console.error('❌ [TRAINING API] Session ID:', sessionId);
    console.error('❌ [TRAINING API] Error status:', error.response?.status);
    console.error('❌ [TRAINING API] Error message:', error.message);
    console.error('❌ [TRAINING API] Error response:', error.response?.data);
    throw error;
  }
};

// Delete training session
export const deleteTrainingSession = async (sessionId: string): Promise<SuccessResponse> => {
  console.log('🗑️ [TRAINING API] Deleting training session');
  console.log('🗑️ [TRAINING API] Session ID:', sessionId);
  console.log('🗑️ [TRAINING API] Endpoint:', `/training_context/${sessionId}`);
  console.log('🗑️ [TRAINING API] Full URL:', `${API_BASE_URL}/training_context/${sessionId}`);

  try {
    const response = await apiClient.delete<SuccessResponse>(`/training_context/${sessionId}`);

    console.log('✅ [TRAINING API] Training session deleted successfully');
    console.log('✅ [TRAINING API] Status:', response.status);
    console.log('✅ [TRAINING API] Session ID:', sessionId);
    console.log('✅ [TRAINING API] Response:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    console.error('❌ [TRAINING API] Error deleting training session');
    console.error('❌ [TRAINING API] Session ID:', sessionId);
    console.error('❌ [TRAINING API] Error status:', error.response?.status);
    console.error('❌ [TRAINING API] Error message:', error.message);
    console.error('❌ [TRAINING API] Error response:', error.response?.data);
    throw error;
  }
};

// Get scores for a specific training session
export const getSessionScores = async (sessionId: string) => {
  console.log('📊 [SCORES API] Requesting session scores');
  console.log('📊 [SCORES API] Session ID:', sessionId);
  console.log('📊 [SCORES API] Endpoint:', `/scores/session/${sessionId}`);
  console.log('📊 [SCORES API] Full URL:', `${API_BASE_URL}/scores/session/${sessionId}`);

  try {
    const response = await apiClient.get(`/scores/session/${sessionId}`);

    console.log('✅ [SCORES API] Session scores response received');
    console.log('✅ [SCORES API] Status:', response.status);
    console.log('✅ [SCORES API] Response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    console.error('❌ [SCORES API] Error fetching session scores');
    console.error('❌ [SCORES API] Session ID:', sessionId);
    console.error('❌ [SCORES API] Error status:', error.response?.status);
    console.error('❌ [SCORES API] Error message:', error.message);
    console.error('❌ [SCORES API] Error response:', error.response?.data);
    throw error;
  }
};

// Get scores for a specific phase across all sessions
export const getPhaseScores = async (phaseId: string) => {
  console.log('📊 [SCORES API] Requesting phase scores');
  console.log('📊 [SCORES API] Phase ID:', phaseId);
  console.log('📊 [SCORES API] Endpoint:', `/scores/phase/${phaseId}`);
  console.log('📊 [SCORES API] Full URL:', `${API_BASE_URL}/scores/phase/${phaseId}`);

  try {
    const response = await apiClient.get(`/scores/phase/${phaseId}`);

    console.log('✅ [SCORES API] Phase scores response received');
    console.log('✅ [SCORES API] Status:', response.status);
    console.log('✅ [SCORES API] Phase ID:', phaseId);
    console.log('✅ [SCORES API] Average Score:', response.data?.average_score);
    console.log('✅ [SCORES API] Total Scores:', response.data?.total_scores);
    console.log('✅ [SCORES API] Response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    console.error('❌ [SCORES API] Error fetching phase scores');
    console.error('❌ [SCORES API] Phase ID:', phaseId);
    console.error('❌ [SCORES API] Error status:', error.response?.status);
    console.error('❌ [SCORES API] Error message:', error.message);
    console.error('❌ [SCORES API] Error response:', error.response?.data);
    throw error;
  }
};

// Get scores for all phases in a single request
export const getAllPhasesScores = async (phaseIds?: string[]) => {
  console.log('📊 [SCORES API] Requesting all phases scores');
  console.log('📊 [SCORES API] Phase IDs:', phaseIds);

  const endpoint = phaseIds && phaseIds.length > 0
    ? `/scores/phases?phase_ids=${phaseIds.join(',')}`
    : '/scores/phases';

  console.log('📊 [SCORES API] Endpoint:', endpoint);
  console.log('📊 [SCORES API] Full URL:', `${API_BASE_URL}${endpoint}`);

  try {
    const response = await apiClient.get(endpoint);

    console.log('✅ [SCORES API] All phases scores response received');
    console.log('✅ [SCORES API] Status:', response.status);
    console.log('✅ [SCORES API] Phases count:', Object.keys(response.data?.phases || {}).length);
    console.log('✅ [SCORES API] Response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    console.error('❌ [SCORES API] Error fetching all phases scores');
    console.error('❌ [SCORES API] Phase IDs:', phaseIds);
    console.error('❌ [SCORES API] Error status:', error.response?.status);
    console.error('❌ [SCORES API] Error message:', error.message);
    console.error('❌ [SCORES API] Error response:', error.response?.data);
    throw error;
  }
};

// Get phase summary with LLM-generated feedback
export const getPhaseSummary = async (phaseId: string) => {
  console.log('🤖 [SCORES API] Requesting phase summary with LLM analysis');
  console.log('🤖 [SCORES API] Phase ID:', phaseId);
  console.log('🤖 [SCORES API] Endpoint:', `/scores/phase/${phaseId}/summary`);
  console.log('🤖 [SCORES API] Full URL:', `${API_BASE_URL}/scores/phase/${phaseId}/summary`);

  try {
    const response = await apiClient.get(`/scores/phase/${phaseId}/summary`);

    console.log('✅ [SCORES API] Phase summary response received');
    console.log('✅ [SCORES API] Status:', response.status);
    console.log('✅ [SCORES API] Phase ID:', phaseId);
    console.log('✅ [SCORES API] Average Score:', response.data?.average_score);
    console.log('✅ [SCORES API] Total Scores:', response.data?.total_scores);
    console.log('✅ [SCORES API] Summary length:', response.data?.summary?.length);
    console.log('✅ [SCORES API] Response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    console.error('❌ [SCORES API] Error fetching phase summary');
    console.error('❌ [SCORES API] Phase ID:', phaseId);
    console.error('❌ [SCORES API] Error status:', error.response?.status);
    console.error('❌ [SCORES API] Error message:', error.message);
    console.error('❌ [SCORES API] Error response:', error.response?.data);
    throw error;
  }
};

// Get session summary with LLM-generated feedback
export const getSessionSummary = async (sessionId: string) => {
  console.log('🤖 [SCORES API] Requesting session summary with LLM analysis');
  console.log('🤖 [SCORES API] Session ID:', sessionId);
  console.log('🤖 [SCORES API] Endpoint:', `/scores/session/${sessionId}/summary`);
  console.log('🤖 [SCORES API] Full URL:', `${API_BASE_URL}/scores/session/${sessionId}/summary`);

  try {
    const response = await apiClient.get(`/scores/session/${sessionId}/summary`);

    console.log('✅ [SCORES API] Session summary response received');
    console.log('✅ [SCORES API] Status:', response.status);
    console.log('✅ [SCORES API] Session ID:', sessionId);
    console.log('✅ [SCORES API] Overall Average:', response.data?.overall_average);
    console.log('✅ [SCORES API] Total Evaluations:', response.data?.total_evaluations);
    console.log('✅ [SCORES API] Phases Count:', response.data?.phases?.length);
    console.log('✅ [SCORES API] Summary length:', response.data?.summary?.length);
    console.log('✅ [SCORES API] Response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    console.error('❌ [SCORES API] Error fetching session summary');
    console.error('❌ [SCORES API] Session ID:', sessionId);
    console.error('❌ [SCORES API] Error status:', error.response?.status);
    console.error('❌ [SCORES API] Error message:', error.message);
    console.error('❌ [SCORES API] Error response:', error.response?.data);
    throw error;
  }
};

// METAR data interface
export interface METARData {
  icaoId: string;
  temp: number;
  dewp: number;
  wdir: number;
  wspd: number;
  visib: string;
  altim: number;
  rawOb: string;
  clouds?: Array<{
    cover: string;
    base: number;
  }>;
  fltCat: string;
}

// Fetch current METAR data via backend proxy
export const fetchMETARData = async (icaoCode: string): Promise<METARData> => {
  const response = await apiClient.get<METARData>(`/metar/${icaoCode}`);
  return response.data;
};

export default apiClient;
