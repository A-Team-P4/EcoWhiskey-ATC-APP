import { AppSnackbar } from '@/components/molecules/AppSnackbar';
import { Dropdown } from '@/components/molecules/Dropdown';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { ThemedText } from '@/components/themed-text';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useCreateTrainingContext } from '@/query_hooks/useTrainingContext';
import { fetchMETARData } from '@/services/apiClient';
import { AIRPORTS, CONDITIONS, SCENARIOS, VISIBILITY } from '@/utils/dropDowns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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

// Generate temperature values (-20°C to 50°C)
const TEMPERATURE_VALUES = Array.from({ length: 71 }, (_, i) => {
  const value = -20 + i;
  return { label: `${value}°C`, value: value.toString() };
});

// Generate dew point values (-20°C to 40°C)
const DEW_POINT_VALUES = Array.from({ length: 61 }, (_, i) => {
  const value = -20 + i;
  return { label: `${value}°C`, value: value.toString() };
});

// Cloud coverage options
const CLOUD_COVERAGE = [
  { label: 'SKC - Sky Clear (Cielo despejado)', value: 'SKC' },
  { label: 'FEW - Few (Pocas nubes, 1-2 octavos)', value: 'FEW' },
  { label: 'SCT - Scattered (Dispersas, 3-4 octavos)', value: 'SCT' },
  { label: 'BKN - Broken (Fragmentadas, 5-7 octavos)', value: 'BKN' },
  { label: 'OVC - Overcast (Cubierto, 8 octavos)', value: 'OVC' },
];

// Cloud base altitude (in feet) - common values for training
const CLOUD_BASE_VALUES = Array.from({ length: 20 }, (_, i) => {
  const value = (i + 1) * 500; // 500ft increments up to 10,000ft
  return { label: `${value} ft`, value: value.toString() };
});

