import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFoodLog } from "@/context/FoodLogContext";

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "今日";
  if (date.toDateString() === yesterday.toDateString()) return "昨日";

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${month}/${day} (${weekdays[date.getDay()]})`;
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries, dailyGoal, setSelectedDate } = useFoodLog();

  const dailyData = useMemo(() => {
    const map: Record<string, { calories: number; protein: number; carbs: number; fat: number; count: number }> = {};
    for (const entry of entries) {
      if (!map[entry.date]) {
        map[entry.date] = { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
      }
      map[entry.date].calories += entry.calories;
      map[entry.date].protein += entry.protein;
      map[entry.date].carbs += entry.carbs;
      map[entry.date].fat += entry.fat;
      map[entry.date].count++;
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({ date, ...data }));
  }, [entries]);

  const handleSelectDay = (date: string) => {
    setSelectedDate(date);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={dailyData}
        keyExtractor={(item) => item.date}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: insets.bottom + 20,
            paddingTop: Platform.OS === "web" ? 67 + 16 : 16,
          },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="calendar" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              記録がありません
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const pct = Math.min((item.calories / dailyGoal.calories) * 100, 100);
          const isOver = item.calories > dailyGoal.calories;

          return (
            <TouchableOpacity
              onPress={() => handleSelectDay(item.date)}
              style={[
                styles.dayCard,
                {
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.dayHeader}>
                <Text style={[styles.dateText, { color: colors.foreground }]}>
                  {formatDate(item.date)}
                </Text>
                <View style={styles.calorieRow}>
                  <Text style={[styles.calorieText, { color: isOver ? colors.destructive : colors.primary }]}>
                    {item.calories.toFixed(0)}
                  </Text>
                  <Text style={[styles.goalText, { color: colors.mutedForeground }]}>
                    / {dailyGoal.calories} kcal
                  </Text>
                </View>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${pct}%` as any,
                      backgroundColor: isOver ? colors.destructive : colors.primary,
                    },
                  ]}
                />
              </View>
              <View style={styles.macros}>
                <MacroTag label="P" value={item.protein} color={colors.protein} />
                <MacroTag label="C" value={item.carbs} color={colors.carbs} />
                <MacroTag label="F" value={item.fat} color={colors.fat} />
                <Text style={[styles.countText, { color: colors.mutedForeground }]}>
                  {item.count}品目
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function MacroTag({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.macroTag}>
      <Text style={[styles.macroTagLabel, { color }]}>{label}</Text>
      <Text style={styles.macroTagValue}>{value.toFixed(0)}g</Text>
    </View>
  );
}

import { Platform } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  dayCard: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  calorieText: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  goalText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  macros: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  macroTag: {
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
  },
  macroTagLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  macroTagValue: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#777777",
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginLeft: "auto",
  },
});
