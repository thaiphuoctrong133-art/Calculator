// Renders a matrix or vector with mathematical bracket notation.
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { formatComplex } from "@/src/lib/complex";
import type { Matrix, Vector } from "@/src/lib/complex";
import { colors, space } from "@/src/lib/theme";

type Props = {
  matrix?: Matrix;
  vector?: Vector;
  label?: string;
  testID?: string;
};

export function MatrixDisplay({ matrix, vector, label, testID }: Props) {
  const data: Matrix = matrix
    ? matrix
    : vector
      ? vector.map((v) => [v])
      : [];

  if (data.length === 0) return null;

  return (
    <View style={styles.wrap} testID={testID}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.bracketWrap}>
          <View style={styles.bracketLeft} />
          <View style={styles.grid}>
            {data.map((row, r) => (
              <View key={`r-${r}`} style={styles.row}>
                {row.map((cell, c) => (
                  <View key={`c-${r}-${c}`} style={styles.cell}>
                    <Text style={styles.cellText} numberOfLines={1}>
                      {formatComplex(cell)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={styles.bracketRight} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  bracketWrap: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: 4,
  },
  bracketLeft: {
    width: 2,
    backgroundColor: colors.cyan,
    marginRight: 10,
  },
  bracketRight: {
    width: 2,
    backgroundColor: colors.cyan,
    marginLeft: 10,
  },
  grid: { gap: 6 },
  row: { flexDirection: "row", gap: 6 },
  cell: {
    minWidth: 72,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: {
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: 14,
  },
});
