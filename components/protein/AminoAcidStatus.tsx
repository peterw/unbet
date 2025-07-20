import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

interface AminoAcidStatusProps {
  isComplete?: boolean;
  recommendation?: string | null;
  missingAminoAcids?: string[];
}

export function AminoAcidStatus({
  isComplete,
  recommendation,
  missingAminoAcids
}: AminoAcidStatusProps) {
  if (isComplete === undefined) return null;

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Text style={styles.title}>Amino Acid Profile</Text>
        <View style={[
          styles.statusBadge,
          isComplete ? styles.completeBadge : styles.incompleteBadge
        ]}>
          <Text style={[
            styles.statusText,
            isComplete ? styles.completeText : styles.incompleteText
          ]}>
            {isComplete ? 'Complete' : 'Incomplete'}
          </Text>
        </View>
      </View>

      {!isComplete && (
        <>
          {missingAminoAcids && missingAminoAcids.length > 0 && (
            <View style={styles.missingContainer}>
              <Text style={styles.missingLabel}>Missing amino acids:</Text>
              <View style={styles.tagsContainer}>
                {missingAminoAcids.map((amino, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{amino}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {recommendation && (
            <View style={styles.recommendationBox}>
              <Ionicons name="bulb-outline" size={20} color="#FFA500" />
              <Text style={styles.recommendationText}>
                Add {recommendation.toLowerCase()} to complete your amino acid profile
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 16,
    paddingBottom: 6,
    marginTop: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completeBadge: {
    backgroundColor: '#E8F5E9',
  },
  incompleteBadge: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completeText: {
    color: '#4CAF50',
  },
  incompleteText: {
    color: '#FF3B30',
  },
  missingContainer: {
    marginVertical: 12,
  },
  missingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '500',
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFAF0',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
}); 