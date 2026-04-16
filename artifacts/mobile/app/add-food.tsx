import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
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
import { MealType, useFoodLog } from "@/context/FoodLogContext";

const COMMON_FOODS = [
  { name: "白米 (150g)", calories: 252, protein: 3.8, carbs: 55.7, fat: 0.5, amount: 150, unit: "g" },
  { name: "食パン (1枚)", calories: 167, protein: 5.6, carbs: 31.5, fat: 2.2, amount: 60, unit: "g" },
  { name: "鶏むね肉 (100g)", calories: 116, protein: 23.3, carbs: 0, fat: 1.9, amount: 100, unit: "g" },
  { name: "卵 (1個)", calories: 91, protein: 7.4, carbs: 0.2, fat: 6.2, amount: 60, unit: "g" },
  { name: "牛乳 (200ml)", calories: 134, protein: 6.6, carbs: 9.6, fat: 7.6, amount: 200, unit: "ml" },
  { name: "バナナ (1本)", calories: 86, protein: 1.1, carbs: 22.5, fat: 0.2, amount: 100, unit: "g" },
  { name: "豆腐 (半丁)", calories: 72, protein: 6.6, carbs: 1.6, fat: 4.2, amount: 150, unit: "g" },
  { name: "サーモン (100g)", calories: 206, protein: 21.1, carbs: 0.1, fat: 12.4, amount: 100, unit: "g" },
];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

export default function AddFoodScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { addEntry, selectedDate } = useFoodLog();

  const mealType = (params.mealType as MealType) ?? "breakfast";

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [amount, setAmount] = useState("100");
  const [unit, setUnit] = useState("g");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCommon, setShowCommon] = useState(true);

  const nameRef = useRef<TextInput>(null);
  const caloriesRef = useRef<TextInput>(null);
  const proteinRef = useRef<TextInput>(null);
  const carbsRef = useRef<TextInput>(null);
  const fatRef = useRef<TextInput>(null);

  const filteredFoods = COMMON_FOODS.filter((f) =>
    f.name.includes(searchQuery)
  );

  const fillCommonFood = (food: (typeof COMMON_FOODS)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setName(food.name);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFat(food.fat.toString());
    setAmount(food.amount.toString());
    setUnit(food.unit);
    setShowCommon(false);
  };

  const isValid =
    name.trim() &&
    parseFloat(calories) > 0;

  const handleSave = async () => {
    if (!isValid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addEntry({
      name: name.trim(),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      amount: parseFloat(amount) || 100,
      unit,
      mealType,
      date: selectedDate,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mealBadge}>
          <Text style={[styles.mealBadgeText, { color: colors.primary }]}>
            {MEAL_LABELS[mealType]}に追加
          </Text>
        </View>

        {showCommon && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              よく食べるもの
            </Text>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="検索..."
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={styles.commonList}>
              {filteredFoods.map((food, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => fillCommonFood(food)}
                  style={[
                    styles.commonItem,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius / 2,
                    },
                  ]}
                >
                  <Text
                    style={[styles.commonName, { color: colors.foreground }]}
                  >
                    {food.name}
                  </Text>
                  <Text
                    style={[
                      styles.commonCals,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {food.calories} kcal
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              手入力
            </Text>
            {!showCommon && (
              <TouchableOpacity onPress={() => setShowCommon(true)}>
                <Text style={[styles.toggleLink, { color: colors.primary }]}>
                  よく食べるもの
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Field label="食品名 *" colors={colors}>
            <TextInput
              ref={nameRef}
              style={[styles.input, { color: colors.foreground }]}
              placeholder="例：鶏むね肉"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              onSubmitEditing={() => caloriesRef.current?.focus()}
            />
          </Field>

          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Field label="量" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="100"
                  placeholderTextColor={colors.mutedForeground}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </Field>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Field label="単位" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="g"
                  placeholderTextColor={colors.mutedForeground}
                  value={unit}
                  onChangeText={setUnit}
                />
              </Field>
            </View>
          </View>

          <Field label="カロリー (kcal) *" colors={colors}>
            <TextInput
              ref={caloriesRef}
              style={[styles.input, { color: colors.foreground }]}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              value={calories}
              onChangeText={setCalories}
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => proteinRef.current?.focus()}
            />
          </Field>

          <View style={styles.macroRow}>
            <View style={{ flex: 1 }}>
              <Field label="タンパク質 (g)" colors={colors}>
                <TextInput
                  ref={proteinRef}
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => carbsRef.current?.focus()}
                />
              </Field>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Field label="炭水化物 (g)" colors={colors}>
                <TextInput
                  ref={carbsRef}
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => fatRef.current?.focus()}
                />
              </Field>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Field label="脂質 (g)" colors={colors}>
                <TextInput
                  ref={fatRef}
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </Field>
            </View>
          </View>
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
          disabled={!isValid}
          style={[
            styles.saveBtn,
            {
              backgroundColor: isValid ? colors.primary : colors.muted,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text
            style={[
              styles.saveBtnText,
              { color: isValid ? colors.primaryForeground : colors.mutedForeground },
            ]}
          >
            追加する
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View
        style={[
          styles.fieldInput,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius / 2,
          },
        ]}
      >
        {children}
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
  mealBadge: {
    marginBottom: 16,
  },
  mealBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  commonList: {
    gap: 6,
  },
  commonItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
  },
  commonName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  commonCals: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  toggleLink: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  row: {
    flexDirection: "row",
  },
  macroRow: {
    flexDirection: "row",
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  fieldInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
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
