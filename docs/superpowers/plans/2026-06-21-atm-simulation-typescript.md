# ATM Simulation CLI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript CLI that simulates an ATM — login/deposit/withdraw/transfer with automatic debt settlement on deposit.

**Architecture:** Pure in-memory state held in a `Bank` class; a `CommandParser` turns raw input into typed commands; a `CommandExecutor` routes commands to Bank methods and formats output strings. The `index.ts` entry point runs a readline REPL and prints those strings — no IO elsewhere, so every layer is unit-testable without mocking.

**Tech Stack:** TypeScript 5, Node.js built-in `readline`, Jest 29 + ts-jest, ts-node (dev runner)

## Global Constraints

- Language: TypeScript only — no JavaScript files in `src/`
- No third-party packages that solve the business logic (no banking/CLI frameworks)
- `start.sh` must start fresh every run (all state is in-memory — no files/DBs)
- `start.sh` is executable and located at the project root
- Auto-tests are required; run with `npm test`
- Submission must not contain binary or compiled output (except `start.sh`)
- Output must exactly match the sample session for the same input (amounts are integers)

## File Structure

```text
atm-cli/
├── src/
│   ├── models/
│   │   └── Customer.ts
│   ├── Bank.ts
│   ├── CommandParser.ts
│   ├── CommandExecutor.ts
│   └── index.ts
├── tests/
│   ├── Customer.test.ts
│   ├── Bank.test.ts
│   ├── CommandParser.test.ts
│   ├── CommandExecutor.test.ts
│   └── integration.test.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── .gitignore
├── start.sh
├── README.md
└── ASSUMPTIONS.md
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `atm-cli/package.json`
- Create: `atm-cli/tsconfig.json`
- Create: `atm-cli/jest.config.js`
- Create: `atm-cli/.gitignore`
- Create: `start.sh`

**Interfaces:**
- Consumes: nothing
- Produces: `npm test`, `npm start`, and `./start.sh`

- [ ] **Step 1: Create the project directory and files**

```bash
mkdir -p atm-cli/src/models atm-cli/tests
```

`atm-cli/package.json`
```json
{
  "name": "atm-cli",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "start": "ts-node src/index.ts",
    "test": "jest",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.14.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
  }
}
```

`atm-cli/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

`atm-cli/jest.config.js`
```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
};
```

`atm-cli/.gitignore`
```gitignore
node_modules/
dist/
coverage/
```

`start.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/atm-cli"
npm install --silent
npx ts-node src/index.ts
```

- [ ] **Step 2: Make `start.sh` executable**

Run: `chmod +x start.sh`
Expected: no output

- [ ] **Step 3: Create a canary test**

`atm-cli/tests/canary.test.ts`
```typescript
describe('canary', () => {
  it('runs jest', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 4: Install dependencies and run tests**

Run: `cd atm-cli && npm install && npm test`
Expected: PASS — `1 passed`

- [ ] **Step 5: Commit**

```bash
git add atm-cli start.sh
git commit -m "chore: scaffold atm typescript project"
```

---

### Task 2: Customer Model

**Files:**
- Create: `atm-cli/src/models/Customer.ts`
- Create: `atm-cli/tests/Customer.test.ts`
- Delete: `atm-cli/tests/canary.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `class Customer`
  - `constructor(name: string)`
  - properties: `name: string`, `balance: number`, `debts: Map<string, number>`

- [ ] **Step 1: Write the failing test**

`atm-cli/tests/Customer.test.ts`
```typescript
import { Customer } from '../src/models/Customer';

describe('Customer', () => {
  it('starts with zero balance and no debts', () => {
    const customer = new Customer('Alice');

    expect(customer.name).toBe('Alice');
    expect(customer.balance).toBe(0);
    expect(customer.debts.size).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/Customer.test.ts`
Expected: FAIL — module `../src/models/Customer` not found

- [ ] **Step 3: Write minimal implementation**

`atm-cli/src/models/Customer.ts`
```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/Customer.test.ts`
Expected: PASS — `1 passed`

- [ ] **Step 5: Remove canary and run full suite**

Run: `rm atm-cli/tests/canary.test.ts && cd atm-cli && npm test`
Expected: PASS — only `Customer.test.ts` runs and passes

- [ ] **Step 6: Commit**

```bash
git add atm-cli/src/models/Customer.ts atm-cli/tests/Customer.test.ts atm-cli/tests/canary.test.ts
git commit -m "feat: add customer model"
```

---

### Task 3: Bank Session and Customer Registry

