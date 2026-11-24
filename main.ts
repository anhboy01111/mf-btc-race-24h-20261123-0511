// Refined entrypoint for btc-race-24h-20261123-0511
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

function run(): void {
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outputDir, { recursive: true });
  
  const entryText = "Autonomous entry crafted by Makefun Spec-Kit Agent.";
  writeFileSync(join(outputDir, 'entry.txt'), entryText, 'utf-8');
}

run();
