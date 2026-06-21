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
}
