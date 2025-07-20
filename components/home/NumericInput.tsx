import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type NumericInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

export const NumericInput = ({
  value,
  onChangeText,
  onIncrement,
  onDecrement
}: NumericInputProps) => (
  <View style={styles.container}>
    <TouchableOpacity
      style={styles.button}
      onPress={onDecrement}
    >
      <Ionicons name="remove-outline" size={24} color="#666" />
    </TouchableOpacity>

    <TextInput
      value={value}
      onChangeText={onChangeText}
      style={styles.input}
      keyboardType="numeric"
      textAlign="center"
    />

    <TouchableOpacity
      style={styles.button}
      onPress={onIncrement}
    >
      <Ionicons name="add-outline" size={24} color="#666" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 280,
    height: 56,
  },
  button: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 24,
    fontWeight: '600',
    backgroundColor: 'white',
    textAlign: 'center',
    padding: 0,
  },
}); 