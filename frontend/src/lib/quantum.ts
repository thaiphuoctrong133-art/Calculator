// Core matrix / quantum operations.
import { C, cAdd, cAbsSq, cMul, Complex, Matrix, Vector, ZERO } from "./complex";

const SQRT1_2 = Math.SQRT1_2; // 1/sqrt(2)

// ---------- shape helpers ----------
export function shape(m: Matrix): [number, number] {
  return [m.length, m[0]?.length ?? 0];
}

export function isSquare(m: Matrix): boolean {
  const [r, c] = shape(m);
  return r === c && r > 0;
}

export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

// ---------- multiply_matrix(a, b) ----------
export function multiply_matrix(a: Matrix, b: Matrix): Matrix {
  const [ar, ac] = shape(a);
  const [br, bc] = shape(b);
  if (ac !== br) {
    throw new Error(
      `Cannot multiply: A is ${ar}x${ac} but B is ${br}x${bc}. Inner dims must match (${ac} ≠ ${br}).`,
    );
  }
  const out: Matrix = Array.from({ length: ar }, () =>
    Array.from({ length: bc }, () => ZERO),
  );
  for (let i = 0; i < ar; i++) {
    for (let j = 0; j < bc; j++) {
      let sum: Complex = ZERO;
      for (let k = 0; k < ac; k++) {
        sum = cAdd(sum, cMul(a[i][k], b[k][j]));
      }
      out[i][j] = sum;
    }
  }
  return out;
}

// matrix * vector
export function multiply_matrix_vector(m: Matrix, v: Vector): Vector {
  const [r, c] = shape(m);
  if (c !== v.length) {
    throw new Error(
      `Cannot apply: gate is ${r}x${c} but state has length ${v.length}.`,
    );
  }
  const out: Vector = new Array(r).fill(ZERO);
  for (let i = 0; i < r; i++) {
    let sum: Complex = ZERO;
    for (let k = 0; k < c; k++) sum = cAdd(sum, cMul(m[i][k], v[k]));
    out[i] = sum;
  }
  return out;
}

// ---------- apply_gate(state, gate) ----------
// state: vector (length N), gate: NxN matrix
export function apply_gate(state: Vector, gate: Matrix): Vector {
  return multiply_matrix_vector(gate, state);
}

// ---------- normalize_vector(v) ----------
export function normalize_vector(v: Vector): Vector {
  let sumSq = 0;
  for (const c of v) sumSq += cAbsSq(c);
  const norm = Math.sqrt(sumSq);
  if (norm === 0) {
    throw new Error("Cannot normalize the zero vector.");
  }
  return v.map((c) => C(c.re / norm, c.im / norm));
}

// ---------- tensor_product(a, b) ----------
// Works for either two matrices or two vectors (vectors treated as Nx1).
export function tensor_product(a: Matrix, b: Matrix): Matrix {
  const [ar, ac] = shape(a);
  const [br, bc] = shape(b);
  const out: Matrix = Array.from({ length: ar * br }, () =>
    Array.from({ length: ac * bc }, () => ZERO),
  );
  for (let i = 0; i < ar; i++) {
    for (let j = 0; j < ac; j++) {
      for (let k = 0; k < br; k++) {
        for (let l = 0; l < bc; l++) {
          out[i * br + k][j * bc + l] = cMul(a[i][j], b[k][l]);
        }
      }
    }
  }
  return out;
}

export function tensor_product_vec(a: Vector, b: Vector): Vector {
  const out: Vector = [];
  for (const x of a) for (const y of b) out.push(cMul(x, y));
  return out;
}

// ---------- measure(state, shots) ----------
// Treats |c_i|^2 as probability of outcome i (assumes normalized; auto-normalizes if not).
export type MeasureResult = {
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  shots: number;
  numQubits: number;
};

