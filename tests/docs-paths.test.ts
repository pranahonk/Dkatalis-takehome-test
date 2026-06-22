import * as fs from 'fs';
import * as path from 'path';

describe('docs and config paths', () => {
  const root = path.resolve(__dirname, '..');

  it('README does not tell users to cd into atm-cli', () => {
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    expect(readme.includes('cd atm-cli')).toBe(false);
  });

  it('README does not describe src files as nested under atm-cli', () => {
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    expect(readme.includes('atm-cli/')).toBe(false);
  });
});
