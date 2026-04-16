import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface MacroBarProps {
  label: string;
  consumed: number;
  goal: number;
  color: string;
  unit?: string;
}

export function MacroBar({
  label,
  consumed,
  goal,
  color,
  unit = "g",
}: MacroBarProps) {
  const colors = useColors();
  const progress = useSharedValue(0);
  const percentage = Math.min(consumed / goal, 1);

  useEffect(() => {
    progress.value = withTiming(percentage, { duration: 700 });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
        </Text>
        <Text style={[styles.values, { color: colors.mutedForeground }]}>
          {consumed.toFixed(1)}{unit}
          <Text style={styles.separator}> / </Text>
          {goal}{unit}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <Animated.View
          style={[styles.fill, animatedStyle, { backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  values: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  separator: {
    opacity: 0.5,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
});
