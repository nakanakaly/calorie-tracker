import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Alert,
  Animated,
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("削除", `「${entry.name}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => onDelete(entry.id),
      },
    ]);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onEdit(entry)}
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
          <View style={styles.info}>
            <Text
              style={[styles.name, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {entry.name}
            </Text>
            <Text style={[styles.amount, { color: colors.mutedForeground }]}>
              {entry.amount}{entry.unit}
            </Text>
          </View>
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="trash-2" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <View style={[styles.macros, { borderTopColor: colors.border }]}>
          <MacroChip label="P" value={entry.protein} color={colors.protein} />
          <MacroChip label="C" value={entry.carbs} color={colors.carbs} />
          <MacroChip label="F" value={entry.fat} color={colors.fat} />
        </View>
      </TouchableOpacity>
    </Animated.View>
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
      <Text style={[styles.chipValue]}>{value.toFixed(1)}g</Text>
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
    padding: 12,
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
    padding: 4,
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
