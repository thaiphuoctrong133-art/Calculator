// Reusable matrix grid input.
import React from "react";
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

import { colors, space } from "@/src/lib/theme";

type Props = {
  rows: number;
  cols: number;
  values: string[][];
  onChange: (next: string[][]) => void;
  label?: string;
  testIDPrefix?: string;
  showDims?: boolean;
  onChangeDims?: (rows: number, cols: number) => void;
  minDim?: number;
  maxDim?: number;
  isVector?: boolean; // single column treated as vector
};

export function MatrixGridInput({
  rows,
  cols,
  values,
  onChange,
  label,
  testIDPrefix = "mat",
  showDims = true,
  onChangeDims,
  minDim = 1,
  maxDim = 6,
  isVector = false,
}: Props) {
  const setCell = (r: number, c: number, v: string) => {
    const copy = values.map((row) => row.slice());
    if (!copy[r]) copy[r] = [];
    copy[r][c] = v;
    onChange(copy);
  };

  const stepRow = (delta: number) => {
    if (!onChangeDims) return;
    const next = Math.min(maxDim, Math.max(minDim, rows + delta));
    if (next !== rows) onChangeDims(next, cols);
  };
  const stepCol = (delta: number) => {
    if (!onChangeDims) return;
    const next = Math.min(maxDim, Math.max(minDim, cols + delta));
    if (next !== cols) onChangeDims(rows, next);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.wrap}>
        {label ? (
          <View style={styles.headerRow}>
            <Text style={styles.label} testID={`${testIDPrefix}-label`}>
              {label}
            </Text>
            {showDims && onChangeDims ? (
              <View style={styles.dimsRow}>
                <DimStepper
                  label={isVector ? "N" : "R"}
                  value={rows}
                  onDec={() => stepRow(-1)}
                  onInc={() => stepRow(1)}
                  testIDPrefix={`${testIDPrefix}-rows`}
                />
                {!isVector && (
                  <DimStepper
                    label="C"
                    value={cols}
                    onDec={() => stepCol(-1)}
                    onInc={() => stepCol(1)}
                    testIDPrefix={`${testIDPrefix}-cols`}
                  />
                )}
              </View>
            ) : null}
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4 }}
        >
          <View style={styles.bracketWrap}>
            <View style={styles.bracketLeft} />
            <View style={styles.grid}>
              {Array.from({ length: rows }).map((_, r) => (
                <View key={`row-${r}`} style={styles.row}>
                  {Array.from({ length: cols }).map((_, c) => (
                    <TextInput
                      key={`cell-${r}-${c}`}
                      testID={`${testIDPrefix}-cell-${r}-${c}`}
                      style={styles.cell}
                      value={values[r]?.[c] ?? ""}
                      onChangeText={(t) => setCell(r, c, t)}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="default"
                      autoCapitalize="none"
                      autoCorrect={false}
                      selectionColor={colors.cyan}
                    />
                  ))}
                </View>
              ))}
            </View>
            <View style={styles.bracketRight} />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function DimStepper({
  label,
  value,
  onDec,
  onInc,
  testIDPrefix,
}: {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
  testIDPrefix: string;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <TouchableOpacity
        onPress={onDec}
        style={styles.stepBtn}
        testID={`${testIDPrefix}-dec`}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepperValue} testID={`${testIDPrefix}-value`}>
        {value}
      </Text>
      <TouchableOpacity
        onPress={onInc}
        style={styles.stepBtn}
        testID={`${testIDPrefix}-inc`}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
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
  dimsRow: { flexDirection: "row", gap: space.sm },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMain,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 6,
  },
  stepperLabel: {
    color: colors.textMuted,
    fontFamily: "monospace",
    fontSize: 11,
  },
  stepBtn: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    backgroundColor: colors.surfaceInput,
  },
  stepBtnText: { color: colors.cyan, fontSize: 14, lineHeight: 16 },
  stepperValue: {
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: 13,
    minWidth: 16,
    textAlign: "center",
  },
  bracketWrap: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 4,
  },
  bracketLeft: {
    width: 2,
    backgroundColor: colors.textSecondary,
    marginRight: 8,
  },
  bracketRight: {
    width: 2,
    backgroundColor: colors.textSecondary,
    marginLeft: 8,
  },
  grid: { gap: 2 },
  row: { flexDirection: "row", gap: 2 },
  cell: {
    minWidth: 64,
    height: 44,
    paddingHorizontal: 8,
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 4,
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: 13,
    textAlign: "center",
  },
});