export default function FlightContextScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');

  // Toggle between current conditions and manual setup
  const [useCurrentConditions, setUseCurrentConditions] = useState(false);
  const [isFetchingMETAR, setIsFetchingMETAR] = useState(false);

  // Meteo object state
  const [meteo, setMeteo] = useState({
    condition: '',
    vis: '',
    qnh: '',
    windDirection: '',
    windSpeed: '',
    temp: '',
    dewp: '',
    cloudCover: '',
    cloudBase: '',
  });

  // Objective state - single selection
  const [objective, setObjective] = useState('');

  // Snackbar hook
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  // Training context mutation
  const { mutate: createContext, isPending } = useCreateTrainingContext();

  // Debug: Log meteo state changes (commented out to reduce console noise)
  // useEffect(() => {
  //   console.log('🔍 Meteo state updated:', meteo);
  //   console.log('🔍 QNH value:', meteo.qnh, 'Type:', typeof meteo.qnh);
  //   console.log('🔍 Condition value:', meteo.condition, 'Type:', typeof meteo.condition);
  // }, [meteo]);

  // Function to map METAR visibility to our format
  const mapMETARVisibility = (visib: string): string => {
    if (visib === '6+' || visib === '10+') return '>10km';
    if (visib.includes('10')) return '10km';
    if (visib.includes('5')) return '5km';
    if (visib.includes('3')) return '3km';
    if (visib.includes('1')) return '1km';
    return '>10km'; // default
  };

  // Function to map METAR flight category to condition
  const mapFlightCategory = (fltCat: string): string => {
    if (fltCat === 'VFR' || fltCat === 'MVFR') return 'VMC';
    if (fltCat === 'IFR' || fltCat === 'LIFR') return 'IMC';
    return 'VMC'; // default
  };

  // Fetch current METAR conditions
  const handleFetchCurrentConditions = async () => {
    if (!departure) {
      showSnackbar('Por favor seleccione aeropuerto de salida primero', 'error');
      return;
    }

    setIsFetchingMETAR(true);
    try {
      const metarData = await fetchMETARData(departure);

      console.log('📡 Raw METAR Data:', metarData);
      console.log('📡 Flight Category (fltCat):', metarData.fltCat);
      console.log('📡 Altimeter (altim):', metarData.altim);
      console.log('📡 Visibility (visib):', metarData.visib);

      const mappedCondition = mapFlightCategory(metarData.fltCat);
      const mappedVis = mapMETARVisibility(metarData.visib);
      // Round QNH to nearest integer to match dropdown values
      const mappedQnh = Math.round(metarData.altim).toString();

      console.log('✅ Mapped condition:', mappedCondition);
      console.log('✅ Mapped visibility:', mappedVis);
      console.log('✅ Mapped QNH:', mappedQnh);

      // Map METAR data to our meteo state
      const newMeteo = {
        condition: mappedCondition,
        vis: mappedVis,
        qnh: mappedQnh,
        windDirection: metarData.wdir.toString().padStart(3, '0'),
        windSpeed: metarData.wspd.toString(),
        temp: metarData.temp.toString(),
        dewp: metarData.dewp.toString(),
        cloudCover: metarData.clouds?.[0]?.cover || 'SKC',
        cloudBase: metarData.clouds?.[0]?.base?.toString() || '',
      };

      console.log('✅ Complete meteo state to be set:', newMeteo);
      setMeteo(newMeteo);

      setUseCurrentConditions(true);
      showSnackbar(`Condiciones actuales de ${departure} cargadas exitosamente`, 'success');
    } catch (error: any) {
      console.error('❌ Error fetching METAR data:', error);
      showSnackbar(
        error?.message || `No se pudieron cargar las condiciones de ${departure}`,
        'error'
      );
    } finally {
      setIsFetchingMETAR(false);
    }
  };

  // Toggle handler
  const handleToggleConditions = (value: boolean) => {
    setUseCurrentConditions(value);
    if (!value) {
      // Reset meteo when switching to manual
      setMeteo({
        condition: '',
        vis: '',
        qnh: '',
        windDirection: '',
        windSpeed: '',
        temp: '',
        dewp: '',
        cloudCover: '',
        cloudBase: '',
      });
    }
  };

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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: isWeb ? 20 : 12 }}>
        <View style={{ maxWidth: isWeb ? 1000 : '100%', width: '100%', alignSelf: 'center' }}>

          {/* Configuration Header */}
          <ThemedText style={{ fontSize: 24, fontWeight: '700', marginBottom: 16 }}>
            Configuración de Vuelo
          </ThemedText>

          {/* Scenario & Route Card */}
          <View style={styles.card}>
            {/* Objective */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Escenario</ThemedText>
              <Dropdown
                label="Escenario"
                placeholder="Seleccione un escenario"
                options={SCENARIOS}
                value={objective}
                onSelect={setObjective}
              />
            </View>

            {/* Route */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Ruta de Vuelo</ThemedText>
              <View style={{ flexDirection: isWeb ? 'row' : 'column', gap: isWeb ? 12 : 0 }}>
                <View style={{ flex: 1 }}>
                  <Dropdown
                    label="Salida"
                    placeholder="Aeropuerto de salida"
                    options={AIRPORTS}
                    value={departure}
                    onSelect={setDeparture}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Dropdown
                    label="Llegada"
                    placeholder="Aeropuerto de llegada"
                    options={AIRPORTS}
                    value={arrival}
                    onSelect={setArrival}
                  />
                </View>
              </View>
              {departure && arrival && (
                <View style={styles.infoBox}>
                  <ThemedText style={styles.infoText}>
                    {departure} → {arrival}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Meteorological Conditions Card */}
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <ThemedText style={styles.cardTitle}>Condiciones Meteorológicas</ThemedText>

              {useCurrentConditions && (
                <TouchableOpacity
                  onPress={() => handleToggleConditions(false)}
                  style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center', backgroundColor: '#EF4444' }}
                >
                  <ThemedText style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>
                    Limpiar
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {/* Load Current Conditions Button */}
            {!useCurrentConditions ? (
              <TouchableOpacity
                style={[styles.loadMetarButton, (isFetchingMETAR || !departure) && styles.loadMetarButtonDisabled]}
                onPress={handleFetchCurrentConditions}
                disabled={isFetchingMETAR || !departure}
                activeOpacity={0.8}
              >
                {isFetchingMETAR && <ActivityIndicator color="#ffffff" size="small" />}
                <ThemedText style={styles.loadMetarButtonText}>
                  {departure ? `Cargar METAR de ${departure}` : 'Seleccione aeropuerto'}
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={styles.currentConditionsInfo}>
                <ThemedText style={styles.currentConditionsText}>
                  Datos del METAR de {departure}
                </ThemedText>
              </View>
            )}

            {/* Compact Grid Layout */}
            <View style={styles.gridContainer}>
              {/* Row 1: Condición */}
              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Dropdown
                    label="Condición"
                    placeholder="VMC/IMC"
                    options={CONDITIONS}
                    value={meteo.condition}
                    onSelect={(value) => setMeteo({ ...meteo, condition: value })}
                    disabled={useCurrentConditions}
                    compact
                  />
                </View>
                <View style={styles.gridItem} />
              </View>

              {/* Row 2: Visibilidad | QNH */}
              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Dropdown
                    label="Visibilidad"
                    placeholder="Seleccione"
                    options={VISIBILITY}
                    value={meteo.vis}
                    onSelect={(value) => setMeteo({ ...meteo, vis: value })}
                    disabled={useCurrentConditions}
                    compact
                  />
                </View>
                <View style={styles.gridItem}>
                  <Dropdown
                    label="QNH"
                    placeholder="hPa"
                    options={QNH_VALUES}
                    value={meteo.qnh}
                    onSelect={(value) => setMeteo({ ...meteo, qnh: value })}
                    disabled={useCurrentConditions}
                    compact
                  />
                </View>
              </View>

              {/* Wind Section Label */}
              <View style={styles.sectionLabel}>
                <ThemedText style={styles.sectionLabelText}>Viento</ThemedText>
              </View>

              {/* Row 3: Velocidad | Dirección */}
              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Dropdown
                    label="Velocidad"
                    placeholder="nudos"
                    options={WIND_SPEEDS}
                    value={meteo.windSpeed}
                    onSelect={(value) => setMeteo({ ...meteo, windSpeed: value })}
                    disabled={useCurrentConditions}
                    compact
                  />
                </View>
                <View style={styles.gridItem}>
                  <Dropdown
                    label="Dirección"
                    placeholder="000°"
                    options={WIND_DIRECTIONS}
                    value={meteo.windDirection}
                    onSelect={(value) => setMeteo({ ...meteo, windDirection: value })}
                    disabled={useCurrentConditions}
                    compact
                  />
                </View>
              </View>

              {/* Row 4: Temperatura | Punto de Rocío */}
              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Dropdown
                    label="Temperatura"
                    placeholder="°C"
                    options={TEMPERATURE_VALUES}
                    value={meteo.temp}
                    onSelect={(value) => setMeteo({ ...meteo, temp: value })}
                    disabled={useCurrentConditions}
                    compact
                  />
                </View>
                <View style={styles.gridItem}>
                  <Dropdown
                    label="Punto de Rocío"
                    placeholder="°C"
                    options={DEW_POINT_VALUES}
                    value={meteo.dewp}
                    onSelect={(value) => setMeteo({ ...meteo, dewp: value })}
                    disabled={useCurrentConditions}
                    compact
                  />
                </View>
              </View>

              {/* Row 5: Nubes | Base de Nubes */}
              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Dropdown
                    label="Nubes"
                    placeholder="Cobertura"
                    options={CLOUD_COVERAGE}
                    value={meteo.cloudCover}
                    onSelect={(value) => setMeteo({ ...meteo, cloudCover: value })}
                    disabled={useCurrentConditions}
                    compact
                  />
                </View>
                <View style={styles.gridItem}>
                  <Dropdown
                    label="Base de Nubes"
                    placeholder="ft"
                    options={CLOUD_BASE_VALUES}
                    value={meteo.cloudBase}
                    onSelect={(value) => setMeteo({ ...meteo, cloudBase: value })}
                    disabled={useCurrentConditions}
                    compact
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={[styles.startButton, isPending && styles.startButtonDisabled]}
            onPress={handleStart}
            activeOpacity={0.8}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.startButtonText}>Iniciar Práctica</ThemedText>
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

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000',
  },
  infoBox: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadMetarButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  loadMetarButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loadMetarButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  currentConditionsInfo: {
    backgroundColor: '#e3f2fd',
    padding: 7,
    borderRadius: 5,
    marginBottom: 10,
  },
  currentConditionsText: {
    fontSize: 11,
    color: '#1976d2',
  },
  sectionLabel: {
    marginTop: 4,
    marginBottom: 6,
  },
  sectionLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  gridContainer: {
    gap: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  gridItem: {
    flex: 1,
  },
  startButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
    }),
    elevation: 5,
  },
  startButtonDisabled: {
    backgroundColor: '#666',
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
