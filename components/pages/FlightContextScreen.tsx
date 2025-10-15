import { Dropdown } from '@/components/molecules/Dropdown';
import { MultiSelectDropdown } from '@/components/molecules/MultiSelectDropdown';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { ThemedText } from '@/components/themed-text';
import { useCreateTrainingContext } from '@/query_hooks/useTrainingContext';
import { AIRPORTS, CONDITIONS, OBJECTIVES, VISIBILITY } from '@/utils/dropDowns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppSnackbar } from '@/components/molecules/AppSnackbar';
import { useSnackbar } from '@/hooks/useSnackbar';


// Generate QNH values from 980 to 1050
const QNH_VALUES = Array.from({ length: 71 }, (_, i) => {
  const value = 980 + i;
  return { label: `${value} hPa`, value: value.toString() };
});

// Generate wind directions (0° to 350° in 10° increments)
const WIND_DIRECTIONS = Array.from({ length: 36 }, (_, i) => {
  const value = i * 10;
  return { label: `${value.toString().padStart(3, '0')}°`, value: value.toString().padStart(3, '0') };
});

// Generate wind speeds (0 to 50 knots)
const WIND_SPEEDS = Array.from({ length: 51 }, (_, i) => {
  return { label: `${i} ${i === 1 ? 'nudo' : 'nudos'}`, value: i.toString() };
});



