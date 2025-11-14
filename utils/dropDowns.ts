export const AIRPORTS = [
  // International Airports
  // { label: 'MROC - Juan Santamaría Intl. (San José / Alajuela)', value: 'MROC' },
  //{ label: 'MRLB - Daniel Oduber Intl. (Liberia)', value: 'MRLB' },
  //{ label: 'MRLM - Limón Intl. (Limón)', value: 'MRLM' },
  //{ label: 'MRPM - Palmar Sur (Osa)', value: 'MRPM' },
  // Domestic Airports
  { label: "MRPV - Tobías Bolaños Intl", value: "MRPV" },
  // { label: 'MRSV - San Vito', value: 'MRSV' },
  // { label: 'MRNS - Nosara', value: 'MRNS' },
  // { label: 'MRTR - Tambor', value: 'MRTR' },
  // { label: 'MRAO - Arenal/La Fortuna', value: 'MRAO' },
  // { label: 'MRCR - Carrillo (Playa Sámara)', value: 'MRCR' },
  // { label: 'MRDK - Drake Bay', value: 'MRDK' },
  // { label: 'MRGF - Golfito', value: 'MRGF' },
  // { label: 'MRPJ - Puerto Jiménez', value: 'MRPJ' },
  // { label: 'MRQP - Quepos / La Managua', value: 'MRQP' },
  // { label: 'MRSO - Sámara', value: 'MRSO' },
];

export const CONDITIONS = [
  { label: "VMC", value: "VMC" },
  { label: "IMC", value: "IMC" },
];

export const VISIBILITY = [
  { label: "Más de 10 km", value: ">10km" },
  { label: "10 km", value: "10km" },
  { label: "5 km", value: "5km" },
  { label: "3 km", value: "3km" },
  { label: "1 km", value: "1km" },
  { label: "Menos de 1 km", value: "<1km" },
];

export const SCENARIOS = [
  //{ label: 'Practicar taxi', value: 'practice_taxi' },
  // { label: 'Énfasis en fraseología', value: 'phraseology_focus' },
  { label: "MRVP-Zona Echo", value: "mrpv_zone_echo" },
  { label: "Zona Echo-MRVP", value: "zone_echo_mrpv" },
  { label: "MRVP-MRVP", value: "mrpv_full_flight" },
  //{ label: 'Uso correcto de altímetro', value: 'altimeter_use' },
  //{ label: 'Tráfico de circuito', value: 'circuit_traffic' },
  //{ label: 'Entrada y salida de aeródromo controlado', value: 'controlled_airfield_ops' },
  //{ label: 'Gestión de emergencias', value: 'emergency_management' },
];

// Generate QNH values from 980 to 1050
export const QNH_VALUES = Array.from({ length: 71 }, (_, i) => {
  const value = 980 + i;
  return { label: `${value} hPa`, value: value.toString() };
});

// Generate wind directions (0° to 350° in 10° increments)
export const WIND_DIRECTIONS = Array.from({ length: 36 }, (_, i) => {
  const value = i * 10;
  return { label: `${value.toString().padStart(3, '0')}°`, value: value.toString().padStart(3, '0') };
});

// Generate wind speeds (0 to 50 knots)
export const WIND_SPEEDS = Array.from({ length: 51 }, (_, i) => {
  return { label: `${i} ${i === 1 ? 'nudo' : 'nudos'}`, value: i.toString() };
});

// Generate temperature values (-20°C to 50°C)
export const TEMPERATURE_VALUES = Array.from({ length: 71 }, (_, i) => {
  const value = -20 + i;
  return { label: `${value}°C`, value: value.toString() };
});

// Generate dew point values (-20°C to 40°C)
export const DEW_POINT_VALUES = Array.from({ length: 61 }, (_, i) => {
  const value = -20 + i;
  return { label: `${value}°C`, value: value.toString() };
});

// Cloud coverage options
export const CLOUD_COVERAGE = [
  { label: 'SKC - Sky Clear (Cielo despejado)', value: 'SKC' },
  { label: 'FEW - Few (Pocas nubes, 1-2 octavos)', value: 'FEW' },
  { label: 'SCT - Scattered (Dispersas, 3-4 octavos)', value: 'SCT' },
  { label: 'BKN - Broken (Fragmentadas, 5-7 octavos)', value: 'BKN' },
  { label: 'OVC - Overcast (Cubierto, 8 octavos)', value: 'OVC' },
];

// Cloud base altitude (in feet) - common values for training
export const CLOUD_BASE_VALUES = Array.from({ length: 20 }, (_, i) => {
  const value = (i + 1) * 500; // 500ft increments up to 10,000ft
  return { label: `${value} ft`, value: value.toString() };
});
