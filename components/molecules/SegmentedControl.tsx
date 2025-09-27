import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { Spacer } from '../atoms/Spacer';
import { Typography } from '../atoms/Typography';

interface SegmentedControlProps {
  title: string;
  value: string;
  onValueChange: (value: any) => void; 
  options: Array<{ value: string; label: string; }>;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  title,
  value,
  onValueChange,
  options
}) => {
  return (
    <View style={segmentStyles.container}>
      <Typography variant="h3">{title}</Typography>
      <Spacer size={12} />
      <SegmentedButtons
        value={value}
        onValueChange={onValueChange}
        buttons={options.map(option => ({
          value: option.value,
          label: option.label,
          // Remove individual button styling to allow proper selection highlighting
        }))}
        style={segmentStyles.segmentedButtons}
        theme={{
          colors: {
            secondaryContainer: '#007AFF', // Selected background color
            onSecondaryContainer: '#FFFFFF', // Selected text color
            outline: '#E5E5EA', // Border color
            onSurface: '#1C1C1E', // Unselected text color
          }
        }}
      />
    </View>
  );
};

// Alternative approach with more control over styling
export const SegmentedControlCustom: React.FC<SegmentedControlProps> = ({
  title,
  value,
  onValueChange,
  options
}) => {
  return (
    <View style={segmentStyles.container}>
      <Typography variant="h3">{title}</Typography>
      <Spacer size={12} />
      <SegmentedButtons
        value={value}
        onValueChange={onValueChange}
        buttons={options.map(option => ({
          value: option.value,
          label: option.label,
          style: [
            segmentStyles.segmentButton,
            value === option.value && segmentStyles.segmentButtonSelected // Apply selected style conditionally
          ],
          labelStyle: [
            segmentStyles.segmentLabel,
            value === option.value && segmentStyles.segmentLabelSelected // Apply selected label style conditionally
          ],
        }))}
        style={segmentStyles.segmentedButtons}
      />
    </View>
  );
};

const segmentStyles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
  },
  // Base styles for unselected state
  segmentButton: {
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  // Selected state styles
  segmentButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  // Base label styles for unselected state
  segmentLabel: {
    color: '#1C1C1E',
    fontWeight: '500',
  },
  // Selected state label styles
  segmentLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});