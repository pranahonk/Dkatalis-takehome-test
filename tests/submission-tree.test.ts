import * as fs from 'fs';
import * as path from 'path';

describe('submission tree cleanliness', () => {
  const root = path.resolve(__dirname, '..');

  it('does not keep unrelated challenge and planning artifacts', () => {
    expect(fs.existsSync(path.join(root, 'PROBLEM_ATM.md'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'PROBLEM_LIBRARY.md'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'docs'))).toBe(false);
    expect(fs.existsSync(path.join(root, '.superpowers'))).toBe(false);
  });

  it('does not keep nested atm-cli folder after flattening', () => {
    expect(fs.existsSync(path.join(root, 'atm-cli'))).toBe(false);
  });
});
