import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MatrixDisplay } from "@/src/components/MatrixDisplay";
import { GATES } from "@/src/lib/quantum";
import { colors, space } from "@/src/lib/theme";

const OP_DOCS = [
  {
    name: "multiply_matrix(A, B)",
    body: "Standard matrix product. A must be m×n and B must be n×p; result is m×p.",
  },
  {
    name: "apply_gate(state, gate)",
    body: "Computes gate · state. The gate must be N×N where N matches the state length.",
  },
  {
    name: "normalize_vector(v)",
    body: "Divides v by its Euclidean norm so that Σ|v_i|² = 1.",
  },
  {
    name: "tensor_product(A, B)",
    body: "Kronecker product. For (m×n) ⊗ (p×q) the result is (mp × nq).",
  },
  {
    name: "measure(state, shots)",
    body: "Samples 'shots' outcomes using |amplitude|² as probability. Returns counts and probabilities.",
  },
];

export default function ReferenceScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Reference</Text>
        <Text style={styles.subtitle}>Operations & standard gates</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>OPERATIONS</Text>
        {OP_DOCS.map((d) => (
          <View key={d.name} style={styles.opCard} testID={`ref-op-${d.name}`}>
            <Text style={styles.opName}>{d.name}</Text>
            <Text style={styles.opBody}>{d.body}</Text>
          </View>
        ))}

        <Text style={[styles.section, { marginTop: space.lg }]}>
          QUANTUM GATES
        </Text>
        <Text style={styles.hint}>
          Tip: complex numbers can be entered as `a+bi`, e.g. `0.707+0.707i`. Use
          `i` or `-i` for unit imaginary.
        </Text>

        {Object.entries(GATES).map(([key, g]) => (
          <View key={key} style={styles.gateCard} testID={`ref-gate-${key}`}>
            <View style={styles.gateHeader}>
              <View style={styles.gateSymbolBox}>
                <Text style={styles.gateSymbol}>{g.symbol}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gateName}>{g.name}</Text>
                <Text style={styles.gateDesc}>{g.description}</Text>
                <Text style={styles.gateMeta}>
                  {g.qubits} qubit{g.qubits > 1 ? "s" : ""} · {g.matrix.length}×
                  {g.matrix.length}
                </Text>
              </View>
            </View>
            <MatrixDisplay matrix={g.matrix} />
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  scroll: {
    paddingHorizontal: space.md,
    paddingBottom: 100,
    gap: space.md,
  },
  section: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: space.xs,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 4,
  },
  opCard: {
    backgroundColor: colors.surfaceCard,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    padding: space.md,
    gap: 6,
  },
  opName: {
    color: colors.cyan,
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "600",
  },
  opBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  gateCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: space.md,
    gap: space.md,
  },
  gateHeader: { flexDirection: "row", gap: space.md, alignItems: "center" },
  gateSymbolBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "rgba(0,229,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  gateSymbol: {
    color: colors.cyan,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  gateName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  gateDesc: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  gateMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 4,
  },
});
