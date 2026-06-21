import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { Histogram } from "@/src/components/Histogram";
import { MatrixDisplay } from "@/src/components/MatrixDisplay";
import { MatrixGridInput } from "@/src/components/MatrixGridInput";
import type { Matrix, Vector } from "@/src/lib/complex";
import { saveHistoryEntry } from "@/src/lib/history";
import {
  GATES,
  MeasureResult,
  apply_gate,
  measure,
  multiply_matrix,
  normalize_vector,
  shape,
  tensor_product,
} from "@/src/lib/quantum";
import {
  jsonToMatrix,
  jsonToVector,
  matrixToStrings,
  stringsToMatrix,
  stringsToVector,
  vectorToStrings,
} from "@/src/lib/serialize";
import { colors, space } from "@/src/lib/theme";

type Op = "multiply_matrix" | "apply_gate" | "normalize_vector" | "tensor_product" | "measure";
type InputMode = "grid" | "json";

const OPS: { id: Op; label: string; sub: string }[] = [
  { id: "multiply_matrix", label: "Multiply Matrices", sub: "A · B" },
  { id: "apply_gate", label: "Apply Gate", sub: "G |ψ⟩" },
  { id: "normalize_vector", label: "Normalize Vector", sub: "v / ‖v‖" },
  { id: "tensor_product", label: "Tensor Product", sub: "A ⊗ B" },
  { id: "measure", label: "Measure", sub: "|ψ⟩ → shots" },
];

const emptyGrid = (rows: number, cols: number, seed?: string[][]): string[][] =>
  Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => seed?.[r]?.[c] ?? ""),
  );

const sampleMat2x2 = (): string[][] => [
  ["1", "0"],
  ["0", "1"],
];

