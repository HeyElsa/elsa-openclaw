# openclaw-elsa-x402

OpenClaw skill-pack for Elsa x402 DeFi API integration with micropayments.

This plugin enables OpenClaw agents to interact with the [Elsa DeFi API](https://x402.heyelsa.ai) using the x402 payment protocol for USDC micropayments on Base.

## Security Posture

- **Non-custodial**: Private keys never leave your machine
- **Local signing**: All transactions are signed locally using viem
- **Budget controls**: Per-call and daily USD limits enforced before any paid API call
- **Execution disabled by default**: Onchain execution tools require explicit opt-in
- **Confirmation tokens**: Dry-run required before confirmed execution (optional but recommended)
- **Separate wallets recommended**: Use different keys for API payments vs. trade execution

## Features

### Read-Only Tools (Always Available)
- `elsa_search_token` - Search tokens across blockchains
- `elsa_get_token_price` - Get real-time token pricing
- `elsa_get_balances` - Get wallet token balances
- `elsa_get_portfolio` - Comprehensive portfolio analysis
- `elsa_analyze_wallet` - Wallet behavior and risk assessment
- `elsa_get_swap_quote` - Get swap quotes and routing
- `elsa_execute_swap_dry_run` - Simulate swap execution (no onchain action)
- `elsa_budget_status` - Check current budget usage

### Execution Tools (Opt-In)
When `ELSA_ENABLE_EXECUTION_TOOLS=true`:
- `elsa_execute_swap_confirmed` - Execute swap with confirmation token
- `elsa_pipeline_get_status` - Check pipeline/transaction status
- `elsa_pipeline_submit_tx_hash` - Submit signed transaction hash
- `elsa_pipeline_run_and_wait` - Orchestrate full pipeline execution

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/HeyElsa/elsa-openclaw.git
cd openclaw-elsa-x402
npm install
```

### 2. Configure OpenClaw

Add the repository path to your OpenClaw configuration:

```json
{
  "skills": {
    "load": {
      "extraDirs": [
        "/path/to/openclaw-elsa-x402"
      ]
    },
    "entries": {
      "openclaw-elsa-x402": {
        "env": {
          "PAYMENT_PRIVATE_KEY": "0x...",
          "TRADE_PRIVATE_KEY": "0x...",
          "BASE_RPC_URL": "https://mainnet.base.org",
          "ELSA_BASE_URL": "https://x402-api.heyelsa.ai",
          "ELSA_MAX_USD_PER_CALL": "0.05",
          "ELSA_MAX_USD_PER_DAY": "2.00",
          "ELSA_MAX_CALLS_PER_MINUTE": "30",
          "ELSA_TZ": "UTC",
          "ELSA_ENABLE_EXECUTION_TOOLS": "false",
          "ELSA_REQUIRE_CONFIRMATION_TOKEN": "true",
          "ELSA_CONFIRMATION_TTL_SECONDS": "600",
          "LOG_LEVEL": "info"
        }
      }
    }
  }
}
```

### 3. Fund your payment wallet

The payment wallet (PAYMENT_PRIVATE_KEY) needs USDC on Base to pay for API calls. Typical costs:
- Search/price queries: $0.001-$0.005
- Portfolio analysis: $0.01-$0.02
- Swap execution: $0.02

## Smoke Test

After installation, verify the setup:

```bash
# Search for a token
npx tsx scripts/index.ts elsa_search_token '{"query": "USDC", "limit": 3}'

# Get portfolio for a sample address
npx tsx scripts/index.ts elsa_get_portfolio '{"wallet_address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}'

# Check budget status
npx tsx scripts/index.ts elsa_budget_status '{}'
```

Expected output includes:
- `ok: true` for successful calls
- `billing: { estimated_cost_usd, ... }` showing API cost
- `meta: { latency_ms, ... }` with request metadata

## Enabling Execution Tools

**WARNING**: Execution tools perform real onchain transactions.

1. Set `ELSA_ENABLE_EXECUTION_TOOLS=true`
2. Ensure `TRADE_PRIVATE_KEY` has sufficient funds for gas and swaps
3. Recommended: Keep `ELSA_REQUIRE_CONFIRMATION_TOKEN=true`

### Safe Execution Pattern

1. Always call `elsa_get_swap_quote` first to review terms
2. Call `elsa_execute_swap_dry_run` to get a `confirmation_token`
3. Review the dry-run output carefully
4. Call `elsa_execute_swap_confirmed` with the `confirmation_token`
5. Use `elsa_pipeline_run_and_wait` to complete signing and submission

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PAYMENT_PRIVATE_KEY` | Yes | - | Wallet for x402 API payments (hex with 0x prefix) |
| `TRADE_PRIVATE_KEY` | No | PAYMENT_PRIVATE_KEY | Wallet for tx signing (recommend separate) |
| `BASE_RPC_URL` | No | https://mainnet.base.org | Base RPC endpoint |
| `ELSA_BASE_URL` | No | https://x402-api.heyelsa.ai | Elsa API base URL |
| `ELSA_MAX_USD_PER_CALL` | No | 0.05 | Max USD per single API call |
| `ELSA_MAX_USD_PER_DAY` | No | 2.00 | Max USD spend per day |
| `ELSA_MAX_CALLS_PER_MINUTE` | No | 30 | Rate limit for API calls |
| `ELSA_TZ` | No | UTC | Timezone for daily budget reset |
| `ELSA_ENABLE_EXECUTION_TOOLS` | No | false | Enable onchain execution tools |
| `ELSA_REQUIRE_CONFIRMATION_TOKEN` | No | true | Require dry-run before execution |
| `ELSA_CONFIRMATION_TTL_SECONDS` | No | 600 | Token validity period |
| `ELSA_AUDIT_LOG_PATH` | No | - | Path for JSONL audit logs |
| `LOG_LEVEL` | No | info | Logging level (debug/info/warn/error) |

## API Pricing

Costs are charged via x402 micropayments in USDC on Base:

| Endpoint | Cost (USD) |
|----------|------------|
| /api/search_token | $0.001 |
| /api/get_token_price | $0.002 |
| /api/get_balances | $0.005 |
| /api/get_portfolio | $0.01 |
| /api/analyze_wallet | $0.02 |
| /api/get_swap_quote | $0.01 |
| /api/execute_swap | $0.02 |
| /api/get_transaction_status | $0.005 |
| /api/submit_transaction_hash | $0.005 |

Note: Prices are estimates based on documentation. Actual costs are determined by x402 payment headers at request time.

## License

MIT
