# Assumptions and Deviations

- Amounts must be positive integers. Decimal, zero, and negative values are rejected.
- Customer names are case-sensitive.
- State is held in memory only, so every `./start.sh` run starts fresh.
- Transfer balance lines follow the literal mixed-case sample output: step 6 uses `your balance is $30`, while the later transfer sample lines use `Your balance is $...`.
- `withdraw` is implemented as a normal balance deduction because the problem statement defines the command but does not provide a sample interaction for it.
- Transfers to unknown users are rejected rather than auto-creating the target user.
