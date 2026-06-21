// Histogram for measure() results.
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, space } from "@/src/lib/theme";

type Props = {
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  shots: number;
  testID?: string;
};

export function Histogram({ counts, probabilities, shots, testID }: Props) {
  const labels = Object.keys(counts);
  const max = Math.max(1, ...Object.values(counts));

  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>MEASUREMENT · {shots} shots</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chart}>
          {labels.map((lab) => {
            const count = counts[lab];
            const prob = probabilities[lab] ?? 0;
            const pct = (count / max) * 100;
            return (
              <View
                key={lab}
                style={styles.barWrap}
                testID={`hist-bar-${lab}`}
              >
                <Text style={styles.count}>{count}</Text>
                <View style={styles.barArea}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(2, pct)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{lab}</Text>
                <Text style={styles.prob}>{(prob * 100).toFixed(1)}%</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    padding: space.md,
    gap: space.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
    minHeight: 220,
    paddingHorizontal: space.sm,
  },
  barWrap: {
    alignItems: "center",
    gap: 4,
    width: 56,
  },
  count: {
    color: colors.cyan,
    fontFamily: "monospace",
    fontSize: 11,
  },
  barArea: {
    width: "100%",
    height: 160,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  bar: {
    width: "70%",
    alignSelf: "center",
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    shadowColor: colors.cyan,
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  barLabel: {
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: 12,
  },
  prob: {
    color: colors.textMuted,
    fontFamily: "monospace",
    fontSize: 10,
  },
});
