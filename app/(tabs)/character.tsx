import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  background: '#0F0F14',
  card: '#1A1A22',
  primary: '#7C5CFF',
  primaryLight: '#9D85FF',
  text: '#F2F2F7',
  textLight: '#8E8E9A',
  border: '#2A2A35',
  success: '#00D9A5',
  coin: '#FFB84D',
  coinBg: '#2A2418',
};

const MAX_LEVEL = 20;
const STREAK_ITEMS = [
  { id: 'hat', name: '帽子', emoji: '🎩', daysRequired: 3 },
  { id: 'bowtie', name: 'リボン', emoji: '🎀', daysRequired: 7 },
  { id: 'cape', name: 'マント', emoji: '🦸', daysRequired: 14 },
  { id: 'crown', name: '王冠', emoji: '👑', daysRequired: 21 },
  { id: 'medal', name: '金メダル', emoji: '🏅', daysRequired: 30 },
];
const EXP_PER_LEVEL = 100;

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

const RARITY_RATES = { common: 50, rare: 30, epic: 15, legendary: 5 };

const drawAnimal = (): Animal => {
  const rand = Math.random() * 100;
  let rarity: 'common' | 'rare' | 'epic' | 'legendary';
  if (rand < RARITY_RATES.legendary) rarity = 'legendary';
  else if (rand < RARITY_RATES.legendary + RARITY_RATES.epic) rarity = 'epic';
  else if (rand < RARITY_RATES.legendary + RARITY_RATES.epic + RARITY_RATES.rare) rarity = 'rare';
  else rarity = 'common';

  const candidates = ALL_ANIMALS.filter(a => a.rarity === rarity);
  return candidates[Math.floor(Math.random() * candidates.length)];
};

