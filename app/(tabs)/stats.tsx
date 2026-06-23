import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

const COLORS = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#6C63FF',
  text: '#2D3436',
  textLight: '#636E72',
  border: '#DFE6E9',
  success: '#00B894',
  warning: '#FDCB6E',
  morning: '#FFB300',
  afternoon: '#43A047',
  evening: '#1E88E5',
};

const DAYS = ['月', '火', '水', '木', '金', '土', '日'];
const SCREEN_WIDTH = Dimensions.get('window').width;

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

export default function StatsScreen() {
  const [totalTime, setTotalTime] = useState(0);
  const [weeklyTime, setWeeklyTime] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    const savedTotalTime = await AsyncStorage.getItem('totalTime');
    const savedRoutines = await AsyncStorage.getItem('routines');
    const savedCompleted = await AsyncStorage.getItem('completedMap');
    const savedWeekly = await AsyncStorage.getItem('weeklyTime');
    const savedBest = await AsyncStorage.getItem('bestStreak');

    const totalTimeVal = savedTotalTime ? parseInt(savedTotalTime) : 0;
    setTotalTime(totalTimeVal);
    setBestStreak(savedBest ? parseInt(savedBest) : 0);

    const routines = savedRoutines ? JSON.parse(savedRoutines) : [];
    const completedMap = savedCompleted ? JSON.parse(savedCompleted) : {};

    // 今週のデータ
    const weekly = savedWeekly ? JSON.parse(savedWeekly) : [0, 0, 0, 0, 0, 0, 0];
    setWeeklyTime(weekly);

    // 総完了数とストリーク計算
    let total = 0;
    let streak = 0;
    let tempStreak = 0;
    let best = savedBest ? parseInt(savedBest) : 0;

    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      const completed = completedMap[key] || [];
      total += completed.length;

      if (completed.length > 0 && routines.length > 0) {
        tempStreak++;
        if (i === 0 || tempStreak > 0) {
          streak = tempStreak;
        }
      } else if (i > 0) {
        tempStreak = 0;
      }
    }

    setTotalCompleted(total);
    setCurrentStreak(streak);

    if (streak > best) {
      best = streak;
      await AsyncStorage.setItem('bestStreak', best.toString());
      setBestStreak(best);
    }

    // 今日の達成率
    const todayKey = getDateKey(today);
    const todayCompleted = completedMap[todayKey] || [];
    const rate = routines.length > 0 ? Math.round((todayCompleted.length / routines.length) * 100) : 0;
    setCompletionRate(rate);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}分`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}時間${m}分` : `${h}時間`;
  };

  const maxWeekly = Math.max(...weeklyTime, 1);
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const getMotivationMessage = () => {
    if (completionRate === 100) return { emoji: '🏆', message: '今日は完璧！最高です！' };
    if (completionRate >= 75) return { emoji: '⭐', message: 'もう少し！あと少しで完璧！' };
    if (completionRate >= 50) return { emoji: '💪', message: '半分達成！この調子で！' };
    if (completionRate > 0) return { emoji: '🌱', message: '少しずつでも前進！' };
    return { emoji: '☀️', message: '今日も一緒に頑張ろう！' };
  };

  const motivation = getMotivationMessage();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.subtitle}>📊 Statistics</Text>
        <Text style={styles.title}>統計</Text>
      </View>

      {/* モチベーションメッセージ */}
      <View style={styles.motivationCard}>
        <Text style={styles.motivationEmoji}>{motivation.emoji}</Text>
        <View>
          <Text style={styles.motivationMessage}>{motivation.message}</Text>
          <Text style={styles.motivationSub}>今日の達成率 {completionRate}%</Text>
        </View>
      </View>

      {/* 今日の達成率リング */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 今日の進捗</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressRing}>
            <Text style={styles.progressPercent}>{completionRate}%</Text>
            <Text style={styles.progressLabel}>達成</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
            </View>
            <Text style={styles.progressBarLabel}>今日の達成率</Text>
          </View>
        </View>
      </View>

      {/* 今週のグラフ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📈 今週の累計時間</Text>
        <View style={styles.chart}>
          {weeklyTime.map((value, index) => (
            <View key={index} style={styles.barContainer}>
              <Text style={styles.barValue}>{value > 0 ? `${value}m` : ''}</Text>
              <View style={styles.barWrapper}>
                <View style={[
                  styles.bar,
                  {
                    height: Math.max((value / maxWeekly) * 100, 4),
                    backgroundColor: index === todayIndex ? COLORS.primary : COLORS.border,
                  }
                ]} />
              </View>
              <Text style={[styles.barLabel, index === todayIndex && { color: COLORS.primary, fontWeight: 'bold' }]}>
                {DAYS[index]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ストリーク */}
      <View style={styles.streakRow}>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0', borderColor: '#FFB300' }]}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={[styles.statNumber, { color: '#FFB300' }]}>{currentStreak}</Text>
          <Text style={styles.statLabel}>現在のストリーク</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0', borderColor: '#FFB300' }]}>
          <Text style={styles.statEmoji}>🏆</Text>
          <Text style={[styles.statNumber, { color: '#FFB300' }]}>{bestStreak}</Text>
          <Text style={styles.statLabel}>最長ストリーク</Text>
        </View>
      </View>

      {/* 実績 */}
      <View style={styles.achievementRow}>
        <View style={styles.achievementCard}>
          <Text style={styles.achievementEmoji}>✅</Text>
          <Text style={styles.achievementNumber}>{totalCompleted}</Text>
          <Text style={styles.achievementLabel}>総完了数</Text>
        </View>
        <View style={styles.achievementCard}>
          <Text style={styles.achievementEmoji}>⏱</Text>
          <Text style={styles.achievementNumber}>{formatTime(totalTime)}</Text>
          <Text style={styles.achievementLabel}>累計時間</Text>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: { marginTop: 50, marginBottom: 20 },
  subtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 2 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  motivationCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  motivationEmoji: { fontSize: 40 },
  motivationMessage: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  motivationSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  progressRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  progressPercent: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  progressLabel: { fontSize: 11, color: COLORS.textLight },
  progressBarContainer: { flex: 1 },
  progressBarBg: { height: 10, backgroundColor: COLORS.border, borderRadius: 5, marginBottom: 8 },
  progressBarFill: { height: 10, backgroundColor: COLORS.primary, borderRadius: 5 },
  progressBarLabel: { fontSize: 12, color: COLORS.textLight },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140 },
  barContainer: { alignItems: 'center', flex: 1 },
  barValue: { fontSize: 10, color: COLORS.textLight, marginBottom: 4, height: 14 },
  barWrapper: { height: 100, justifyContent: 'flex-end', width: '70%' },
  bar: { borderRadius: 6, width: '100%' },
  barLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },
  streakRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1 },
  statEmoji: { fontSize: 28, marginBottom: 4 },
  statNumber: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 4, textAlign: 'center' },
  achievementRow: { flexDirection: 'row', gap: 12 },
  achievementCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  achievementEmoji: { fontSize: 28, marginBottom: 4 },
  achievementNumber: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  achievementLabel: { fontSize: 12, color: COLORS.textLight, textAlign: 'center' },
});