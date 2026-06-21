# Quantum + Matrix Calculator — PRD

## Overview
A React Native Expo mobile app that performs matrix and quantum-state calculations using five core operations specified by the user:
- `multiply_matrix(a, b)` — standard matrix product
- `apply_gate(state, gate)` — applies a unitary gate (matrix-vector multiplication)
- `normalize_vector(v)` — unit-norm normalization
- `tensor_product(a, b)` — Kronecker product
- `measure(state, shots)` — samples outcomes from |amplitude|² with histogram

## User choices (locked)
- Combined quantum + general matrix calculator
- Both grid AND JSON input modes
- Full complex number support (`a+bi`)
- Local history of past calculations
- Dark scientific theme ("Quantum Lab" aesthetic)

## Screens
1. **Calculator** (`app/(tabs)/calculator.tsx`) — operation chips, input mode toggle, gate picker (for apply_gate), matrix grid input with row/col steppers, JSON textarea, sample loader, compute button, error box, result panel with bracket-rendered matrices/vectors or measurement histogram.
2. **History** (`app/(tabs)/history.tsx`) — list of past operations (op, timestamp, summary, result preview), clear-all action.
3. **Reference** (`app/(tabs)/reference.tsx`) — operation descriptions + all 8 standard quantum gates (H, X, Y, Z, I, S, T, CNOT) with matrices.

## Architecture
- 100% client-side (no backend / no network calls). All math in pure TypeScript under `frontend/src/lib/`.
- Local persistence via `@/src/utils/storage` (AsyncStorage-backed JSON list).
- Navigation: `expo-router` file-based with `(tabs)` group, bottom tab bar.
- Complex numbers represented as `{re, im}` with parser supporting `1`, `i`, `-i`, `2i`, `1+2i`, `0.5-0.5i`, scientific notation.

## Key files
- `src/lib/complex.ts` — complex parse/format/arithmetic
- `src/lib/quantum.ts` — the 5 required functions + 8 standard gates
- `src/lib/serialize.ts` — JSON ↔ matrix/vector
- `src/lib/history.ts` — storage helpers
- `src/components/MatrixGridInput.tsx` — RxC editable grid with dim steppers + bracket styling
- `src/components/MatrixDisplay.tsx` — read-only matrix/vector with cyan brackets
- `src/components/Histogram.tsx` — bar chart for measurement results

## Tested
All 17 review scenarios passed via testing_agent on web preview (see `/app/test_reports/iteration_1.json`).
