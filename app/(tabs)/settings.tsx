import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const COLORS = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#6C63FF',
  primaryLight: '#A89CFF',
  text: '#2D3436',
  textLight: '#B2BEC3',
  border: '#DFE6E9',
  success: '#00B894',
  warning: '#FDCB6E',
  danger: '#FF7675',
  morning: '#FFD93D',
  afternoon: '#6BCB77',
  evening: '#4D96FF',
};

type Routine = {
  id: string;
  title: string;
  duration: number;
  unit: 'minutes' | 'count';
  location: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'reward';
  isReward: boolean;
};

const TIME_OF_DAY = [
  { key: 'morning', label: '☀️ 朝', color: COLORS.morning },
  { key: 'afternoon', label: '🌤 昼', color: COLORS.afternoon },
  { key: 'evening', label: '🌙 夜', color: COLORS.evening },
  { key: 'reward', label: '🎁 ご褒美', color: COLORS.danger },
];

const UNIT_OPTIONS = [
  { key: 'minutes', label: '分' },
  { key: 'count', label: '回' },
];

export default function SettingsScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [unit, setUnit] = useState<'minutes' | 'count'>('minutes');
  const [location, setLocation] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'reward'>('morning');

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [])
  );

  const loadRoutines = async () => {
    const saved = await AsyncStorage.getItem('routines');
    setRoutines(saved ? JSON.parse(saved) : []);
  };

  const saveRoutines = async (newRoutines: Routine[]) => {
    await AsyncStorage.setItem('routines', JSON.stringify(newRoutines));
    setRoutines(newRoutines);
  };

  const openAddModal = () => {
    setEditingRoutine(null);
    setTitle('');
    setDuration('');
    setUnit('minutes');
    setLocation('');
    setTimeOfDay('morning');
    setModalVisible(true);
  };

  const openEditModal = (routine: Routine) => {
    setEditingRoutine(routine);
    setTitle(routine.title);
    setDuration(routine.duration.toString());
    setUnit(routine.unit);
    setLocation(routine.location);
    setTimeOfDay(routine.timeOfDay);
    setModalVisible(true);
  };

  const saveRoutine = async () => {
    if (title.trim() === '' || duration.trim() === '') {
      Alert.alert('入力エラー', 'タイトルと時間/回数を入力してください。');
      return;
    }

    const newRoutine: Routine = {
      id: editingRoutine ? editingRoutine.id : Date.now().toString(),
      title: title.trim(),
      duration: parseInt(duration),
      unit,
      location: location.trim(),
      timeOfDay,
      isReward: timeOfDay === 'reward',
    };

    let newRoutines;
    if (editingRoutine) {
      newRoutines = routines.map(r => r.id === editingRoutine.id ? newRoutine : r);
    } else {
      newRoutines = [...routines, newRoutine];
    }

    await saveRoutines(newRoutines);
    setModalVisible(false);
    Keyboard.dismiss();
  };

  const deleteRoutine = (id: string) => {
    Alert.alert('削除確認', 'このルーティンを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive', onPress: async () => {
          const newRoutines = routines.filter(r => r.id !== id);
          await saveRoutines(newRoutines);
        }
      }
    ]);
  };

  const getTimeOfDayStyle = (tod: string) => {
    return TIME_OF_DAY.find(t => t.key === tod) || TIME_OF_DAY[0];
  };

  const groupedRoutines = TIME_OF_DAY.map(tod => ({
    ...tod,
    routines: routines.filter(r => r.timeOfDay === tod.key),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>⚙️ Settings</Text>
        <Text style={styles.title}>ルーティン設定</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {groupedRoutines.map(group => (
          <View key={group.key} style={styles.group}>
            <Text style={[styles.groupTitle, { color: group.color }]}>{group.label}</Text>
            {group.routines.length === 0 ? (
              <Text style={styles.emptyText}>まだルーティンがありません</Text>
            ) : (
              group.routines.map(routine => (
                <TouchableOpacity
                  key={routine.id}
                  style={[styles.routineCard, { borderLeftColor: group.color }]}
                  onPress={() => openEditModal(routine)}
                >
                  <View style={styles.routineInfo}>
                    <Text style={styles.routineTitle}>{routine.title}</Text>
                    <Text style={styles.routineDetail}>
                      {routine.location ? `📍 ${routine.location}　` : ''}
                      ⏱ {routine.duration}{routine.unit === 'minutes' ? '分' : '回'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteRoutine(routine.id)}>
                    <Text style={styles.deleteButton}>🗑</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>＋ ルーティンを追加</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* 追加・編集モーダル */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{editingRoutine ? 'ルーティンを編集' : 'ルーティンを追加'}</Text>

                <Text style={styles.modalLabel}>時間帯</Text>
                <View style={styles.timeOfDayRow}>
                  {TIME_OF_DAY.map(tod => (
                    <TouchableOpacity
                      key={tod.key}
                      style={[styles.timeOfDayButton, timeOfDay === tod.key && { backgroundColor: tod.color, borderColor: tod.color }]}
                      onPress={() => setTimeOfDay(tod.key as any)}
                    >
                      <Text style={[styles.timeOfDayText, timeOfDay === tod.key && { color: '#fff' }]}>{tod.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.modalLabel}>タイトル</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="例：スクワット、読書、瞑想..."
                  value={title}
                  onChangeText={setTitle}
                  returnKeyType="next"
                />

                <Text style={styles.modalLabel}>場所（任意）</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="例：リビング、ジム、デスク..."
                  value={location}
                  onChangeText={setLocation}
                  returnKeyType="next"
                />

                <Text style={styles.modalLabel}>時間 / 回数</Text>
                <View style={styles.durationRow}>
                  <TextInput
                    style={[styles.modalInput, { flex: 1, marginRight: 10 }]}
                    placeholder="例：30"
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                  <View style={styles.unitSelector}>
                    {UNIT_OPTIONS.map(u => (
                      <TouchableOpacity
                        key={u.key}
                        style={[styles.unitButton, unit === u.key && styles.unitButtonActive]}
                        onPress={() => setUnit(u.key as any)}
                      >
                        <Text style={[styles.unitText, unit === u.key && styles.unitTextActive]}>{u.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalCancelText}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSaveButton} onPress={saveRoutine}>
                    <Text style={styles.modalSaveText}>{editingRoutine ? '保存する' : '追加する'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: { marginTop: 50, marginBottom: 24 },
  subtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 2 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  group: { marginBottom: 20 },
  groupTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  emptyText: { color: COLORS.textLight, fontSize: 13, paddingLeft: 8 },
  routineCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  routineInfo: { flex: 1 },
  routineTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  routineDetail: { fontSize: 12, color: COLORS.textLight },
  deleteButton: { fontSize: 18, padding: 4 },
  addButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textLight, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, marginBottom: 16 },
  timeOfDayRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  timeOfDayButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
  timeOfDayText: { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
  durationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  unitSelector: { flexDirection: 'row', gap: 8 },
  unitButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border },
  unitButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  unitText: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  unitTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancelButton: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  modalCancelText: { color: COLORS.textLight, fontWeight: '600' },
  modalSaveButton: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: 'bold' },
});