**Files:**
- Create: `atm-cli/src/Bank.ts`
- Create: `atm-cli/tests/Bank.test.ts`

**Interfaces:**
- Consumes: `Customer` from `./models/Customer`
- Produces:
  - `interface LoginResult { user: Customer; owedFromOthers: Map<string, number> }`
  - `class Bank`
  - `login(name: string): LoginResult`
  - `logout(): Customer`
  - `getCurrentUser(): Customer | null`
  - `getCustomer(name: string): Customer | undefined`
  - `getOwedFromOthers(userName: string): Map<string, number>`

- [ ] **Step 1: Write the failing tests**

`atm-cli/tests/Bank.test.ts`
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/Bank.test.ts`
Expected: FAIL — module `../src/Bank` not found

- [ ] **Step 3: Write minimal implementation**

`atm-cli/src/Bank.ts`
```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/Bank.test.ts`
Expected: PASS — `5 passed`

- [ ] **Step 5: Commit**

```bash
git add atm-cli/src/Bank.ts atm-cli/tests/Bank.test.ts
git commit -m "feat: add bank session and customer registry"
```

---

### Task 4: Deposit with Automatic Debt Settlement

**Files:**
- Modify: `atm-cli/src/Bank.ts`
- Modify: `atm-cli/tests/Bank.test.ts`

**Interfaces:**
- Consumes: `Bank.getCurrentUser`, `Customer.debts`
- Produces:
  - `deposit(amount: number): { lines: string[] }`

- [ ] **Step 1: Write the failing tests**

Append to `atm-cli/tests/Bank.test.ts`
```typescript

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/Bank.test.ts`
Expected: FAIL — `bank.deposit is not a function`

- [ ] **Step 3: Write minimal implementation**

Add to `atm-cli/src/Bank.ts` inside `Bank`:
```typescript
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

  private requireCurrentUser(): Customer {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    return this.currentUser;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/Bank.test.ts`
Expected: PASS — deposit tests green

- [ ] **Step 5: Commit**

```bash
git add atm-cli/src/Bank.ts atm-cli/tests/Bank.test.ts
git commit -m "feat: add deposit with automatic debt settlement"
```

---

### Task 5: Withdraw

**Files:**
- Modify: `atm-cli/src/Bank.ts`
- Modify: `atm-cli/tests/Bank.test.ts`

**Interfaces:**
- Consumes: `requireCurrentUser()`
- Produces:
  - `withdraw(amount: number): { lines: string[] }`

- [ ] **Step 1: Write the failing tests**

Append to `atm-cli/tests/Bank.test.ts`
```typescript

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/Bank.test.ts`
Expected: FAIL — `bank.withdraw is not a function`

- [ ] **Step 3: Write minimal implementation**

Add to `atm-cli/src/Bank.ts` inside `Bank`:
```typescript
  withdraw(amount: number): { lines: string[] } {
    const user = this.requireCurrentUser();

    if (user.balance < amount) {
      return { lines: ["Sorry, you don't have enough balance."] };
    }

    user.balance -= amount;
    return { lines: [`Your balance is $${user.balance}`] };
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/Bank.test.ts`
Expected: PASS — withdraw tests green

- [ ] **Step 5: Commit**

```bash
git add atm-cli/src/Bank.ts atm-cli/tests/Bank.test.ts
git commit -m "feat: add withdraw operation"
```

---

### Task 6: Transfer with Partial Fulfilment and Debt Tracking

**Files:**
- Modify: `atm-cli/src/Bank.ts`
- Modify: `atm-cli/tests/Bank.test.ts`

**Interfaces:**
- Consumes: `requireCurrentUser()`, `getCustomer(name)`
- Produces:
  - `transfer(targetName: string, amount: number): { lines: string[] }`

- [ ] **Step 1: Write the failing tests**

Append to `atm-cli/tests/Bank.test.ts`
```typescript

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
      'Your balance is $30'
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/Bank.test.ts`
Expected: FAIL — `bank.transfer is not a function`

- [ ] **Step 3: Write minimal implementation**

Add to `atm-cli/src/Bank.ts` inside `Bank`:
```typescript
  transfer(targetName: string, amount: number): { lines: string[] } {
    const user = this.requireCurrentUser();

    if (targetName === user.name) {
      return { lines: ['Cannot transfer to yourself.'] };
    }

    const target = this.customers.get(targetName);
    if (!target) {
      return { lines: [`Sorry, ${targetName} doesn't exist.`] };
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

    if (user.debts.has(targetName)) {
      lines.push(`Owed $${user.debts.get(targetName)} to ${targetName}`);
    }

    if (target.debts.has(user.name)) {
      lines.push(`Owed $${target.debts.get(user.name)} from ${targetName}`);
    }

    return { lines };
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/Bank.test.ts`
Expected: PASS — transfer tests green

- [ ] **Step 5: Commit**

```bash
git add atm-cli/src/Bank.ts atm-cli/tests/Bank.test.ts
git commit -m "feat: add transfer debt logic"
```

---

### Task 7: Command Parser

**Files:**
- Create: `atm-cli/src/CommandParser.ts`
- Create: `atm-cli/tests/CommandParser.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type ParsedCommand`
  - `parseCommand(line: string): ParsedCommand`

- [ ] **Step 1: Write the failing test**

`atm-cli/tests/CommandParser.test.ts`
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/CommandParser.test.ts`
Expected: FAIL — module `../src/CommandParser` not found

- [ ] **Step 3: Write minimal implementation**

`atm-cli/src/CommandParser.ts`
```typescript
export type ParsedCommand =
  | { type: 'login'; name: string }
  | { type: 'deposit'; amount: number }
  | { type: 'withdraw'; amount: number }
  | { type: 'transfer'; target: string; amount: number }
  | { type: 'logout' }
  | { type: 'error'; message: string }
  | { type: 'unknown'; raw: string };

function parsePositiveInteger(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const amount = Number(value);
  return amount > 0 ? amount : null;
}

export function parseCommand(line: string): ParsedCommand {
  const trimmed = line.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const command = parts[0];

  switch (command) {
    case 'login':
      return parts[1]
        ? { type: 'login', name: parts[1] }
        : { type: 'error', message: 'Usage: login [name]' };
    case 'deposit': {
      if (!parts[1]) return { type: 'error', message: 'Usage: deposit [amount]' };
      const amount = parsePositiveInteger(parts[1]);
      return amount === null
        ? { type: 'error', message: 'Amount must be a positive integer.' }
        : { type: 'deposit', amount };
    }
    case 'withdraw': {
      if (!parts[1]) return { type: 'error', message: 'Usage: withdraw [amount]' };
      const amount = parsePositiveInteger(parts[1]);
      return amount === null
        ? { type: 'error', message: 'Amount must be a positive integer.' }
        : { type: 'withdraw', amount };
    }
    case 'transfer': {
      if (!parts[1] || !parts[2]) {
        return { type: 'error', message: 'Usage: transfer [target] [amount]' };
      }
      const amount = parsePositiveInteger(parts[2]);
      return amount === null
        ? { type: 'error', message: 'Amount must be a positive integer.' }
        : { type: 'transfer', target: parts[1], amount };
    }
    case 'logout':
      return { type: 'logout' };
    default:
      return { type: 'unknown', raw: trimmed };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/CommandParser.test.ts`
Expected: PASS — parser tests green

- [ ] **Step 5: Commit**

```bash
git add atm-cli/src/CommandParser.ts atm-cli/tests/CommandParser.test.ts
git commit -m "feat: add command parser"
```

---

### Task 8: Command Executor

**Files:**
- Create: `atm-cli/src/CommandExecutor.ts`
- Create: `atm-cli/tests/CommandExecutor.test.ts`

**Interfaces:**
- Consumes:
  - `Bank`
  - `ParsedCommand`
- Produces:
  - `executeCommand(bank: Bank, parsed: ParsedCommand): string[]`

- [ ] **Step 1: Write the failing test**

`atm-cli/tests/CommandExecutor.test.ts`
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/CommandExecutor.test.ts`
Expected: FAIL — module `../src/CommandExecutor` not found

- [ ] **Step 3: Write minimal implementation**

`atm-cli/src/CommandExecutor.ts`
```typescript
import { Bank } from './Bank';
import { ParsedCommand } from './CommandParser';

export function executeCommand(bank: Bank, parsed: ParsedCommand): string[] {
  switch (parsed.type) {
    case 'login': {
      const result = bank.login(parsed.name);
      const lines = [`Hello, ${result.user.name}!`, `Your balance is $${result.user.balance}`];

      for (const [creditorName, amount] of result.user.debts.entries()) {
        lines.push(`Owed $${amount} to ${creditorName}`);
      }

      for (const [debtorName, amount] of result.owedFromOthers.entries()) {
        lines.push(`Owed $${amount} from ${debtorName}`);
      }

      return lines;
    }

    case 'deposit':
      return bank.getCurrentUser() ? bank.deposit(parsed.amount).lines : ['Please login first.'];

    case 'withdraw':
      return bank.getCurrentUser() ? bank.withdraw(parsed.amount).lines : ['Please login first.'];

    case 'transfer':
      return bank.getCurrentUser() ? bank.transfer(parsed.target, parsed.amount).lines : ['Please login first.'];

    case 'logout':
      return bank.getCurrentUser() ? [`Goodbye, ${bank.logout().name}!`] : ['Please login first.'];

    case 'error':
      return [parsed.message];

    case 'unknown':
      return [`Unknown command: ${parsed.raw}`];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/CommandExecutor.test.ts`
Expected: PASS — executor tests green

- [ ] **Step 5: Commit**

```bash
git add atm-cli/src/CommandExecutor.ts atm-cli/tests/CommandExecutor.test.ts
git commit -m "feat: add command executor"
```

---

### Task 9: CLI Entry Point

**Files:**
- Create: `atm-cli/src/index.ts`

**Interfaces:**
- Consumes: `parseCommand`, `executeCommand`, `Bank`
- Produces: interactive CLI on stdin/stdout

- [ ] **Step 1: Implement the readline loop**

`atm-cli/src/index.ts`
```typescript
import readline from 'readline';
import { Bank } from './Bank';
import { parseCommand } from './CommandParser';
import { executeCommand } from './CommandExecutor';

const bank = new Bank();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(): void {
  process.stdout.write('$ ');
}

prompt();

rl.on('line', (line: string) => {
  const parsed = parseCommand(line);
  const outputLines = executeCommand(bank, parsed);

  for (const outputLine of outputLines) {
    console.log(outputLine);
  }

  console.log('');
  prompt();
});

rl.on('close', () => {
  process.exit(0);
});
```

- [ ] **Step 2: Smoke-test the CLI**

Run:
```bash
echo -e "login Alice\ndeposit 100\nlogout" | ./start.sh
```

Expected output:
```text
$ Hello, Alice!
Your balance is $0

$ Your balance is $100

$ Goodbye, Alice!

$
```

- [ ] **Step 3: Commit**

```bash
git add atm-cli/src/index.ts
git commit -m "feat: add cli entry point"
```

---

### Task 10: Integration Test for the Full Sample Session

**Files:**
- Create: `atm-cli/tests/integration.test.ts`

**Interfaces:**
- Consumes: `Bank`, `parseCommand`, `executeCommand`
- Produces: sample-session regression coverage

- [ ] **Step 1: Write the failing integration test**

`atm-cli/tests/integration.test.ts`
```typescript
import { Bank } from '../src/Bank';
import { parseCommand } from '../src/CommandParser';
import { executeCommand } from '../src/CommandExecutor';

function run(bank: Bank, command: string): string[] {
  return executeCommand(bank, parseCommand(command));
}

describe('ATM sample session', () => {
  it('matches the problem statement session', () => {
    const bank = new Bank();

    expect(run(bank, 'login Alice')).toEqual(['Hello, Alice!', 'Your balance is $0']);
    expect(run(bank, 'deposit 100')).toEqual(['Your balance is $100']);
    expect(run(bank, 'logout')).toEqual(['Goodbye, Alice!']);

    expect(run(bank, 'login Bob')).toEqual(['Hello, Bob!', 'Your balance is $0']);
    expect(run(bank, 'deposit 80')).toEqual(['Your balance is $80']);
    expect(run(bank, 'transfer Alice 50')).toEqual(['Transferred $50 to Alice', 'Your balance is $30']);
    expect(run(bank, 'transfer Alice 100')).toEqual(['Transferred $30 to Alice', 'Your balance is $0', 'Owed $70 to Alice']);
    expect(run(bank, 'deposit 30')).toEqual(['Transferred $30 to Alice', 'Your balance is $0', 'Owed $40 to Alice']);
    expect(run(bank, 'logout')).toEqual(['Goodbye, Bob!']);

    expect(run(bank, 'login Alice')).toEqual(['Hello, Alice!', 'Your balance is $210', 'Owed $40 from Bob']);
    expect(run(bank, 'transfer Bob 30')).toEqual(['Your balance is $210', 'Owed $10 from Bob']);
    expect(run(bank, 'logout')).toEqual(['Goodbye, Alice!']);

    expect(run(bank, 'login Bob')).toEqual(['Hello, Bob!', 'Your balance is $0', 'Owed $10 to Alice']);
    expect(run(bank, 'deposit 100')).toEqual(['Transferred $10 to Alice', 'Your balance is $90']);
    expect(run(bank, 'logout')).toEqual(['Goodbye, Bob!']);
  });
});
```

- [ ] **Step 2: Run test to reveal any mismatches**

Run: `cd atm-cli && npm test -- --runTestsByPath tests/integration.test.ts`
Expected: first run may fail if any business rule or output formatting is off

- [ ] **Step 3: Fix mismatches only in production code**

If the integration test fails, update only the relevant logic in:
- `atm-cli/src/Bank.ts`
- `atm-cli/src/CommandExecutor.ts`
- `atm-cli/src/CommandParser.ts`

Do **not** change the test unless the test miscopied the spec.

- [ ] **Step 4: Run the full suite**

Run: `cd atm-cli && npm test`
Expected: PASS — all unit and integration tests green

- [ ] **Step 5: Commit**

```bash
git add atm-cli/tests/integration.test.ts atm-cli/src/Bank.ts atm-cli/src/CommandExecutor.ts atm-cli/src/CommandParser.ts
git commit -m "test: add full sample session regression"
```

---

### Task 11: Documentation and Submission Notes

**Files:**
- Create: `atm-cli/README.md`
- Create: `atm-cli/ASSUMPTIONS.md`

**Interfaces:**
- Consumes: completed implementation
- Produces: run instructions and documented assumptions/deviations

- [ ] **Step 1: Write `README.md`**

`atm-cli/README.md`
```markdown
# ATM CLI

TypeScript implementation of the DKatalis ATM take-home challenge.

## Run

From the repository root:

```bash
./start.sh
```

## Test

```bash
cd atm-cli
npm install
npm test
npm run test:coverage
```

## Commands

- `login [name]`
- `deposit [amount]`
- `withdraw [amount]`
- `transfer [target] [amount]`
- `logout`

## Design

- `src/models/Customer.ts` — customer state
- `src/Bank.ts` — ATM business rules
- `src/CommandParser.ts` — CLI input parsing
- `src/CommandExecutor.ts` — output formatting
- `src/index.ts` — readline loop
```

- [ ] **Step 2: Write `ASSUMPTIONS.md`**

`atm-cli/ASSUMPTIONS.md`
```markdown
# Assumptions and Deviations

- Amounts must be positive integers. Decimal, zero, and negative values are rejected.
- Customer names are case-sensitive.
- State is held in memory only, so every `./start.sh` run starts fresh.
- The sample output line `your balance is $30` is treated as a typo and normalised to `Your balance is $30`.
- `withdraw` is implemented as a normal balance deduction because the problem statement defines the command but does not provide a sample interaction for it.
- Transfers to unknown users are rejected rather than auto-creating the target user.
```

- [ ] **Step 3: Run a doc-verified smoke test**

Run:
```bash
echo -e "login Alice\ndeposit 100\nlogout" | ./start.sh
```
Expected: output matches the README example

- [ ] **Step 4: Commit**

```bash
git add atm-cli/README.md atm-cli/ASSUMPTIONS.md
git commit -m "docs: add usage and assumptions"
```

---

### Task 12: Final Verification and Archive

**Files:**
- Modify: none

**Interfaces:**
- Consumes: completed project
- Produces: validated submission archive

- [ ] **Step 1: Run all tests one last time**

Run: `cd atm-cli && npm test`
Expected: PASS — full test suite green

- [ ] **Step 2: Run coverage**

Run: `cd atm-cli && npm run test:coverage`
Expected: coverage report prints and core logic files are well-covered

- [ ] **Step 3: Create the submission archive**

Run from repo root:
```bash
git archive --format=zip --output=atm-cli-submission.zip HEAD
```
Expected: `atm-cli-submission.zip` created successfully

- [ ] **Step 4: Verify archive contents are source-only**

Run:
```bash
unzip -l atm-cli-submission.zip | grep -E 'node_modules|dist|coverage'
```
Expected: no output

- [ ] **Step 5: Commit an empty submission checkpoint**

```bash
git commit --allow-empty -m "chore: mark atm submission ready"
```

---

## Self-Review

**1. Spec coverage:**
- CLI commands: covered by Tasks 3–9
- Automatic debt behaviour: covered by Tasks 4 and 6
- Exact sample session behaviour: covered by Task 10
- `start.sh` fresh environment: covered by Tasks 1 and 9
- Tests required: covered by Tasks 2–10 and 12
- Documentation of assumptions/deviations: covered by Task 11
- Submission archive: covered by Task 12

**2. Placeholder scan:** No `TBD`, `TODO`, or “write tests for the above” placeholders remain.

**3. Type consistency:**
- `Customer.debts` is always `Map<string, number>`
- `Bank` money operations all return `{ lines: string[] }`
- `ParsedCommand` is consumed consistently by `executeCommand`
