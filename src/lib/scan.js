// SPDX-License-Identifier: MIT
// File-system walking + text reading utilities (zero dependencies).
import { readdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg',
  'dist', 'build', 'out', 'coverage', '.cache',
  '.next', '.nuxt', '.turbo', 'vendor', 'tmp', '.venv'
]);

const MAX_FILE_BYTES = 1024 * 1024; // skip files larger than 1 MB

// Extensions we treat as binary and never read.
const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.tif', '.tiff', '.svg',
  '.pdf', '.zip', '.gz', '.tar', '.tgz', '.rar', '.7z', '.bz2', '.xz',
  '.mp3', '.mp4', '.mov', '.avi', '.mkv', '.wav', '.flac', '.ogg', '.webm',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.class', '.jar', '.wasm',
  '.parquet', '.pkl', '.npy', '.npz', '.h5', '.pt', '.onnx', '.db', '.sqlite'
]);

/**
 * Recursively collect file paths under `root`, skipping ignored dirs and symlinks.
 * Never throws: unreadable directories are silently skipped.
 */
export async function walkFiles(root, { ignoreDirs = DEFAULT_IGNORE_DIRS } = {}) {
  const out = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return; // missing / unreadable dir -> nothing to scan
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) continue; // avoid symlink loops
      if (entry.isDirectory()) {
        if (ignoreDirs.has(entry.name)) continue;
        await walk(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  await walk(root);
  return out;
}

export function isBinaryPath(file) {
  return BINARY_EXT.has(path.extname(file).toLowerCase());
}

/**
 * Read a file as UTF-8 text. Returns null for oversized, unreadable, or
 * binary-looking (contains a NUL byte) files.
 */
export async function readTextFile(file) {
  let info;
  try {
    info = await stat(file);
  } catch {
    return null;
  }
  if (info.size > MAX_FILE_BYTES) return null;
  let buf;
  try {
    buf = await readFile(file);
  } catch {
    return null;
  }
  if (buf.subarray(0, 8000).includes(0)) return null; // binary sniff
  return buf.toString('utf8');
}
