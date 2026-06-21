import { Customer } from './models/Customer';

export interface LoginResult {
  user: Customer;
  owedFromOthers: Map<string, number>;
}

export class Bank {
  private readonly customers = new Map<string, Customer>();
  private currentUser: Customer | null = null;

  login(name: string): LoginResult {
    let customer = this.customers.get(name);

    if (!customer) {
      customer = new Customer(name);
      this.customers.set(name, customer);
    }

    this.currentUser = customer;

    return {
      user: customer,
      owedFromOthers: this.getOwedFromOthers(name),
    };
  }

  logout(): Customer {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    const loggedOut = this.currentUser;
    this.currentUser = null;
    return loggedOut;
  }

  getCurrentUser(): Customer | null {
    return this.currentUser;
  }

  getCustomer(name: string): Customer | undefined {
    return this.customers.get(name);
  }

  getOwedFromOthers(userName: string): Map<string, number> {
    const owed = new Map<string, number>();

    for (const [customerName, customer] of this.customers.entries()) {
      const amount = customer.debts.get(userName);
      if (customerName !== userName && amount && amount > 0) {
        owed.set(customerName, amount);
      }
    }

    return owed;
  }

  deposit(amount: number): { lines: string[] } {
    const user = this.requireCurrentUser();
    const lines: string[] = [];

    user.balance += amount;

    for (const [creditorName, owedAmount] of Array.from(user.debts.entries())) {
      if (user.balance === 0) {
        break;
      }

      const paid = Math.min(user.balance, owedAmount);
      const creditor = this.customers.get(creditorName)!;

      user.balance -= paid;
      creditor.balance += paid;

      const remaining = owedAmount - paid;
      if (remaining === 0) {
        user.debts.delete(creditorName);
      } else {
        user.debts.set(creditorName, remaining);
      }

      lines.push(`Transferred $${paid} to ${creditorName}`);
    }

    lines.push(`Your balance is $${user.balance}`);

    for (const [creditorName, owedAmount] of user.debts.entries()) {
      lines.push(`Owed $${owedAmount} to ${creditorName}`);
    }

    return { lines };
  }


  withdraw(amount: number): { lines: string[] } {
    const user = this.requireCurrentUser();

    if (user.balance < amount) {
      return { lines: ["Sorry, you don't have enough balance."] };
    }

    user.balance -= amount;
    return { lines: [`Your balance is $${user.balance}`] };
  }

  transfer(targetName: string, amount: number): { lines: string[] } {
    const user = this.requireCurrentUser();

    if (amount <= 0) {
      return { lines: ['Transfer amount must be positive.'] };
    }

    if (targetName === user.name) {
      return { lines: ['Cannot transfer to yourself.'] };
    }

    const target = this.customers.get(targetName);
    if (!target) {
      return { lines: [`Sorry, ${targetName} doesn't exist.`] };
    }

    // Net any mutual debts before processing to prevent contradictory output:
    // if user owes target AND target owes user, cancel down to one-directional debt.
    const userDebtToTarget = user.debts.get(targetName) ?? 0;
    const targetDebtToUserInit = target.debts.get(user.name) ?? 0;
    if (userDebtToTarget > 0 && targetDebtToUserInit > 0) {
      const net = userDebtToTarget - targetDebtToUserInit;
      if (net > 0) {
        user.debts.set(targetName, net);
        target.debts.delete(user.name);
      } else if (net < 0) {
        target.debts.set(user.name, -net);
        user.debts.delete(targetName);
      } else {
        user.debts.delete(targetName);
        target.debts.delete(user.name);
      }
    }

    const lines: string[] = [];
    let remainingAmount = amount;

    const targetDebtToUser = target.debts.get(user.name) ?? 0;
    if (targetDebtToUser > 0) {
      const offset = Math.min(remainingAmount, targetDebtToUser);
      remainingAmount -= offset;
      const updatedDebt = targetDebtToUser - offset;

      if (updatedDebt === 0) {
        target.debts.delete(user.name);
      } else {
        target.debts.set(user.name, updatedDebt);
      }
    }

    if (remainingAmount > 0) {
      const paid = Math.min(user.balance, remainingAmount);
      user.balance -= paid;
      target.balance += paid;

      if (paid > 0) {
        lines.push(`Transferred $${paid} to ${targetName}`);
      }

      const shortfall = remainingAmount - paid;
      if (shortfall > 0) {
        const existingDebt = user.debts.get(targetName) ?? 0;
        user.debts.set(targetName, existingDebt + shortfall);
      }
    }

    lines.push(`Your balance is $${user.balance}`);

    // Only one direction can appear: mutual debts were netted at the top.
    if (user.debts.has(targetName)) {
      lines.push(`Owed $${user.debts.get(targetName)} to ${targetName}`);
    } else if (target.debts.has(user.name)) {
      lines.push(`Owed $${target.debts.get(user.name)} from ${targetName}`);
    }

    return { lines };
  }

  private requireCurrentUser(): Customer {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    return this.currentUser;
  }
}
