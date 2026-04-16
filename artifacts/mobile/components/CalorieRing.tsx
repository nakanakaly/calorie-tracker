import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export function CalorieRing({
  consumed,
  goal,
  size = 180,
  strokeWidth = 14,
}: CalorieRingProps) {
  const colors = useColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  const percentage = Math.min(consumed / goal, 1);

  useEffect(() => {
    progress.value = withTiming(percentage, { duration: 800 });
  }, [percentage]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.muted}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? colors.destructive : colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.consumed, { color: colors.foreground }]}>
          {consumed.toFixed(0)}
        </Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          kcal
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.remaining, { color: isOver ? colors.destructive : colors.mutedForeground }]}>
          {isOver ? `+${(consumed - goal).toFixed(0)}` : remaining.toFixed(0)}
        </Text>
        <Text style={[styles.remainingLabel, { color: colors.mutedForeground }]}>
          {isOver ? "超過" : "残り"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  consumed: {
    fontSize: 40,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 44,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 0,
  },
  divider: {
    width: 40,
    height: 1,
    marginVertical: 4,
  },
  remaining: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  remainingLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
