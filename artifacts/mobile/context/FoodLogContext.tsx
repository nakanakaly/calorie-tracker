import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  amount: number;
  unit: string;
  mealType: MealType;
  date: string;
  createdAt: number;
}

export interface DailyGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodLogContextType {
  entries: FoodEntry[];
  dailyGoal: DailyGoal;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  addEntry: (entry: Omit<FoodEntry, "id" | "createdAt">) => Promise<void>;
  updateEntry: (id: string, entry: Partial<FoodEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  updateDailyGoal: (goal: DailyGoal) => Promise<void>;
  getEntriesForDate: (date: string) => FoodEntry[];
  getDailySummary: (date: string) => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

const STORAGE_KEYS = {
  ENTRIES: "@food_log_entries",
  GOAL: "@food_log_goal",
};

const DEFAULT_GOAL: DailyGoal = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
};

const FoodLogContext = createContext<FoodLogContextType | null>(null);

export function FoodLogProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(DEFAULT_GOAL);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesRaw, goalRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.GOAL),
      ]);
      if (entriesRaw) setEntries(JSON.parse(entriesRaw));
      if (goalRaw) setDailyGoal(JSON.parse(goalRaw));
    } catch (e) {
      console.error("Failed to load food log data", e);
    }
  };

  const saveEntries = async (newEntries: FoodEntry[]) => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ENTRIES,
      JSON.stringify(newEntries)
    );
  };

  const addEntry = useCallback(
    async (entry: Omit<FoodEntry, "id" | "createdAt">) => {
      const newEntry: FoodEntry = {
        ...entry,
        id:
          Date.now().toString() + Math.random().toString(36).substring(2, 9),
        createdAt: Date.now(),
      };
      const updated = [...entries, newEntry];
      setEntries(updated);
      await saveEntries(updated);
    },
    [entries]
  );

  const updateEntry = useCallback(
    async (id: string, partial: Partial<FoodEntry>) => {
      const updated = entries.map((e) =>
        e.id === id ? { ...e, ...partial } : e
      );
      setEntries(updated);
      await saveEntries(updated);
    },
    [entries]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const updated = entries.filter((e) => e.id !== id);
      setEntries(updated);
      await saveEntries(updated);
    },
    [entries]
  );

  const updateDailyGoal = useCallback(async (goal: DailyGoal) => {
    setDailyGoal(goal);
    await AsyncStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify(goal));
  }, []);

  const getEntriesForDate = useCallback(
    (date: string) => entries.filter((e) => e.date === date),
    [entries]
  );

  const getDailySummary = useCallback(
    (date: string) => {
      const dayEntries = entries.filter((e) => e.date === date);
      return dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          carbs: acc.carbs + e.carbs,
          fat: acc.fat + e.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    },
    [entries]
  );

  return (
    <FoodLogContext.Provider
      value={{
        entries,
        dailyGoal,
        selectedDate,
        setSelectedDate,
        addEntry,
        updateEntry,
        deleteEntry,
        updateDailyGoal,
        getEntriesForDate,
        getDailySummary,
      }}
    >
      {children}
    </FoodLogContext.Provider>
  );
}

export function useFoodLog() {
  const ctx = useContext(FoodLogContext);
  if (!ctx) throw new Error("useFoodLog must be used within FoodLogProvider");
  return ctx;
}
