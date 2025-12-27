export function applyTransformToHomogeneousBuffer(
  transformation: DOMMatrix,
  buffer: Float32Array,
  inPlace: boolean = false
): Float32Array {
  const len = buffer.length;

  if (len % 3 !== 0) {
    throw new Error('Buffer length must be multiple of 3 [x, y, 1]');
  }

  // Decide output buffer once
  const out = inPlace ? buffer : new Float32Array(len);

  // Cache matrix values (critical for perf)
  const a = transformation.a;
  const b = transformation.b;
  const c = transformation.c;
  const d = transformation.d;
  const e = transformation.e;
  const f = transformation.f;

  for (let i = 0; i < len; i += 3) {
    const x = buffer[i] as number;
    const y = buffer[i + 1] as number;

    out[i] = a * x + c * y + e;
    out[i + 1] = b * x + d * y + f;
    out[i + 2] = 1;
  }

  return out;
}
