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

  it('shows owed-to debt summary on login using public transfer flow', () => {
    const bank = new Bank();

    // Create Alice so Bob can transfer to her
    executeCommand(bank, parseCommand('login Alice'));
    executeCommand(bank, parseCommand('logout'));

    // Bob has $0; transfer Alice 40 creates a debt: Bob owes Alice $40
    executeCommand(bank, parseCommand('login Bob'));
    executeCommand(bank, parseCommand('transfer Alice 40'));
    executeCommand(bank, parseCommand('logout'));

    expect(executeCommand(bank, parseCommand('login Bob'))).toEqual([
      'Hello, Bob!',
      'Your balance is $0',
      'Owed $40 to Alice'
    ]);
  });

  it('shows owed-from debt summary on login using public transfer flow', () => {
    const bank = new Bank();

    // Create Alice so Bob can transfer to her; then log in as Alice to see "owed from Bob"
    executeCommand(bank, parseCommand('login Alice'));
    executeCommand(bank, parseCommand('logout'));

    executeCommand(bank, parseCommand('login Bob'));
    executeCommand(bank, parseCommand('transfer Alice 40'));
    executeCommand(bank, parseCommand('logout'));

    expect(executeCommand(bank, parseCommand('login Alice'))).toEqual([
      'Hello, Alice!',
      'Your balance is $0',
      'Owed $40 from Bob'
    ]);
  });

  it('shows both owed-to and owed-from lines on login when applicable', () => {
    const bank = new Bank();

    // Set up three users: Alice, Charlie, Dave
    executeCommand(bank, parseCommand('login Alice'));
    executeCommand(bank, parseCommand('logout'));

    executeCommand(bank, parseCommand('login Dave'));
    executeCommand(bank, parseCommand('logout'));

    // Charlie has $0 and transfers $50 to Alice => Charlie owes Alice $50
    executeCommand(bank, parseCommand('login Charlie'));
    executeCommand(bank, parseCommand('transfer Alice 50'));
    executeCommand(bank, parseCommand('logout'));

    // Dave has $0 and transfers $30 to Charlie => Dave owes Charlie $30
    executeCommand(bank, parseCommand('login Dave'));
    executeCommand(bank, parseCommand('transfer Charlie 30'));
    executeCommand(bank, parseCommand('logout'));

    // Charlie's login should show BOTH:
    //   Owed $50 to Alice    (Charlie's own debt)
    //   Owed $30 from Dave   (Dave owes Charlie)
    expect(executeCommand(bank, parseCommand('login Charlie'))).toEqual([
      'Hello, Charlie!',
      'Your balance is $0',
      'Owed $50 to Alice',
      'Owed $30 from Dave'
    ]);
  });
});
