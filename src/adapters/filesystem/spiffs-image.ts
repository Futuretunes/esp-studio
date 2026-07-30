/**
 * SPIFFS image extract / rebuild helpers for filesystem transfer.
 *
 * Index page layout matches the browse heuristic in EspFilesystemAdapter:
 * page header (5) + size u32 @5 + name cstring @9.
 * Blocks use ESP-IDF-like defaults (page 256, block 4096) with leading lookup pages.
 */

import { FilesystemError } from "@/features/filesystem/FilesystemError";

const DEFAULT_PAGE_SIZE = 256;
const DEFAULT_BLOCK_SIZE = 4096;
const OBJ_NAME_LEN = 32;
const PAGE_HEADER_SIZE = 5;
const INDEX_SIZE_OFFSET = 5;
const INDEX_NAME_OFFSET = 9;

export type SpiffsFileMap = ReadonlyMap<string, Uint8Array>;

/**
 * Detects a plausible SPIFFS page size by scanning for index-like headers.
 *
 * @param image - Raw volume bytes
 */
export function detectSpiffsPageSize(image: Uint8Array): number {
  for (const pageSize of [256, 128, 512, 1024] as const) {
    if (countSpiffsIndexPages(image, pageSize) > 0) {
      return pageSize;
    }
  }
  return DEFAULT_PAGE_SIZE;
}

/**
 * Extracts file path → bytes from a SPIFFS volume image.
 *
 * @param image - Raw volume bytes
 */
export function extractSpiffsFiles(image: Uint8Array): Map<string, Uint8Array> {
  const pageSize = detectSpiffsPageSize(image);
  const files = new Map<string, Uint8Array>();
  const pageCount = Math.floor(image.byteLength / pageSize);

  for (let page = 0; page < pageCount; page += 1) {
    const base = page * pageSize;
    const header = readPageHeader(image, base);
    if (header?.span !== 0) {
      continue;
    }
    if (!isUsedPage(header.flags)) {
      continue;
    }

    const name = decodeName(
      image.subarray(
        base + INDEX_NAME_OFFSET,
        base + INDEX_NAME_OFFSET + OBJ_NAME_LEN,
      ),
    );
    if (name.length === 0 || !isPlausibleFilename(name)) {
      continue;
    }

    const size =
      (image[base + INDEX_SIZE_OFFSET] ?? 0) |
      ((image[base + INDEX_SIZE_OFFSET + 1] ?? 0) << 8) |
      ((image[base + INDEX_SIZE_OFFSET + 2] ?? 0) << 16) |
      ((image[base + INDEX_SIZE_OFFSET + 3] ?? 0) << 24);

    if (size < 0 || size > image.byteLength) {
      continue;
    }

    const path = name.startsWith("/") ? name : `/${name}`;
    const data = readSpiffsObjectData(image, pageSize, header.objId, size);
    files.set(normalizeRelativePath(path), data);
  }

  return files;
}

/**
 * Builds a SPIFFS volume image from a file map.
 *
 * @param files - Path → bytes (paths like `/foo.txt`)
 * @param imageSize - Partition size in bytes
 * @param pageSize - Logical page size (default 256)
 * @param blockSize - Logical block size (default 4096)
 */
