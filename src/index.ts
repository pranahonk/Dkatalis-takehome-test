import readline from 'readline';
import { Bank } from './Bank';
import { parseCommand } from './CommandParser';
import { executeCommand } from './CommandExecutor';

const bank = new Bank();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(): void {
  process.stdout.write('$ ');
}

prompt();

rl.on('line', (line: string) => {
  // Skip blank lines silently so pressing Enter just re-prompts.
  if (line.trim() === '') {
    prompt();
    return;
  }

  const parsed = parseCommand(line);
  const outputLines = executeCommand(bank, parsed);

  for (const outputLine of outputLines) {
    console.log(outputLine);
  }

  console.log('');
  prompt();
});

rl.on('close', () => {
  process.exit(0);
});
