import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { FoodEntry } from "@/context/FoodLogContext";

interface FoodEntryCardProps {
  entry: FoodEntry;
  onDelete: (id: string) => void;
  onEdit: (entry: FoodEntry) => void;
}

export function FoodEntryCard({ entry, onDelete, onEdit }: FoodEntryCardProps) {
  const colors = useColors();

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") {
      if (window.confirm(`「${entry.name}」を削除しますか？`)) {
        onDelete(entry.id);
      }
    } else {
      Alert.alert("削除", `「${entry.name}」を削除しますか？`, [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => onDelete(entry.id),
        },
      ]);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.main}>
        <Pressable
          style={styles.info}
          onPress={() => onEdit(entry)}
          android_ripple={{ color: colors.muted }}
        >
          <Text
            style={[styles.name, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {entry.name}
          </Text>
          <Text style={[styles.amount, { color: colors.mutedForeground }]}>
            {entry.amount}{entry.unit}
          </Text>
        </Pressable>

        <View style={styles.right}>
          <Text style={[styles.calories, { color: colors.primary }]}>
            {entry.calories.toFixed(0)}
          </Text>
          <Text style={[styles.kcal, { color: colors.mutedForeground }]}>
            kcal
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.5}
        >
          <Feather name="trash-2" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <View style={[styles.macros, { borderTopColor: colors.border }]}>
        <MacroChip label="P" value={entry.protein} color={colors.protein} />
        <MacroChip label="C" value={entry.carbs} color={colors.carbs} />
        <MacroChip label="F" value={entry.fat} color={colors.fat} />
      </View>
    </View>
  );
}

function MacroChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.chip}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
      <Text style={styles.chipValue}>{value.toFixed(1)}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  main: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 8,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  amount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  right: {
    alignItems: "flex-end",
    marginRight: 4,
  },
  calories: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  kcal: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
  },
  macros: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    gap: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  chipValue: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#777777",
  },
});
