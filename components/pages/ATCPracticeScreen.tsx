import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { sendAudioForAnalysis } from '@/services/apiClient';
import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { Modal, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const MIN_FREQUENCY = 118.00;
const MAX_FREQUENCY = 135.90;

export default function AudioInteractionScreen() {
  const colorScheme = useColorScheme();

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isTransmitting, setIsRecording] = useState(false);
  const [feedbackText, setFeedbackText] = useState('Ready to start recording. Press the button to begin.');
  const [frequency, setFrequency] = useState(118.00);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputFrequency, setInputFrequency] = useState('118.00');

  useEffect(() => {
    setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
  }, []);

  const startRecording = async () => {
    try {
      setFeedbackText('Recording... Speak your ATC communication now.');

      await audioRecorder.record();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      setFeedbackText('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setFeedbackText('Processing audio...');

    try {
      await audioRecorder.stop();
      
      const uri = audioRecorder.uri;

      if (uri) {
        await sendAudioToBackend(uri);
      } else {
        setFeedbackText('Failed to get recording URI. Please try again.');
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      setFeedbackText('Failed to process recording. Please try again.');
    }
  };

  const sendAudioToBackend = async (audioUri: string) => {
    try {
      setFeedbackText('Sending audio to ATC system...');

      // Send audio to backend for analysis
      const response = await sendAudioForAnalysis(audioUri);

      setFeedbackText('Audio sent successfully! Analyzing communication...');

      // Display the response from the backend
      if (response.atcResponse) {
        setFeedbackText(`ATC Response: "${response.atcResponse}"`);
      } else if (response.feedback) {
        setFeedbackText(`Feedback: ${response.feedback}`);
      } else {
        setFeedbackText('Analysis complete. Audio processed successfully.');
      }

    } catch (error: any) {
      console.error('Failed to send audio', error);

      // Handle different types of errors
      if (error.response?.status === 401) {
        setFeedbackText('Authentication required. Please log in and try again.');
      } else if (error.response?.status >= 500) {
        setFeedbackText('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        setFeedbackText('Network error. Please check your connection and try again.');
      } else {
        setFeedbackText('Failed to send audio to server. Please try again.');
      }
    }
  };

  const handleAudioRecord = async () => {
    if (isTransmitting) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleOpenModal = () => {
    setInputFrequency(frequency.toFixed(2));
    setModalVisible(true);
  };

  const handleSaveFrequency = () => {
    const parsedFrequency = parseFloat(inputFrequency);

    // Validate frequency
    if (isNaN(parsedFrequency)) {
      alert('Please enter a valid number');
      return;
    }

    if (parsedFrequency < MIN_FREQUENCY || parsedFrequency > MAX_FREQUENCY) {
      alert(`Frequency must be between ${MIN_FREQUENCY} and ${MAX_FREQUENCY} MHz`);
      return;
    }

    setFrequency(parseFloat(parsedFrequency.toFixed(2)));
    setModalVisible(false);
  };

  return (
    <ResponsiveLayout>
      <SafeAreaView className="flex-1 bg-white">
    {/* <ThemedView className="flex-1 px-5 pt-[60px]"> */}
      {/* Radio Frequency Control */}
      <View className="items-center py-4 px-5 bg-black/[0.03] rounded-[20px] mb-5">
        <ThemedText className="text-xs font-bold tracking-widest mb-4 opacity-60">
          FRECUENCIA
        </ThemedText>

        {/* Frequency Display - Tap to Edit */}
        <TouchableOpacity onPress={handleOpenModal} activeOpacity={0.7}>
          <View
            style={{
              backgroundColor: '#000',
              paddingHorizontal: 32,
              paddingVertical: 20,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 8,
              minWidth: 180,
              justifyContent: 'center',
              shadowColor: 'rgba(255, 255, 255, 0.1)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#F5E050',
                fontFamily: 'monospace',
              }}
            >
              {frequency.toFixed(2)}
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 16,
                color: '#F5E050',
                fontWeight: '600',
              }}
            >
              MHz
            </ThemedText>
          </View>
        </TouchableOpacity>

        <ThemedText className="text-xs opacity-60 text-center mt-3">
          Tap cambiar la frecuencia
        </ThemedText>
      </View>

      {/* Frequency Input Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              padding: 30,
              width: '80%',
              maxWidth: 400,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            <ThemedText
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 8,
                color: '#000',
              }}
            >
              Enter Frequency
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 14,
                textAlign: 'center',
                marginBottom: 24,
                opacity: 0.6,
                color: '#000',
              }}
            >
              Range: {MIN_FREQUENCY} - {MAX_FREQUENCY} MHz
            </ThemedText>

            <TextInput
              style={{
                backgroundColor: '#f5f5f5',
                borderRadius: 12,
                padding: 16,
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 24,
                borderWidth: 2,
                borderColor: '#e0e0e0',
                color: '#000',
              }}
              value={inputFrequency}
              onChangeText={setInputFrequency}
              keyboardType="decimal-pad"
              placeholder="118.00"
              placeholderTextColor="#888"
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: '#e0e0e0',
                }}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#000',
                  }}
                >
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: "#000",
                }}
                onPress={handleSaveFrequency}
              >
                <ThemedText
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#fff',
                  }}
                >
                  Save
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Text feedback area */}
      <View style={{ flex: 1, paddingHorizontal: 20, marginBottom: 24 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#1a1a1a',
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            justifyContent: 'center',
          }}
        >
          <ThemedText
            style={{
              fontSize: 16,
              lineHeight: 24,
              textAlign: 'center',
              color: '#ffffff',
              fontFamily: 'monospace',
            }}
          >
            {feedbackText}
          </ThemedText>
        </View>
      </View>

      

      {/* Audio button area */}
     <View style={{ paddingBottom: 40, alignItems: 'center' }}>
  
        <Button
          mode="contained"
          className="w-24 h-24 rounded-full shadow-lg"
          style={{
            backgroundColor: isTransmitting ? '#22C55E' : '#000', // green = live, blue = idle
          }}
          contentStyle={{
            width: 85,
            height: 85,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 9999,
          }}
          labelStyle={{
            fontSize: 14,
            fontWeight: 'bold',
            color: 'white',
          }}
        >
          {isTransmitting ? 'ON AIR' : 'PTT'}
        </Button>
      </View>
      </SafeAreaView>
    </ResponsiveLayout>
  );
}