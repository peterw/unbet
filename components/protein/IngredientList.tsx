import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EditableIngredient } from './EditableIngredient';
import { Colors } from '@/constants/Colors';
import { Ingredient } from '@/types/protein';
export function IngredientList({
  ingredients,
  isEditing,
  onUpdateIngredient,
  onDeleteIngredient,
  onAddIngredient,
}: {
  ingredients: Ingredient[];
  isEditing: boolean;
  onUpdateIngredient: (index: number, field: string, value: string) => void;
  onDeleteIngredient: (index: number) => void;
  onAddIngredient: () => void;
}) {
  return (
    <View style={styles.container}>
      {ingredients.map((ingredient, index) => (
        <EditableIngredient
          key={index}
          ingredient={ingredient}
          index={index}
          isEditing={isEditing}
          onUpdate={onUpdateIngredient}
          onDelete={onDeleteIngredient}
        />
      ))}

      {isEditing && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddIngredient}
        >
          <View style={styles.addButtonContent}>
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Ingredient</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginVertical: 16,
  },
  addButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: Colors.light.secondaryButtonBackground,
    overflow: 'hidden',
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  addButtonText: {
    color: Colors.light.secondaryButtonBackground,
    fontSize: 15,
    fontWeight: '600',
  },
}); 