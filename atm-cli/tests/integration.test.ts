/**
 * Integration test: Full sample session from PROBLEM_ATM.md
 *
 * Each test drives the Bank + parseCommand + executeCommand pipeline exactly as
 * the CLI entry-point does, then asserts that the returned lines match the
 * oracle output shown in the problem statement.
 *
 * Note: PROBLEM_ATM.md step 6 ("transfer Alice 50") prints "your balance is $30"
 * with a lowercase "y". The implementation follows the literal spec: the transfer
 * method emits "your balance is $…" (lowercase). All other commands (login, deposit,
 * withdraw) continue to emit "Your balance is $…" (uppercase).
 */

import { Bank } from '../src/Bank';
import { parseCommand } from '../src/CommandParser';
import { executeCommand } from '../src/CommandExecutor';

function run(bank: Bank, command: string): string[] {
  return executeCommand(bank, parseCommand(command));
}

/**
 * Helper: replay the sample session up to (but not including) the given step
 * index (1-based, matching the session comments below) and return the bank.
 *
 * Session steps:
 *  1. login Alice
 *  2. deposit 100
 *  3. logout
 *  4. login Bob
 *  5. deposit 80
 *  6. transfer Alice 50
 *  7. transfer Alice 100
 *  8. deposit 30
 *  9. logout
 * 10. login Alice
 * 11. transfer Bob 30
 * 12. logout
 * 13. login Bob
 * 14. deposit 100
 * 15. logout
 */
function sessionUpTo(lastStep: number): { bank: Bank } {
  const bank = new Bank();
  const steps = [
    () => run(bank, 'login Alice'),   // 1
    () => run(bank, 'deposit 100'),   // 2
    () => run(bank, 'logout'),        // 3
    () => run(bank, 'login Bob'),     // 4
    () => run(bank, 'deposit 80'),    // 5
    () => run(bank, 'transfer Alice 50'),  // 6
    () => run(bank, 'transfer Alice 100'), // 7
    () => run(bank, 'deposit 30'),    // 8
    () => run(bank, 'logout'),        // 9
    () => run(bank, 'login Alice'),   // 10
    () => run(bank, 'transfer Bob 30'), // 11
    () => run(bank, 'logout'),        // 12
    () => run(bank, 'login Bob'),     // 13
    () => run(bank, 'deposit 100'),   // 14
    () => run(bank, 'logout'),        // 15
  ];
  for (let i = 0; i < lastStep; i++) {
    steps[i]();
  }
  return { bank };
}

