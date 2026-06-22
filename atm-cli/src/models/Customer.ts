export class Customer {
  readonly name: string;
  balance: number;
  readonly debts: Map<string, number>;

  constructor(name: string) {
    this.name = name;
    this.balance = 0;
    this.debts = new Map<string, number>();
  }
}
