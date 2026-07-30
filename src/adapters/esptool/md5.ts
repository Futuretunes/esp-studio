/**
 * Minimal MD5 digest for firmware verify/write checksums.
 *
 * Web Crypto does not expose MD5. This pure implementation keeps flash verify
 * free of extra npm dependencies.
 */

/**
 * Computes the lowercase hex MD5 of `data`.
 *
 * @param data - Bytes to hash
 * @returns 32-character lowercase hex digest
 */
export function md5Hex(data: Uint8Array): string {
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ] as const;

  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i += 1) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  }

  const bitLen = data.length * 8;
  const paddedLen = ((((data.length + 8) >>> 6) + 1) << 6) - 8;
  const totalLen = paddedLen + 8;
  const buffer = new Uint8Array(totalLen);
  buffer.set(data);
  buffer[data.length] = 0x80;
  const view = new DataView(buffer.buffer);
  view.setUint32(totalLen - 8, bitLen >>> 0, true);
  view.setUint32(totalLen - 4, Math.floor(bitLen / 0x100000000) >>> 0, true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const rotateLeft = (x: number, c: number): number =>
    ((x << c) | (x >>> (32 - c))) >>> 0;

  for (let offset = 0; offset < totalLen; offset += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i += 1) {
      M[i] = view.getUint32(offset + i * 4, true);
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i += 1) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }

      const Ki = K[i] ?? 0;
      const Mg = M[g] ?? 0;
      const shift = s[i] ?? 0;
      F = (F + A + Ki + Mg) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotateLeft(F, shift)) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0, true);
  outView.setUint32(4, b0, true);
  outView.setUint32(8, c0, true);
  outView.setUint32(12, d0, true);

  let hex = "";
  for (const byte of out) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}
