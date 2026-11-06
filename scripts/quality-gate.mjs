import { spawnSync } from 'node:child_process';

const checks = [
  ['typecheck', ['npm', 'run', 'typecheck']],
  ['lint', ['npm', 'run', 'lint']],
  ['format', ['npm', 'run', 'format:check']],
  ['design tokens', ['npm', 'run', 'check:tokens']],
  ['unit tests', ['npm', 'run', 'test']],
  ['build', ['npm', 'run', 'build']],
  ['E2E preview', ['npm', 'run', 'test:e2e:preview']],
];

for (const [name, [command, ...args]] of checks) {
  console.log(`\n▶ ${name}`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\n✓ Quality gate aprovado.');
