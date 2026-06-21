import { Bank } from '../src/Bank';
import { parseCommand } from '../src/CommandParser';
import { executeCommand } from '../src/CommandExecutor';

describe('executeCommand', () => {
  it('formats login output', () => {
    const bank = new Bank();

    expect(executeCommand(bank, parseCommand('login Alice'))).toEqual([
      'Hello, Alice!',
      'Your balance is $0'
    ]);
  });

  it('formats logout output', () => {
    const bank = new Bank();
    executeCommand(bank, parseCommand('login Alice'));

    expect(executeCommand(bank, parseCommand('logout'))).toEqual([
      'Goodbye, Alice!'
    ]);
  });

  it('shows login reminder for money commands without session', () => {
    const bank = new Bank();

    expect(executeCommand(bank, parseCommand('deposit 100'))).toEqual(['Please login first.']);
    expect(executeCommand(bank, parseCommand('withdraw 100'))).toEqual(['Please login first.']);
    expect(executeCommand(bank, parseCommand('transfer Alice 100'))).toEqual(['Please login first.']);
  });

  it('formats parse errors', () => {
    const bank = new Bank();

    expect(executeCommand(bank, parseCommand('deposit foo'))).toEqual([
      'Amount must be a positive integer.'
    ]);
  });

  it('formats unknown commands', () => {
    const bank = new Bank();

    expect(executeCommand(bank, parseCommand('hello'))).toEqual([
      'Unknown command: hello'
    ]);
  });

  it('shows debt summaries on login', () => {
    const bank = new Bank();
    executeCommand(bank, parseCommand('login Alice'));
    executeCommand(bank, parseCommand('logout'));
    executeCommand(bank, parseCommand('login Bob'));
    bank.getCurrentUser()!.debts.set('Alice', 40);
    executeCommand(bank, parseCommand('logout'));

    expect(executeCommand(bank, parseCommand('login Bob'))).toEqual([
      'Hello, Bob!',
      'Your balance is $0',
      'Owed $40 to Alice'
    ]);

    executeCommand(bank, parseCommand('logout'));

    expect(executeCommand(bank, parseCommand('login Alice'))).toEqual([
      'Hello, Alice!',
      'Your balance is $0',
      'Owed $40 from Bob'
    ]);
  });
});
