/* =====================================================================
   Hand-rolled BMP + ICO encoders — ported 1:1 from the standalone
   image-studio tool (imageconvert.js). No external libraries, pure
   typed-array manipulation, 100% client-side.
   ===================================================================== */

/**
 * Encode an ImageData (from canvas.getImageData) as an uncompressed
 * 24bpp, bottom-up Windows BMP file.
 * @param {ImageData} imgData
 * @returns {Uint8Array} raw BMP file bytes
 */
export function imageDataToBmp(imgData) {
  const { width, height, data } = imgData;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = new ArrayBuffer(fileSize);
  const dv = new DataView(buf);
  const bytes = new Uint8Array(buf);
  bytes[0] = 0x42; bytes[1] = 0x4d; // 'BM'
  dv.setUint32(2, fileSize, true);
  dv.setUint32(10, 54, true); // offset to pixel data
  dv.setUint32(14, 40, true); // BITMAPINFOHEADER size
  dv.setInt32(18, width, true);
  dv.setInt32(22, height, true);
  dv.setUint16(26, 1, true);  // planes
  dv.setUint16(28, 24, true); // bits per pixel
  dv.setUint32(34, pixelArraySize, true);
  dv.setInt32(38, 2835, true); // ~72dpi
  dv.setInt32(42, 2835, true);
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    let rowOff = offset;
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      bytes[rowOff++] = data[p + 2]; // B
      bytes[rowOff++] = data[p + 1]; // G
      bytes[rowOff++] = data[p];     // R
    }
    offset += rowSize;
  }
  return bytes;
}

/**
 * Wrap a single PNG image in an ICO container (the modern ICO format,
 * supported since Windows Vista: the entry embeds the PNG bytes
 * directly instead of a raw classic DIB bitmap).
 * @param {Uint8Array} pngBytes
 * @param {number} width
 * @param {number} height
 * @returns {Uint8Array} raw ICO file bytes
 */
export function pngToIco(pngBytes, width, height) {
  const headerSize = 6 + 16;
  const buf = new Uint8Array(headerSize + pngBytes.length);
  const dv = new DataView(buf.buffer);
  dv.setUint16(2, 1, true); // type = icon
  dv.setUint16(4, 1, true); // number of images
  buf[6] = width >= 256 ? 0 : width;   // 0 means 256
  buf[7] = height >= 256 ? 0 : height;
  dv.setUint16(10, 1, true);  // planes
  dv.setUint16(12, 32, true); // bit count
  dv.setUint32(14, pngBytes.length, true);
  dv.setUint32(18, headerSize, true);
  buf.set(pngBytes, headerSize);
  return buf;
}
