import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EditableField } from './EditableField';
import { Colors } from '@/constants/Colors';
import { Ingredient } from '@/types/protein';

interface EditableIngredientProps {
  ingredient: Ingredient;
  index: number;
  isEditing: boolean;
  onUpdate: (index: number, field: string, value: string) => void;
  onDelete: (index: number) => void;
}

export function EditableIngredient({
  ingredient,
  index,
  isEditing,
  onUpdate,
  onDelete,
}: EditableIngredientProps) {
  const proteinGrams = ((ingredient.weight * ingredient.proteinPercentage) / 100).toFixed(1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <EditableField
          value={ingredient.name}
          onChangeText={(text) => onUpdate(index, 'name', text)}
          isEditing={isEditing}
          style={styles.nameText}
        />
        {isEditing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(index)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Weight</Text>
          <EditableField
            value={ingredient.weight.toString()}
            onChangeText={(text) => onUpdate(index, 'weight', text)}
            isEditing={isEditing}
            keyboardType="numeric"
            isNumeric={true}
            style={styles.value}
          />
          <Text style={styles.unit}>g</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.label}>Protein</Text>
          <EditableField
            value={ingredient.proteinPercentage.toString()}
            onChangeText={(text) => onUpdate(index, 'proteinPercentage', text)}
            isEditing={isEditing}
            keyboardType="numeric"
            isNumeric={true}
            style={styles.value}
          />
          <Text style={styles.unit}>%</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.value}>{proteinGrams}</Text>
          <Text style={styles.unit}>g</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  unit: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
}); 