import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
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

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

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

  // Label scan state
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const scanPulse = useRef(new Animated.Value(1)).current;

  // AI estimate state
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [estimateImage, setEstimateImage] = useState<string | null>(null);
  const [estimateImageUri, setEstimateImageUri] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateSuccess, setEstimateSuccess] = useState(false);
  const [isEstimate, setIsEstimate] = useState(false);
  const estimatePulse = useRef(new Animated.Value(1)).current;

  const nameRef = useRef<TextInput>(null);
  const caloriesRef = useRef<TextInput>(null);
  const proteinRef = useRef<TextInput>(null);
  const carbsRef = useRef<TextInput>(null);
  const fatRef = useRef<TextInput>(null);

  const filteredFoods = COMMON_FOODS.filter((f) => f.name.includes(searchQuery));

  const fillCommonFood = (food: (typeof COMMON_FOODS)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setName(food.name);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFat(food.fat.toString());
    setAmount(food.amount.toString());
    setUnit(food.unit);
    setIsEstimate(false);
    setShowCommon(false);
  };

  const startPulse = (anim: Animated.Value) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.04, duration: 600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = (anim: Animated.Value) => {
    anim.stopAnimation();
    anim.setValue(1);
  };

  // ---- Label scan ----
  const analyzeLabel = async (base64: string) => {
    setScanning(true);
    setScanSuccess(false);
    startPulse(scanPulse);
    try {
      const res = await fetch(`${API_BASE}/api/nutrition-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      if (!res.ok) throw new Error("Scan failed");
      const data = await res.json();
      if (data.calories > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (data.name && data.name !== "食品名") setName(data.name);
        setCalories(data.calories.toString());
        setProtein((data.protein ?? 0).toString());
        setCarbs((data.carbs ?? 0).toString());
        setFat((data.fat ?? 0).toString());
        if (data.amount) setAmount(data.amount.toString());
        if (data.unit) setUnit(data.unit);
        setIsEstimate(false);
        setScanSuccess(true);
        setShowCommon(false);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("読み取りに失敗", "成分表を正面からはっきり撮影して再試行してください。");
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("エラー", "画像の解析に失敗しました。もう一度お試しください。");
    } finally {
      setScanning(false);
      stopPulse(scanPulse);
    }
  };

  const handleScanCamera = async () => {
    if (Platform.OS === "web") {
      Alert.alert("非対応", "カメラ機能はスマートフォンのExpo Goでご利用ください。");
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("カメラへのアクセスが必要です", "設定からカメラの使用を許可してください。");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]?.base64) {
      await analyzeLabel(result.assets[0].base64);
    }
  };

  const handleScanGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("写真へのアクセスが必要です", "設定から写真ライブラリの使用を許可してください。");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]?.base64) {
      await analyzeLabel(result.assets[0].base64);
    }
  };

  const showScanOptions = () => {
    if (Platform.OS === "web") { handleScanGallery(); return; }
    Alert.alert("成分表を読み取る", "撮影方法を選択してください", [
      { text: "カメラで撮影", onPress: handleScanCamera },
      { text: "アルバムから選ぶ", onPress: handleScanGallery },
      { text: "キャンセル", style: "cancel" },
    ]);
  };

  // ---- AI Estimate ----
  const pickEstimateCamera = async () => {
    if (Platform.OS === "web") return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("カメラへのアクセスが必要です", "設定からカメラの使用を許可してください。");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.6, base64: true });
    if (!result.canceled && result.assets[0]) {
      setEstimateImage(result.assets[0].base64 ?? null);
      setEstimateImageUri(result.assets[0].uri);
    }
  };

  const pickEstimateGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("写真へのアクセスが必要です", "設定から写真ライブラリの使用を許可してください。");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6, base64: true });
    if (!result.canceled && result.assets[0]) {
      setEstimateImage(result.assets[0].base64 ?? null);
      setEstimateImageUri(result.assets[0].uri);
    }
  };

  const runEstimate = async () => {
    if (!name.trim() && !estimateImage) {
      Alert.alert("料理名または写真が必要です", "料理名を入力するか、写真を選択してください。");
      return;
    }
    setEstimating(true);
    setEstimateSuccess(false);
    startPulse(estimatePulse);
    try {
      const res = await fetch(`${API_BASE}/api/food-estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          imageBase64: estimateImage || undefined,
        }),
      });
      if (!res.ok) throw new Error("Estimate failed");
      const data = await res.json();
      if (data.calories > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (data.name && data.name !== "食品名") setName(data.name);
        setCalories(data.calories.toString());
        setProtein((data.protein ?? 0).toString());
        setCarbs((data.carbs ?? 0).toString());
        setFat((data.fat ?? 0).toString());
        if (data.amount) setAmount(data.amount.toString());
        if (data.unit) setUnit(data.unit);
        setIsEstimate(true);
        setEstimateSuccess(true);
        setShowCommon(false);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("推定に失敗", "料理名を具体的に入力するか、写真を選択して再試行してください。");
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("エラー", "栄養素の推定に失敗しました。もう一度お試しください。");
    } finally {
      setEstimating(false);
      stopPulse(estimatePulse);
    }
  };

  const isValid = name.trim() && parseFloat(calories) > 0;
  const isBusy = scanning || estimating;

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
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mealBadge}>
          <Text style={[styles.mealBadgeText, { color: colors.primary }]}>
            {MEAL_LABELS[mealType]}に追加
          </Text>
        </View>

        {/* ---- Label Scan Card ---- */}
        <Animated.View style={{ transform: [{ scale: scanPulse }], marginBottom: 10 }}>
          <TouchableOpacity
            onPress={showScanOptions}
            disabled={isBusy}
            style={[
              styles.aiCard,
              {
                backgroundColor: scanSuccess ? colors.secondary : colors.card,
                borderColor: scanSuccess ? colors.primary : colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            {scanning ? (
              <>
                <ActivityIndicator color={colors.primary} size="small" />
                <View style={styles.aiTextCol}>
                  <Text style={[styles.aiTitle, { color: colors.foreground }]}>読み取り中...</Text>
                  <Text style={[styles.aiSub, { color: colors.mutedForeground }]}>AIが成分表を解析しています</Text>
                </View>
              </>
            ) : scanSuccess ? (
              <>
                <Feather name="check-circle" size={24} color={colors.primary} />
                <View style={styles.aiTextCol}>
                  <Text style={[styles.aiTitle, { color: colors.primary }]}>成分表の読み取り完了</Text>
                  <Text style={[styles.aiSub, { color: colors.mutedForeground }]}>タップして再スキャン</Text>
                </View>
              </>
            ) : (
              <>
                <Feather name="camera" size={24} color={colors.primary} />
                <View style={styles.aiTextCol}>
                  <Text style={[styles.aiTitle, { color: colors.foreground }]}>成分表を写真で読み取る</Text>
                  <Text style={[styles.aiSub, { color: colors.mutedForeground }]}>パッケージの栄養成分表示を撮影</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* ---- AI Estimate Card ---- */}
        <View
          style={[
            styles.estimateCard,
            {
              backgroundColor: colors.card,
              borderColor: estimateSuccess ? "#7B1FA2" : colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          {/* Header row */}
          <TouchableOpacity
            onPress={() => setEstimateOpen((v) => !v)}
            disabled={isBusy}
            style={styles.estimateHeader}
          >
            <Feather name="zap" size={22} color="#7B1FA2" />
            <View style={styles.aiTextCol}>
              <Text style={[styles.aiTitle, { color: estimateSuccess ? "#7B1FA2" : colors.foreground }]}>
                {estimateSuccess ? "AI推定完了（タップで再推定）" : "料理名・写真でAI推定"}
              </Text>
              <Text style={[styles.aiSub, { color: colors.mutedForeground }]}>
                手料理・外食のカロリーをAIが予測
              </Text>
            </View>
            <Feather
              name={estimateOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>

          {/* Expanded panel */}
          {estimateOpen && (
            <View style={[styles.estimatePanel, { borderTopColor: colors.border }]}>
              {/* Photo area */}
              <Text style={[styles.estimatePanelLabel, { color: colors.mutedForeground }]}>
                料理の写真（任意・あると精度UP）
              </Text>

              {estimateImageUri ? (
                <View style={styles.imagePreviewRow}>
                  <Image source={{ uri: estimateImageUri }} style={[styles.imagePreview, { borderRadius: colors.radius / 2 }]} />
                  <TouchableOpacity
                    onPress={() => { setEstimateImage(null); setEstimateImageUri(null); }}
                    style={[styles.imageClearBtn, { backgroundColor: colors.muted, borderRadius: 20 }]}
                  >
                    <Feather name="x" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoButtonRow}>
                  {Platform.OS !== "web" && (
                    <TouchableOpacity
                      onPress={pickEstimateCamera}
                      style={[styles.photoBtn, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: colors.radius / 2 }]}
                    >
                      <Feather name="camera" size={20} color="#7B1FA2" />
                      <Text style={[styles.photoBtnText, { color: colors.foreground }]}>カメラで撮影</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={pickEstimateGallery}
                    style={[styles.photoBtn, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: colors.radius / 2 }]}
                  >
                    <Feather name="image" size={20} color="#7B1FA2" />
                    <Text style={[styles.photoBtnText, { color: colors.foreground }]}>アルバムから選ぶ</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Hint */}
              <Text style={[styles.estimateHint, { color: colors.mutedForeground }]}>
                下の「食品名」欄に料理名も入力すると精度が上がります
              </Text>

              {/* Run button */}
              <Animated.View style={{ transform: [{ scale: estimatePulse }] }}>
                <TouchableOpacity
                  onPress={runEstimate}
                  disabled={estimating || isBusy}
                  style={[
                    styles.estimateRunBtn,
                    { backgroundColor: estimating ? colors.muted : "#7B1FA2", borderRadius: colors.radius / 2 },
                  ]}
                >
                  {estimating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Feather name="zap" size={16} color="#fff" />
                  )}
                  <Text style={styles.estimateRunBtnText}>
                    {estimating ? "推定中..." : "AIでカロリーを推定する"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}
        </View>

        <View style={{ height: 16 }} />

        {/* ---- Common Foods ---- */}
        {showCommon && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>よく食べるもの</Text>
            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
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
                  style={[styles.commonItem, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius / 2 }]}
                >
                  <Text style={[styles.commonName, { color: colors.foreground }]}>{food.name}</Text>
                  <Text style={[styles.commonCals, { color: colors.mutedForeground }]}>{food.calories} kcal</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ---- Manual Input ---- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>手入力</Text>
            {!showCommon && (
              <TouchableOpacity onPress={() => setShowCommon(true)}>
                <Text style={[styles.toggleLink, { color: colors.primary }]}>よく食べるもの</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEstimate && (
            <View style={[styles.estimateBadge, { backgroundColor: "#F3E5F5", borderColor: "#CE93D8" }]}>
              <Feather name="info" size={13} color="#7B1FA2" />
              <Text style={[styles.estimateBadgeText, { color: "#7B1FA2" }]}>
                ※ AI推定値です。実際の値と異なる場合があります。必要に応じて修正してください。
              </Text>
            </View>
          )}

          <Field label="食品名 *" colors={colors}>
            <TextInput
              ref={nameRef}
              style={[styles.input, { color: colors.foreground }]}
              placeholder="例：カレーライス"
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

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid}
          style={[styles.saveBtn, { backgroundColor: isValid ? colors.primary : colors.muted, borderRadius: colors.radius }]}
        >
          <Text style={[styles.saveBtnText, { color: isValid ? colors.primaryForeground : colors.mutedForeground }]}>
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
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius / 2 }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  mealBadge: { marginBottom: 12 },
  mealBadgeText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  aiCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  aiTextCol: { flex: 1 },
  aiTitle: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  aiSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  estimateCard: {
    borderWidth: 1.5,
    overflow: "hidden",
  },
  estimateHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  estimatePanel: {
    borderTopWidth: 1,
    padding: 14,
    gap: 10,
  },
  estimatePanelLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  photoButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
  },
  photoBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  imagePreviewRow: {
    position: "relative",
    alignSelf: "flex-start",
  },
  imagePreview: {
    width: 120,
    height: 90,
  },
  imageClearBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  estimateHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  estimateRunBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    marginTop: 2,
  },
  estimateRunBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  estimateBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  estimateBadgeText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 10 },
  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, gap: 8, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  commonList: { gap: 6 },
  commonItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, borderWidth: 1 },
  commonName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  commonCals: { fontSize: 12, fontFamily: "Inter_400Regular" },
  toggleLink: { fontSize: 13, fontFamily: "Inter_500Medium" },

  row: { flexDirection: "row" },
  macroRow: { flexDirection: "row" },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4 },
  fieldInput: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  input: { fontSize: 15, fontFamily: "Inter_400Regular" },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  saveBtn: { alignItems: "center", paddingVertical: 14 },
  saveBtnText: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
