import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEMES, THEME_LABELS, ThemeName, useTheme } from '../theme';

export default function SettingsScreen() {
  const { theme: COLORS, themeName, changeTheme } = useTheme();
  const styles = getStyles(COLORS);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>⚙️ Settings</Text>
        <Text style={styles.title}>設定</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎨 テーマ</Text>
        <Text style={styles.cardSubtitle}>好きな見た目に変更できます</Text>

        <View style={styles.themeGrid}>
          {(Object.keys(THEMES) as ThemeName[]).map(name => {
            const isSelected = themeName === name;
            const previewColors = THEMES[name];
            return (
              <TouchableOpacity
                key={name}
                style={[
                  styles.themeCard,
                  { backgroundColor: previewColors.card, borderColor: isSelected ? previewColors.primary : previewColors.border },
                  isSelected && styles.themeCardSelected,
                ]}
                onPress={() => changeTheme(name)}
              >
                <View style={styles.themePreviewRow}>
                  <View style={[styles.previewDot, { backgroundColor: previewColors.background }]} />
                  <View style={[styles.previewDot, { backgroundColor: previewColors.primary }]} />
                  <View style={[styles.previewDot, { backgroundColor: previewColors.success }]} />
                </View>
                <Text style={[styles.themeLabel, { color: previewColors.text }]}>{THEME_LABELS[name]}</Text>
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: previewColors.primary }]}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: { marginTop: 50, marginBottom: 24 },
  subtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 2 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 16 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themeCard: { width: '47%', borderRadius: 14, borderWidth: 2, padding: 16, position: 'relative' },
  themeCardSelected: { borderWidth: 3 },
  themePreviewRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  previewDot: { width: 20, height: 20, borderRadius: 10 },
  themeLabel: { fontSize: 14, fontWeight: '600' },
  selectedBadge: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  selectedBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});