import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#6C63FF',
  text: '#2D3436',
  textLight: '#636E72',
  border: '#DFE6E9',
  success: '#00B894',
  danger: '#FF7675',
  warning: '#FDCB6E',
  morning: '#FFB300',
  afternoon: '#43A047',
  evening: '#1E88E5',
  reward: '#E53935',
};

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
  repeatType: string;
  repeatInterval: number;
};

const TIME_OF_DAY = [
  { key: 'morning', label: '☀️ 朝', color: COLORS.morning },
  { key: 'afternoon', label: '🌤 昼', color: COLORS.afternoon },
  { key: 'evening', label: '🌙 夜', color: COLORS.evening },
  { key: 'reward', label: '🎁 ご褒美', color: COLORS.reward },
];

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const getTimeOfDayColor = (tod: string) =>
  TIME_OF_DAY.find(t => t.key === tod)?.color || COLORS.primary;

const timeStringToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const SHORT_DURATIONS = [5, 10, 15, 20, 30];

export default function TimerScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [completedToday, setCompletedToday] = useState<string[]>([]);
  const [showMotivation, setShowMotivation] = useState(false);
  const intervalRef = useRef<any>(null);
  const characterAnim = useRef(new Animated.Value(0)).current;
  const characterLoopRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [])
  );

  const loadData = async () => {
    const savedRoutines = await AsyncStorage.getItem('routines');
    const savedCompleted = await AsyncStorage.getItem('completedMap');
    const today = getDateKey(new Date());
    const completedMap = savedCompleted ? JSON.parse(savedCompleted) : {};
    setRoutines(savedRoutines ? JSON.parse(savedRoutines) : []);
    setCompletedToday(completedMap[today] || []);
  };

  useEffect(() => {
    if (routines.length === 0 || selectedRoutine) return;
    const checkTime = setInterval(() => {
      const currentMinutes = getCurrentMinutes();
      const routine = routines.find(r => {
        const startMinutes = timeStringToMinutes(r.startTime);
        return currentMinutes === startMinutes && !completedToday.includes(r.id);
      });
      if (routine) startTimer(routine);
    }, 30000);
    return () => clearInterval(checkTime);
  }, [routines, completedToday, selectedRoutine]);

  const getTotalSeconds = (routine: Routine, customEndTime?: string) => {
    const startMinutes = timeStringToMinutes(routine.startTime);
    const endMinutes = timeStringToMinutes(customEndTime || routine.endTime);
    const diff = endMinutes - startMinutes;
    return diff > 0 ? diff * 60 : 60;
  };

  const startTimer = (routine: Routine, customEndTime?: string) => {
    const total = getTotalSeconds(routine, customEndTime);
    setSelectedRoutine({ ...routine, endTime: customEndTime || routine.endTime });
    setTotalSeconds(total);
    setElapsedSeconds(0);
    setIsRunning(true);
    setIsPaused(false);
    setShowMotivation(false);
    startCharacterAnimation();
  };

  const startCharacterAnimation = () => {
    characterLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(characterAnim, { toValue: -8, duration: 500, useNativeDriver: true }),
        Animated.timing(characterAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    );
    characterLoopRef.current.start();
  };

  const stopCharacterAnimation = () => {
    if (characterLoopRef.current) characterLoopRef.current.stop();
    characterAnim.setValue(0);
  };

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          if (prev >= totalSeconds) {
            clearInterval(intervalRef.current);
            handleComplete();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isPaused, totalSeconds]);

  const handleComplete = async () => {
    setIsRunning(false);
    stopCharacterAnimation();
    if (!selectedRoutine) return;

    const today = getDateKey(new Date());
    const savedCompleted = await AsyncStorage.getItem('completedMap');
    const completedMap = savedCompleted ? JSON.parse(savedCompleted) : {};
    const current = completedMap[today] || [];

    if (!current.includes(selectedRoutine.id)) {
      const newCompleted = [...current, selectedRoutine.id];
      completedMap[today] = newCompleted;
      await AsyncStorage.setItem('completedMap', JSON.stringify(completedMap));
      setCompletedToday(newCompleted);

      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      const savedTotal = await AsyncStorage.getItem('totalTime');
      const previousTotal = savedTotal ? parseInt(savedTotal) : 0;
      const newTotal = previousTotal + elapsedMinutes;
      await AsyncStorage.setItem('totalTime', newTotal.toString());

      // タスク完了の経験値
      await addExp(10);

      // 累計時間の経験値（1時間ごとに+5、新たに超えた時間分だけ加算）
      const previousHours = Math.floor(previousTotal / 60);
      const newHours = Math.floor(newTotal / 60);
      const hoursPassed = newHours - previousHours;
      if (hoursPassed > 0) {
        await addExp(hoursPassed * 5);
      }
    }

    Alert.alert('🎉 完了！', `${selectedRoutine.title}を達成しました！`, [
      { text: '次へ', onPress: () => { setSelectedRoutine(null); setIsRunning(false); } }
    ]);
  };

  const addExp = async (amount: number) => {
    const savedLevel = await AsyncStorage.getItem('charLevel');
    const savedExp = await AsyncStorage.getItem('charExp');
    const savedCoins = await AsyncStorage.getItem('coins');

    let level = savedLevel ? parseInt(savedLevel) : 1;
    let exp = (savedExp ? parseInt(savedExp) : 0) + amount;
    let coins = savedCoins ? parseInt(savedCoins) : 0;

    const MAX_LEVEL = 20;
    const EXP_PER_LEVEL = 100;

    while (exp >= EXP_PER_LEVEL && level < MAX_LEVEL) {
      exp -= EXP_PER_LEVEL;
      level += 1;
      coins += 20;
    }

    if (level >= MAX_LEVEL) {
      exp = EXP_PER_LEVEL;
    }

    await AsyncStorage.setItem('charLevel', level.toString());
    await AsyncStorage.setItem('charExp', exp.toString());
    await AsyncStorage.setItem('coins', coins.toString());
  };

  const handleLowMotivation = () => {
    setIsPaused(true);
    setIsRunning(false);
    setShowMotivation(true);
    stopCharacterAnimation();
  };

  const handleShortDuration = (minutes: number) => {
    if (!selectedRoutine) return;
    const startMinutes = timeStringToMinutes(selectedRoutine.startTime);
    const newEndMinutes = startMinutes + minutes;
    const newEndHour = Math.floor(newEndMinutes / 60);
    const newEndMinute = newEndMinutes % 60;
    const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMinute.toString().padStart(2, '0')}`;
    startTimer(selectedRoutine, newEndTime);
  };

  const progress = totalSeconds > 0 ? Math.min(elapsedSeconds / totalSeconds, 1) : 0;
  const remaining = Math.max(totalSeconds - elapsedSeconds, 0);

  if (selectedRoutine) {
    const color = getTimeOfDayColor(selectedRoutine.timeOfDay);
    return (
      <View style={styles.container}>
        <View style={styles.timerHeader}>
          <TouchableOpacity onPress={() => { setIsRunning(false); setSelectedRoutine(null); stopCharacterAnimation(); }}>
            <Text style={styles.backButton}>← 戻る</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.characterContainer}>
          <Animated.Text style={[styles.character, { transform: [{ translateY: characterAnim }] }]}>
            {showMotivation ? '😴' : isRunning ? '💪' : '😊'}
          </Animated.Text>
          <Text style={styles.characterMessage}>
            {showMotivation ? 'どのくらいならできそう？' : isRunning ? '一緒に頑張ってるよ！' : 'いつでもスタートしよう！'}
          </Text>
        </View>

        <View style={[styles.timerCard, { borderColor: color }]}>
          <Text style={styles.timerRoutineTitle}>{selectedRoutine.title}</Text>
          <Text style={styles.timerTimeRange}>🕐 {selectedRoutine.startTime} → {selectedRoutine.endTime}</Text>
          <Text style={[styles.timerTime, { color }]}>{formatTime(remaining)}</Text>
          <Text style={styles.timerElapsed}>経過 {formatTime(elapsedSeconds)}</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
          </View>
        </View>

        <View style={styles.controlRow}>
          {!isRunning && !isPaused ? (
            <TouchableOpacity style={[styles.startButton, { backgroundColor: color }]} onPress={() => setIsRunning(true)}>
              <Text style={styles.startButtonText}>▶ スタート</Text>
            </TouchableOpacity>
          ) : isPaused ? (
            <TouchableOpacity style={[styles.startButton, { backgroundColor: color }]} onPress={() => { setIsRunning(true); setIsPaused(false); setShowMotivation(false); startCharacterAnimation(); }}>
              <Text style={styles.startButtonText}>▶ 再開</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.pauseButton} onPress={() => { setIsPaused(true); setIsRunning(false); stopCharacterAnimation(); }}>
              <Text style={styles.pauseButtonText}>⏸ 一時停止</Text>
            </TouchableOpacity>
          )}
        </View>

        {!showMotivation ? (
          <TouchableOpacity style={styles.lowMotivationButton} onPress={handleLowMotivation}>
            <Text style={styles.lowMotivationText}>😔 やる気が出ない...</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.motivationCard}>
            <Text style={styles.motivationTitle}>どのくらいならできそう？⚡</Text>
            <View style={styles.shortDurationRow}>
              {SHORT_DURATIONS.map(min => (
                <TouchableOpacity key={min} style={[styles.shortDurationButton, { borderColor: color }]} onPress={() => handleShortDuration(min)}>
                  <Text style={[styles.shortDurationText, { color }]}>{min}分</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => { setShowMotivation(false); setIsRunning(true); setIsPaused(false); startCharacterAnimation(); }}>
              <Text style={styles.cancelMotivation}>やっぱりそのままやる</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeButtonText}>✅ 完了にする</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>⏱ Timer</Text>
        <Text style={styles.title}>タイマー</Text>
      </View>

      <Text style={styles.sectionTitle}>今日のルーティン</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {routines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>ルーティンがありません</Text>
            <Text style={styles.emptySubText}>ホーム画面から追加してください</Text>
          </View>
        ) : (
          routines.map(routine => {
            const isCompleted = completedToday.includes(routine.id);
            const color = getTimeOfDayColor(routine.timeOfDay);
            const currentMinutes = getCurrentMinutes();
            const startMinutes = timeStringToMinutes(routine.startTime);
            const endMinutes = timeStringToMinutes(routine.endTime);
            const isNow = currentMinutes >= startMinutes && currentMinutes < endMinutes;

            return (
              <TouchableOpacity
                key={routine.id}
                style={[styles.routineCard, { borderLeftColor: color }, isCompleted && styles.routineCardCompleted, isNow && !isCompleted && styles.routineCardNow]}
                onPress={() => !isCompleted && startTimer(routine)}
              >
                <View style={styles.routineCardLeft}>
                  <View style={[styles.completedCircle, isCompleted && { backgroundColor: color, borderColor: color }]}>
                    {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View>
                    <View style={styles.routineTitleRow}>
                      <Text style={[styles.routineTitle, isCompleted && styles.routineTitleCompleted]}>{routine.title}</Text>
                      {isNow && !isCompleted && (
                        <View style={[styles.nowBadge, { backgroundColor: color }]}>
                          <Text style={styles.nowBadgeText}>NOW</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.routineDetail}>
                      🕐 {routine.startTime} - {routine.endTime}
                      {routine.location ? `　📍 ${routine.location}` : ''}
                    </Text>
                  </View>
                </View>
                {!isCompleted && (
                  <View style={[styles.startBadge, { backgroundColor: color + '20', borderColor: color }]}>
                    <Text style={[styles.startBadgeText, { color }]}>スタート</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: { marginTop: 50, marginBottom: 24 },
  subtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 2 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  timerHeader: { marginTop: 50, marginBottom: 16 },
  backButton: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  characterContainer: { alignItems: 'center', marginBottom: 20 },
  character: { fontSize: 70, marginBottom: 8 },
  characterMessage: { fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
  timerCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 2, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  timerRoutineTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  timerTimeRange: { fontSize: 14, color: COLORS.textLight, marginBottom: 12 },
  timerTime: { fontSize: 64, fontWeight: 'bold', marginBottom: 4 },
  timerElapsed: { fontSize: 13, color: COLORS.textLight, marginBottom: 16 },
  progressBg: { width: '100%', height: 8, backgroundColor: COLORS.border, borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4 },
  controlRow: { marginBottom: 16 },
  startButton: { borderRadius: 14, padding: 16, alignItems: 'center' },
  startButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  pauseButton: { borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: COLORS.warning },
  pauseButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  lowMotivationButton: { padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', marginBottom: 16 },
  lowMotivationText: { fontSize: 15, color: COLORS.textLight, fontWeight: '600' },
  motivationCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  motivationTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  shortDurationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 },
  shortDurationButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 2 },
  shortDurationText: { fontSize: 16, fontWeight: 'bold' },
  cancelMotivation: { fontSize: 13, color: COLORS.textLight, textDecorationLine: 'underline' },
  completeButton: { padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.success, alignItems: 'center', backgroundColor: COLORS.success + '10' },
  completeButtonText: { fontSize: 15, color: COLORS.success, fontWeight: 'bold' },
  routineCard: { backgroundColor: COLORS.card, borderRadius: 14, borderLeftWidth: 4, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  routineCardCompleted: { opacity: 0.5 },
  routineCardNow: { borderWidth: 1.5, borderColor: COLORS.primary },
  routineCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  routineTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  completedCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  routineTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  routineTitleCompleted: { textDecorationLine: 'line-through', color: COLORS.textLight },
  routineDetail: { fontSize: 12, color: COLORS.textLight },
  nowBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  nowBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  startBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5 },
  startBadgeText: { fontSize: 13, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  emptySubText: { fontSize: 13, color: COLORS.textLight },
});