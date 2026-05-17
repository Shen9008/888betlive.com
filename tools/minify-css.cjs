/**
 * Minifies css/style.css -> css/style.min.css (Lightning CSS).
 * Referenced from production HTML href; edit style.css as source of truth.
 */
const fs = require('fs');
const path = require('path');
const { transform } = require('lightningcss');

const ROOT = path.join(__dirname, '..');
const inputPath = path.join(ROOT, 'css', 'style.css');
const outputPath = path.join(ROOT, 'css', 'style.min.css');

function main() {
  const code = fs.readFileSync(inputPath);
  const result = transform({
    filename: path.basename(inputPath),
    code,
    minify: true,
    sourceMap: false,
    errorRecovery: false,
  });
  fs.writeFileSync(outputPath, result.code);
  const ratio = ((1 - result.code.length / code.length) * 100).toFixed(1);
  console.log(
    'Wrote css/style.min.css',
    result.code.length,
    'bytes (~' + ratio + '% smaller than style.css)',
  );
}

main();