export default function CalculatorScreen() {
  const router = useRouter();

  const [op, setOp] = useState<Op>("multiply_matrix");
  const [mode, setMode] = useState<InputMode>("grid");

  // Matrix A (also used as "state" for apply_gate)
  const [aRows, setARows] = useState(2);
  const [aCols, setACols] = useState(2);
  const [aGrid, setAGrid] = useState<string[][]>(sampleMat2x2);
  const [aJson, setAJson] = useState<string>(JSON.stringify(sampleMat2x2()));

  // Matrix B (or gate name for apply_gate)
  const [bRows, setBRows] = useState(2);
  const [bCols, setBCols] = useState(2);
  const [bGrid, setBGrid] = useState<string[][]>(sampleMat2x2);
  const [bJson, setBJson] = useState<string>(JSON.stringify(sampleMat2x2()));

  // Vector v (for normalize_vector / measure / apply_gate state)
  const [vLen, setVLen] = useState(2);
  const [vGrid, setVGrid] = useState<string[][]>([["1"], ["0"]]);
  const [vJson, setVJson] = useState<string>(JSON.stringify(["1", "0"]));

  const [gateKey, setGateKey] = useState<keyof typeof GATES>("H");
  const [shots, setShots] = useState<string>("1024");

  const [error, setError] = useState<string | null>(null);
  const [resultMatrix, setResultMatrix] = useState<Matrix | null>(null);
  const [resultVector, setResultVector] = useState<Vector | null>(null);
  const [resultMeasure, setResultMeasure] = useState<MeasureResult | null>(null);
  const [resultLabel, setResultLabel] = useState<string>("");

  const resultRef = useRef<View>(null);

  // sync grid <-> json when switching mode
  const switchMode = (next: InputMode) => {
    if (next === mode) return;
    try {
      if (next === "json") {
        setAJson(JSON.stringify(aGrid));
        setBJson(JSON.stringify(bGrid));
        setVJson(JSON.stringify(vGrid.map((r) => r[0] ?? "0")));
      } else {
        if (op !== "normalize_vector" && op !== "measure") {
          const am = jsonToMatrix(aJson);
          setAGrid(matrixToStrings(am));
          setARows(am.length);
          setACols(am[0]?.length ?? 1);
        }
        if (op === "multiply_matrix" || op === "tensor_product") {
          const bm = jsonToMatrix(bJson);
          setBGrid(matrixToStrings(bm));
          setBRows(bm.length);
          setBCols(bm[0]?.length ?? 1);
        }
        if (op === "normalize_vector" || op === "measure") {
          const vv = jsonToVector(vJson);
          setVGrid(vv.map((c) => [c.re === 0 && c.im === 0 ? "0" : "" + JSON.stringify(c)]));
          setVLen(vv.length);
          setVGrid(vectorToStrings(vv).map((s) => [s]));
        }
      }
    } catch {
      // ignore parse error here; user will see it on compute
    }
    setMode(next);
  };

  // when op changes, reset some state
  useEffect(() => {
    setError(null);
    setResultMatrix(null);
    setResultVector(null);
    setResultMeasure(null);
    setResultLabel("");
  }, [op]);

  // Resize grid when dim changes
  const onChangeADims = (r: number, c: number) => {
    setARows(r);
    setACols(c);
    setAGrid((prev) => emptyGrid(r, c, prev));
  };
  const onChangeBDims = (r: number, c: number) => {
    setBRows(r);
    setBCols(c);
    setBGrid((prev) => emptyGrid(r, c, prev));
  };
  const onChangeVDims = (n: number) => {
    setVLen(n);
    setVGrid((prev) => emptyGrid(n, 1, prev));
  };

  const parseA = (): Matrix =>
    mode === "grid" ? stringsToMatrix(aGrid) : jsonToMatrix(aJson);
  const parseB = (): Matrix =>
    mode === "grid" ? stringsToMatrix(bGrid) : jsonToMatrix(bJson);
  const parseV = (): Vector =>
    mode === "grid"
      ? stringsToVector(vGrid.map((r) => r[0] ?? "0"))
      : jsonToVector(vJson);

  const compute = async () => {
    setError(null);
    setResultMatrix(null);
    setResultVector(null);
    setResultMeasure(null);
    try {
      if (op === "multiply_matrix") {
        const a = parseA();
        const b = parseB();
        const r = multiply_matrix(a, b);
        const [ar, ac] = shape(a);
        const [br, bc] = shape(b);
        setResultMatrix(r);
        setResultLabel(`A·B  (${ar}×${ac}) · (${br}×${bc})`);
        await saveHistoryEntry({
          id: `${Date.now()}`,
          timestamp: Date.now(),
          op,
          summary: `${ar}×${ac} · ${br}×${bc}`,
          inputs: { a: matrixToStrings(a), b: matrixToStrings(b) },
          result: { matrix: matrixToStrings(r) },
        });
      } else if (op === "tensor_product") {
        const a = parseA();
        const b = parseB();
        const r = tensor_product(a, b);
        const [ar, ac] = shape(a);
        const [br, bc] = shape(b);
        setResultMatrix(r);
        setResultLabel(`A ⊗ B  → (${ar * br}×${ac * bc})`);
        await saveHistoryEntry({
          id: `${Date.now()}`,
          timestamp: Date.now(),
          op,
          summary: `${ar}×${ac} ⊗ ${br}×${bc}`,
          inputs: { a: matrixToStrings(a), b: matrixToStrings(b) },
          result: { matrix: matrixToStrings(r) },
        });
      } else if (op === "normalize_vector") {
        const v = parseV();
        const r = normalize_vector(v);
        setResultVector(r);
        setResultLabel(`normalize · length ${v.length}`);
        await saveHistoryEntry({
          id: `${Date.now()}`,
          timestamp: Date.now(),
          op,
          summary: `length ${v.length}`,
          inputs: { v: vectorToStrings(v) },
          result: { vector: vectorToStrings(r) },
        });
      } else if (op === "apply_gate") {
        const g = GATES[gateKey].matrix;
        const v = parseV();
        const r = apply_gate(v, g);
        setResultVector(r);
        setResultLabel(`${GATES[gateKey].symbol} |ψ⟩`);
        await saveHistoryEntry({
          id: `${Date.now()}`,
          timestamp: Date.now(),
          op,
          summary: `${GATES[gateKey].symbol} on length ${v.length}`,
          inputs: { gate: gateKey, v: vectorToStrings(v) },
          result: { vector: vectorToStrings(r) },
        });
      } else if (op === "measure") {
        const v = parseV();
        const shotsN = Math.max(1, Math.floor(Number(shots) || 0));
        const r = measure(v, shotsN);
        setResultMeasure(r);
        setResultLabel(`${shotsN} shots`);
        await saveHistoryEntry({
          id: `${Date.now()}`,
          timestamp: Date.now(),
          op,
          summary: `${shotsN} shots on length ${v.length}`,
          inputs: { v: vectorToStrings(v), shots: shotsN },
          result: { counts: r.counts, probabilities: r.probabilities },
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
  };

  const fillSample = () => {
    setError(null);
    if (op === "multiply_matrix") {
      setARows(2); setACols(2);
      setAGrid([["1", "2"], ["3", "4"]]);
      setBRows(2); setBCols(2);
      setBGrid([["2", "0"], ["1", "2"]]);
      setAJson(JSON.stringify([["1","2"],["3","4"]]));
      setBJson(JSON.stringify([["2","0"],["1","2"]]));
    } else if (op === "tensor_product") {
      setARows(2); setACols(2);
      setAGrid([["1", "0"], ["0", "1"]]);
      setBRows(2); setBCols(2);
      setBGrid([["0", "1"], ["1", "0"]]);
      setAJson(JSON.stringify([["1","0"],["0","1"]]));
      setBJson(JSON.stringify([["0","1"],["1","0"]]));
    } else if (op === "normalize_vector") {
      setVLen(2);
      setVGrid([["3"], ["4"]]);
      setVJson(JSON.stringify(["3","4"]));
    } else if (op === "apply_gate") {
      setGateKey("H");
      setVLen(2);
      setVGrid([["1"], ["0"]]);
      setVJson(JSON.stringify(["1","0"]));
    } else if (op === "measure") {
      setVLen(2);
      setVGrid([["0.707"], ["0.707"]]);
      setVJson(JSON.stringify(["0.707","0.707"]));
      setShots("1024");
    }
  };

  const showAandB = op === "multiply_matrix" || op === "tensor_product";
  const showV = op === "normalize_vector" || op === "apply_gate" || op === "measure";
  const showGateSelect = op === "apply_gate";
  const showShots = op === "measure";

  // for apply_gate we want vector length = gate dim
  const requiredVLen = showGateSelect ? GATES[gateKey].matrix.length : null;
  useEffect(() => {
    if (requiredVLen && vLen !== requiredVLen) {
      onChangeVDims(requiredVLen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiredVLen]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title} testID="screen-title">
              Quantum Calculator
            </Text>
            <Text style={styles.subtitle}>
              Matrix · Vector · Gate · Measurement
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/reference")}
            testID="goto-reference"
            style={styles.iconBtn}
          >
            <Ionicons name="information-circle-outline" size={22} color={colors.cyan} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* OPERATION PICKER (horizontal chip row, sticky-style) */}
          <Text style={styles.sectionLabel}>OPERATION</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.opRow}
          >
            {OPS.map((o) => {
              const active = o.id === op;
              return (
                <TouchableOpacity
                  key={o.id}
                  onPress={() => setOp(o.id)}
                  style={[styles.opChip, active && styles.opChipActive]}
                  testID={`op-${o.id}`}
                >
                  <Text
                    style={[styles.opChipLabel, active && styles.opChipLabelActive]}
                  >
                    {o.label}
                  </Text>
                  <Text style={styles.opChipSub}>{o.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* INPUT MODE TOGGLE */}
          <View style={styles.modeRow}>
            <Text style={styles.sectionLabel}>INPUT MODE</Text>
            <View style={styles.toggleGroup}>
              <TouchableOpacity
                style={[styles.toggleItem, mode === "grid" && styles.toggleItemActive]}
                onPress={() => switchMode("grid")}
                testID="mode-grid"
              >
                <Text style={[styles.toggleText, mode === "grid" && styles.toggleTextActive]}>
                  Grid
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleItem, mode === "json" && styles.toggleItemActive]}
                onPress={() => switchMode("json")}
                testID="mode-json"
              >
                <Text style={[styles.toggleText, mode === "json" && styles.toggleTextActive]}>
                  JSON
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* GATE PICKER for apply_gate */}
          {showGateSelect && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>GATE</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gateRow}
              >
                {Object.entries(GATES).map(([key, g]) => {
                  const active = key === gateKey;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setGateKey(key as keyof typeof GATES)}
                      style={[styles.gateChip, active && styles.gateChipActive]}
                      testID={`gate-${key}`}
                    >
                      <Text
                        style={[
                          styles.gateChipLabel,
                          active && styles.gateChipLabelActive,
                        ]}
                      >
                        {g.symbol}
                      </Text>
                      <Text style={styles.gateChipSub}>{g.qubits}q</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text style={styles.hint}>
                {GATES[gateKey].name} · {GATES[gateKey].description}
              </Text>
            </View>
          )}

          {/* INPUTS */}
          {showAandB && (
            <View style={styles.section}>
              {mode === "grid" ? (
                <MatrixGridInput
                  label={op === "tensor_product" ? "MATRIX A" : "MATRIX A"}
                  rows={aRows}
                  cols={aCols}
                  values={aGrid}
                  onChange={setAGrid}
                  onChangeDims={onChangeADims}
                  testIDPrefix="a"
                />
              ) : (
                <JsonField
                  label="MATRIX A (JSON)"
                  value={aJson}
                  onChange={setAJson}
                  testID="a-json"
                />
              )}

              {mode === "grid" ? (
                <MatrixGridInput
                  label="MATRIX B"
                  rows={bRows}
                  cols={bCols}
                  values={bGrid}
                  onChange={setBGrid}
                  onChangeDims={onChangeBDims}
                  testIDPrefix="b"
                />
              ) : (
                <JsonField
                  label="MATRIX B (JSON)"
                  value={bJson}
                  onChange={setBJson}
                  testID="b-json"
                />
              )}
            </View>
          )}

          {showV && (
            <View style={styles.section}>
              {mode === "grid" ? (
                <MatrixGridInput
                  label="VECTOR |ψ⟩"
                  rows={vLen}
                  cols={1}
                  values={vGrid}
                  onChange={setVGrid}
                  onChangeDims={(r) => onChangeVDims(r)}
                  testIDPrefix="v"
                  isVector
                  showDims={!showGateSelect}
                />
              ) : (
                <JsonField
                  label="VECTOR |ψ⟩ (JSON)"
                  value={vJson}
                  onChange={setVJson}
                  testID="v-json"
                />
              )}
            </View>
          )}

          {showShots && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SHOTS</Text>
              <TextInput
                style={styles.shotsInput}
                value={shots}
                onChangeText={(t) => setShots(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder="1024"
                placeholderTextColor={colors.textMuted}
                testID="shots-input"
              />
            </View>
          )}

          {/* SAMPLE / RESET */}
          <TouchableOpacity
            style={styles.sampleBtn}
            onPress={fillSample}
            testID="sample-btn"
          >
            <Ionicons name="sparkles-outline" size={14} color={colors.cyan} />
            <Text style={styles.sampleBtnText}>Load sample input</Text>
          </TouchableOpacity>

          {/* COMPUTE */}
          <TouchableOpacity
            style={styles.computeBtn}
            onPress={compute}
            testID="compute-btn"
            activeOpacity={0.85}
          >
            <Ionicons name="flash" size={18} color="#fff" />
            <Text style={styles.computeBtnText}>Compute</Text>
          </TouchableOpacity>

          {/* ERROR */}
          {error ? (
            <View style={styles.errorBox} testID="error-box">
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* RESULT */}
          {(resultMatrix || resultVector || resultMeasure) && (
            <View ref={resultRef} style={styles.resultCard} testID="result-card">
              <View style={styles.resultHeader}>
                <Text style={styles.resultBadge}>RESULT</Text>
                <Text style={styles.resultMeta}>{resultLabel}</Text>
              </View>

              {resultMatrix && (
                <MatrixDisplay matrix={resultMatrix} testID="result-matrix" />
              )}
              {resultVector && (
                <MatrixDisplay vector={resultVector} testID="result-vector" />
              )}
              {resultMeasure && (
                <Histogram
                  counts={resultMeasure.counts}
                  probabilities={resultMeasure.probabilities}
                  shots={resultMeasure.shots}
                  testID="result-histogram"
                />
              )}
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function JsonField({
  label,
  value,
  onChange,
  testID,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  testID?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <TextInput
        style={styles.json}
        value={value}
        onChangeText={onChange}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={`[["1","0"],["0","1"]]`}
        placeholderTextColor={colors.textMuted}
        testID={testID}
        selectionColor={colors.cyan}
      />
    </View>
  );
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
    letterSpacing: 0.4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceMain,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: space.md,
    paddingBottom: 120,
    gap: space.lg,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  opRow: {
    gap: 10,
    paddingVertical: 2,
    paddingRight: 8,
  },
  opChip: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMain,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    minWidth: 130,
  },
  opChipActive: {
    borderColor: colors.cyan,
    backgroundColor: "rgba(0,229,255,0.06)",
  },
  opChipLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  opChipLabelActive: { color: colors.cyan },
  opChipSub: {
    color: colors.textMuted,
    fontFamily: "monospace",
    fontSize: 11,
    marginTop: 2,
  },
  modeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space.md,
  },
  toggleGroup: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMain,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  toggleItem: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleItemActive: { backgroundColor: colors.surfaceInput },
  toggleText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  toggleTextActive: { color: colors.cyan },
  section: { gap: space.md },
  gateRow: { gap: 8, paddingRight: 8 },
  gateChip: {
    flexShrink: 0,
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceMain,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
  },
  gateChipActive: {
    borderColor: colors.pink,
    backgroundColor: "rgba(255,126,182,0.08)",
  },
  gateChipLabel: {
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "700",
  },
  gateChipLabelActive: { color: colors.pink },
  gateChipSub: {
    color: colors.textMuted,
    fontFamily: "monospace",
    fontSize: 10,
    marginTop: 2,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: "italic",
  },
  shotsInput: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: 15,
  },
  json: {
    backgroundColor: colors.surfaceMain,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    padding: 12,
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: 12,
    minHeight: 100,
    textAlignVertical: "top",
  },
  sampleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sampleBtnText: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: "500",
  },
  computeBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  computeBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,84,112,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,84,112,0.4)",
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  resultCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    padding: space.md,
    gap: space.md,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultBadge: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  resultMeta: {
    color: colors.textMuted,
    fontFamily: "monospace",
    fontSize: 11,
  },
});
