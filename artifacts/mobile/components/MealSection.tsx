import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { FoodEntry, MealType } from "@/context/FoodLogContext";
import { FoodEntryCard } from "./FoodEntryCard";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: "sunrise",
  lunch: "sun",
  dinner: "moon",
  snack: "coffee",
};

interface MealSectionProps {
  mealType: MealType;
  entries: FoodEntry[];
  onAdd: (mealType: MealType) => void;
  onDelete: (id: string) => void;
  onEdit: (entry: FoodEntry) => void;
}

export function MealSection({
  mealType,
  entries,
  onAdd,
  onDelete,
  onEdit,
}: MealSectionProps) {
  const colors = useColors();

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);

  const bgKey = mealType as keyof typeof colors;
  const accentKey = `${mealType}Accent` as keyof typeof colors;
  const bg = (colors as Record<string, string>)[bgKey] ?? colors.card;
  const accent = (colors as Record<string, string>)[accentKey] ?? colors.primary;

  return (
    <View style={[styles.section, { backgroundColor: bg, borderRadius: colors.radius }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name={MEAL_ICONS[mealType] as any} size={16} color={accent} />
          <Text style={[styles.mealLabel, { color: accent }]}>
            {MEAL_LABELS[mealType]}
          </Text>
          {entries.length > 0 && (
            <Text style={[styles.calCount, { color: accent }]}>
              {totalCalories.toFixed(0)} kcal
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => onAdd(mealType)}
          style={[styles.addBtn, { backgroundColor: accent }]}
        >
          <Feather name="plus" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      {entries.length > 0 && (
        <View style={styles.entries}>
          {entries.map((entry) => (
            <FoodEntryCard
              key={entry.id}
              entry={entry}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </View>
      )}
      {entries.length === 0 && (
        <TouchableOpacity
          onPress={() => onAdd(mealType)}
          style={styles.emptyRow}
        >
          <Text style={[styles.emptyText, { color: accent }]}>
            食事を追加...
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
    padding: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mealLabel: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  calCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    opacity: 0.8,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  entries: {
    marginTop: 4,
  },
  emptyRow: {
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    opacity: 0.7,
  },
});
