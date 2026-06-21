import { parseCommand } from '../src/CommandParser';

describe('parseCommand', () => {
  it('parses login', () => {
    expect(parseCommand('login Alice')).toEqual({ type: 'login', name: 'Alice' });
  });

  it('parses deposit', () => {
    expect(parseCommand('deposit 100')).toEqual({ type: 'deposit', amount: 100 });
  });

  it('parses withdraw', () => {
    expect(parseCommand('withdraw 50')).toEqual({ type: 'withdraw', amount: 50 });
  });

  it('parses transfer', () => {
    expect(parseCommand('transfer Alice 30')).toEqual({ type: 'transfer', target: 'Alice', amount: 30 });
  });

  it('parses logout', () => {
    expect(parseCommand('logout')).toEqual({ type: 'logout' });
  });

  it('returns usage error for missing login name', () => {
    expect(parseCommand('login')).toEqual({ type: 'error', message: 'Usage: login [name]' });
  });

  it('returns usage error for missing amount', () => {
    expect(parseCommand('deposit')).toEqual({ type: 'error', message: 'Usage: deposit [amount]' });
  });

  it('rejects non-positive integer amounts', () => {
    expect(parseCommand('deposit 0')).toEqual({ type: 'error', message: 'Amount must be a positive integer.' });
    expect(parseCommand('withdraw -1')).toEqual({ type: 'error', message: 'Amount must be a positive integer.' });
    expect(parseCommand('transfer Alice 1.5')).toEqual({ type: 'error', message: 'Amount must be a positive integer.' });
  });

  it('returns unknown command for unsupported input', () => {
    expect(parseCommand('hello')).toEqual({ type: 'unknown', raw: 'hello' });
  });
});