export default function CharacterScreen() {
  const [currentAnimalId, setCurrentAnimalId] = useState<string>('dog');
  const [unlockedAnimals, setUnlockedAnimals] = useState<string[]>(['dog']);
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [showMaxLevelModal, setShowMaxLevelModal] = useState(false);
  const [showGachaResult, setShowGachaResult] = useState<Animal | null>(null);
  const [unlockedStreakItems, setUnlockedStreakItems] = useState<string[]>([]);
　const [equippedItem, setEquippedItem] = useState<string | null>(null);
　const [showStreakUnlock, setShowStreakUnlock] = useState<{ emoji: string; name: string } | null>(null);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadData();
      startBounce();
    }, [])
  );

  const startBounce = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -10, duration: 600, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const loadData = async () => {
    const savedAnimalId = await AsyncStorage.getItem('currentAnimalId');
    const savedUnlocked = await AsyncStorage.getItem('unlockedAnimals');
    const savedLevel = await AsyncStorage.getItem('charLevel');
    const savedExp = await AsyncStorage.getItem('charExp');
    const savedCoins = await AsyncStorage.getItem('coins');
    const savedStreakItems = await AsyncStorage.getItem('unlockedStreakItems');
    const savedEquipped = await AsyncStorage.getItem('equippedItem');

    setCurrentAnimalId(savedAnimalId || 'dog');
    setUnlockedAnimals(savedUnlocked ? JSON.parse(savedUnlocked) : ['dog']);
    setLevel(savedLevel ? parseInt(savedLevel) : 1);
    setExp(savedExp ? parseInt(savedExp) : 0);
    setCoins(savedCoins ? parseInt(savedCoins) : 0);
    setUnlockedStreakItems(savedStreakItems ? JSON.parse(savedStreakItems) : []);
    setEquippedItem(savedEquipped || null);

    await checkStreakItems();
  };

  const checkStreakItems = async () => {
    const savedCompleted = await AsyncStorage.getItem('completedMap');
    const savedRoutines = await AsyncStorage.getItem('routines');
    const completedMap = savedCompleted ? JSON.parse(savedCompleted) : {};
    const routines = savedRoutines ? JSON.parse(savedRoutines) : [];

    if (routines.length === 0) return;

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const completed = completedMap[key] || [];
      if (completed.length > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    const savedStreakItems = await AsyncStorage.getItem('unlockedStreakItems');
    const unlocked = savedStreakItems ? JSON.parse(savedStreakItems) : [];

    for (const item of STREAK_ITEMS) {
      if (streak >= item.daysRequired && !unlocked.includes(item.id)) {
        const newUnlocked = [...unlocked, item.id];
        await AsyncStorage.setItem('unlockedStreakItems', JSON.stringify(newUnlocked));
        setUnlockedStreakItems(newUnlocked);
        setShowStreakUnlock({ emoji: item.emoji, name: item.name });
        break;
      }
    }
  };

  const currentAnimal = ALL_ANIMALS.find(a => a.id === currentAnimalId) || ALL_ANIMALS[0];
  const expProgress = exp / EXP_PER_LEVEL;
  const isMaxLevel = level >= MAX_LEVEL;

  const handleMaxLevelChoice = async (choice: 'gacha' | 'select') => {
    setShowMaxLevelModal(false);
    if (choice === 'gacha') {
      const newAnimal = drawAnimal();
      const newUnlocked = unlockedAnimals.includes(newAnimal.id)
        ? unlockedAnimals
        : [...unlockedAnimals, newAnimal.id];

      await AsyncStorage.setItem('unlockedAnimals', JSON.stringify(newUnlocked));
      setUnlockedAnimals(newUnlocked);
      setShowGachaResult(newAnimal);

      // レベルとexpをリセット
      await AsyncStorage.setItem('charLevel', '1');
      await AsyncStorage.setItem('charExp', '0');
      setLevel(1);
      setExp(0);
    } else {
      // レベルだけリセットして同じキャラ継続
      await AsyncStorage.setItem('charLevel', '1');
      await AsyncStorage.setItem('charExp', '0');
      setLevel(1);
      setExp(0);
      Alert.alert('レベルリセット', 'もう一度レベル1から育てよう！');
    }
  };

  const selectAnimal = async (animalId: string) => {
    await AsyncStorage.setItem('currentAnimalId', animalId);
    setCurrentAnimalId(animalId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>🐾 My Character</Text>
        <Text style={styles.title}>キャラクター</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinText}>🪙 {coins}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* キャラクター表示 */}
        <View style={styles.characterCard}>
          <View style={[styles.rarityTag, { backgroundColor: RARITY_COLORS[currentAnimal.rarity] }]}>
            <Text style={styles.rarityTagText}>{currentAnimal.rarity.toUpperCase()}</Text>
          </View>
          <View style={styles.characterWithItem}>
  <Animated.Text style={[styles.characterEmoji, { transform: [{ translateY: bounceAnim }] }]}>
    {currentAnimal.emoji}
  </Animated.Text>
  {equippedItem && (
    <Text style={styles.equippedItemEmoji}>
      {STREAK_ITEMS.find(i => i.id === equippedItem)?.emoji}
    </Text>
  )}
</View>
          <Text style={styles.characterName}>{currentAnimal.name}</Text>

          {isMaxLevel ? (
            <TouchableOpacity style={styles.maxLevelButton} onPress={() => setShowMaxLevelModal(true)}>
              <Text style={styles.maxLevelButtonText}>🎉 MAXレベル達成！タップして次へ</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.levelText}>Lv. {level}</Text>
              <View style={styles.expBarBg}>
                <View style={[styles.expBarFill, { width: `${expProgress * 100}%` }]} />
              </View>
              <Text style={styles.expText}>{exp} / {EXP_PER_LEVEL} EXP</Text>
            </>
          )}
        </View>

        {/* 解放済みキャラクター選択 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎴 解放済みキャラクター（{unlockedAnimals.length}/{ALL_ANIMALS.length}）</Text>
          <View style={styles.animalGrid}>
            {unlockedAnimals.map(id => {
              const animal = ALL_ANIMALS.find(a => a.id === id);
              if (!animal) return null;
              const isSelected = id === currentAnimalId;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.animalOption, isSelected && styles.animalOptionSelected, { borderColor: RARITY_COLORS[animal.rarity] }]}
                  onPress={() => selectAnimal(id)}
                >
                  <Text style={styles.animalOptionEmoji}>{animal.emoji}</Text>
                  {isSelected && <Text style={styles.selectedLabel}>使用中</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ストリークアイテム */}
<View style={[styles.card, { marginTop: 16 }]}>
  <Text style={styles.cardTitle}>🎁 ストリークアイテム（{unlockedStreakItems.length}/{STREAK_ITEMS.length}）</Text>
  <View style={styles.animalGrid}>
    {STREAK_ITEMS.map(item => {
      const isUnlocked = unlockedStreakItems.includes(item.id);
      const isEquipped = equippedItem === item.id;
      return (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.animalOption,
            isEquipped && styles.animalOptionSelected,
            { borderColor: isUnlocked ? COLORS.primary : COLORS.border, opacity: isUnlocked ? 1 : 0.4 }
          ]}
          disabled={!isUnlocked}
          onPress={async () => {
            const newEquipped = isEquipped ? null : item.id;
            await AsyncStorage.setItem('equippedItem', newEquipped || '');
            setEquippedItem(newEquipped);
          }}
        >
          <Text style={styles.animalOptionEmoji}>{isUnlocked ? item.emoji : '🔒'}</Text>
          {isEquipped && <Text style={styles.selectedLabel}>装着中</Text>}
        </TouchableOpacity>
      );
    })}
  </View>
  <Text style={styles.streakHint}>ストリークを継続してアイテムをアンロックしよう！</Text>