describe('Full sample session (PROBLEM_ATM.md oracle)', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // Individual command assertions that mirror each line of the sample session
  // ─────────────────────────────────────────────────────────────────────────

  it('step 1 – login Alice: new customer starts with $0 balance', () => {
    const bank = new Bank();
    expect(run(bank, 'login Alice')).toEqual([
      'Hello, Alice!',
      'Your balance is $0',
    ]);
  });

  it('step 2 – deposit 100: Alice balance increases to $100', () => {
    const { bank } = sessionUpTo(1);
    expect(run(bank, 'deposit 100')).toEqual(['Your balance is $100']);
  });

  it('step 3 – logout: Alice gets goodbye message', () => {
    const { bank } = sessionUpTo(2);
    expect(run(bank, 'logout')).toEqual(['Goodbye, Alice!']);
  });

  it('step 4 – login Bob: new customer starts with $0 balance', () => {
    const { bank } = sessionUpTo(3);
    expect(run(bank, 'login Bob')).toEqual([
      'Hello, Bob!',
      'Your balance is $0',
    ]);
  });

  it('step 5 – deposit 80 (Bob): balance increases to $80', () => {
    const { bank } = sessionUpTo(4);
    expect(run(bank, 'deposit 80')).toEqual(['Your balance is $80']);
  });

  it('step 6 – transfer Alice 50: cash transfer; Bob balance drops to $30', () => {
    const { bank } = sessionUpTo(5);
    expect(run(bank, 'transfer Alice 50')).toEqual([
      'Transferred $50 to Alice',
      'your balance is $30',
    ]);
  });

  it('step 7 – transfer Alice 100: partial cash + debt; Bob $0, owes $70 to Alice', () => {
    const { bank } = sessionUpTo(6);
    expect(run(bank, 'transfer Alice 100')).toEqual([
      'Transferred $30 to Alice',
      'your balance is $0',
      'Owed $70 to Alice',
    ]);
  });

  it('step 8 – deposit 30 (Bob, owing $70): auto-repays $30; balance $0, owes $40', () => {
    const { bank } = sessionUpTo(7);
    expect(run(bank, 'deposit 30')).toEqual([
      'Transferred $30 to Alice',
      'Your balance is $0',
      'Owed $40 to Alice',
    ]);
  });

  it('step 9 – logout Bob: goodbye message', () => {
    const { bank } = sessionUpTo(8);
    expect(run(bank, 'logout')).toEqual(['Goodbye, Bob!']);
  });

  it('step 10 – login Alice: balance $210, owed $40 from Bob', () => {
    const { bank } = sessionUpTo(9);
    expect(run(bank, 'login Alice')).toEqual([
      'Hello, Alice!',
      'Your balance is $210',
      'Owed $40 from Bob',
    ]);
  });

  it('step 11 – transfer Bob 30 (Alice): offsets debt; Alice balance $210 unchanged, Bob owes $10', () => {
    const { bank } = sessionUpTo(10);
    expect(run(bank, 'transfer Bob 30')).toEqual([
      'your balance is $210',
      'Owed $10 from Bob',
    ]);
  });

  it('step 12 – logout Alice: goodbye message', () => {
    const { bank } = sessionUpTo(11);
    expect(run(bank, 'logout')).toEqual(['Goodbye, Alice!']);
  });

  it('step 13 – login Bob: balance $0, owes $10 to Alice', () => {
    const { bank } = sessionUpTo(12);
    expect(run(bank, 'login Bob')).toEqual([
      'Hello, Bob!',
      'Your balance is $0',
      'Owed $10 to Alice',
    ]);
  });

  it('step 14 – deposit 100 (Bob, owing $10): auto-repays $10 to Alice; Bob balance $90', () => {
    const { bank } = sessionUpTo(13);
    expect(run(bank, 'deposit 100')).toEqual([
      'Transferred $10 to Alice',
      'Your balance is $90',
    ]);
  });

  it('step 15 – logout Bob: goodbye message', () => {
    const { bank } = sessionUpTo(14);
    expect(run(bank, 'logout')).toEqual(['Goodbye, Bob!']);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // End-to-end: run the entire sample session in a single bank instance and
  // assert ALL outputs together so that cumulative state is verified.
  // ─────────────────────────────────────────────────────────────────────────

  it('full sample session produces correct output for every command', () => {
    const bank = new Bank();

    const results: { cmd: string; lines: string[] }[] = [];

    const exec = (cmd: string) => {
      const lines = run(bank, cmd);
      results.push({ cmd, lines });
      return lines;
    };

    // Step 1
    expect(exec('login Alice')).toEqual(['Hello, Alice!', 'Your balance is $0']);

    // Step 2
    expect(exec('deposit 100')).toEqual(['Your balance is $100']);

    // Step 3
    expect(exec('logout')).toEqual(['Goodbye, Alice!']);

    // Step 4
    expect(exec('login Bob')).toEqual(['Hello, Bob!', 'Your balance is $0']);

    // Step 5
    expect(exec('deposit 80')).toEqual(['Your balance is $80']);

    // Step 6 — literal spec output: 'your balance is $30' (lowercase, as written in PROBLEM_ATM.md)
    expect(exec('transfer Alice 50')).toEqual([
      'Transferred $50 to Alice',
      'your balance is $30',
    ]);

    // Step 7
    expect(exec('transfer Alice 100')).toEqual([
      'Transferred $30 to Alice',
      'your balance is $0',
      'Owed $70 to Alice',
    ]);

    // Step 8
    expect(exec('deposit 30')).toEqual([
      'Transferred $30 to Alice',
      'Your balance is $0',
      'Owed $40 to Alice',
    ]);

    // Step 9
    expect(exec('logout')).toEqual(['Goodbye, Bob!']);

    // Step 10
    expect(exec('login Alice')).toEqual([
      'Hello, Alice!',
      'Your balance is $210',
      'Owed $40 from Bob',
    ]);

    // Step 11
    expect(exec('transfer Bob 30')).toEqual([
      'your balance is $210',
      'Owed $10 from Bob',
    ]);

    // Step 12
    expect(exec('logout')).toEqual(['Goodbye, Alice!']);

    // Step 13
    expect(exec('login Bob')).toEqual([
      'Hello, Bob!',
      'Your balance is $0',
      'Owed $10 to Alice',
    ]);

    // Step 14
    expect(exec('deposit 100')).toEqual([
      'Transferred $10 to Alice',
      'Your balance is $90',
    ]);

    // Step 15
    expect(exec('logout')).toEqual(['Goodbye, Bob!']);

    // Sanity: every command produced output
    expect(results).toHaveLength(15);
  });
});
