import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFoodLog } from "@/context/FoodLogContext";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { dailyGoal, updateDailyGoal } = useFoodLog();

  const [calories, setCalories] = useState(dailyGoal.calories.toString());
  const [protein, setProtein] = useState(dailyGoal.protein.toString());
  const [carbs, setCarbs] = useState(dailyGoal.carbs.toString());
  const [fat, setFat] = useState(dailyGoal.fat.toString());

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateDailyGoal({
      calories: parseFloat(calories) || 2000,
      protein: parseFloat(protein) || 150,
      carbs: parseFloat(carbs) || 250,
      fat: parseFloat(fat) || 65,
    });
    router.back();
  };

  const presets = [
    { label: "減量 (-20%)", calories: 1600, protein: 140, carbs: 180, fat: 55 },
    { label: "維持", calories: 2000, protein: 150, carbs: 250, fat: 65 },
    { label: "増量 (+20%)", calories: 2400, protein: 180, carbs: 300, fat: 80 },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            プリセット
          </Text>
          <View style={styles.presets}>
            {presets.map((preset) => (
              <TouchableOpacity
                key={preset.label}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCalories(preset.calories.toString());
                  setProtein(preset.protein.toString());
                  setCarbs(preset.carbs.toString());
                  setFat(preset.fat.toString());
                }}
                style={[
                  styles.presetBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius / 2,
                  },
                ]}
              >
                <Text style={[styles.presetLabel, { color: colors.foreground }]}>
                  {preset.label}
                </Text>
                <Text style={[styles.presetCal, { color: colors.primary }]}>
                  {preset.calories} kcal
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            1日の目標
          </Text>

          <GoalField
            label="カロリー"
            unit="kcal"
            value={calories}
            onChangeText={setCalories}
            colors={colors}
          />
          <GoalField
            label="タンパク質"
            unit="g"
            value={protein}
            onChangeText={setProtein}
            colors={colors}
          />
          <GoalField
            label="炭水化物"
            unit="g"
            value={carbs}
            onChangeText={setCarbs}
            colors={colors}
          />
          <GoalField
            label="脂質"
            unit="g"
            value={fat}
            onChangeText={setFat}
            colors={colors}
          />
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <Text style={[styles.infoText, { color: colors.primary }]}>
            目標値は個人の体格・目標によって異なります。
            栄養士や医師に相談することをお勧めします。
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
            保存する
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function GoalField({
  label,
  unit,
  value,
  onChangeText,
  colors,
}: {
  label: string;
  unit: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.goalField,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius / 2,
        },
      ]}
    >
      <Text style={[styles.goalLabel, { color: colors.foreground }]}>
        {label}
      </Text>
      <View style={styles.goalInputRow}>
        <TextInput
          style={[styles.goalInput, { color: colors.primary }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
        />
        <Text style={[styles.goalUnit, { color: colors.mutedForeground }]}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  presets: {
    flexDirection: "row",
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  presetCal: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  goalField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  goalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  goalInput: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    minWidth: 60,
  },
  goalUnit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  infoBox: {
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