export function buildSpiffsImage(
  files: SpiffsFileMap,
  imageSize: number,
  pageSize = DEFAULT_PAGE_SIZE,
  blockSize = DEFAULT_BLOCK_SIZE,
): Uint8Array {
  if (imageSize <= 0 || imageSize % blockSize !== 0) {
    throw new FilesystemError(
      "io-failure",
      "SPIFFS image size must be a positive multiple of the block size.",
    );
  }
  if (blockSize % pageSize !== 0) {
    throw new FilesystemError(
      "io-failure",
      "SPIFFS block size must be a multiple of the page size.",
    );
  }

  const image = new Uint8Array(imageSize);
  image.fill(0xff);

  const pagesPerBlock = blockSize / pageSize;
  const lookupPages = Math.max(1, Math.ceil((pagesPerBlock * 2) / pageSize));
  const dataPagesPerBlock = pagesPerBlock - lookupPages;

  if (dataPagesPerBlock <= 0) {
    throw new FilesystemError(
      "io-failure",
      "SPIFFS block layout has no data pages.",
    );
  }

  type FreePage = { readonly absolutePage: number; readonly block: number };
  const freePages: FreePage[] = [];
  const blockCount = imageSize / blockSize;

  for (let block = 0; block < blockCount; block += 1) {
    for (let i = 0; i < dataPagesPerBlock; i += 1) {
      freePages.push({
        absolutePage: block * pagesPerBlock + lookupPages + i,
        block,
      });
    }
  }

  let nextObjId = 1;
  const sorted = [...files.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );

  for (const [rawPath, data] of sorted) {
    const path = normalizeRelativePath(rawPath);
    const name = path.startsWith("/") ? path.slice(1) : path;
    if (name.length === 0 || name.length >= OBJ_NAME_LEN) {
      throw new FilesystemError(
        "invalid-path",
        `SPIFFS file name is empty or longer than ${String(OBJ_NAME_LEN - 1)} bytes.`,
      );
    }

    const payloadPerDataPage = pageSize - PAGE_HEADER_SIZE;
    const dataPageCount =
      data.byteLength === 0
        ? 1
        : Math.ceil(data.byteLength / payloadPerDataPage);
    const pagesNeeded = 1 + dataPageCount;
    if (freePages.length < pagesNeeded) {
      throw new FilesystemError(
        "io-failure",
        "Not enough free space in the SPIFFS volume for this upload.",
      );
    }

    const objId = nextObjId;
    nextObjId += 1;
    if (objId > 0x7ffe) {
      throw new FilesystemError(
        "io-failure",
        "SPIFFS object id space exhausted for this volume rebuild.",
      );
    }

    const indexSlot = freePages.shift();
    if (indexSlot === undefined) {
      throw new FilesystemError("io-failure", "SPIFFS free page list underflow.");
    }

    writeIndexPage(
      image,
      indexSlot.absolutePage * pageSize,
      pageSize,
      objId,
      name,
      data.byteLength,
    );
    writeLookupEntry(
      image,
      indexSlot.block,
      pagesPerBlock,
      pageSize,
      lookupPages,
      indexSlot.absolutePage % pagesPerBlock,
      objId | 0x8000,
    );

    let offset = 0;
    for (let span = 1; span <= dataPageCount; span += 1) {
      const slot = freePages.shift();
      if (slot === undefined) {
        throw new FilesystemError(
          "io-failure",
          "SPIFFS free page list underflow.",
        );
      }
      const chunk = data.subarray(
        offset,
        Math.min(offset + payloadPerDataPage, data.byteLength),
      );
      writeDataPage(
        image,
        slot.absolutePage * pageSize,
        pageSize,
        objId,
        span,
        chunk,
      );
      writeLookupEntry(
        image,
        slot.block,
        pagesPerBlock,
        pageSize,
        lookupPages,
        slot.absolutePage % pagesPerBlock,
        objId,
      );
      offset += chunk.byteLength;
    }
  }

  return image;
}

function countSpiffsIndexPages(image: Uint8Array, pageSize: number): number {
  let count = 0;
  const pageCount = Math.floor(image.byteLength / pageSize);
  for (let page = 0; page < pageCount; page += 1) {
    const base = page * pageSize;
    const header = readPageHeader(image, base);
    if (header?.span !== 0 || header.objId === 0) {
      continue;
    }
    const name = decodeName(
      image.subarray(
        base + INDEX_NAME_OFFSET,
        base + INDEX_NAME_OFFSET + OBJ_NAME_LEN,
      ),
    );
    if (name.length > 0 && isPlausibleFilename(name)) {
      count += 1;
    }
  }
  return count;
}