export default function FlightContextScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('manual');
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');

  // Meteo object state
  const [meteo, setMeteo] = useState({
    condition: '',
    vis: '',
    qnh: '',
    windDirection: '',
    windSpeed: '',
  });

  // Objectives state - can be multiple selections
  const [objectives, setObjectives] = useState<string[]>([]);

  // Snackbar hook
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  // Training context mutation
  const { mutate: createContext, isPending } = useCreateTrainingContext();

  const handleStart = () => {
    // Construct wind as "direction/speed"
    const wind = meteo.windDirection && meteo.windSpeed
      ? `${meteo.windDirection}/${meteo.windSpeed}`
      : '';

    // Construct route as "departure-arrival"
    const route = departure && arrival ? `${departure}-${arrival}` : '';

    // Validate required fields
    if (!route) {
      showSnackbar('Por favor seleccione aeropuertos de salida y llegada', 'error');
      return;
    }

    // Prepare training configuration
    const trainingConfig = {
      route,
      meteo: {
        ...meteo,
        wind,
      },
      objectives,
    };

    console.log('📤 Sending training config:', trainingConfig);

    // Send to backend
    createContext(trainingConfig, {
      onSuccess: (data) => {
        console.log('✅ Training context created successfully:', data);
        console.log('📝 Session ID:', data.trainingSessionId);

        showSnackbar('Configuración de entrenamiento guardada', 'success');

        // Navigate after a brief delay to show the success message
        setTimeout(() => {
          router.push({
            pathname: '/atc-practice',
            params: { sessionId: data.trainingSessionId },
          });
        }, 1000);
      },
      onError: (error: any) => {
        console.error('❌ Error creating training context:', error);
        showSnackbar(
          error?.response?.data?.message || 'No se pudo guardar la configuración',
          'error'
        );
      },
    });
  };

  return (
    <ResponsiveLayout>
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <ThemedText
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Configuración de Entrenamiento
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 14,
                textAlign: 'center',
                opacity: 0.6,
              }}
            >
              Practica Briefing previo al vuelo
            </ThemedText>
          </View>

          {/* Tabs */}
          {/* <View style={{ marginBottom: 20 }}>
            <SegmentedButtons
              value={activeTab}
              onValueChange={setActiveTab}
              buttons={[
                {
                  value: 'manual',
                  label: 'Configuración Manual',
                  style: activeTab === 'manual' ? styles.activeTab : styles.inactiveTab,
                  labelStyle: activeTab === 'manual' ? styles.activeLabel : styles.inactiveLabel,
                },
                {
                  value: 'voice',
                  label: 'Por Voz',
                  style: activeTab === 'voice' ? styles.activeTab : styles.inactiveTab,
                  labelStyle: activeTab === 'voice' ? styles.activeLabel : styles.inactiveLabel,
                },
              ]}
              style={styles.segmentedButtons}
            />
          </View> */}

          {/* Manual Configuration Content */}
          {/* {activeTab === 'manual' && ( */}
            <>
              {/* Route Section */}
              <View style={{ marginBottom: 8 }}>
                <ThemedText
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    marginBottom: 12,
                  }}
                >
                  Ruta
                </ThemedText>
              </View>

              {/* Departure Airport */}
              <Dropdown
                label="Salida (Departure)"
                placeholder="Seleccione aeropuerto de salida"
                options={AIRPORTS}
                value={departure}
                onSelect={setDeparture}
                searchable={true}
              />

              {/* Arrival Airport */}
              <Dropdown
                label="Llegada (Arrival)"
                placeholder="Seleccione aeropuerto de llegada"
                options={AIRPORTS}
                value={arrival}
                onSelect={setArrival}
                searchable={true}
              />

              {/* Route Display */}
              {departure && arrival && (
                <View style={{
                  backgroundColor: '#f5f5f5',
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 8,
                  marginBottom: 16
                }}>
                  <ThemedText style={{ fontSize: 14, opacity: 0.6 }}>
                    Ruta: {departure} → {arrival}
                  </ThemedText>
                </View>
              )}

              {/* Meteorological Conditions Section */}
              <View style={{ marginTop: 16, marginBottom: 8 }}>
                <ThemedText
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    marginBottom: 12,
                  }}
                >
                  Condiciones Meteorológicas
                </ThemedText>
              </View>

              {/* Condition */}
              <Dropdown
                label="Condición"
                placeholder="Seleccione condición"
                options={CONDITIONS}
                value={meteo.condition}
                onSelect={(value) => setMeteo({ ...meteo, condition: value })}
                searchable={false}
              />

              {/* Visibility */}
              <Dropdown
                label="Visibilidad"
                placeholder="Seleccione visibilidad"
                options={VISIBILITY}
                value={meteo.vis}
                onSelect={(value) => setMeteo({ ...meteo, vis: value })}
                searchable={false}
              />

              {/* QNH */}
              <Dropdown
                label="QNH (hPa)"
                placeholder="Seleccione QNH"
                options={QNH_VALUES}
                value={meteo.qnh}
                onSelect={(value) => setMeteo({ ...meteo, qnh: value })}
                searchable={true}
              />

              {/* Wind Section */}
              <View style={{ marginTop: 8, marginBottom: 8 }}>
                <ThemedText
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    marginBottom: 12,
                  }}
                >
                  Viento (Dirección / Velocidad)
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Wind Direction */}
                <View style={{ flex: 1 }}>
                  <Dropdown
                    label="Dirección"
                    placeholder="000°"
                    options={WIND_DIRECTIONS}
                    value={meteo.windDirection}
                    onSelect={(value) => setMeteo({ ...meteo, windDirection: value })}
                    searchable={true}
                  />
                </View>

                {/* Wind Speed */}
                <View style={{ flex: 1 }}>
                  <Dropdown
                    label="Velocidad"
                    placeholder="0 nudos"
                    options={WIND_SPEEDS}
                    value={meteo.windSpeed}
                    onSelect={(value) => setMeteo({ ...meteo, windSpeed: value })}
                    searchable={true}
                  />
                </View>
              </View>

              {/* Wind Display */}
              {meteo.windDirection && meteo.windSpeed && (
                <View style={{
                  backgroundColor: '#f5f5f5',
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 8,
                  marginBottom: 16
                }}>
                  <ThemedText style={{ fontSize: 14, opacity: 0.6 }}>
                    Viento: {meteo.windDirection}/{meteo.windSpeed}
                  </ThemedText>
                </View>
              )}

              {/* Objectives Section */}
              <View style={{ marginTop: 16, marginBottom: 8 }}>
                <ThemedText
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    marginBottom: 12,
                  }}
                >
                  Objetivos de Práctica
                </ThemedText>
              </View>

              {/* Objectives Multi-Select Dropdown */}
              <MultiSelectDropdown
                label="Objetivos"
                placeholder="Seleccione uno o más objetivos"
                options={OBJECTIVES}
                values={objectives}
                onSelect={setObjectives}
                searchable={false}
              />
            </>
      

          {/* Start Button */}
          <TouchableOpacity
            style={{
              backgroundColor: isPending ? '#666' : '#000',
              paddingVertical: 18,
              borderRadius: 12,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              marginTop: 8,
              marginBottom: 24,
            }}
            onPress={handleStart}
            activeOpacity={0.8}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#ffffff',
                }}
              >
                Iniciar
              </ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Snackbar for notifications */}
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

