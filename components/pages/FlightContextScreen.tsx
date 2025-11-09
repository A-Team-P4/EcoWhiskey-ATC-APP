import { AppSnackbar } from '@/components/molecules/AppSnackbar';
import { Dropdown } from '@/components/molecules/Dropdown';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { ThemedText } from '@/components/themed-text';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useCreateTrainingContext } from '@/query_hooks/useTrainingContext';
import { AIRPORTS, CONDITIONS, SCENARIOS, VISIBILITY } from '@/utils/dropDowns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';


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
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

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

  // Objective state - single selection
  const [objective, setObjective] = useState('');

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
    if (!objective) {
      showSnackbar('Por favor seleccione un objetivo de práctica', 'error');
      return;
    }

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
      scenario_id: objective ,
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
    <ResponsiveLayout showTopNav={true}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>


        <View style={{ maxWidth: isWeb ? 1000 : '100%', width: '100%', alignSelf: 'center' }}>

          {/* Objectives Section */}
          <View style={{ marginBottom: isWeb ? 16 : 2 }}>
            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: '600',
                marginBottom: isWeb ? 16 : 12,
              }}
            >
              Objetivos de Práctica
            </ThemedText>

            {/* Objective Single-Select Dropdown */}
            <Dropdown
              label="Escenario"
              placeholder="Seleccione un escenario"
              options={SCENARIOS}
              value={objective}
              onSelect={setObjective}
             
            />
          </View>

          {/* Route Section */}
          <View style={{ marginBottom: isWeb ? 16 : 2 }}>
            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: '600',
                marginBottom: isWeb ? 16 : 12,
              }}
            >
              Ruta
            </ThemedText>

            <View style={{ flexDirection: isWeb ? 'row' : 'column', gap: isWeb ? 16 : 0 }}>
              {/* Departure Airport */}
              <View style={{ flex: 1 }}>
                <Dropdown
                  label="Salida (Departure)"
                  placeholder="Seleccione aeropuerto de salida"
                  options={AIRPORTS}
                  value={departure}
                  onSelect={setDeparture}
                  
                />
              </View>

              {/* Arrival Airport */}
              <View style={{ flex: 1 }}>
                <Dropdown
                  label="Llegada (Arrival)"
                  placeholder="Seleccione aeropuerto de llegada"
                  options={AIRPORTS}
                  value={arrival}
                  onSelect={setArrival}
                  
                />
              </View>
            </View>

            {/* Route Display */}
            {departure && arrival && (
              <View style={{
                backgroundColor: '#f5f5f5',
                padding: 12,
                borderRadius: 8,
                marginTop: 8,
              }}>
                <ThemedText style={{ fontSize: 14, opacity: 0.6 }}>
                  Ruta: {departure} → {arrival}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Meteorological Conditions Section */}
          <View style={{ marginBottom: isWeb ? 16 : 2 }}>
            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: '600',
                marginBottom: isWeb ? 16 : 12,
              }}
            >
              Condiciones Meteorológicas
            </ThemedText>

            <View style={{ flexDirection: isWeb ? 'row' : 'column', gap: isWeb ? 16 : 8, marginBottom: isWeb ? 16 : 2 }}>
              {/* Condition */}
              <View style={{ flex: 1 }}>
                <Dropdown
                  label="Condición"
                  placeholder="Seleccione condición"
                  options={CONDITIONS}
                  value={meteo.condition}
                  onSelect={(value) => setMeteo({ ...meteo, condition: value })}
                
                />
              </View>

              {/* Visibility */}
              <View style={{ flex: 1 }}>
                <Dropdown
                  label="Visibilidad"
                  placeholder="Seleccione visibilidad"
                  options={VISIBILITY}
                  value={meteo.vis}
                  onSelect={(value) => setMeteo({ ...meteo, vis: value })}
                
                />
              </View>

              {/* QNH */}
              <View style={{ flex: 1 }}>
                <Dropdown
                  label="QNH (hPa)"
                  placeholder="Seleccione QNH"
                  options={QNH_VALUES}
                  value={meteo.qnh}
                  onSelect={(value) => setMeteo({ ...meteo, qnh: value })}
                  
                />
              </View>
            </View>

            {/* Wind Section */}
            <View style={{ marginBottom: 8 }}>
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

            <View style={{ flexDirection: 'row', gap: 16 }}>
              {/* Wind Direction */}
              <View style={{ flex: 1 }}>
                <Dropdown
                  label="Dirección"
                  placeholder="000°"
                  options={WIND_DIRECTIONS}
                  value={meteo.windDirection}
                  onSelect={(value) => setMeteo({ ...meteo, windDirection: value })}
                  
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
              }}>
                <ThemedText style={{ fontSize: 14, opacity: 0.6 }}>
                  Viento: {meteo.windDirection}/{meteo.windSpeed}
                </ThemedText>
              </View>
            )}
          </View>

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
        </View>
      </ScrollView>

      {/* Snackbar for notifications */}
      <AppSnackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={hideSnackbar}
      />
    </ResponsiveLayout>
  );
}