function readSpiffsObjectData(
  image: Uint8Array,
  pageSize: number,
  objId: number,
  size: number,
): Uint8Array {
  if (size === 0) {
    return new Uint8Array(0);
  }

  const payloadPerDataPage = pageSize - PAGE_HEADER_SIZE;
  const out = new Uint8Array(size);
  let written = 0;
  const pageCount = Math.floor(image.byteLength / pageSize);
  const bySpan = new Map<number, Uint8Array>();

  for (let page = 0; page < pageCount; page += 1) {
    const base = page * pageSize;
    const header = readPageHeader(image, base);
    if (header?.objId !== objId || header.span === 0) {
      continue;
    }
    if (!isUsedPage(header.flags)) {
      continue;
    }
    bySpan.set(
      header.span,
      image.subarray(base + PAGE_HEADER_SIZE, base + pageSize),
    );
  }

  const spans = [...bySpan.keys()].sort((left, right) => left - right);
  for (const span of spans) {
    const chunk = bySpan.get(span);
    if (chunk === undefined) {
      continue;
    }
    const remaining = size - written;
    if (remaining <= 0) {
      break;
    }
    const take = Math.min(remaining, payloadPerDataPage, chunk.byteLength);
    out.set(chunk.subarray(0, take), written);
    written += take;
  }

  return written === size ? out : out.subarray(0, written);
}

function readPageHeader(
  image: Uint8Array,
  base: number,
): { readonly objId: number; readonly span: number; readonly flags: number } | null {
  if (base + PAGE_HEADER_SIZE > image.byteLength) {
    return null;
  }
  const objId = (image[base] ?? 0) | ((image[base + 1] ?? 0) << 8);
  const span = (image[base + 2] ?? 0) | ((image[base + 3] ?? 0) << 8);
  const flags = image[base + 4] ?? 0;
  if (objId === 0xffff || objId === 0) {
    return null;
  }
  return { objId: objId & 0x7fff, span, flags };
}

function isUsedPage(flags: number): boolean {
  return (flags & 0x80) === 0;
}

function writeIndexPage(
  image: Uint8Array,
  base: number,
  pageSize: number,
  objId: number,
  name: string,
  size: number,
): void {
  image.fill(0xff, base, base + pageSize);
  image[base] = objId & 0xff;
  image[base + 1] = (objId >> 8) & 0xff;
  image[base + 2] = 0;
  image[base + 3] = 0;
  image[base + 4] = 0x01;
  image[base + INDEX_SIZE_OFFSET] = size & 0xff;
  image[base + INDEX_SIZE_OFFSET + 1] = (size >> 8) & 0xff;
  image[base + INDEX_SIZE_OFFSET + 2] = (size >> 16) & 0xff;
  image[base + INDEX_SIZE_OFFSET + 3] = (size >> 24) & 0xff;
  const nameBytes = new TextEncoder().encode(name);
  const copyLen = Math.min(nameBytes.byteLength, OBJ_NAME_LEN - 1);
  image.set(nameBytes.subarray(0, copyLen), base + INDEX_NAME_OFFSET);
  image[base + INDEX_NAME_OFFSET + copyLen] = 0;
}

function writeDataPage(
  image: Uint8Array,
  base: number,
  pageSize: number,
  objId: number,
  span: number,
  chunk: Uint8Array,
): void {
  image.fill(0xff, base, base + pageSize);
  image[base] = objId & 0xff;
  image[base + 1] = (objId >> 8) & 0xff;
  image[base + 2] = span & 0xff;
  image[base + 3] = (span >> 8) & 0xff;
  image[base + 4] = 0x01;
  image.set(chunk, base + PAGE_HEADER_SIZE);
}

function writeLookupEntry(
  image: Uint8Array,
  block: number,
  pagesPerBlock: number,
  pageSize: number,
  lookupPages: number,
  pageInBlock: number,
  objId: number,
): void {
  const lookupBase = block * pagesPerBlock * pageSize;
  const entryOffset = lookupBase + pageInBlock * 2;
  if (entryOffset + 1 >= lookupBase + lookupPages * pageSize) {
    return;
  }
  image[entryOffset] = objId & 0xff;
  image[entryOffset + 1] = (objId >> 8) & 0xff;
}

function decodeName(bytes: Uint8Array): string {
  let end = bytes.byteLength;
  for (let i = 0; i < bytes.byteLength; i += 1) {
    if (bytes[i] === 0) {
      end = i;
      break;
    }
  }
  return new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.subarray(0, end))
    .trim();
}

function normalizeRelativePath(path: string): string {
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.replace(/\/{2,}/gu, "/");
}

function isPlausibleFilename(name: string): boolean {
  if (name.length === 0 || name.length > 64) {
    return false;
  }
  if (name === "littlefs") {
    return false;
  }
  return /^[\w./+\-@]+$/u.test(name);
}
