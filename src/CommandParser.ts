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
