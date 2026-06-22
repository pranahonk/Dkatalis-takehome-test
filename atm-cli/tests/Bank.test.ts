import { Bank } from '../src/Bank';

describe('Bank session and registry', () => {
  it('creates a customer on first login', () => {
    const bank = new Bank();

    const result = bank.login('Alice');

    expect(result.user.name).toBe('Alice');
    expect(result.user.balance).toBe(0);
    expect(result.owedFromOthers.size).toBe(0);
    expect(bank.getCurrentUser()?.name).toBe('Alice');
  });

  it('reuses the same customer on later logins', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.getCurrentUser()!.balance = 100;
    bank.logout();

    const result = bank.login('Alice');

    expect(result.user.balance).toBe(100);
  });

  it('clears session on logout', () => {
    const bank = new Bank();
    bank.login('Alice');

    const loggedOut = bank.logout();

    expect(loggedOut.name).toBe('Alice');
    expect(bank.getCurrentUser()).toBeNull();
  });

  it('throws when logout is called without login', () => {
    const bank = new Bank();
    expect(() => bank.logout()).toThrow('No user logged in');
  });

  it('reports debts owed from other customers', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.logout();
    bank.login('Bob');
    bank.getCurrentUser()!.debts.set('Alice', 40);
    bank.logout();

    const result = bank.login('Alice');

    expect(result.owedFromOthers.get('Bob')).toBe(40);
  });
});

describe('Bank deposit', () => {
  it('adds funds when there is no debt', () => {
    const bank = new Bank();
    bank.login('Alice');

    const result = bank.deposit(100);

    expect(result.lines).toEqual(['Your balance is $100']);
    expect(bank.getCurrentUser()!.balance).toBe(100);
  });

  it('automatically pays existing debt on deposit', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.logout();
    bank.login('Bob');
    bank.getCurrentUser()!.debts.set('Alice', 70);

    const result = bank.deposit(30);

    expect(result.lines).toEqual([
      'Transferred $30 to Alice',
      'Your balance is $0',
      'Owed $40 to Alice'
    ]);
    expect(bank.getCurrentUser()!.balance).toBe(0);
    expect(bank.getCurrentUser()!.debts.get('Alice')).toBe(40);
    expect(bank.getCustomer('Alice')!.balance).toBe(30);
  });

  it('clears debt when deposit fully covers it', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.logout();
    bank.login('Bob');
    bank.getCurrentUser()!.debts.set('Alice', 20);

    const result = bank.deposit(100);

    expect(result.lines).toEqual([
      'Transferred $20 to Alice',
      'Your balance is $80'
    ]);
    expect(bank.getCurrentUser()!.debts.has('Alice')).toBe(false);
    expect(bank.getCurrentUser()!.balance).toBe(80);
  });
});

describe('Bank withdraw', () => {
  it('subtracts balance when enough money exists', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.deposit(100);

    const result = bank.withdraw(40);

    expect(result.lines).toEqual(['Your balance is $60']);
    expect(bank.getCurrentUser()!.balance).toBe(60);
  });

  it('rejects withdraw larger than balance', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.deposit(20);

    const result = bank.withdraw(30);

    expect(result.lines).toEqual(["Sorry, you don't have enough balance."]);
    expect(bank.getCurrentUser()!.balance).toBe(20);
  });
});

describe('Bank transfer', () => {
  it('transfers when the sender has enough balance', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.deposit(100);
    bank.logout();
    bank.login('Bob');
    bank.deposit(80);

    const result = bank.transfer('Alice', 50);

    expect(result.lines).toEqual([
      'Transferred $50 to Alice',
      'your balance is $30'
    ]);
    expect(bank.getCurrentUser()!.balance).toBe(30);
    expect(bank.getCustomer('Alice')!.balance).toBe(150);
  });

  it('creates debt when sender cannot fully pay transfer', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.logout();
    bank.login('Bob');
    bank.deposit(30);

    const result = bank.transfer('Alice', 100);

    expect(result.lines).toEqual([
      'Transferred $30 to Alice',
      'Your balance is $0',
      'Owed $70 to Alice'
    ]);
    expect(bank.getCurrentUser()!.debts.get('Alice')).toBe(70);
  });

  it('offsets target debt before moving cash', () => {
    const bank = new Bank();
    bank.login('Bob');
    bank.getCurrentUser()!.debts.set('Alice', 40);
    bank.logout();
    bank.login('Alice');
    bank.deposit(210);

    const result = bank.transfer('Bob', 30);

    expect(result.lines).toEqual([
      'Your balance is $210',
      'Owed $10 from Bob'
    ]);
    expect(bank.getCustomer('Bob')!.debts.get('Alice')).toBe(10);
    expect(bank.getCurrentUser()!.balance).toBe(210);
  });

  it('rejects transfer to unknown customer', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.deposit(100);

    const result = bank.transfer('Ghost', 50);

    expect(result.lines).toEqual(["Sorry, Ghost doesn't exist."]);
  });

  it('rejects transfer to self', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.deposit(100);

    const result = bank.transfer('Alice', 50);

    expect(result.lines).toEqual(['Cannot transfer to yourself.']);
  });
});

