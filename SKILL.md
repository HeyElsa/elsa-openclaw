---
name: openclaw-elsa-x402
version: 1.0.0
description: Elsa DeFi API tools with x402 micropayments for portfolio analysis, token search, and swap execution
author: Elsa Team
tags:
  - defi
  - trading
  - portfolio
  - x402
  - base
  - micropayments
danger: |
  EXECUTION TOOLS CAN PERFORM REAL ONCHAIN TRANSACTIONS.
  - Execution is DISABLED by default (ELSA_ENABLE_EXECUTION_TOOLS=false)
  - Even when enabled, dry-run confirmation is required by default
  - Real funds may be at risk - use separate wallets for payments vs trading
  - Never loop execution calls - always wait for user confirmation between swaps
---

# Elsa x402 DeFi Tools

This skill provides access to the Elsa DeFi API for portfolio management, token analysis, and swap execution using x402 micropayments.

## Standard Operating Procedure

### Budget Controls
- Maximum $0.05 per API call (configurable)
- Maximum $2.00 per day (configurable)
- Maximum 30 calls per minute rate limit
- Daily budget resets at midnight in configured timezone (default: UTC)

### Required Confirmation Flow
When execution tools are enabled:
1. **ALWAYS** get a quote first with `elsa_get_swap_quote`
2. **ALWAYS** dry-run with `elsa_execute_swap_dry_run` before any real execution
3. **ALWAYS** present the dry-run results to the user and wait for explicit confirmation
4. **ONLY THEN** call `elsa_execute_swap_confirmed` with the confirmation token
5. **NEVER** loop or batch execution calls without user confirmation between each

### Critical Rules
- **NEVER** execute swaps without showing the user the quote first
- **NEVER** call execution tools in a loop
- **NEVER** proceed if budget limits are exceeded
- **ALWAYS** check `elsa_budget_status` if unsure about remaining budget
- **ALWAYS** use dry-run mode first for any swap operation

## Tool Catalog

### Read-Only Tools (Always Available)

#### elsa_search_token
Search for tokens across supported blockchains.

```bash
npx tsx scripts/index.ts elsa_search_token '{"query": "USDC", "limit": 5}'
```

**Input:**
- `query` (string, required): Token name, symbol, or address
- `limit` (number, optional): Max results (default: 10)

---

#### elsa_get_token_price
Get current price for a token.

```bash
npx tsx scripts/index.ts elsa_get_token_price '{"token_address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "chain": "base"}'
```

**Input:**
- `token_address` (string, required): Token contract address
- `chain` (string, optional): Chain name (default: "base")

---

#### elsa_get_balances
Get token balances for a wallet.

```bash
npx tsx scripts/index.ts elsa_get_balances '{"wallet_address": "0x..."}'
```

**Input:**
- `wallet_address` (string, required): Wallet address to query

---

#### elsa_get_portfolio
Get comprehensive portfolio analysis.

```bash
npx tsx scripts/index.ts elsa_get_portfolio '{"wallet_address": "0x..."}'
```

**Input:**
- `wallet_address` (string, required): Wallet address to analyze

---

#### elsa_analyze_wallet
Get wallet behavior and risk assessment.

```bash
npx tsx scripts/index.ts elsa_analyze_wallet '{"wallet_address": "0x..."}'
```

**Input:**
- `wallet_address` (string, required): Wallet address to analyze

---

#### elsa_get_swap_quote
Get a swap quote with optimal routing.

```bash
npx tsx scripts/index.ts elsa_get_swap_quote '{
  "from_chain": "base",
  "from_token": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "from_amount": "100",
  "to_chain": "base",
  "to_token": "0x4200000000000000000000000000000000000006",
  "wallet_address": "0x...",
  "slippage": 0.5
}'
```

**Input:**
- `from_chain` (string, required): Source chain
- `from_token` (string, required): Source token address
- `from_amount` (string, required): Amount to swap
- `to_chain` (string, required): Destination chain
- `to_token` (string, required): Destination token address
- `wallet_address` (string, required): Wallet address
- `slippage` (number, required): Slippage tolerance (0-50)

---

#### elsa_execute_swap_dry_run
Simulate a swap without execution. Returns a confirmation token for subsequent confirmed execution.

```bash
npx tsx scripts/index.ts elsa_execute_swap_dry_run '{
  "from_chain": "base",
  "from_token": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "from_amount": "100",
  "to_chain": "base",
  "to_token": "0x4200000000000000000000000000000000000006",
  "wallet_address": "0x...",
  "slippage": 0.5
}'
```

**Output includes:**
- Swap simulation results
- `confirmation_token` (if ELSA_REQUIRE_CONFIRMATION_TOKEN=true)
- Token expires after ELSA_CONFIRMATION_TTL_SECONDS

---

#### elsa_budget_status
Check current budget usage and remaining limits.

```bash
npx tsx scripts/index.ts elsa_budget_status '{}'
```

**Output:**
- `spent_today_usd`: Amount spent today
- `remaining_today_usd`: Remaining daily budget
- `calls_last_minute`: Recent call count
- `last_calls`: Recent call details

---

### Execution Tools (Requires ELSA_ENABLE_EXECUTION_TOOLS=true)

#### elsa_execute_swap_confirmed
Execute a confirmed swap. Requires prior dry-run and confirmation token.

```bash
npx tsx scripts/index.ts elsa_execute_swap_confirmed '{
  "from_chain": "base",
  "from_token": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "from_amount": "100",
  "to_chain": "base",
  "to_token": "0x4200000000000000000000000000000000000006",
  "wallet_address": "0x...",
  "slippage": 0.5,
  "confirmation_token": "abc123..."
}'
```

---

#### elsa_pipeline_get_status
Check status of a pipeline/transaction.

```bash
npx tsx scripts/index.ts elsa_pipeline_get_status '{"pipeline_id": "pip_123456789"}'
```

---

#### elsa_pipeline_submit_tx_hash
Submit a signed transaction hash to the pipeline.

```bash
npx tsx scripts/index.ts elsa_pipeline_submit_tx_hash '{"task_id": "task_123", "tx_hash": "0x..."}'
```

---

#### elsa_pipeline_run_and_wait
Orchestrate full pipeline execution with automatic signing and submission.

```bash
npx tsx scripts/index.ts elsa_pipeline_run_and_wait '{
  "pipeline_id": "pip_123456789",
  "timeout_seconds": 120,
  "poll_interval_seconds": 2,
  "mode": "local_signer"
}'
```

**Modes:**
- `local_signer`: Signs and broadcasts transactions using TRADE_PRIVATE_KEY
- `external_signer`: Returns unsigned tx_data for external signing

## Supported Chains

- base (default)
- ethereum
- arbitrum
- optimism
- polygon
- bsc
- avalanche
- zksync

## Coming Soon

- **Hyperliquid Perp Endpoints** - Perpetual futures trading on Hyperliquid L1
- **Polymarket APIs** - Prediction market trading and data
