import { Customer } from '../src/models/Customer';

describe('Customer', () => {
  it('starts with zero balance and no debts', () => {
    const customer = new Customer('Alice');

    expect(customer.name).toBe('Alice');
    expect(customer.balance).toBe(0);
    expect(customer.debts.size).toBe(0);
  });
});