describe('Bank transfer – fix pass (negative amount + mutual-debt contradiction)', () => {
  it('rejects a negative transfer amount', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.deposit(100);

    const result = bank.transfer('Bob', -50);

    expect(result.lines).toEqual(['Transfer amount must be positive.']);
    expect(bank.getCurrentUser()!.balance).toBe(100);
  });

  it('rejects a zero transfer amount', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.deposit(100);
    bank.logout();
    bank.login('Bob');

    const result = bank.transfer('Alice', 0);

    expect(result.lines).toEqual(['Transfer amount must be positive.']);
    expect(bank.getCurrentUser()!.balance).toBe(0);
  });

  it('does not corrupt debt state when negative amount is passed', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.logout();
    bank.login('Bob');
    bank.getCurrentUser()!.debts.set('Alice', 40);

    bank.transfer('Alice', -10);

    // Debt must remain unchanged
    expect(bank.getCurrentUser()!.debts.get('Alice')).toBe(40);
    expect(bank.getCurrentUser()!.balance).toBe(0);
  });

  it('never emits both owed-to and owed-from for the same party (mutual debt, user nets positive)', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.logout();
    bank.login('Bob');
    // Bob owes Alice $50
    bank.getCurrentUser()!.debts.set('Alice', 50);
    bank.logout();
    // Alice owes Bob $30
    bank.login('Alice');
    bank.getCurrentUser()!.debts.set('Bob', 30);

    // Alice transfers $10 to Bob — after netting: Bob still owes Alice net $20
    const result = bank.transfer('Bob', 10);

    const hasOwedTo = result.lines.some(l => l.includes('Owed') && l.includes('to Bob'));
    const hasOwedFrom = result.lines.some(l => l.includes('Owed') && l.includes('from Bob'));
    expect(hasOwedTo && hasOwedFrom).toBe(false);
  });

  it('never emits both owed-to and owed-from for the same party (mutual debt, target nets positive)', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.logout();
    bank.login('Bob');
    // Bob owes Alice $20
    bank.getCurrentUser()!.debts.set('Alice', 20);
    bank.logout();
    // Alice owes Bob $50
    bank.login('Alice');
    bank.getCurrentUser()!.debts.set('Bob', 50);

    // Alice transfers $5 to Bob
    const result = bank.transfer('Bob', 5);

    const hasOwedTo = result.lines.some(l => l.includes('Owed') && l.includes('to Bob'));
    const hasOwedFrom = result.lines.some(l => l.includes('Owed') && l.includes('from Bob'));
    expect(hasOwedTo && hasOwedFrom).toBe(false);
  });

  it('nets mutual debt to one direction when target debt exceeds user debt', () => {
    const bank = new Bank();
    bank.login('Alice');
    bank.getCurrentUser()!.debts.set('Bob', 20);
    bank.logout();
    bank.login('Bob');
    bank.getCurrentUser()!.debts.set('Alice', 30);
    bank.logout();
    bank.login('Alice');
    bank.deposit(100);

    // After netting: Bob owes Alice net $10 (30-20). Transfer $5 to Bob.
    // Offset: Bob owes Alice $10, offset = min(5,10) = 5, Bob now owes Alice $5, remaining = 0.
    // No cash paid, no shortfall. Output: balance line + "Owed $5 from Bob".
    const result = bank.transfer('Bob', 5);

    expect(result.lines).not.toContain(expect.stringContaining('Owed $5 to Bob'));
    expect(result.lines.some(l => l.includes('Owed') && l.includes('to Bob'))).toBe(false);
    expect(result.lines.some(l => l.includes('Owed') && l.includes('from Bob'))).toBe(true);
    // No contradictory both-directions
    const hasOwedTo = result.lines.some(l => l.includes('Owed') && l.includes('to Bob'));
    const hasOwedFrom = result.lines.some(l => l.includes('Owed') && l.includes('from Bob'));
    expect(hasOwedTo && hasOwedFrom).toBe(false);
  });
});
