import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  clearHistory,
  HistoryEntry,
  loadHistory,
} from "@/src/lib/history";
import { colors, space } from "@/src/lib/theme";

const OP_LABELS: Record<string, string> = {
  multiply_matrix: "Matrix Multiply",
  apply_gate: "Apply Gate",
  normalize_vector: "Normalize Vector",
  tensor_product: "Tensor Product",
  measure: "Measure",
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function HistoryScreen() {
  const [items, setItems] = useState<HistoryEntry[]>([]);

  const refresh = useCallback(async () => {
    setItems(await loadHistory());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onClear = async () => {
    await clearHistory();
    setItems([]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>
            {items.length} {items.length === 1 ? "entry" : "entries"} stored locally
          </Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={onClear}
            testID="clear-history-btn"
          >
            <Ionicons name="trash-outline" size={14} color={colors.danger} />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(it) => it.id}
        ListEmptyComponent={
          <View style={styles.empty} testID="history-empty">
            <Ionicons name="time-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No calculations yet</Text>
            <Text style={styles.emptySub}>
              Run an operation from the Calculator tab to see it here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card} testID={`history-${item.id}`}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardOp}>
                {OP_LABELS[item.op] ?? item.op}
              </Text>
              <Text style={styles.cardTime}>{timeAgo(item.timestamp)}</Text>
            </View>
            <Text style={styles.cardSummary}>{item.summary}</Text>
            <Text style={styles.cardPreview} numberOfLines={2}>
              {summarizeResult(item)}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function summarizeResult(item: HistoryEntry): string {
  const r = item.result as Record<string, unknown>;
  if (r && Array.isArray(r.matrix)) {
    const m = r.matrix as string[][];
    return `→ matrix ${m.length}×${m[0]?.length ?? 0}`;
  }
  if (r && Array.isArray(r.vector)) {
    const v = r.vector as string[];
    return `→ [${v.slice(0, 4).join(", ")}${v.length > 4 ? ", …" : ""}]`;
  }
  if (r && r.counts) {
    const counts = r.counts as Record<string, number>;
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${k}:${v}`)
      .join(" · ");
    return `→ ${top}`;
  }
  return "→ result";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,84,112,0.3)",
  },
  clearBtnText: { color: colors.danger, fontSize: 12, fontWeight: "500" },
  list: {
    paddingHorizontal: space.md,
    paddingBottom: 100,
    gap: space.md,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 80,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: space.md,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardOp: { color: colors.cyan, fontSize: 13, fontWeight: "600" },
  cardTime: { color: colors.textMuted, fontSize: 11, fontFamily: "monospace" },
  cardSummary: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: "monospace",
  },
  cardPreview: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: "monospace",
  },
});
