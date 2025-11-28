import { AppSnackbar } from '@/components/molecules/AppSnackbar';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { ThemedText } from '@/components/themed-text';
import { useSnackbar } from '@/hooks/useSnackbar';
import { sendAudioForAnalysis } from '@/services/apiClient';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Modal, Platform, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, Switch } from 'react-native-paper';
import { Icon } from '../atoms/Icon';

const MIN_FREQUENCY = 118.00;
const MAX_FREQUENCY = 135.90;

export default function AudioInteractionScreen() {

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioPlayer = useAudioPlayer();
  const recorderState = useAudioRecorderState(audioRecorder);
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  const params = useLocalSearchParams<{
    sessionId?: string;
    session_id?: string;
    frequency?: string;
    controller_text?: string;
    feedback?: string;
    session_completed?: string;
  }>();

  // Handle both sessionId (new session) and session_id (continued session)
  const sessionId = params.sessionId || params.session_id;
  const router = useRouter();

  // Initialize state from params if continuing a session, otherwise use defaults
  const [feedbackText, setFeedbackText] = useState(
    params.feedback || 'Inicie comunicación con la torre de control. Presione el botón PTT para comenzar.'
  );
  const [controllerText, setControllerText] = useState(params.controller_text || '');
  const [displayedControllerText, setDisplayedControllerText] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [frequency, setFrequency] = useState(
    params.frequency ? parseFloat(params.frequency) : 118.00
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [inputFrequency, setInputFrequency] = useState('118.00');
  const [frequencyError, setFrequencyError] = useState('');
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [enableAudioReview, setEnableAudioReview] = useState(true);
  const [silenceWarningShown, setSilenceWarningShown] = useState(false);
  const [sessionCompletedModalVisible, setSessionCompletedModalVisible] = useState(false);
  const [previousControllerText, setPreviousControllerText] = useState('');
  const [showPreviousController, setShowPreviousController] = useState(false);
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

  // Show notification when continuing a session
  useEffect(() => {
    if (params.session_id && params.controller_text) {
      showSnackbar('Sesión reanudada exitosamente', 'success');
    }
  }, []);

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

       
      } catch (error) {
       
        setFeedbackText('No se pudo obtener permiso del micrófono');
      }
    })();
  }, []);


  //* HANDLERS

  const startRecording = async () => {
    try {
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
      setFeedbackText('No se pudo obtener la grabación. Graba al menos 1 segundo e inténtalo de nuevo.');
    }
  };

  const playRecording = async () => {
    if (!recordedAudioUri) return;

    // If already playing, pause it
    if (playerStatus.playing) {
      audioPlayer.pause();
      setFeedbackText('Reproducción pausada. Presiona reproducir para continuar.');
      return;
    }

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });
      audioPlayer.replace({ uri: recordedAudioUri });
      audioPlayer.volume = 1.0;
      audioPlayer.play();

      setFeedbackText('Reproduciendo tu grabación...');

      setTimeout(async () => {
        if (!playerStatus.playing) {
          setFeedbackText('Reproducción completa. Listo para enviar o grabar de nuevo.');
          await setAudioModeAsync({
            playsInSilentMode: true,
            allowsRecording: true,
          });
        }
      }, (playerStatus.duration || 5) * 1000);

    } catch (error) {
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
    // Don't clear controllerText - keep the previous response visible
  };

  const sendAudioToBackend = async (audioUri: string) => {
    if (!sessionId) {
      setFeedbackText('No se encontró ID de sesión. Por favor inicia desde la pantalla de Contexto de Vuelo.');
      return;
    }

    try {
      setIsLoadingResponse(true);
      setFeedbackText('');

      // Save current controller text as previous before clearing
      if (controllerText) {
        setPreviousControllerText(controllerText);
      }

      setControllerText('');
      setShowPreviousController(false);
      const formattedFrequency = frequency.toFixed(3);
      const response = await sendAudioForAnalysis(audioUri, sessionId, formattedFrequency);
      setRecordedAudioUri(null);
      if (response.feedback) { setFeedbackText(response.feedback); }
      if (response.controller_text) { setControllerText(response.controller_text);  }

      if (response.audio_url) {
        await audioPlayer.replace({ uri: response.audio_url });
        await audioPlayer.play();
      }
      setIsLoadingResponse(false);

      // Check if session is completed
      if (response.session_completed === true) {
        // Show completion modal
        setSessionCompletedModalVisible(true);
      }
    } catch (error: any) {
      setIsLoadingResponse(false);
      setRecordedAudioUri(null);

      if (error.response?.status === 401) {
        setFeedbackText('Autenticación requerida. Por favor inicia sesión e intenta de nuevo.');
      } else if (error.response?.status === 400) {
        setFeedbackText(error.response?.data?.detail || 'Formato de audio inválido. Inténtalo de nuevo.');
      } else if (error.response?.status >= 500) {
        setFeedbackText('Error al enviar audio. Intenta de nuevo.');
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
  };

  const handleGoToScores = () => {
    setSessionCompletedModalVisible(false);
    router.replace('/(tabs)/ScoresTab');
  };

  const handleStartNewPractice = () => {
    setSessionCompletedModalVisible(false);
    router.replace('/(tabs)/ATCTrainingTab');
  };

  // Extract last portion of UUID for display
  const sessionIdSuffix = sessionId ? sessionId.split('-').pop()?.toUpperCase() : '';

  return (

    <ResponsiveLayout showTopNav={true} >
      {sessionId && (
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#10B981',
              }} />
              <ThemedText style={{
                fontSize: 13,
                fontWeight: '500',
                color: '#6B7280',
              }}>
                Práctica activa
              </ThemedText>
              <ThemedText style={{
                fontSize: 11,
                fontWeight: '600',
                color: '#777d86',
                fontFamily: 'monospace',
              }}>
               - TID# {sessionIdSuffix}
              </ThemedText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/ATCTrainingTab')}
                activeOpacity={0.6}
              >
                <ThemedText style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>
                  Salir
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleSettingsDrawer}
                activeOpacity={0.6}
              >
                <Icon type="MaterialIcons" name="settings" color="#9CA3AF" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={{ paddingHorizontal: 20, marginBottom: 8, paddingTop:16 }}>
        <TouchableOpacity onPress={handleOpenModal} activeOpacity={0.98}>
          <View style={{
            backgroundColor: '#F8F9FA',
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: '#E9ECEF',
            ...(Platform.OS === 'web' ? { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 }),
            elevation: 2
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              {/* Left: Icon and Radio label */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Icon type="Foundation" name="graph-bar" color="#2196F3" size={16} />
                <ThemedText style={{ fontSize: 10, fontWeight: '600', color: '#6C757D', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  Radio
                </ThemedText>
              </View>

              {/* Center: Frequency */}
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <ThemedText style={{ fontSize: 28, fontWeight: 'bold', color: '#212529', fontFamily: 'monospace', letterSpacing: 1 }}>
                  {frequency.toFixed(2)}
                </ThemedText>
                <ThemedText style={{ fontSize: 16, fontWeight: '600', color: '#2196F3', marginLeft: 6, marginTop: 4 }}>
                  MHz
                </ThemedText>
              </View>

              {/* Right: Edit icon */}
              <View style={{ marginTop: 2 }}>
                <Icon type="MaterialIcons" name="edit" color="#ADB5BD" size={16} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 30, width: '80%', maxWidth: 400, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16 }), elevation: 10 }}>
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
            <View style={{ marginBottom: controllerText || showPreviousController ? 20 : 0 }}>
              <ThemedText style={{ fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 8 }}>
                Feedback:
              </ThemedText>
              <ThemedText style={{ fontSize: 15, lineHeight: 22, color: '#333' }}>
                {feedbackText}
              </ThemedText>

              {/* Show "Ver anterior" button only when there's feedback but no current controller text */}
              {!controllerText && previousControllerText && (
                <TouchableOpacity
                  onPress={() => setShowPreviousController(!showPreviousController)}
                  activeOpacity={0.7}
                  style={{
                    marginTop: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Icon
                    type="MaterialIcons"
                    name={showPreviousController ? 'visibility-off' : 'history'}
                    color="#2196F3"
                    size={18}
                  />
                  <ThemedText style={{ fontSize: 13, fontWeight: '600', color: '#2196F3' }}>
                    {showPreviousController ? 'Ocultar instrucción anterior' : 'Ver instrucción anterior'}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Show previous controller text when toggled */}
          {!isLoadingResponse && showPreviousController && previousControllerText && !controllerText && (
            <View style={{ marginBottom: 20 }}>
              <ThemedText style={{ fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 8 }}>
                Instrucción Anterior del Controlador:
              </ThemedText>
              <ThemedText style={{ fontSize: 15, lineHeight: 22, color: '#666', fontFamily: 'monospace', fontStyle: 'italic' }}>
                {previousControllerText}
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
              //className="w-24 h-24 rounded-full "
              onPress={recorderState.isRecording ? stopRecording : startRecording}
              style={{ backgroundColor: recorderState.isRecording ? '#EF4444' : '#000' }}
              contentStyle={{ width: 300, height: 80, justifyContent: 'center', alignItems: 'center', borderRadius: '100%' }}
              labelStyle={{ fontSize: 15, fontWeight: 'bold', color: recorderState.isRecording ? 'white' : 'white' }}
            >
              {recorderState.isRecording ? 'Finalizar transmisión' : 'PTT'}
            </Button>
          </View>
        )}

        {recordedAudioUri && enableAudioReview && (
          <View style={{ width: '100%', paddingHorizontal: 20 }}>
            {/* Send Button */}
            <TouchableOpacity
              onPress={sendRecording}
              disabled={isLoadingResponse}
              activeOpacity={0.85}
              style={{
                backgroundColor: isLoadingResponse ? '#B0B0B0' : '#000',
                borderRadius: 16,
                paddingVertical: 18,
                paddingHorizontal: 24,
                marginBottom: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                ...(Platform.OS === 'web' ? {
                  boxShadow: isLoadingResponse ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)'
                } : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isLoadingResponse ? 0 : 0.15,
                  shadowRadius: 12,
                }),
                elevation: isLoadingResponse ? 0 : 6,
              }}
            >
              <Icon type="MaterialIcons" name="send" color="#ffffff" size={22} />
              <ThemedText style={{ fontSize: 16, fontWeight: '700', color: '#ffffff', letterSpacing: 0.3 }}>
                Enviar a Torre de Control
              </ThemedText>
            </TouchableOpacity>

            {/* Secondary Actions */}
        
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Play/Pause Button */}
                <TouchableOpacity
                  onPress={playRecording}
                  disabled={isLoadingResponse}
                  style={{
                    flex: 1,
                    backgroundColor: playerStatus.playing ? '#E3F2FD' : '#2196F3',
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isLoadingResponse ? 0.5 : 1,
                    ...(Platform.OS === 'web' ? {
                      boxShadow: playerStatus.playing ? 'none' : '0 2px 6px rgba(33, 150, 243, 0.2)'
                    } : {
                      shadowColor: '#2196F3',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: playerStatus.playing ? 0 : 0.2,
                      shadowRadius: 6,
                    }),
                    elevation: playerStatus.playing ? 0 : 3,
                  }}
                  activeOpacity={0.8}
                >
                  <Icon
                    type="MaterialIcons"
                    name={playerStatus.playing ? 'pause' : 'play-arrow'}
                    color={playerStatus.playing ? '#1976D2' : '#ffffff'}
                    size={24}
                  />
                  <ThemedText style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: playerStatus.playing ? '#1976D2' : '#ffffff',
                    marginTop: 4
                  }}>
                    {playerStatus.playing ? 'Pausar' : 'Reproducir'}
                  </ThemedText>
                </TouchableOpacity>

                {/* Re-record Button */}
                <TouchableOpacity
                  onPress={discardRecording}
                  disabled={isLoadingResponse}
                  style={{
                    flex: 1,
                    backgroundColor: '#FFF',
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#EF4444',
                    opacity: isLoadingResponse ? 0.5 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  <Icon
                    type="MaterialIcons"
                    name="refresh"
                    color="#EF4444"
                    size={24}
                  />
                  <ThemedText style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#EF4444',
                    marginTop: 4
                  }}>
                    Re-grabar
                  </ThemedText>
                </TouchableOpacity>
              </View>
           
          </View>
        )}
      </View>

      {/* Settings Modal for Web, Drawer for Mobile */}
      {Platform.OS === 'web' ? (
        <Modal animationType="fade" transparent={true} visible={settingsDrawerVisible} onRequestClose={toggleSettingsDrawer}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 30, width: '90%', maxWidth: 450, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <ThemedText style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>
                  Configuración
                </ThemedText>
                <TouchableOpacity onPress={toggleSettingsDrawer} activeOpacity={0.7}>
                  <Icon type="MaterialIcons" name="close" color="#000" size={24} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <ThemedText style={{ fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 6 }}>
                    Revisión de audios
                  </ThemedText>
                  <ThemedText style={{ fontSize: 14, color: '#666', lineHeight: 20 }}>
                    Reproduce o graba nuevamente audios antes de enviar a torre de control
                  </ThemedText>
                </View>
                <Switch value={enableAudioReview} onValueChange={setEnableAudioReview} color="#2196F3" />
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        settingsDrawerVisible && (
          <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }} activeOpacity={1} onPress={toggleSettingsDrawer}>
            <Animated.View
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: Dimensions.get('window').width * 0.85,
                backgroundColor: '#fff',
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 10,
                transform: [{
                  translateX: drawerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [Dimensions.get('window').width * 0.85, 0]
                  })
                }]
              }}
              onStartShouldSetResponder={() => true}
            >
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
        )
      )}

      {/* Session Completed Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={sessionCompletedModalVisible}
        onRequestClose={() => setSessionCompletedModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 30,
            width: '80%',
            maxWidth: 400,
            ...(Platform.OS === 'web' ? {
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
            } : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 16
            }),
            elevation: 10
          }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Icon type="MaterialIcons" name="check-circle" color="#10B981" size={64} />
            </View>

            <ThemedText style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#000' }}>
              ¡Has completado el entrenamiento!
            </ThemedText>

            <ThemedText style={{ fontSize: 15, textAlign: 'center', marginBottom: 24, color: '#666', lineHeight: 22 }}>
              Buen trabajo. Selecciona una opción para continuar:
            </ThemedText>

            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#2196F3',
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  ...(Platform.OS === 'web' ? {
                    boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
                  } : {
                    shadowColor: '#2196F3',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8
                  }),
                  elevation: 4
                }}
                onPress={handleGoToScores}
              >
                <ThemedText style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                  Ir a Calificaciones
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#2196F3'
                }}
                onPress={handleStartNewPractice}
              >
                <ThemedText style={{ fontSize: 16, fontWeight: '600', color: '#2196F3' }}>
                  Iniciar Nueva Práctica
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AppSnackbar visible={snackbar.visible} message={snackbar.message} type={snackbar.type} onDismiss={hideSnackbar} />
    </ResponsiveLayout>
  );
}
