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
