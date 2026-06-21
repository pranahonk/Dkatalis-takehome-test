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

    default: {
      const _exhaustive: never = parsed;
      throw new Error(`Unhandled command type: ${(_exhaustive as { type: string }).type}`);
    }
  }
}
