import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const COLORS = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#6C63FF',
  primaryLight: '#A89CFF',
  text: '#2D3436',
  textLight: '#636E72',
  border: '#DFE6E9',
  success: '#00B894',
  danger: '#FF7675',
  morning: '#FFB300',
  afternoon: '#43A047',
  evening: '#1E88E5',
  reward: '#E53935',
};

type RepeatType = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'interval';

type Routine = {
  id: string;
  title: string;
  duration: number;
  unit: 'minutes' | 'count';
  location: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'reward';
  isReward: boolean;
  startTime: string;
  endTime: string;
  repeatType: RepeatType;
  repeatInterval: number;
};

const TIME_OF_DAY = [
  { key: 'morning', label: '☀️ 朝', color: COLORS.morning },
  { key: 'afternoon', label: '🌤 昼', color: COLORS.afternoon },
  { key: 'evening', label: '🌙 夜', color: COLORS.evening },
  { key: 'reward', label: '🎁 ご褒美', color: COLORS.reward },
];

const UNIT_OPTIONS = [
  { key: 'minutes', label: '分' },
  { key: 'count', label: '回' },
];

const REPEAT_OPTIONS: { key: RepeatType; label: string }[] = [
  { key: 'once', label: '今日のみ' },
  { key: 'daily', label: '毎日' },
  { key: 'weekly', label: '毎週' },
  { key: 'monthly', label: '毎月' },
  { key: 'yearly', label: '毎年' },
  { key: 'interval', label: 'N日ごと' },
];

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const shouldShowRoutine = (routine: Routine, date: Date, createdDate: Date) => {
  if (routine.repeatType === 'once') {
    return getDateKey(date) === getDateKey(createdDate);
  }
  if (routine.repeatType === 'daily') return true;
  if (routine.repeatType === 'weekly') {
    return date.getDay() === createdDate.getDay();
  }
  if (routine.repeatType === 'monthly') {
    return date.getDate() === createdDate.getDate();
  }
  if (routine.repeatType === 'yearly') {
    return date.getDate() === createdDate.getDate() && date.getMonth() === createdDate.getMonth();
  }
  if (routine.repeatType === 'interval') {
    const diff = Math.floor((date.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff % routine.repeatInterval === 0;
  }
  return true;
};

export default function HomeScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [unit, setUnit] = useState<'minutes' | 'count'>('minutes');
  const [location, setLocation] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'reward'>('morning');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [repeatType, setRepeatType] = useState<RepeatType>('daily');
  const [repeatInterval, setRepeatInterval] = useState('2');
  const [completedMap, setCompletedMap] = useState<Record<string, string[]>>({});
  const [createdDates, setCreatedDates] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const savedRoutines = await AsyncStorage.getItem('routines');
    const savedCompleted = await AsyncStorage.getItem('completedMap');
    const savedCreated = await AsyncStorage.getItem('createdDates');
    setRoutines(savedRoutines ? JSON.parse(savedRoutines) : []);
    setCompletedMap(savedCompleted ? JSON.parse(savedCompleted) : {});
    setCreatedDates(savedCreated ? JSON.parse(savedCreated) : {});
  };

  const saveRoutines = async (newRoutines: Routine[], newCreatedDates: Record<string, string>) => {
    await AsyncStorage.setItem('routines', JSON.stringify(newRoutines));
    await AsyncStorage.setItem('createdDates', JSON.stringify(newCreatedDates));
    setRoutines(newRoutines);
    setCreatedDates(newCreatedDates);
  };

  const toggleComplete = async (id: string) => {
    const dateKey = getDateKey(selectedDate);
    const current = completedMap[dateKey] || [];
    const newCompleted = current.includes(id)
      ? current.filter(r => r !== id)
      : [...current, id];
    const newMap = { ...completedMap, [dateKey]: newCompleted };
    await AsyncStorage.setItem('completedMap', JSON.stringify(newMap));
    setCompletedMap(newMap);
  };

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const timeToDate = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  };

  const openAddModal = () => {
    setEditingRoutine(null);
    setTitle('');
    setDuration('');
    setUnit('minutes');
    setLocation('');
    setTimeOfDay('morning');
    const now = new Date();
    setStartTime(now);
    const end = new Date(now);
    end.setMinutes(end.getMinutes() + 30);
    setEndTime(end);
    setRepeatType('daily');
    setRepeatInterval('2');
    setShowStartPicker(false);
    setShowEndPicker(false);
    setModalVisible(true);
  };

  const openEditModal = (routine: Routine) => {
    setEditingRoutine(routine);
    setTitle(routine.title);
    setDuration(routine.duration.toString());
    setUnit(routine.unit);
    setLocation(routine.location);
    setTimeOfDay(routine.timeOfDay);
    setStartTime(timeToDate(routine.startTime));
    setEndTime(timeToDate(routine.endTime));
    setRepeatType(routine.repeatType);
    setRepeatInterval(routine.repeatInterval?.toString() || '2');
    setShowStartPicker(false);
    setShowEndPicker(false);
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
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      repeatType,
      repeatInterval: parseInt(repeatInterval) || 2,
    };

    let newRoutines;
    const newCreatedDates = { ...createdDates };

    if (editingRoutine) {
      newRoutines = routines.map(r => r.id === editingRoutine.id ? newRoutine : r);
    } else {
      newRoutines = [...routines, newRoutine];
      newCreatedDates[newRoutine.id] = getDateKey(selectedDate);
    }

    newRoutines.sort((a, b) => a.startTime.localeCompare(b.startTime));

    await saveRoutines(newRoutines, newCreatedDates);
    setModalVisible(false);
    Keyboard.dismiss();
  };

  const deleteRoutine = (id: string) => {
    Alert.alert('削除確認', 'このルーティンを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive', onPress: async () => {
          const newRoutines = routines.filter(r => r.id !== id);
          const newCreatedDates = { ...createdDates };
          delete newCreatedDates[id];
          await saveRoutines(newRoutines, newCreatedDates);
        }
      }
    ]);
  };

  const getDates = () => {
    const dates = [];
    for (let i = -2; i <= 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const isToday = (d: Date) => isSameDay(d, new Date());

  const dateKey = getDateKey(selectedDate);
  const completedToday = completedMap[dateKey] || [];

  const visibleRoutines = routines.filter(routine => {
    const createdStr = createdDates[routine.id];
    const created = createdStr ? new Date(createdStr.replace(/-/g, '/')) : new Date();
    return shouldShowRoutine(routine, selectedDate, created);
  });

  const completedCount = completedToday.filter(id => visibleRoutines.some(r => r.id === id)).length;
  const totalCount = visibleRoutines.length;

  const getTimeOfDayColor = (tod: string) =>
    TIME_OF_DAY.find(t => t.key === tod)?.color || COLORS.primary;

  const getRepeatLabel = (routine: Routine) => {
    switch (routine.repeatType) {
      case 'once': return '今日のみ';
      case 'daily': return '毎日';
      case 'weekly': return '毎週';
      case 'monthly': return '毎月';
      case 'yearly': return '毎年';
      case 'interval': return `${routine.repeatInterval}日ごと`;
    }
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>🗓 Today's Routine</Text>
          <Text style={styles.title}>ルーティン</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{completedCount}/{totalCount} 完了</Text>
        </View>
      </View>

      {/* 日付選択 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dateScrollContent}>
        {getDates().map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.dateButton, isSameDay(date, selectedDate) && styles.dateButtonSelected, isToday(date) && !isSameDay(date, selectedDate) && styles.dateButtonToday]}
            onPress={() => setSelectedDate(date)}
          >
            <Text style={[styles.dateDayText, isSameDay(date, selectedDate) && styles.dateTextSelected]}>{DAYS[date.getDay()]}</Text>
            <Text style={[styles.dateDateText, isSameDay(date, selectedDate) && styles.dateTextSelected]}>{date.getDate()}</Text>
            {isToday(date) && <View style={[styles.todayDot, isSameDay(date, selectedDate) && { backgroundColor: '#fff' }]} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* タイムライン */}
      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
        {visibleRoutines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>ルーティンがまだありません</Text>
            <Text style={styles.emptySubText}>＋ボタンから追加してみよう！</Text>
          </View>
        ) : (
          visibleRoutines.map((routine, index) => {
            const isCompleted = completedToday.includes(routine.id);
            const color = getTimeOfDayColor(routine.timeOfDay);
            return (
              <View key={routine.id} style={styles.timelineItem}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeText}>{routine.startTime}</Text>
                  <Text style={styles.timeTextEnd}>{routine.endTime}</Text>
                  {index < visibleRoutines.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <TouchableOpacity
                  style={[styles.routineCard, { borderLeftColor: color }, isCompleted && styles.routineCardCompleted]}
                  onPress={() => toggleComplete(routine.id)}
                  onLongPress={() => openEditModal(routine)}
                >
                  <View style={styles.routineCardContent}>
                    <View style={styles.routineCardLeft}>
                      <View style={[styles.completedCircle, isCompleted && { backgroundColor: color, borderColor: color }]}>
                        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.routineTitle, isCompleted && styles.routineTitleCompleted]}>{routine.title}</Text>
                        <Text style={styles.routineDetail}>
                          {routine.location ? `📍 ${routine.location}　` : ''}
                          ⏱ {routine.duration}{routine.unit === 'minutes' ? '分' : '回'}　🔁 {getRepeatLabel(routine)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => deleteRoutine(routine.id)}>
                      <Text style={styles.deleteButton}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ＋ボタン */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* モーダル */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>{editingRoutine ? 'ルーティンを編集' : 'ルーティンを追加'}</Text>

                  {/* 時間帯 */}
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

                  {/* 開始時刻 */}
                  <Text style={styles.modalLabel}>開始時刻</Text>
                  <TouchableOpacity style={styles.timePickerButton} onPress={() => { setShowStartPicker(!showStartPicker); setShowEndPicker(false); }}>
                    <Text style={styles.timePickerText}>🕐 {formatTime(startTime)}</Text>
                  </TouchableOpacity>
                  {showStartPicker && (
                    <>
                      <View style={styles.pickerContainer}>
                        <DateTimePicker
                          value={startTime}
                          mode="time"
                          display="spinner"
                          onChange={(_, date) => { if (date) setStartTime(date); }}
                          locale="ja"
                          textColor={COLORS.text}
                          themeVariant="light"
                        />
                      </View>
                      <TouchableOpacity style={styles.timePickerDone} onPress={() => setShowStartPicker(false)}>
                        <Text style={styles.timePickerDoneText}>完了</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* 終了時刻 */}
                  <Text style={styles.modalLabel}>終了時刻</Text>
                  <TouchableOpacity style={styles.timePickerButton} onPress={() => { setShowEndPicker(!showEndPicker); setShowStartPicker(false); }}>
                    <Text style={styles.timePickerText}>🕐 {formatTime(endTime)}</Text>
                  </TouchableOpacity>
                  {showEndPicker && (
                    <>
                      <View style={styles.pickerContainer}>
                        <DateTimePicker
                          value={endTime}
                          mode="time"
                          display="spinner"
                          onChange={(_, date) => { if (date) setEndTime(date); }}
                          locale="ja"
                          textColor={COLORS.text}
                          themeVariant="light"
                        />
                      </View>
                      <TouchableOpacity style={styles.timePickerDone} onPress={() => setShowEndPicker(false)}>
                        <Text style={styles.timePickerDoneText}>完了</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* タイトル */}
                  <Text style={styles.modalLabel}>タイトル</Text>
                  <TextInput style={styles.modalInput} placeholder="例：スクワット、読書、瞑想..." value={title} onChangeText={setTitle} returnKeyType="next" />

                  {/* 場所 */}
                  <Text style={styles.modalLabel}>場所（任意）</Text>
                  <TextInput style={styles.modalInput} placeholder="例：リビング、ジム、デスク..." value={location} onChangeText={setLocation} returnKeyType="next" />

                  {/* 時間/回数 */}
                  <Text style={styles.modalLabel}>時間 / 回数</Text>
                  <View style={styles.durationRow}>
                    <TextInput style={[styles.modalInput, { flex: 1, marginRight: 10 }]} placeholder="例：30" value={duration} onChangeText={setDuration} keyboardType="numeric" returnKeyType="done" />
                    <View style={styles.unitSelector}>
                      {UNIT_OPTIONS.map(u => (
                        <TouchableOpacity key={u.key} style={[styles.unitButton, unit === u.key && styles.unitButtonActive]} onPress={() => setUnit(u.key as any)}>
                          <Text style={[styles.unitText, unit === u.key && styles.unitTextActive]}>{u.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* 繰り返し */}
                  <Text style={styles.modalLabel}>繰り返し</Text>
                  <View style={styles.repeatRow}>
                    {REPEAT_OPTIONS.map(r => (
                      <TouchableOpacity
                        key={r.key}
                        style={[styles.repeatButton, repeatType === r.key && styles.repeatButtonActive]}
                        onPress={() => setRepeatType(r.key)}
                      >
                        <Text style={[styles.repeatText, repeatType === r.key && styles.repeatTextActive]}>{r.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {repeatType === 'interval' && (
                    <View style={styles.intervalRow}>
                      <TextInput
                        style={[styles.modalInput, { flex: 1, marginRight: 8, marginBottom: 0 }]}
                        placeholder="例：3"
                        value={repeatInterval}
                        onChangeText={setRepeatInterval}
                        keyboardType="numeric"
                        returnKeyType="done"
                      />
                      <Text style={styles.intervalLabel}>日ごとに繰り返す</Text>
                    </View>
                  )}

                  {/* ボタン */}
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                      <Text style={styles.modalCancelText}>キャンセル</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalSaveButton} onPress={saveRoutine}>
                      <Text style={styles.modalSaveText}>{editingRoutine ? '保存する' : '追加する'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ height: 20 }} />
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 50, marginBottom: 16 },
  subtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 2 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  progressBadge: { backgroundColor: COLORS.primary + '20', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.primary },
  progressText: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary },
  dateScroll: { marginBottom: 16 },
  dateScrollContent: { paddingHorizontal: 20, gap: 8 },
  dateButton: { width: 52, height: 68, borderRadius: 14, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  dateButtonSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dateButtonToday: { borderColor: COLORS.primary },
  dateDayText: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  dateDateText: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  dateTextSelected: { color: '#fff' },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 4 },
  timeline: { flex: 1, paddingHorizontal: 20 },
  timelineItem: { flexDirection: 'row', marginBottom: 12 },
  timeColumn: { width: 52, alignItems: 'center', paddingTop: 4 },
  timeText: { fontSize: 12, color: COLORS.text, fontWeight: '700' },
  timeTextEnd: { fontSize: 11, color: COLORS.textLight },
  timelineLine: { width: 1, flex: 1, backgroundColor: COLORS.border, marginTop: 6 },
  routineCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, borderLeftWidth: 4, marginLeft: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  routineCardCompleted: { opacity: 0.6 },
  routineCardContent: { flexDirection: 'row', alignItems: 'center', padding: 14, justifyContent: 'space-between' },
  routineCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  completedCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  routineTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  routineTitleCompleted: { textDecorationLine: 'line-through', color: COLORS.textLight },
  routineDetail: { fontSize: 12, color: COLORS.textLight },
  deleteButton: { fontSize: 18, padding: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  emptySubText: { fontSize: 13, color: COLORS.textLight },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textLight, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, marginBottom: 16 },
  timePickerButton: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12, padding: 14, marginBottom: 8, alignItems: 'center', backgroundColor: COLORS.primary + '10' },
  timePickerText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  pickerContainer: { backgroundColor: COLORS.background, borderRadius: 12, marginBottom: 4 },
  timePickerDone: { alignItems: 'center', padding: 8, marginBottom: 12 },
  timePickerDoneText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15 },
  timeOfDayRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  timeOfDayButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
  timeOfDayText: { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
  durationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  unitSelector: { flexDirection: 'row', gap: 8 },
  unitButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border },
  unitButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  unitText: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  unitTextActive: { color: '#fff' },
  repeatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  repeatButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
  repeatButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  repeatText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  repeatTextActive: { color: '#fff' },
  intervalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  intervalLabel: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancelButton: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  modalCancelText: { color: COLORS.textLight, fontWeight: '600' },
  modalSaveButton: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: 'bold' },
});