// Complex number utilities.
// A complex number is represented as { re: number, im: number }.

export type Complex = { re: number; im: number };
export type Matrix = Complex[][];
export type Vector = Complex[];

export const C = (re: number, im: number = 0): Complex => ({ re, im });
export const ZERO: Complex = C(0, 0);
export const ONE: Complex = C(1, 0);

export const cAdd = (a: Complex, b: Complex): Complex => ({
  re: a.re + b.re,
  im: a.im + b.im,
});

export const cSub = (a: Complex, b: Complex): Complex => ({
  re: a.re - b.re,
  im: a.im - b.im,
});

export const cMul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

export const cAbsSq = (a: Complex): number => a.re * a.re + a.im * a.im;
export const cAbs = (a: Complex): number => Math.sqrt(cAbsSq(a));

// Parse a complex number from a string. Accepts forms like:
//   "1", "1.5", "-2", "i", "-i", "2i", "1+2i", "0.5-0.5i", "3 + 4 i"
export function parseComplex(input: string): Complex {
  const s = String(input ?? "").replace(/\s+/g, "").replace(/j/gi, "i");
  if (s === "" || s === "+" || s === "-") return ZERO;

  // Pure imaginary shortcuts
  if (s === "i") return C(0, 1);
  if (s === "-i") return C(0, -1);
  if (s === "+i") return C(0, 1);

  // Try plain real number first
  if (!s.includes("i")) {
    const n = Number(s);
    if (Number.isNaN(n)) throw new Error(`Invalid number: "${input}"`);
    return C(n, 0);
  }

  // Pure imaginary like "2i", "-3.5i"
  const pureIm = s.match(/^([+-]?\d*\.?\d+)i$/);
  if (pureIm) {
    return C(0, Number(pureIm[1]));
  }
  if (s === "i" || s === "+i") return C(0, 1);

  // a+bi or a-bi
  // Split on the last + or - that isn't at index 0 and isn't after an 'e'
  let splitIdx = -1;
  for (let i = s.length - 1; i > 0; i--) {
    const ch = s[i];
    const prev = s[i - 1];
    if ((ch === "+" || ch === "-") && prev !== "e" && prev !== "E") {
      splitIdx = i;
      break;
    }
  }
  if (splitIdx > 0) {
    const realPart = s.slice(0, splitIdx);
    let imPart = s.slice(splitIdx);
    if (!imPart.endsWith("i")) {
      throw new Error(`Invalid complex number: "${input}"`);
    }
    imPart = imPart.slice(0, -1); // drop i
    if (imPart === "+" || imPart === "") imPart = "1";
    else if (imPart === "-") imPart = "-1";
    const re = Number(realPart);
    const im = Number(imPart);
    if (Number.isNaN(re) || Number.isNaN(im)) {
      throw new Error(`Invalid complex number: "${input}"`);
    }
    return C(re, im);
  }

  throw new Error(`Invalid complex number: "${input}"`);
}

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) < 1e-10) return "0";
  // Show up to 4 significant decimals, trim trailing zeros
  const rounded = Math.round(n * 10000) / 10000;
  let s = rounded.toString();
  if (s.includes(".")) {
    s = s.replace(/0+$/, "").replace(/\.$/, "");
  }
  return s;
}

export function formatComplex(c: Complex): string {
  const re = Math.abs(c.re) < 1e-10 ? 0 : c.re;
  const im = Math.abs(c.im) < 1e-10 ? 0 : c.im;
  if (im === 0) return fmtNum(re);
  if (re === 0) {
    if (im === 1) return "i";
    if (im === -1) return "-i";
    return `${fmtNum(im)}i`;
  }
  const imAbs = Math.abs(im);
  const imStr = imAbs === 1 ? "i" : `${fmtNum(imAbs)}i`;
  return `${fmtNum(re)} ${im >= 0 ? "+" : "-"} ${imStr}`;
}
