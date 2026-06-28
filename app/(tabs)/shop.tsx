import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

type ShopItem = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  category: 'hat' | 'face' | 'accessory';
};

const SHOP_ITEMS: ShopItem[] = [
  { id: 'glasses', name: 'メガネ', emoji: '👓', price: 50, category: 'face' },
  { id: 'sunglasses', name: 'サングラス', emoji: '🕶', price: 80, category: 'face' },
  { id: 'top_hat', name: 'シルクハット', emoji: '🎩', price: 100, category: 'hat' },
  { id: 'cap', name: 'キャップ', emoji: '🧢', price: 60, category: 'hat' },
  { id: 'crown_shop', name: '王冠（購入版）', emoji: '👑', price: 200, category: 'hat' },
  { id: 'bowtie_shop', name: '蝶ネクタイ', emoji: '🎀', price: 70, category: 'accessory' },
  { id: 'scarf', name: 'マフラー', emoji: '🧣', price: 90, category: 'accessory' },
  { id: 'flower', name: 'お花', emoji: '🌸', price: 40, category: 'accessory' },
  { id: 'star', name: 'スター', emoji: '⭐', price: 150, category: 'accessory' },
  { id: 'diamond', name: 'ダイヤ', emoji: '💎', price: 300, category: 'accessory' },
];

const CATEGORY_LABELS = {
  hat: '🎩 帽子',
  face: '👓 メガネ系',
  accessory: '✨ アクセサリー',
};

export default function ShopScreen() {
    const { theme: COLORS } = useTheme();
  const [coins, setCoins] = useState(0);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [equippedShopItem, setEquippedShopItem] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const savedCoins = await AsyncStorage.getItem('coins');
    const savedOwned = await AsyncStorage.getItem('ownedShopItems');
    const savedEquipped = await AsyncStorage.getItem('equippedShopItem');
    setCoins(savedCoins ? parseInt(savedCoins) : 0);
    setOwnedItems(savedOwned ? JSON.parse(savedOwned) : []);
    setEquippedShopItem(savedEquipped || null);
  };

  const buyItem = (item: ShopItem) => {
    if (ownedItems.includes(item.id)) return;
    if (coins < item.price) {
      Alert.alert('コインが足りない', `あと${item.price - coins}🪙必要です。\nルーティンを完了してコインを集めよう！`);
      return;
    }

    Alert.alert(
      `${item.emoji} ${item.name}を購入`,
      `${item.price}🪙 消費します。よろしいですか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '購入する', onPress: async () => {
            const newCoins = coins - item.price;
            const newOwned = [...ownedItems, item.id];
            await AsyncStorage.setItem('coins', newCoins.toString());
            await AsyncStorage.setItem('ownedShopItems', JSON.stringify(newOwned));
            setCoins(newCoins);
            setOwnedItems(newOwned);
            Alert.alert('購入完了！', `${item.emoji} ${item.name}をゲット！`);
          }
        },
      ]
    );
  };

  const toggleEquip = async (itemId: string) => {
    const newEquipped = equippedShopItem === itemId ? null : itemId;
    await AsyncStorage.setItem('equippedShopItem', newEquipped || '');
    setEquippedShopItem(newEquipped);
  };

  const groupedItems = (['hat', 'face', 'accessory'] as const).map(category => ({
    category,
    items: SHOP_ITEMS.filter(i => i.category === category),
  }));
const styles = getStyles(COLORS);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>🛍 Item Shop</Text>
          <Text style={styles.title}>ショップ</Text>
        </View>
        <View style={styles.coinBadge}>
          <Text style={styles.coinText}>🪙 {coins}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {groupedItems.map(group => (
          <View key={group.category} style={styles.group}>
            <Text style={styles.groupTitle}>{CATEGORY_LABELS[group.category]}</Text>
            <View style={styles.itemGrid}>
              {group.items.map(item => {
                const owned = ownedItems.includes(item.id);
                const equipped = equippedShopItem === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemCard, equipped && styles.itemCardEquipped]}
                    onPress={() => owned ? toggleEquip(item.id) : buyItem(item)}
                  >
                    <Text style={styles.itemEmoji}>{item.emoji}</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {owned ? (
                      <View style={[styles.statusBadge, equipped && styles.statusBadgeEquipped]}>
                        <Text style={[styles.statusText, equipped && styles.statusTextEquipped]}>
                          {equipped ? '装着中' : '所持済み'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.priceBadge}>
                        <Text style={styles.priceText}>🪙 {item.price}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 50, marginBottom: 20 },
  subtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 2 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  coinBadge: { backgroundColor: COLORS.coinBg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.coin },
  coinText: { fontSize: 14, fontWeight: 'bold', color: COLORS.coin },
  group: { marginBottom: 20 },
  groupTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  itemCard: { width: 100, backgroundColor: COLORS.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  itemCardEquipped: { borderColor: COLORS.primary, borderWidth: 2, backgroundColor: '#F0EEFF' },
  itemEmoji: { fontSize: 32, marginBottom: 6 },
  itemName: { fontSize: 11, fontWeight: '600', color: COLORS.text, marginBottom: 8, textAlign: 'center' },
  priceBadge: { backgroundColor: COLORS.coinBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  priceText: { fontSize: 11, fontWeight: 'bold', color: COLORS.coin },
  statusBadge: { backgroundColor: COLORS.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeEquipped: { backgroundColor: COLORS.primary },
  statusText: { fontSize: 10, fontWeight: 'bold', color: COLORS.textLight },
  statusTextEquipped: { color: '#fff' },
});