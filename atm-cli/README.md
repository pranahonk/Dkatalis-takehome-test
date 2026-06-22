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
