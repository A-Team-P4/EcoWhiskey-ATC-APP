import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { ThemedText } from '@/components/themed-text';
import { sendAudioForAnalysis } from '@/services/apiClient';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Modal, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../atoms/Icon';
import { AppSnackbar } from '@/components/molecules/AppSnackbar';
import { useSnackbar } from '@/hooks/useSnackbar';

const MIN_FREQUENCY = 118.00;
const MAX_FREQUENCY = 135.90;

export default function AudioInteractionScreen() {

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioPlayer = useAudioPlayer();
  const recorderState = useAudioRecorderState(audioRecorder);
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [feedbackText, setFeedbackText] = useState('Ready to start recording. Press the button to begin.');
  const [frequency, setFrequency] = useState(118.00);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputFrequency, setInputFrequency] = useState('118.00');
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);

  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  useEffect(() => {
    (async () => {
      try {
        // Request permissions using AudioModule (like in the docs)
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          showSnackbar('Microphone permission is required for ATC practice', 'error');
          return;
        }

        // Set audio mode
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });

        console.log('🎤 Permissions granted and audio mode set');
      } catch (error) {
        console.error('Permission request failed:', error);
        setFeedbackText('Failed to get microphone permission');
      }
    })();
  }, []);

  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      console.log('🎤 Recorder state before:', {
        canRecord: recorderState.canRecord,
        isRecording: recorderState.isRecording,
        durationMillis: recorderState.durationMillis
      });
      setFeedbackText('Grabando... hable ahora con el control aéreo.');
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      setFeedbackText('No fue posible iniciar la grabación. Inténtelo de nuevo.');
    }
  };

  const stopRecording = async () => {
    setFeedbackText('Procesando audio...');

    try {
      await audioRecorder.stop();
      await new Promise(resolve => setTimeout(resolve, 300));
      const uri = audioRecorder.uri;
      if (uri) {
        setRecordedAudioUri(uri);
        setFeedbackText(`Grabación finalizada (${(recorderState.durationMillis / 1000).toFixed(1)} s). Puedes reproducirla o enviarla al control aéreo.`);
      } else {
        setFeedbackText('Failed to get recording URI. Try recording for at least 1 second.');
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      setFeedbackText('No se pudo obtener la grabación. Graba al menos 1 segundo e inténtalo de nuevo.');
    }
  };

  const playRecording = async () => {
    if (!recordedAudioUri) return;

    try {
     setFeedbackText('Reproduciendo tu grabación...');
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });
      audioPlayer.replace({ uri: recordedAudioUri });
      audioPlayer.volume = 1.0;
      audioPlayer.play();
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('🔊 Player status after play:', {
        playing: playerStatus.playing,
        currentTime: playerStatus.currentTime,
        duration: playerStatus.duration
      });

      if (playerStatus.playing) {
        console.log('✅ Playback is active! Duration:', playerStatus.duration, 's');
        setFeedbackText(`Playing recording (${playerStatus.duration?.toFixed(1)}s)...`);
      } else {
        console.error('⚠️ WARNING: Player not playing! Check emulator microphone settings.');
        setFeedbackText('Playback failed. Audio may be silent.');
      }

      // Auto-reset after playback duration
      setTimeout(async () => {
        setFeedbackText('Playback complete. Ready to send or re-record.');
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      }, (playerStatus.duration || 5) * 1000);

    } catch (error) {
      console.error('❌ Failed to play recording', error);
      setFeedbackText('Failed to play recording. Please try again.');

      // Re-enable recording mode on error
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    }
  };

  const sendRecording = async () => {
    if (!recordedAudioUri) return;
    await sendAudioToBackend(recordedAudioUri);
  };

  const discardRecording = () => {
    setRecordedAudioUri(null);
    setFeedbackText('Recording discarded. Press PTT to record again.');
  };

  const exportRecording = async () => {
    if (!recordedAudioUri) return;

    try {
      console.log('📤 Exporting recording from:', recordedAudioUri);

      // Share the file directly (it will open share dialog on device)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(recordedAudioUri, {
          mimeType: 'audio/mp4',
          dialogTitle: 'Save or share your recording',
        });
        setFeedbackText('Recording shared! You can now save it to your device.');
      } else {
        showSnackbar('Cannot share files on this device.', 'error');
      }
    } catch (err) {
      console.error('❌ Export failed:', err);
      setFeedbackText('Failed to export recording.');
    }
  };

  const sendAudioToBackend = async (audioUri: string) => {
    // Validate session ID
    if (!sessionId) {
      setFeedbackText('No session ID found. Please start from Flight Context screen.');
      return;
    }

    try {
      setFeedbackText('Sending audio to ATC system...');

      const formattedFrequency = frequency.toFixed(2); 
      const response = await sendAudioForAnalysis(audioUri, sessionId, formattedFrequency);

      console.log('📥 Backend response:', response);

      // Clear the recorded audio after sending
      setRecordedAudioUri(null);

      // Backend returns { session_id, audio_url }
      if (response.audio_url) {
        setFeedbackText('Audio processed! Playing ATC response...');

        // Play the ATC response audio
        await audioPlayer.replace({ uri: response.audio_url });
        await audioPlayer.play();

        setFeedbackText('ATC response complete. Press PTT to record again.');
      } else {
        setFeedbackText('Analysis complete. Press PTT to record again.');
      }

    } catch (error: any) {
      console.error('Failed to send audio', error);

      // Handle different types of errors
      if (error.response?.status === 401) {
        setFeedbackText('Authentication required. Please log in and try again.');
      } else if (error.response?.status === 400) {
        setFeedbackText(error.response?.data?.detail || 'Invalid audio format. Please try again.');
      } else if (error.response?.status >= 500) {
        setFeedbackText('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        setFeedbackText('Network error. Please check your connection and try again.');
      } else {
        setFeedbackText('Failed to send audio to server. Please try again.');
      }
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

      {/* Session ID Display */}
      {sessionId && (
        <View className="px-5 py-2 bg-green-50 border-b border-green-200">
          <ThemedText className="text-xs text-center opacity-60">
            Session Activa
          </ThemedText>
        </View>
      )}

      {/* Radio Frequency Control */}
      <View className="items-center py-2 px-5 rounded-[20px] mb-5">
        <ThemedText className="text-xs font-bold tracking-widest mb-2 opacity-60">
          Radio
        </ThemedText>
        <TouchableOpacity onPress={handleOpenModal} activeOpacity={0.7}>
          <View
            style={{
              backgroundColor: '#000',
              paddingHorizontal: 50,
              paddingVertical: 15,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 8,
              //minWidth: 180,
              //justifyContent: 'center',
              //shadowColor: 'rgba(255, 255, 255, 0.1)',
             // shadowOffset: { width: 0, height: 4 },
             // shadowOpacity: 0.3,
              //shadowRadius: 8,
              //elevation: 8,
            }}
          >
            <ThemedText style={{ fontSize: 20, fontWeight: 'bold', color: '#F5E050', fontFamily: 'monospace', }} >
              {frequency.toFixed(2)}
            </ThemedText>
            <ThemedText style={{ fontSize: 16, color: '#F5E050', fontWeight: '600', }} >
              MHz
            </ThemedText>
            <Icon type="Foundation" name="graph-bar"  color="#F5E050" />
          </View>

        </TouchableOpacity>

        <ThemedText className="text-xs opacity-60 text-center mt-3">
          Tap para cambiar la frecuencia
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
              Ingrese una frecuencia
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
              Rango: {MIN_FREQUENCY} - {MAX_FREQUENCY} MHz
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
                  Cancelar
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
                  Guardar
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
           // backgroundColor: '#1a1a1a',
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
              color: '#000',
              fontFamily: 'monospace',
            }}
          >
            {feedbackText}
          </ThemedText>
        </View>
      </View>

      

      {/* Audio button area */}
     <View style={{ paddingBottom: 40, alignItems: 'center' }}>
        {/* Show PTT button when not recorded, or when already sent */}
        {!recordedAudioUri && (
          <View style={{ alignItems: 'center' }}>
            {/* Recording duration indicator */}
            {recorderState.isRecording && (
              <View style={{
                marginBottom: 16,
               // backgroundColor: '#22C55E',
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 20
              }}>
                <ThemedText style={{
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: 16,
                  fontFamily: 'monospace'
                }}>
                  🔴 {(recorderState.durationMillis / 1000).toFixed(1)}s
                </ThemedText>
              </View>
            )}

            <Button
              mode="contained"
              className="w-24 h-24 rounded-full shadow-lg"
              onPress={recorderState.isRecording ? stopRecording : startRecording}
              style={{
                backgroundColor: recorderState.isRecording ? '#22C55E' : '#000', // green = recording, black = idle
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
              {recorderState.isRecording ? 'ON AIR' : 'PTT'}
            </Button>
          </View>
        )}

        {/* Show playback controls when audio is recorded */}
        {recordedAudioUri && (
          <View style={{ width: '100%', paddingHorizontal: 20 }}>
            {/* Send button */}
            <Button
              mode="contained"
              onPress={sendRecording}
              style={{
                backgroundColor: '#000',
                marginBottom: 20,
              }}
              contentStyle={{ paddingVertical: 12 }}
              labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            >
              Enviar a Torre de Control
            </Button>

            {/* Action buttons row with icons and labels */}
            <View
              style={{
                //backgroundColor: '#f5f5f5',
                borderRadius: 16,
                paddingVertical: 10,
                paddingHorizontal: 16,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-evenly',
                  alignItems: 'flex-start',
                }}
              >
                {/* Play/Pause button */}
                <TouchableOpacity
                  onPress={playRecording}
                  disabled={playerStatus.playing}
                  style={{ alignItems: 'center', flex: 1 }}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: playerStatus.playing ? '#93C5FD' : '#3B82F6',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Icon
                      type="MaterialIcons"
                      name={playerStatus.playing ? 'pause' : 'play-arrow'}
                      color="#ffffff"
                      size={28}
                    />
                  </View>
                  <ThemedText
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: playerStatus.playing ? '#666' : '#000',
                      textAlign: 'center',
                    }}
                  >
                    {playerStatus.playing ? 'Reproduciendo' : 'Reproducir'}
                  </ThemedText>
                </TouchableOpacity>

               

                {/* Re-record button */}
                <TouchableOpacity
                  onPress={discardRecording}
                  style={{ alignItems: 'center', flex: 1 }}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: '#EF4444',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Icon
                      type="MaterialIcons"
                      name="refresh"
                      color="#ffffff"
                      size={28}
                    />
                  </View>
                  <ThemedText
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: '#000',
                      textAlign: 'center',
                    }}
                  >
                    Re-grabar
                  </ThemedText>
                </TouchableOpacity>

               
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Snackbar */}
      <AppSnackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={hideSnackbar}
      />
      </SafeAreaView>
    </ResponsiveLayout>
  );
}