</View>

      {/* MAXレベル選択モーダル */}
      <Modal visible={showMaxLevelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>🎊</Text>
            <Text style={styles.modalTitle}>レベルMAX達成！</Text>
            <Text style={styles.modalSubtitle}>{currentAnimal.name}が立派に育ちました！</Text>
            <Text style={styles.modalQuestion}>次はどうする？</Text>

            <TouchableOpacity style={styles.modalGachaButton} onPress={() => handleMaxLevelChoice('gacha')}>
              <Text style={styles.modalGachaButtonText}>🎲 新しいキャラを解放する</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSelectButton} onPress={() => handleMaxLevelChoice('select')}>
              <Text style={styles.modalSelectButtonText}>🔄 このキャラで続ける</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ガチャ結果モーダル */}
      <Modal visible={!!showGachaResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {showGachaResult && (
              <>
                <View style={[styles.rarityTag, { backgroundColor: RARITY_COLORS[showGachaResult.rarity], alignSelf: 'center', marginBottom: 12 }]}>
                  <Text style={styles.rarityTagText}>{showGachaResult.rarity.toUpperCase()}</Text>
                </View>
                <Text style={styles.gachaResultEmoji}>{showGachaResult.emoji}</Text>
                <Text style={styles.modalTitle}>{showGachaResult.name}を解放！</Text>
                <TouchableOpacity
                  style={styles.modalGachaButton}
                  onPress={() => { setShowGachaResult(null); selectAnimal(showGachaResult.id); }}
                >
                  <Text style={styles.modalGachaButtonText}>やったー！</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ストリークアイテム解放モーダル */}
<Modal visible={!!showStreakUnlock} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      {showStreakUnlock && (
        <>
          <Text style={styles.gachaResultEmoji}>{showStreakUnlock.emoji}</Text>
          <Text style={styles.modalTitle}>{showStreakUnlock.name}をアンロック！</Text>
          <Text style={styles.modalSubtitle}>ストリーク継続のごほうび🎉</Text>
          <TouchableOpacity style={styles.modalGachaButton} onPress={() => setShowStreakUnlock(null)}>
            <Text style={styles.modalGachaButtonText}>やったー！</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  </View>
</Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: { marginTop: 50, marginBottom: 20 },
  subtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 2 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  coinBadge: { backgroundColor: COLORS.coinBg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.coin },
  coinText: { fontSize: 14, fontWeight: 'bold', color: COLORS.coin },
  characterCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  rarityTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginBottom: 12 },
  rarityTagText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  characterEmoji: { fontSize: 90, marginBottom: 8 },
  characterName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  levelText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 },
  expBarBg: { width: '100%', height: 12, backgroundColor: COLORS.border, borderRadius: 6, marginBottom: 6 },
  expBarFill: { height: 12, backgroundColor: COLORS.primary, borderRadius: 6 },
  expText: { fontSize: 12, color: COLORS.textLight },
  maxLevelButton: { backgroundColor: COLORS.coin, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, marginTop: 8 },
  maxLevelButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 14 },
  animalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  animalOption: { width: 64, height: 64, borderRadius: 14, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  animalOptionSelected: { backgroundColor: '#F0EEFF' },
  animalOptionEmoji: { fontSize: 30 },
  selectedLabel: { fontSize: 8, color: COLORS.primary, fontWeight: 'bold', position: 'absolute', bottom: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 28, width: '85%', alignItems: 'center' },
  modalEmoji: { fontSize: 50, marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 6, textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 16, textAlign: 'center' },
  modalQuestion: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 16 },
  modalGachaButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, width: '100%', alignItems: 'center', marginBottom: 10 },
  modalGachaButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalSelectButton: { borderRadius: 14, padding: 16, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  modalSelectButtonText: { color: COLORS.textLight, fontWeight: '600', fontSize: 15 },
  gachaResultEmoji: { fontSize: 80, marginBottom: 12 },
  characterWithItem: { position: 'relative', alignItems: 'center' },
equippedItemEmoji: { fontSize: 36, position: 'absolute', top: -20 },
streakHint: { fontSize: 11, color: COLORS.textLight, marginTop: 10, textAlign: 'center' },
});