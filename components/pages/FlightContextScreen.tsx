import { AppSnackbar } from '@/components/molecules/AppSnackbar';
import { Dropdown } from '@/components/molecules/Dropdown';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { ThemedText } from '@/components/themed-text';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useCreateTrainingContext } from '@/query_hooks/useTrainingContext';
import { fetchMETARData } from '@/services/apiClient';
import { CLOUD_BASE_VALUES, CLOUD_COVERAGE, CONDITIONS, DEW_POINT_VALUES, QNH_VALUES, SCENARIOS, TEMPERATURE_VALUES, VISIBILITY, WIND_DIRECTIONS, WIND_SPEEDS } from '@/utils/dropDowns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';


export default function FlightContextScreen() {
  //* HOOKS
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [useCurrentConditions, setUseCurrentConditions] = useState(false);
  const [isFetchingMETAR, setIsFetchingMETAR] = useState(false);
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
  const [scenario, setScenario] = useState('');
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  const { mutate: createContext, isPending } = useCreateTrainingContext();


  //* HANDLERS
  const handleFetchCurrentConditions = async () => {
    if (!scenario) {
      showSnackbar('Por favor seleccione escenario de práctica', 'error');
      return;
    }

    setIsFetchingMETAR(true);
    try {
      const metarData = await fetchMETARData('MROC');
      //const metarData = await fetchMETARData(departure);
      const mappedCondition = mapFlightCategory(metarData.fltCat);
      const mappedVis = mapMETARVisibility(metarData.visib);
      const mappedQnh = Math.round(metarData.altim).toString();

      // Handle variable wind direction (VRB) or other non-numeric cases
      const windDir = typeof metarData.wdir === 'number'
        ? metarData.wdir.toString().padStart(3, '0')
        : metarData.wdir === 'VRB'
          ? '000'  // Use calm wind (000) for variable winds
          : '000'; // Default fallback for any other cases

      const newMeteo = {
        condition: mappedCondition,
        vis: mappedVis,
        qnh: mappedQnh,
        windDirection: windDir,
        windSpeed: metarData.wspd.toString(),
        temp: metarData.temp.toString(),
        dewp: metarData.dewp.toString(),
        cloudCover: metarData.clouds?.[0]?.cover || 'SKC',
        cloudBase: metarData.clouds?.[0]?.base?.toString() || '',
      };

      setMeteo(newMeteo);

      setUseCurrentConditions(true);
    } catch (error: any) {
      showSnackbar('METAR no disponible, por favor ingrese las condiciones manualmente', 'error');
    } finally {
      setIsFetchingMETAR(false);
    }
  };
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

    // Construct route - fixed for specific scenarios, otherwise use departure-arrival
    let route = '';
    if (scenario === 'mrpv_full_flight') {
      route = 'MRPV-MRPV';
    } else if (scenario === 'mrpv_zone_echo') {
      route = 'MRPV-mrpv_zone_echo';
    } else if (scenario === 'zone_echo_mrpv') {
      route = 'zone_echo_mrpv-MRPV';
    } else {
      route = departure && arrival ? `${departure}-${arrival}` : '';
    }

    // Validate required fields
    if (!scenario) {
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
      scenario_id: scenario ,
      session_completed: false
    };


    // Send to backend
    createContext(trainingConfig, {
      onSuccess: (data) => {
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
        showSnackbar(
          error?.response?.data?.message || 'No se pudo guardar la configuración',
          'error'
        );
      },
    });
  };
  //* HELPERS
  const mapFlightCategory = (fltCat: string): string => {
    if (fltCat === 'VFR' || fltCat === 'MVFR') return 'VMC';
    if (fltCat === 'IFR' || fltCat === 'LIFR') return 'IMC';
    return 'VMC'; // default
  };
  const mapMETARVisibility = (visib: string): string => {
    if (visib === '6+' || visib === '10+') return '>10km';
    if (visib.includes('10')) return '10km';
    if (visib.includes('5')) return '5km';
    if (visib.includes('3')) return '3km';
    if (visib.includes('1')) return '1km';
    return '>10km';
  };

  return (
    <ResponsiveLayout showTopNav={true}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: isWeb ? 20 : 12 }}>
        <View style={{ maxWidth: isWeb ? 1000 : '100%', width: '100%', alignSelf: 'center' }}>

          {/* Configuration Header */}
          <ThemedText style={{ fontSize: 24, fontWeight: '700', marginBottom: 16 }}> Configuración de Práctica </ThemedText>

          {/* Scenario & Route Card */}
          <View style={styles.card}>
            {/* Objective */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Selecciona un escenario</ThemedText>
              <Dropdown
                label="Escenario"
                placeholder="Seleccione un escenario"
                options={SCENARIOS}
                value={scenario}
                onSelect={setScenario}
              />

              {/* Helper text for mrpv_full_flight scenario */}
              {scenario === 'mrpv_full_flight' && (
                <View style={styles.helperBox}>
                  <ThemedText style={styles.helperText}>
                    Este escenario simula un vuelo completo que parte del aeropuerto de Tobías Bolaño (MRPV), se dirige hacia la Zona Echo y luego regresa a MRPV. Es ideal para practicar todas las fases del vuelo, desde el despegue hasta el aterrizaje.
                  </ThemedText>
                </View>
              )}

              {/* Helper text for mrpv_zone_echo scenario */}
              {scenario === 'mrpv_zone_echo' && (
                <View style={styles.helperBox}>
                  <ThemedText style={styles.helperText}>
                    Este escenario simula un vuelo desde el aeropuerto de Tobías Bolaños (MRPV) hacia la Zona Echo. Es ideal para practicar el despegue, comunicaciones iniciales y salida del espacio aéreo controlado.
                  </ThemedText>
                </View>
              )}

              {/* Helper text for zone_echo_mrpv scenario */}
              {scenario === 'zone_echo_mrpv' && (
                <View style={styles.helperBox}>
                  <ThemedText style={styles.helperText}>
                    Este escenario simula un vuelo de regreso desde la Zona Echo hacia el aeropuerto de Tobías Bolaños (MRPV). Es ideal para practicar la entrada al espacio aéreo controlado, aproximación y aterrizaje.
                  </ThemedText>
                </View>
              )}
            </View>


            {/* Fixed route display for mrpv_full_flight */}
            {scenario === 'mrpv_full_flight' && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Ruta de Vuelo</ThemedText>
                <View style={styles.infoBox}>
                  <ThemedText style={styles.infoText}>
                    MRPV → Zona Echo → MRPV
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Fixed route display for mrpv_zone_echo */}
            {scenario === 'mrpv_zone_echo' && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Ruta de Vuelo</ThemedText>
                <View style={styles.infoBox}>
                  <ThemedText style={styles.infoText}>
                    MRPV → Zona Echo
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Fixed route display for zone_echo_mrpv */}
            {scenario === 'zone_echo_mrpv' && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Ruta de Vuelo</ThemedText>
                <View style={styles.infoBox}>
                  <ThemedText style={styles.infoText}>
                    Zona Echo → MRPV
                  </ThemedText>
                </View>
              </View>
            )}
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
                style={[styles.loadMetarButton, (isFetchingMETAR || !scenario) && styles.loadMetarButtonDisabled]}
                onPress={handleFetchCurrentConditions}
                disabled={isFetchingMETAR || !scenario}
                activeOpacity={0.8}
              >
                {isFetchingMETAR && <ActivityIndicator color="#ffffff" size="small" />}
                <ThemedText style={styles.loadMetarButtonText}>
                  {scenario ? `Cargar METAR` : 'Selecciona un scenario'}
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={styles.currentConditionsInfo}>
                <ThemedText style={styles.currentConditionsText}>
                  Datos METAR
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
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
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
  helperBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    marginTop: 0,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  helperText: {
    fontSize: 13,
    color: '#616161',
    lineHeight: 18,
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
