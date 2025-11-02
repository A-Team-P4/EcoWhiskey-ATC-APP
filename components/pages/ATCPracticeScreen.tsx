import { AppSnackbar } from '@/components/molecules/AppSnackbar';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { ThemedText } from '@/components/themed-text';
import { useSnackbar } from '@/hooks/useSnackbar';
import { sendAudioForAnalysis } from '@/services/apiClient';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Modal, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, Switch } from 'react-native-paper';
import { Icon } from '../atoms/Icon';

const MIN_FREQUENCY = 118.00;
const MAX_FREQUENCY = 135.90;

export default function AudioInteractionScreen() {

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioPlayer = useAudioPlayer();
  const recorderState = useAudioRecorderState(audioRecorder);
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [feedbackText, setFeedbackText] = useState('Inicie comunicación con la torre de control. Presione el botón PTT para comenzar.');
  const [controllerText, setControllerText] = useState('');
  const [displayedControllerText, setDisplayedControllerText] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [frequency, setFrequency] = useState(118.00);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputFrequency, setInputFrequency] = useState('118.00');
  const [frequencyError, setFrequencyError] = useState('');
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [enableAudioReview, setEnableAudioReview] = useState(true);
  const [silenceWarningShown, setSilenceWarningShown] = useState(false);
  const drawerAnimation = React.useRef(new Animated.Value(0)).current;
  const silenceCheckTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  // Settings drawer animation
  useEffect(() => {
    Animated.timing(drawerAnimation, {
      toValue: settingsDrawerVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [settingsDrawerVisible]);

  const toggleSettingsDrawer = () => {
    setSettingsDrawerVisible(!settingsDrawerVisible);
  };

  // Typing animation effect for controller text
  useEffect(() => {
    if (!controllerText) {
      setDisplayedControllerText('');
      return;
    }

    let currentIndex = 0;
    setDisplayedControllerText('');

    const typingInterval = setInterval(() => {
      if (currentIndex < controllerText.length) {
        setDisplayedControllerText(controllerText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [controllerText]);

  useEffect(() => {
    (async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          showSnackbar('Se requiere permiso del micrófono para práctica de ATC', 'error');
          return;
        }

        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });

        console.log('🎤 Permissions granted and audio mode set');
      } catch (error) {
        console.error('Permission request failed:', error);
        setFeedbackText('No se pudo obtener permiso del micrófono');
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
        // Check if recording is too short (possible silence/no input)
        const recordingDuration = recorderState.durationMillis / 1000;
        if (recordingDuration < 1.0) {
          setFeedbackText('Grabación muy corta. Verifica que tu micrófono esté funcionando.');
          return;
        }

        setRecordedAudioUri(uri);

        if (!enableAudioReview) {
          setFeedbackText('Enviando audio automáticamente...');
          await sendAudioToBackend(uri);
        } else {
          setFeedbackText(`Grabación finalizada (${recordingDuration.toFixed(1)} s). Puedes reproducirla o enviarla al control aéreo.`);
        }
      } else {
        setFeedbackText('No se pudo obtener el audio. Intenta grabar al menos 1 segundo.');
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
        setFeedbackText(`Reproduciendo grabación (${playerStatus.duration?.toFixed(1)}s)...`);
      } else {
        console.error('⚠️ WARNING: Player not playing! Check emulator microphone settings.');
        setFeedbackText('Error al reproducir. El audio puede estar en silencio.');
      }

      setTimeout(async () => {
        setFeedbackText('Reproducción completa. Listo para enviar o grabar de nuevo.');
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      }, (playerStatus.duration || 5) * 1000);

    } catch (error) {
      console.error('❌ Failed to play recording', error);
      setFeedbackText('No se pudo reproducir la grabación. Inténtalo de nuevo.');

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
    setFeedbackText('Grabación descartada. Presiona PTT para grabar de nuevo.');
    setControllerText('');
    setDisplayedControllerText('');
  };

  const sendAudioToBackend = async (audioUri: string) => {
    if (!sessionId) {
      setFeedbackText('No se encontró ID de sesión. Por favor inicia desde la pantalla de Contexto de Vuelo.');
      return;
    }

    try {
      setIsLoadingResponse(true);
      setFeedbackText('');
      setControllerText('');

      const formattedFrequency = frequency.toFixed(2);
      const response = await sendAudioForAnalysis(audioUri, sessionId, formattedFrequency);

      console.log('📥 Backend response:', response);

      setRecordedAudioUri(null);

      if (response.feedback) {
        setFeedbackText(response.feedback);
      }

      if (response.controller_text) {
        setControllerText(response.controller_text);
      }

      if (response.audio_url) {
        await audioPlayer.replace({ uri: response.audio_url });
        await audioPlayer.play();
      }

      setIsLoadingResponse(false);

    } catch (error: any) {
      setIsLoadingResponse(false);
      console.error('Failed to send audio', error);

      if (error.response?.status === 401) {
        setFeedbackText('Autenticación requerida. Por favor inicia sesión e intenta de nuevo.');
      } else if (error.response?.status === 400) {
        setFeedbackText(error.response?.data?.detail || 'Formato de audio inválido. Inténtalo de nuevo.');
      } else if (error.response?.status >= 500) {
        setFeedbackText('Error al enviar audio. Intenta de nuevo más tarde.');
      } else if (error.code === 'NETWORK_ERROR') {
        setFeedbackText('Error de red. Verifica tu conexión e intenta de nuevo.');
      } else {
        setFeedbackText('No se pudo enviar el audio,. Inténtalo de nuevo.');
      }
    }
  };

  const handleOpenModal = () => {
    setInputFrequency(frequency.toFixed(2));
    setFrequencyError('');
    setModalVisible(true);
  };

  const handleSaveFrequency = () => {
    const parsedFrequency = parseFloat(inputFrequency);

    if (isNaN(parsedFrequency)) {
      setFrequencyError('Por favor ingrese un número válido');
      return;
    }

    if (parsedFrequency < MIN_FREQUENCY || parsedFrequency > MAX_FREQUENCY) {
      setFrequencyError(`La frecuencia debe estar entre ${MIN_FREQUENCY} y ${MAX_FREQUENCY} MHz`);
      return;
    }

    setFrequency(parseFloat(parsedFrequency.toFixed(2)));
    setFrequencyError('');
    setModalVisible(false);
    showSnackbar(`Frecuencia actualizada a ${parsedFrequency.toFixed(2)} MHz`, 'success');
  };

  return (

    <ResponsiveLayout showTopNav={true} >
      {sessionId && (
        <View className="px-5 py-2 bg-green-50 border-b border-green-200">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }} />
            <ThemedText className="text-xs text-center opacity-60" style={{ flex: 1 }}>
              Session Activa
            </ThemedText>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <TouchableOpacity onPress={toggleSettingsDrawer} activeOpacity={0.7}>
                <Icon type="MaterialIcons" name="settings" color="#000" size={24} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={{ paddingHorizontal: 20, marginBottom: 8, paddingTop:16 }}>
        <TouchableOpacity onPress={handleOpenModal} activeOpacity={0.98}>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 14, paddingRight: 16, paddingLeft: 16, paddingTop:4, borderWidth: 1, borderColor: '#E9ECEF', 
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon type="Foundation" name="graph-bar" color="#4CAF50" size={16} />
                <ThemedText style={{ fontSize: 10, fontWeight: '600', color: '#6C757D', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  Radio
                </ThemedText>
              </View>
              <Icon type="MaterialIcons" name="edit" color="#ADB5BD" size={16} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}>
              <ThemedText style={{ fontSize: 28, fontWeight: 'bold', color: '#212529', fontFamily: 'monospace', letterSpacing: 1 }}>
                {frequency.toFixed(2)}
              </ThemedText>
              <ThemedText style={{ fontSize: 16, fontWeight: '600', color: '#4CAF50', marginLeft: 6, marginTop: 4 }}>
                MHz
              </ThemedText>
            </View>

            <View style={{ marginTop: 4, alignItems: 'center' }}>
              <ThemedText style={{ fontSize: 12, color: '#000', fontWeight: '500' }}>
                Tab para ajustar
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 30, width: '80%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 }}>
            <ThemedText style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#000' }}>
              Ingrese una frecuencia
            </ThemedText>
            <ThemedText style={{ fontSize: 14, textAlign: 'center', marginBottom: 24, opacity: 0.6, color: '#000' }}>
              Rango: {MIN_FREQUENCY} - {MAX_FREQUENCY} MHz
            </ThemedText>

            <TextInput
              style={{ backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, borderWidth: 2, borderColor: frequencyError ? '#EF4444' : '#e0e0e0', color: '#000' }}
              value={inputFrequency}
              onChangeText={(text) => {
                setInputFrequency(text);
                setFrequencyError('');
              }}
              keyboardType="decimal-pad"
              placeholder="118.00"
              placeholderTextColor="#888"
              autoFocus
            />

            {frequencyError ? (
              <ThemedText style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', marginBottom: 16, minHeight: 18 }}>
                {frequencyError}
              </ThemedText>
            ) : (
              <View style={{ height: 18, marginBottom: 16 }} />
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#e0e0e0' }} onPress={() => setModalVisible(false)}>
                <ThemedText style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: "#2196F3" }} onPress={handleSaveFrequency}>
                <ThemedText style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                  Guardar
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ flex: 1, paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ flex: 1, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'flex-start' }}>
          {isLoadingResponse && (
            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <ActivityIndicator size="large" color="#2196F3" />
              <ThemedText style={{ fontSize: 16, marginTop: 16, color: '#000', fontWeight: '600' }}>
                Esperando respuesta del controlador...
              </ThemedText>
            </View>
          )}

          {!isLoadingResponse && feedbackText && feedbackText !== 'Inicie comunicación con la torre de control. Presione el botón PTT para comenzar.' && (
            <View style={{ marginBottom: controllerText ? 20 : 0 }}>
              <ThemedText style={{ fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 8 }}>
                Feedback:
              </ThemedText>
              <ThemedText style={{ fontSize: 15, lineHeight: 22, color: '#333' }}>
                {feedbackText}
              </ThemedText>
            </View>
          )}

          {!isLoadingResponse && controllerText && (
            <View>
              <ThemedText style={{ fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 8 }}>
                Respuesta de Controlador:
              </ThemedText>
              <ThemedText style={{ fontSize: 15, lineHeight: 22, color: '#333', fontFamily: 'monospace' }}>
                {displayedControllerText}
                {displayedControllerText.length < controllerText.length && (
                  <ThemedText style={{ opacity: 0.5 }}>▊</ThemedText>
                )}
              </ThemedText>
            </View>
          )}

          {!isLoadingResponse && (!feedbackText || feedbackText === 'Inicie comunicación con la torre de control. Presione el botón PTT para comenzar.') && !controllerText && (
            <ThemedText style={{ fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#000', fontFamily: 'monospace' }}>
              Inicie comunicación con la torre de control. Presione el botón PTT para comenzar.
            </ThemedText>
          )}
        </View>
      </View>

      <View style={{ paddingBottom: 40, alignItems: 'center' }}>
        {!recordedAudioUri && (
          <View style={{ alignItems: 'center' }}>
            {recorderState.isRecording && (
              <View style={{ marginBottom: 16, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 }}>
                <ThemedText style={{ color: '#000', fontWeight: 'bold', fontSize: 16, fontFamily: 'monospace' }}>
                  🔴 {(recorderState.durationMillis / 1000).toFixed(1)}s
                </ThemedText>
              </View>
            )}

            <Button
              mode="contained"
              className="w-24 h-24 rounded-full shadow-lg"
              onPress={recorderState.isRecording ? stopRecording : startRecording}
              style={{ backgroundColor: recorderState.isRecording ? '#22C55E' : '#000' }}
              contentStyle={{ width: 85, height: 85, justifyContent: 'center', alignItems: 'center', borderRadius: 9999 }}
              labelStyle={{ fontSize: 14, fontWeight: 'bold', color: 'white' }}
            >
              {recorderState.isRecording ? 'ON AIR' : 'PTT'}
            </Button>
          </View>
        )}

        {recordedAudioUri && enableAudioReview && (
          <View style={{ width: '100%', paddingHorizontal: 20 }}>
            <Button
              mode="contained"
              onPress={sendRecording}
              disabled={isLoadingResponse}
              style={{ backgroundColor: isLoadingResponse ? '#666' : '#000', marginBottom: 20 }}
              contentStyle={{ paddingVertical: 12 }}
              labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            >
              Enviar a Torre de Control
            </Button>

            <View style={{ borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-start' }}>
                <TouchableOpacity onPress={playRecording} disabled={playerStatus.playing || isLoadingResponse} style={{ alignItems: 'center', flex: 1 }} activeOpacity={0.7}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: (playerStatus.playing || isLoadingResponse) ? '#93C5FD' : '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 8, opacity: isLoadingResponse ? 0.5 : 1 }}>
                    <Icon type="MaterialIcons" name={playerStatus.playing ? 'pause' : 'play-arrow'} color="#ffffff" size={28} />
                  </View>
                  <ThemedText style={{ fontSize: 12, fontWeight: '600', color: (playerStatus.playing || isLoadingResponse) ? '#666' : '#000', textAlign: 'center' }}>
                    {playerStatus.playing ? 'Reproduciendo' : 'Reproducir'}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity onPress={discardRecording} disabled={isLoadingResponse} style={{ alignItems: 'center', flex: 1 }} activeOpacity={0.7}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', marginBottom: 8, opacity: isLoadingResponse ? 0.5 : 1 }}>
                    <Icon type="MaterialIcons" name="refresh" color="#ffffff" size={28} />
                  </View>
                  <ThemedText style={{ fontSize: 12, fontWeight: '600', color: isLoadingResponse ? '#666' : '#000', textAlign: 'center' }}>
                    Re-grabar
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {settingsDrawerVisible && (
        <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} activeOpacity={1} onPress={toggleSettingsDrawer}>
          <Animated.View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: Dimensions.get('window').width * 0.85, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10, transform: [{ translateX: drawerAnimation.interpolate({ inputRange: [0, 1], outputRange: [Dimensions.get('window').width * 0.85, 0] }) }] }} onStartShouldSetResponder={() => true}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
              <ThemedText style={{ fontSize: 20, fontWeight: 'bold', color: '#000' }}>
                Configuración
              </ThemedText>
              <TouchableOpacity onPress={toggleSettingsDrawer} activeOpacity={0.7}>
                <Icon type="MaterialIcons" name="close" color="#000" size={24} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <ThemedText style={{ fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 }}>
                    Revisión de audios
                  </ThemedText>
                  <ThemedText style={{ fontSize: 13, color: '#666', lineHeight: 18 }}>
                    Reproduce o graba nuevamente audios antes de enviar a torre de control
                  </ThemedText>
                </View>
                <Switch value={enableAudioReview} onValueChange={setEnableAudioReview} color="#2196F3" />
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}

      <AppSnackbar visible={snackbar.visible} message={snackbar.message} type={snackbar.type} onDismiss={hideSnackbar} />
    </ResponsiveLayout>
  );
}
