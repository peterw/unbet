import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EditableFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  isEditing: boolean;
  style?: any;
  keyboardType?: 'default' | 'numeric';
  isNumeric?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export function EditableField({
  value,
  onChangeText,
  isEditing,
  style,
  keyboardType = 'default',
  isNumeric = false,
}: EditableFieldProps) {
  const handleIncrement = () => {
    if (keyboardType === 'numeric') {
      const newValue = (parseFloat(value) || 0) + 1;
      onChangeText(newValue.toString());
    }
  };

  const handleDecrement = () => {
    if (keyboardType === 'numeric') {
      const newValue = Math.max(0, (parseFloat(value) || 0) - 1);
      onChangeText(newValue.toString());
    }
  };

  if (isEditing) {
    return (
      <View style={styles.editableFieldContainer}>
        {isNumeric ? (
          <View style={styles.numericInputContainer}>
            <TouchableOpacity
              style={[styles.numericButton, styles.numericButtonLeft]}
              onPress={handleDecrement}
            >
              <Ionicons name="remove-outline" size={18} color="#666" />
            </TouchableOpacity>

            <TextInput
              value={value}
              onChangeText={onChangeText}
              style={[styles.editableInput, style]}
              keyboardType={keyboardType}
              textAlign="center"
            />

            <TouchableOpacity
              style={[styles.numericButton, styles.numericButtonRight]}
              onPress={handleIncrement}
            >
              <Ionicons name="add-outline" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        ) : (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            style={[styles.editableInput, styles.roundedInput, style]}
            keyboardType={keyboardType}
          />
        )}
      </View>
    );
  }
  return <Text style={style}>{value}</Text>;
}

const styles = StyleSheet.create({
  editableFieldContainer: {
    flex: 1,
  },
  numericInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 90,
  },
  editableInput: {
    minWidth: 32,
    height: 28,
    paddingHorizontal: 4,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  numericButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  numericButtonLeft: {
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderRightWidth: 0,
  },
  numericButtonRight: {
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderLeftWidth: 0,
  },
  roundedInput: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
}); 