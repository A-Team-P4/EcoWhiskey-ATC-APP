import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FlightContextScreen() {
  const router = useRouter();
  const [context, setContext] = useState('');

  const handleStart = () => {
    // TODO: Save context to global state or pass as parameter
    router.push('/atc-practice');
  };

  return (
    <ResponsiveLayout>
      <SafeAreaView className="flex-1 bg-white">
        <View style={{ flex: 1, padding: 20 }}>
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
              Contexto de Vuelo
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 14,
                textAlign: 'center',
                opacity: 0.6,
              }}
            >
              Proporciona información sobre tu vuelo
            </ThemedText>
          </View>

          {/* Context Input Area */}
          <View style={{ flex: 1, marginBottom: 24 }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: '#1a1a1a',
                borderRadius: 16,
                padding: 20,
                fontSize: 16,
                color: '#ffffff',
                textAlignVertical: 'top',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                fontFamily: 'monospace',
              }}
              value={context}
              onChangeText={setContext}
              placeholder="Describe tu situación de vuelo:&#10;&#10;• ¿Dónde estás?&#10;• ¿Qué está pasando?&#10;• ¿A dónde vas?&#10;• Condiciones meteorológicas&#10;• Tipo de aeronave&#10;• Cualquier otra información relevante..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              numberOfLines={10}
            />
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#000',
              paddingVertical: 18,
              borderRadius: 12,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              Iniciar
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ResponsiveLayout>
  );
}
