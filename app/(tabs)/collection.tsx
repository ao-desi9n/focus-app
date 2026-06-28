import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

type Animal = {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

const ALL_ANIMALS: Animal[] = [
  { id: 'dog', name: 'いぬ', emoji: '🐶', rarity: 'common' },
  { id: 'cat', name: 'ねこ', emoji: '🐱', rarity: 'common' },
  { id: 'rabbit', name: 'うさぎ', emoji: '🐰', rarity: 'common' },
  { id: 'bear', name: 'くま', emoji: '🐻', rarity: 'common' },
  { id: 'panda', name: 'パンダ', emoji: '🐼', rarity: 'rare' },
  { id: 'koala', name: 'コアラ', emoji: '🐨', rarity: 'rare' },
  { id: 'fox', name: 'きつね', emoji: '🦊', rarity: 'rare' },
  { id: 'lion', name: 'ライオン', emoji: '🦁', rarity: 'rare' },
  { id: 'tiger', name: 'とら', emoji: '🐯', rarity: 'epic' },
  { id: 'penguin', name: 'ペンギン', emoji: '🐧', rarity: 'epic' },
  { id: 'owl', name: 'ふくろう', emoji: '🦉', rarity: 'epic' },
  { id: 'unicorn', name: 'ユニコーン', emoji: '🦄', rarity: 'legendary' },
  { id: 'dragon', name: 'ドラゴン', emoji: '🐉', rarity: 'legendary' },
  { id: 'phoenix', name: 'フェニックス', emoji: '🔥', rarity: 'legendary' },
];

const RARITY_COLORS = {
  common: '#9E9E9E',
  rare: '#4A90E2',
  epic: '#A78BFA',
  legendary: '#F5A623',
};

const RARITY_LABELS = {
  common: 'コモン',
  rare: 'レア',
  epic: 'エピック',
  legendary: 'レジェンダリー',
};

export default function CollectionScreen() {
    const { theme: COLORS } = useTheme();
  const [unlockedAnimals, setUnlockedAnimals] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const saved = await AsyncStorage.getItem('unlockedAnimals');
    setUnlockedAnimals(saved ? JSON.parse(saved) : ['dog']);
  };

  const groupedByRarity = (['common', 'rare', 'epic', 'legendary'] as const).map(rarity => ({
    rarity,
    animals: ALL_ANIMALS.filter(a => a.rarity === rarity),
  }));
const styles = getStyles(COLORS);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>📖 Collection</Text>
        <Text style={styles.title}>図鑑</Text>
        <Text style={styles.progress}>{unlockedAnimals.length} / {ALL_ANIMALS.length} 解放済み</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {groupedByRarity.map(group => (
          <View key={group.rarity} style={styles.group}>
            <View style={styles.groupHeader}>
              <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[group.rarity] }]} />
              <Text style={styles.groupTitle}>{RARITY_LABELS[group.rarity]}</Text>
            </View>
            <View style={styles.animalGrid}>
              {group.animals.map(animal => {
                const isUnlocked = unlockedAnimals.includes(animal.id);
                return (
                  <View key={animal.id} style={[styles.animalCard, { borderColor: isUnlocked ? RARITY_COLORS[group.rarity] : COLORS.border }]}>
                    <Text style={styles.animalEmoji}>
                      {isUnlocked ? animal.emoji : '❓'}
                    </Text>
                    <Text style={[styles.animalName, !isUnlocked && styles.animalNameLocked]}>
                      {isUnlocked ? animal.name : '？？？'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: { marginTop: 50, marginBottom: 20 },
  subtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 2 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
  progress: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  group: { marginBottom: 20 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  rarityDot: { width: 10, height: 10, borderRadius: 5 },
  groupTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  animalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  animalCard: { width: 90, backgroundColor: COLORS.card, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 2 },
  animalEmoji: { fontSize: 36, marginBottom: 6 },
  animalName: { fontSize: 11, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  animalNameLocked: { color: COLORS.textLight },
});