import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path/posix';

const problems = [];
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (path !== 'src/mocks') await check(path);
      continue;
    }
    if (!/\.(css|tsx?)$/.test(entry.name) || path === 'src/styles/tokens.css') continue;
    const lines = (await readFile(path, 'utf8')).split('\n');
    for (const [index, line] of lines.entries()) {
      if (
        /(#[\da-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\s*\(|\b(?:bg|text|border|ring|outline|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d+)?\b)/.test(
          line,
        )
      ) {
        problems.push(`${path}:${index + 1}: use um token de cor semântico ou de componente`);
      }
    }
  }
}
await check('src');
if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else console.log('Verificação de cores: nenhum valor literal encontrado fora de tokens.css.');
