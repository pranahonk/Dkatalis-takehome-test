import * as fs from 'fs';
import * as path from 'path';

describe('submission root layout', () => {
  const root = path.resolve(__dirname, '..');

  it('has package.json, src, and tests at the repository root', () => {
    expect(fs.existsSync(path.join(root, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'src'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'tests'))).toBe(true);
  });

  it('does not require atm-cli subdirectory for the launcher', () => {
    const startSh = fs.readFileSync(path.join(root, 'start.sh'), 'utf8');
    expect(startSh.includes('cd "$SCRIPT_DIR/atm-cli"')).toBe(false);
  });
});
