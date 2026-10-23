(() => {
  const MAX_BITS = 12;

  class ByteSink {
    constructor() {
      this.buf = new Uint8Array(1 << 16);
      this.len = 0;
    }
    push(b) {
      if (this.len === this.buf.length) {
        const n = new Uint8Array(this.buf.length * 2);
        n.set(this.buf);
        this.buf = n;
      }
      this.buf[this.len++] = b;
    }
    bytes(arr) {
      for (let i = 0; i < arr.length; i++) this.push(arr[i]);
    }
    u16(v) {
      this.push(v & 255);
      this.push((v >> 8) & 255);
    }
    result() {
      return this.buf.subarray(0, this.len);
    }
  }

  function lzwEncode(pixels, minBits) {
    const out = new ByteSink(),
      clearCode = 1 << minBits,
      eoiCode = clearCode + 1,
      HSIZE = 5003,
      hashKey = new Int32Array(HSIZE),
      hashCode = new Int32Array(HSIZE);
    let nBits = minBits + 1,
      maxcode = (1 << nBits) - 1,
      freeEnt = clearCode + 2,
      clearFlg = false,
      cur = 0,
      curBits = 0;
    const chunk = [];
    let chunkLen = 0;
    const flushChunk = () => {
      if (!chunkLen) return;
      out.push(chunkLen);
      for (let i = 0; i < chunkLen; i++) out.push(chunk[i]);
      chunkLen = 0;
    };
    const writeByte = b => {
      chunk[chunkLen++] = b;
      if (chunkLen === 255) flushChunk();
    };
    const output = code => {
      cur |= code << curBits;
      curBits += nBits;
      while (curBits >= 8) {
        writeByte(cur & 255);
        cur >>>= 8;
        curBits -= 8;
      }
      if (freeEnt > maxcode || clearFlg) {
        if (clearFlg) {
          nBits = minBits + 1;
          maxcode = (1 << nBits) - 1;
          clearFlg = false;
        } else {
          nBits++;
          maxcode = nBits === MAX_BITS ? 1 << MAX_BITS : (1 << nBits) - 1;
        }
      }
    };
    const resetTable = () => {
      hashKey.fill(-1);
      freeEnt = clearCode + 2;
      clearFlg = true;
      output(clearCode);
    };
    out.push(minBits);
    hashKey.fill(-1);
    output(clearCode);
    let ent = pixels[0];
    for (let i = 1; i < pixels.length; i++) {
      const c = pixels[i],
        fcode = (c << MAX_BITS) + ent;
      let h = ((c << 8) ^ ent) % HSIZE;
      if (h < 0) h += HSIZE;
      let found = false;
      while (hashKey[h] !== -1) {
        if (hashKey[h] === fcode) {
          ent = hashCode[h];
          found = true;
          break;
        }
        h++;
        if (h === HSIZE) h = 0;
      }
      if (found) continue;
      output(ent);
      ent = c;
      if (freeEnt < 1 << MAX_BITS) {
        hashCode[h] = freeEnt++;
        hashKey[h] = fcode;
      } else resetTable();
    }
    output(ent);
    output(eoiCode);
    if (curBits > 0) writeByte(cur & 255);
    flushChunk();
    out.push(0);
    return out.result();
  }

  // Median cut over sampled pixels (flat RGB triplets).
  function buildPalette(samples, count) {
    const n = samples.length / 3,
      idx = new Uint32Array(n);
    for (let i = 0; i < n; i++) idx[i] = i;
    const boxes = [{lo: 0, hi: n}];
    const range = b => {
      let rmin = 255,
        rmax = 0,
        gmin = 255,
        gmax = 0,
        bmin = 255,
        bmax = 0;
      for (let i = b.lo; i < b.hi; i++) {
        const p = idx[i] * 3,
          r = samples[p],
          g = samples[p + 1],
          bl = samples[p + 2];
        if (r < rmin) rmin = r;
        if (r > rmax) rmax = r;
        if (g < gmin) gmin = g;
        if (g > gmax) gmax = g;
        if (bl < bmin) bmin = bl;
        if (bl > bmax) bmax = bl;
      }
      const dr = rmax - rmin,
        dg = gmax - gmin,
        db = bmax - bmin,
        ch = dr >= dg && dr >= db ? 0 : dg >= db ? 1 : 2;
      return {ch, span: Math.max(dr, dg, db)};
    };
    while (boxes.length < count) {
      let best = -1,
        bs = 0,
        bch = 0;
      boxes.forEach((b, i) => {
        if (b.hi - b.lo < 2) return;
        const r = range(b),
          score = r.span * Math.sqrt(b.hi - b.lo);
        if (score > bs) {
          bs = score;
          best = i;
          bch = r.ch;
        }
      });
      if (best < 0 || bs === 0) break;
      const b = boxes[best],
        part = Array.from(idx.subarray(b.lo, b.hi)).sort(
          (x, y) => samples[x * 3 + bch] - samples[y * 3 + bch],
        );
      idx.set(part, b.lo);
      const mid = (b.lo + (b.hi - b.lo) / 2) | 0;
      boxes.splice(best, 1, {lo: b.lo, hi: mid}, {lo: mid, hi: b.hi});
    }
    return boxes.map(b => {
      let r = 0,
        g = 0,
        bl = 0;
      for (let i = b.lo; i < b.hi; i++) {
        const p = idx[i] * 3;
        r += samples[p];
        g += samples[p + 1];
        bl += samples[p + 2];
      }
      const k = Math.max(1, b.hi - b.lo);
      return [Math.round(r / k), Math.round(g / k), Math.round(bl / k)];
    });
  }

  function makeMapper(palette) {
    const lut = new Int16Array(32768).fill(-1);
    return (r, g, b) => {
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      let v = lut[key];
      if (v >= 0) return v;
      const rr = (r & 0xf8) | 4,
        gg = (g & 0xf8) | 4,
        bb = (b & 0xf8) | 4;
      let bd = Infinity;
      v = 0;
      for (let i = 0; i < palette.length; i++) {
        const p = palette[i],
          d = (p[0] - rr) ** 2 + (p[1] - gg) ** 2 + (p[2] - bb) ** 2;
        if (d < bd) {
          bd = d;
          v = i;
        }
      }
      lut[key] = v;
      return v;
    };
  }

  function indexFrame(rgba, w, h, palette, map, dither) {
    const out = new Uint8Array(w * h);
    if (!dither) {
      for (let i = 0; i < w * h; i++) out[i] = map(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
      return out;
    }
    let cur = new Float32Array((w + 2) * 3),
      next = new Float32Array((w + 2) * 3);
    for (let y = 0; y < h; y++) {
      next.fill(0);
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4,
          e = (x + 1) * 3,
          r = Math.min(255, Math.max(0, rgba[i] + cur[e])),
          g = Math.min(255, Math.max(0, rgba[i + 1] + cur[e + 1])),
          b = Math.min(255, Math.max(0, rgba[i + 2] + cur[e + 2])),
          k = map(r | 0, g | 0, b | 0),
          p = palette[k];
        out[y * w + x] = k;
        const er = r - p[0],
          eg = g - p[1],
          eb = b - p[2];
        cur[e + 3] += (er * 7) / 16;
        cur[e + 4] += (eg * 7) / 16;
        cur[e + 5] += (eb * 7) / 16;
        next[e - 3] += (er * 3) / 16;
        next[e - 2] += (eg * 3) / 16;
        next[e - 1] += (eb * 3) / 16;
        next[e] += (er * 5) / 16;
        next[e + 1] += (eg * 5) / 16;
        next[e + 2] += (eb * 5) / 16;
        next[e + 3] += er / 16;
        next[e + 4] += eg / 16;
        next[e + 5] += eb / 16;
      }
      [cur, next] = [next, cur];
    }
    return out;
  }

  // frames: [{data: Uint8ClampedArray RGBA, delay: seconds}], all width x height.
  function encode(frames, width, height, o = {}) {
    const colors = Math.min(255, Math.max(2, o.colors || 255)),
      sink = new ByteSink(),
      total = width * height,
      step = Math.max(1, Math.floor((total * frames.length) / 120000)),
      samples = [];
    frames.forEach(f => {
      for (let i = 0; i < total; i += step) samples.push(f.data[i * 4], f.data[i * 4 + 1], f.data[i * 4 + 2]);
    });
    const palette = buildPalette(Uint8Array.from(samples), colors),
      map = makeMapper(palette),
      transIdx = 255;
    while (palette.length < 256) palette.push([0, 0, 0]);
    sink.bytes([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    sink.u16(width);
    sink.u16(height);
    sink.push(0xf7);
    sink.push(0);
    sink.push(0);
    palette.forEach(c => sink.bytes(c));
    sink.bytes([0x21, 0xff, 0x0b, ...[...'NETSCAPE2.0'].map(c => c.charCodeAt(0)), 0x03, 0x01]);
    sink.u16(o.loop === undefined ? 0 : o.loop);
    sink.push(0);

    const queue = [];
    let prev = null,
      elapsed = 0,
      written = 0;
    frames.forEach(f => {
      const idxs = indexFrame(f.data, width, height, palette, map, o.dither !== false);
      elapsed += f.delay * 100;
      const delay = Math.max(2, Math.round(elapsed) - written);
      if (prev && idxs.every((v, i) => v === prev[i])) {
        queue[queue.length - 1].delay += delay;
      } else queue.push({idxs, delay});
      written += delay;
      prev = idxs;
    });

    let last = null;
    queue.forEach(f => {
      let x0 = 0,
        y0 = 0,
        w = width,
        h = height,
        px = f.idxs,
        trans = false;
      if (last) {
        let minX = width,
          minY = height,
          maxX = -1,
          maxY = -1;
        for (let y = 0; y < height; y++)
          for (let x = 0; x < width; x++)
            if (f.idxs[y * width + x] !== last[y * width + x]) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
        x0 = minX;
        y0 = minY;
        w = maxX - minX + 1;
        h = maxY - minY + 1;
        px = new Uint8Array(w * h);
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            const a = f.idxs[(y0 + y) * width + x0 + x];
            px[y * w + x] = a === last[(y0 + y) * width + x0 + x] ? transIdx : a;
          }
        trans = true;
      }
      sink.bytes([0x21, 0xf9, 0x04, trans ? 0x05 : 0x04]);
      sink.u16(f.delay);
      sink.push(trans ? transIdx : 0);
      sink.push(0);
      sink.push(0x2c);
      sink.u16(x0);
      sink.u16(y0);
      sink.u16(w);
      sink.u16(h);
      sink.push(0);
      sink.bytes(lzwEncode(px, 8));
      last = f.idxs;
    });
    sink.push(0x3b);
    return new Blob([sink.result()], {type: 'image/gif'});
  }

  window.MoonGif = Object.assign(window.MoonGif || {}, {encode});
})();
