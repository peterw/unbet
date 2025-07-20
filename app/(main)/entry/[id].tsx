import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { LinearGradient } from 'expo-linear-gradient';
import { LayoutAnimation } from 'react-native';
import { IngredientList } from '@/components/protein/IngredientList';
import { AminoAcidStatus } from '@/components/protein/AminoAcidStatus';
import { ProteinEntry, Ingredient } from '@/types/protein';
import * as Haptics from 'expo-haptics';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { FixWithAIModal } from '@/components/protein/FixWithAIModal';

export default function AnalysisDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const proteinEntry = useQuery(api.protein.getProteinEntry, { entryId: id as Id<"proteinEntries"> });
  const updateEntry = useMutation(api.protein.updateProteinEntry);
  const saveFood = useMutation(api.protein.saveFood);
  const checkSaved = useQuery(api.protein.checkSavedStatus, { entryId: id as Id<"proteinEntries"> });
  const createFixJob = useMutation(api.analyse.createFixJob);

  // Analytics
  const analytics = useAnalytics();

  useEffect(() => {
    if (id) {
      analytics.track({ name: 'Entry Viewed', properties: { entryId: id as string } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState<ProteinEntry | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showFixAIModal, setShowFixAIModal] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const handleUpdateIngredient = (index: number, field: string, value: string) => {
    if (!editedEntry) return;

    const newIngredients = [...editedEntry.ingredients];
    const ingredient = { ...newIngredients[index] };

    switch (field) {
      case 'name':
        ingredient.name = value;
        break;
      case 'weight':
        ingredient.weight = parseFloat(value) || 0;
        break;
      case 'proteinPercentage':
        ingredient.proteinPercentage = Math.min(100, parseFloat(value) || 0);
        break;
    }

    newIngredients[index] = ingredient;
    const totalProtein = newIngredients.reduce((sum, ing) =>
      sum + ((ing.weight * ing.proteinPercentage) / 100), 0);

    setEditedEntry({
      ...editedEntry,
      ingredients: newIngredients,
      totalProteinEstimate: totalProtein,
    });
  };

  const handleDeleteIngredient = (index: number) => {
    if (!editedEntry) return;

    const newIngredients = editedEntry.ingredients.filter((_, i) => i !== index);
    const totalProtein = newIngredients.reduce((sum, ing) => sum + ((ing.weight * ing.proteinPercentage) / 100), 0);

    setEditedEntry({
      ...editedEntry,
      ingredients: newIngredients,
      totalProteinEstimate: totalProtein,
    });
  };

  const handleAddIngredient = () => {
    if (!editedEntry) return;

    const newIngredient: Ingredient = {
      name: 'New Ingredient',
      weight: 0,
      proteinPercentage: 0,
      calories: 0,
      aminoAcidMissing: [],
    };

    const newIngredients = [...editedEntry.ingredients, newIngredient];
    const totalProtein = newIngredients.reduce((sum, ing) => sum + ((ing.weight * ing.proteinPercentage) / 100), 0);

    setEditedEntry({
      ...editedEntry,
      ingredients: newIngredients,
      totalProteinEstimate: totalProtein,
    });
  };

  const handleSave = async () => {
    if (!editedEntry) return;

    await updateEntry({
      entryId: id as Id<"proteinEntries">,
      ingredients: editedEntry.ingredients as Ingredient[],
      totalProteinEstimate: editedEntry.totalProteinEstimate,
      name: editedEntry.name,
      aminoRecommendation: editedEntry.aminoRecommendation,
    });

    setIsEditing(false);

    analytics.track({ name: 'Entry Edits Saved', properties: { entryId: id as string } });
  };

  useEffect(() => {
    if (proteinEntry) {
      const { name, ingredients, totalProteinEstimate, aminoRecommendation } = proteinEntry;
      setEditedEntry({
        name: name || '',
        ingredients: ingredients,
        totalProteinEstimate: totalProteinEstimate,
        aminoRecommendation: aminoRecommendation || ''
      });
      setIsSaved(checkSaved || false);
    }
  }, [proteinEntry, checkSaved]);

  if (!proteinEntry) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <TouchableOpacity
                style={[styles.backButton, styles.backButtonNoImage]}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <View style={styles.loadingTitlePlaceholder} />
            </View>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <LinearGradient
              colors={['#F0F0F0', '#FFFFFF', '#F0F0F0']}
              style={[styles.card, styles.cardNoImage]}
            >
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#333" />
                <Text style={styles.loadingText}>Loading entry details...</Text>
              </View>

              <View style={styles.skeletonCard}>
                <View style={styles.skeletonNutrition} />
                <View style={styles.skeletonIngredient} />
                <View style={styles.skeletonIngredient} />
                <View style={styles.skeletonIngredient} />
              </View>
            </LinearGradient>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  const toggleEditMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }

    analytics.track({ name: 'Entry Edit Toggled', properties: { entryId: id as string, enabled: !isEditing } });
  };

  return (
    <View style={styles.container}>
      {proteinEntry.imageUrl ? (
        <Image
          source={{ uri: proteinEntry.imageUrl }}
          style={styles.backgroundImage}
        />
      ) : null}
      <SafeAreaView style={styles.contentContainer}>
        <View style={styles.header}>
          <View style={[
            styles.headerTitleRow,
            proteinEntry.imageUrl ? styles.headerTitleRowWithImage : null
          ]}>
            <TouchableOpacity
              style={[
                styles.backButton,
                proteinEntry.imageUrl ? styles.backButtonWithImage : styles.backButtonNoImage
              ]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            {!proteinEntry.imageUrl && (
              <Text style={styles.headerTitle}>{editedEntry?.name || 'Item'}</Text>
            )}

            <TouchableOpacity
              style={[styles.saveButton, proteinEntry.imageUrl ? styles.saveButtonWithImage : null]}
              onPress={async () => {
                if (!editedEntry) return;

                try {
                  await saveFood({
                    originalEntryId: id as Id<"proteinEntries">,
                    name: editedEntry.name,
                    ingredients: editedEntry.ingredients,
                    totalProteinEstimate: editedEntry.totalProteinEstimate,
                    aminoRecommendation: editedEntry.aminoRecommendation,
                    imageUrl: proteinEntry.imageUrl,
                  });
                  setIsSaved(true);
                  Alert.alert('Success', 'Food saved successfully!');

                  analytics.track({ name: 'Entry Food Saved', properties: { entryId: id as string } });
                } catch (error) {
                  Alert.alert('Error', 'Failed to save food');
                }
              }}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={24}
                color="#333"
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <LinearGradient
            colors={['#F0F0F0', '#FFFFFF', '#F0F0F0']}
            style={[styles.card, !proteinEntry.imageUrl && styles.cardNoImage]}
          >

            {proteinEntry.imageUrl && (
              <View style={styles.headerRow}>
                <Text style={styles.itemName}>{editedEntry?.name || 'Item'}</Text>
              </View>
            )}

            <View style={styles.nutritionInfo}>
              <View style={styles.nutritionItem}>
                <Ionicons name="barbell-outline" size={20} color="#FF3B30" />
                <Text style={styles.nutritionValue}>
                  {editedEntry?.totalProteinEstimate.toFixed(0)}g
                </Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
            </View>

            <IngredientList
              ingredients={editedEntry?.ingredients || []}
              isEditing={isEditing}
              onUpdateIngredient={handleUpdateIngredient}
              onDeleteIngredient={handleDeleteIngredient}
              onAddIngredient={handleAddIngredient}
            />

            {(proteinEntry.aminoRecommendation || proteinEntry.ingredients.some(ing => ing.aminoAcidMissing && ing.aminoAcidMissing.length > 0)) && (
              <AminoAcidStatus
                isComplete={proteinEntry.ingredients.some(ing => {
                  const totalMass = proteinEntry.ingredients.reduce((sum, i) => sum + i.weight, 0);
                  const ingredientPercentage = (ing.weight / totalMass) * 100;
                  return ing.aminoAcidMissing && ing.aminoAcidMissing.length === 0 && ingredientPercentage >= 25;
                })}
                recommendation={proteinEntry.aminoRecommendation}
                missingAminoAcids={
                  proteinEntry.ingredients.length > 0
                    ? proteinEntry.ingredients.reduce((commonMissing, ing, index) => {
                      const missing = ing.aminoAcidMissing || [];
                      return index === 0
                        ? missing
                        : commonMissing.filter(acid => missing.includes(acid));
                    }, [] as string[])
                    : []
                }
              />
            )}
          </LinearGradient>
        </ScrollView>

        <View style={styles.footer}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setEditedEntry({
                    name: proteinEntry.name || '',
                    ingredients: proteinEntry.ingredients,
                    totalProteinEstimate: proteinEntry.totalProteinEstimate,
                  });
                  setIsEditing(false);
                }}
              >
                <Ionicons name="close" size={20} color="#FF3B30" />
                <Text style={styles.footerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={toggleEditMode}
              >
                <Ionicons name="checkmark" size={20} color="#4CAF50" />
                <Text style={styles.footerButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowFixAIModal(true);
                }}
              >
                <Ionicons name="flash-outline" size={20} color="#007AFF" />
                <Text style={styles.footerButtonText}>Fix with AI</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={toggleEditMode}
              >
                <Ionicons name="pencil-outline" size={20} color="#666" />
                <Text style={styles.footerButtonText}>Edit Entry</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
      {showFixAIModal && (
        <FixWithAIModal
          entryId={id as Id<"proteinEntries">}
          onClose={() => setShowFixAIModal(false)}
          onSuccess={async () => {
            setIsFixing(true);
            setShowFixAIModal(false);
            router.back();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '50%',
    resizeMode: 'cover',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginTop: 150,
    padding: 16,
    minHeight: 500,
  },
  cardNoImage: {
    marginTop: 0,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  nutritionValue: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    backgroundColor: 'white',
  },
  footerButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  backButtonWithImage: {
    backgroundColor: 'white',
  },
  backButtonNoImage: {
    backgroundColor: 'white',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleRowWithImage: {
    width: '100%',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    maxWidth: '80%',
  },
  saveButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginLeft: 'auto',
  },
  saveButtonWithImage: {
    backgroundColor: 'white',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  loadingTitlePlaceholder: {
    height: 20,
    width: 150,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonCard: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  skeletonNutrition: {
    height: 70,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 24,
  },
  skeletonIngredient: {
    height: 60,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
  },
});
