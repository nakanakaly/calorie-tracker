import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroBar } from "@/components/MacroBar";
import { MealSection } from "@/components/MealSection";
import { useFoodLog, FoodEntry, MealType } from "@/context/FoodLogContext";
import { useColors } from "@/hooks/useColors";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "今日";
  if (date.toDateString() === yesterday.toDateString()) return "昨日";
  if (date.toDateString() === tomorrow.toDateString()) return "明日";

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${month}月${day}日 (${weekdays[date.getDay()]})`;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    selectedDate,
    setSelectedDate,
    getEntriesForDate,
    getDailySummary,
    dailyGoal,
    deleteEntry,
  } = useFoodLog();

  const entries = getEntriesForDate(selectedDate);
  const summary = getDailySummary(selectedDate);

  const goDay = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d + delta);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleAddFood = (mealType: MealType) => {
    router.push({ pathname: "/add-food", params: { mealType } });
  };

  const handleEditFood = (entry: FoodEntry) => {
    router.push({ pathname: "/add-food", params: { mealType: entry.mealType } });
  };

  const topPad = Platform.OS === "web" ? 10 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: colors.background,
            paddingTop: topPad,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.push("/history")} style={styles.iconBtn}>
          <Feather name="calendar" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => goDay(-1)} style={styles.navBtn}>
            <Feather name="chevron-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.dateTitle, { color: colors.foreground }]}>
            {formatDateDisplay(selectedDate)}
          </Text>
          <TouchableOpacity onPress={() => goDay(1)} style={styles.navBtn}>
            <Feather name="chevron-right" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push("/settings")} style={styles.iconBtn}>
          <Feather name="sliders" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.card,
              borderRadius: colors.radius,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.ringRow}>
            <CalorieRing
              consumed={summary.calories}
              goal={dailyGoal.calories}
              size={160}
              strokeWidth={12}
            />
            <View style={styles.goalInfo}>
              <Text style={[styles.goalLabel, { color: colors.mutedForeground }]}>
                目標
              </Text>
              <Text style={[styles.goalValue, { color: colors.foreground }]}>
                {dailyGoal.calories}
              </Text>
              <Text style={[styles.goalUnit, { color: colors.mutedForeground }]}>
                kcal
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.macros}>
            <MacroBar
              label="タンパク質"
              consumed={summary.protein}
              goal={dailyGoal.protein}
              color={colors.protein}
            />
            <MacroBar
              label="炭水化物"
              consumed={summary.carbs}
              goal={dailyGoal.carbs}
              color={colors.carbs}
            />
            <MacroBar
              label="脂質"
              consumed={summary.fat}
              goal={dailyGoal.fat}
              color={colors.fat}
            />
          </View>
        </View>

        <View style={styles.meals}>
          {MEAL_TYPES.map((mealType) => (
            <MealSection
              key={mealType}
              mealType={mealType}
              entries={entries.filter((e) => e.mealType === mealType)}
              onAdd={handleAddFood}
              onDelete={deleteEntry}
              onEdit={handleEditFood}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  navBtn: {
    padding: 4,
  },
  iconBtn: {
    padding: 4,
    width: 32,
    alignItems: "center",
  },
  dateTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    minWidth: 80,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  ringRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  goalInfo: {
    alignItems: "center",
  },
  goalLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  goalUnit: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    marginBottom: 14,
  },
  macros: {
    gap: 2,
  },
  meals: {
    gap: 0,
  },
});
