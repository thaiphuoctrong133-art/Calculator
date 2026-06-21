// JSON <-> Matrix/Vector serializers using "a+bi" string notation per cell.
import { Complex, formatComplex, Matrix, parseComplex, Vector } from "./complex";

export function matrixToStrings(m: Matrix): string[][] {
  return m.map((row) => row.map(formatComplex));
}

export function vectorToStrings(v: Vector): string[] {
  return v.map(formatComplex);
}

export function stringsToMatrix(s: string[][]): Matrix {
  return s.map((row) => row.map((cell) => parseComplex(cell || "0")));
}

export function stringsToVector(s: string[]): Vector {
  return s.map((cell) => parseComplex(cell || "0"));
}

export function matrixToJSON(m: Matrix): string {
  return JSON.stringify(matrixToStrings(m), null, 2);
}

export function vectorToJSON(v: Vector): string {
  return JSON.stringify(vectorToStrings(v));
}

// Accepts either:
//  - 2D array of strings or numbers: [["1","2"],["3","4"]] or [[1,2],[3,4]]
//  - 1D array (returns as a single row)
//  - 2D array of complex objects {re, im}
export function jsonToMatrix(input: string): Matrix {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Empty JSON input.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid JSON: ${msg}`);
  }
  if (!Array.isArray(parsed)) throw new Error("JSON must be an array.");
  const arr2d: unknown[][] = Array.isArray(parsed[0])
    ? (parsed as unknown[][])
    : [parsed as unknown[]];
  return arr2d.map((row) =>
    row.map((cell): Complex => {
      if (typeof cell === "number") return { re: cell, im: 0 };
      if (typeof cell === "string") return parseComplex(cell);
      if (cell && typeof cell === "object" && "re" in cell && "im" in cell) {
        const c = cell as { re: number; im: number };
        return { re: Number(c.re), im: Number(c.im) };
      }
      throw new Error(`Unsupported cell type: ${JSON.stringify(cell)}`);
    }),
  );
}

export function jsonToVector(input: string): Vector {
  const m = jsonToMatrix(input);
  // If user gave a column vector [[a],[b]] flatten it
  if (m.every((row) => row.length === 1)) return m.map((r) => r[0]);
  if (m.length === 1) return m[0];
  throw new Error("Vector must be a 1D array or a column array.");
}