export function measure(state: Vector, shots: number): MeasureResult {
  const n = state.length;
  if (n === 0) throw new Error("Cannot measure an empty state.");
  const shotsInt = Math.max(1, Math.floor(shots));

  // probabilities
  const probsRaw = state.map(cAbsSq);
  const total = probsRaw.reduce((s, p) => s + p, 0);
  if (total === 0) throw new Error("State has zero norm; cannot measure.");
  const probs = probsRaw.map((p) => p / total);

  const isPow2 = isPowerOfTwo(n);
  const numQubits = isPow2 ? Math.log2(n) : 0;
  const labelFor = (i: number) => {
    if (isPow2) {
      const bits = i.toString(2).padStart(Math.max(1, numQubits), "0");
      return `|${bits}⟩`;
    }
    return `|${i}⟩`;
  };

  // Cumulative distribution sampling
  const cum: number[] = [];
  let acc = 0;
  for (const p of probs) {
    acc += p;
    cum.push(acc);
  }

  const counts: Record<string, number> = {};
  for (let i = 0; i < n; i++) counts[labelFor(i)] = 0;

  for (let s = 0; s < shotsInt; s++) {
    const r = Math.random();
    let idx = cum.findIndex((c) => r <= c);
    if (idx === -1) idx = n - 1;
    counts[labelFor(idx)] += 1;
  }

  const probabilities: Record<string, number> = {};
  for (let i = 0; i < n; i++) probabilities[labelFor(i)] = probs[i];

  return { counts, probabilities, shots: shotsInt, numQubits: isPow2 ? numQubits : 0 };
}

// ---------- standard gates ----------
export const GATES: Record<
  string,
  { name: string; symbol: string; matrix: Matrix; qubits: number; description: string }
> = {
  I: {
    name: "Identity",
    symbol: "I",
    qubits: 1,
    description: "Leaves the state unchanged.",
    matrix: [
      [C(1), C(0)],
      [C(0), C(1)],
    ],
  },
  X: {
    name: "Pauli-X (NOT)",
    symbol: "X",
    qubits: 1,
    description: "Bit flip: |0⟩ ↔ |1⟩.",
    matrix: [
      [C(0), C(1)],
      [C(1), C(0)],
    ],
  },
  Y: {
    name: "Pauli-Y",
    symbol: "Y",
    qubits: 1,
    description: "Bit + phase flip with imaginary component.",
    matrix: [
      [C(0, 0), C(0, -1)],
      [C(0, 1), C(0, 0)],
    ],
  },
  Z: {
    name: "Pauli-Z",
    symbol: "Z",
    qubits: 1,
    description: "Phase flip on |1⟩.",
    matrix: [
      [C(1), C(0)],
      [C(0), C(-1)],
    ],
  },
  H: {
    name: "Hadamard",
    symbol: "H",
    qubits: 1,
    description: "Creates superposition. |0⟩ → (|0⟩+|1⟩)/√2.",
    matrix: [
      [C(SQRT1_2), C(SQRT1_2)],
      [C(SQRT1_2), C(-SQRT1_2)],
    ],
  },
  S: {
    name: "Phase (S)",
    symbol: "S",
    qubits: 1,
    description: "Quarter phase rotation.",
    matrix: [
      [C(1), C(0)],
      [C(0), C(0, 1)],
    ],
  },
  T: {
    name: "π/8 (T)",
    symbol: "T",
    qubits: 1,
    description: "Eighth phase rotation.",
    matrix: [
      [C(1), C(0)],
      [C(0), C(Math.SQRT1_2, Math.SQRT1_2)],
    ],
  },
  CNOT: {
    name: "Controlled-NOT",
    symbol: "CNOT",
    qubits: 2,
    description: "Flips target qubit if control qubit is |1⟩.",
    matrix: [
      [C(1), C(0), C(0), C(0)],
      [C(0), C(1), C(0), C(0)],
      [C(0), C(0), C(0), C(1)],
      [C(0), C(0), C(1), C(0)],
    ],
  },
};

// helpers to build empty matrices / vectors
export function emptyMatrix(rows: number, cols: number): Matrix {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ZERO),
  );
}
export function emptyVector(n: number): Vector {
  return Array.from({ length: n }, () => ZERO);
}
