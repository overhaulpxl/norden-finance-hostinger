import { gzipSync } from 'node:zlib';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const chunksDir = join(process.cwd(), '.next', 'static', 'chunks');
const maxGzipBytes = 1_500_000;
const maxChunkGzipBytes = 350_000;

if (!existsSync(chunksDir)) {
  console.error('Bundle budget check failed: .next/static/chunks does not exist. Run npm run build first.');
  process.exit(1);
}

function listJsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) return listJsFiles(fullPath);
    return fullPath.endsWith('.js') ? [fullPath] : [];
  });
}

const files = listJsFiles(chunksDir);
const chunks = files.map((file) => {
  const gzipBytes = gzipSync(readFileSync(file)).byteLength;
  return { file, gzipBytes };
});

const totalGzipBytes = chunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0);
const oversized = chunks.filter((chunk) => chunk.gzipBytes > maxChunkGzipBytes);

if (totalGzipBytes > maxGzipBytes || oversized.length > 0) {
  console.error('Bundle budget check failed.');
  console.error(`Total gzip JS: ${totalGzipBytes} bytes. Budget: ${maxGzipBytes} bytes.`);
  for (const chunk of oversized) {
    console.error(`Oversized chunk: ${chunk.file} = ${chunk.gzipBytes} bytes. Budget: ${maxChunkGzipBytes} bytes.`);
  }
  process.exit(1);
}

console.log(`Bundle budget check passed. Total gzip JS: ${totalGzipBytes} bytes.`);
