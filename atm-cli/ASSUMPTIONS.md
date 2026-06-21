# Assumptions and Deviations

- Amounts must be positive integers. Decimal, zero, and negative values are rejected.
- Customer names are case-sensitive.
- State is held in memory only, so every `./start.sh` run starts fresh.
- The sample output line `your balance is $30` is treated as a typo and normalised to `Your balance is $30`.
- `withdraw` is implemented as a normal balance deduction because the problem statement defines the command but does not provide a sample interaction for it.
- Transfers to unknown users are rejected rather than auto-creating the target user.
