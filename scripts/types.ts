import { z } from 'zod';

// ============================================================================
// Input Schemas
// ============================================================================

export const SearchTokenInputSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(100).optional().default(10),
});

export const GetTokenPriceInputSchema = z.object({
  token_address: z.string().min(1),
  chain: z.string().optional().default('base'),
});

export const GetBalancesInputSchema = z.object({
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
});

export const GetPortfolioInputSchema = z.object({
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
});

export const AnalyzeWalletInputSchema = z.object({
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
});

export const SwapParamsSchema = z.object({
  from_chain: z.string().min(1),
  from_token: z.string().min(1),
  from_amount: z.string().min(1),
  to_chain: z.string().min(1),
  to_token: z.string().min(1),
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  slippage: z.number().min(0).max(50),
});

export const GetSwapQuoteInputSchema = SwapParamsSchema;

export const ExecuteSwapDryRunInputSchema = SwapParamsSchema.extend({
  dry_run: z.literal(true).optional(),
});

export const ExecuteSwapConfirmedInputSchema = SwapParamsSchema.extend({
  confirmation_token: z.string().optional(),
});

export const PipelineGetStatusInputSchema = z.object({
  pipeline_id: z.string().min(1),
});

export const PipelineSubmitTxHashInputSchema = z.object({
  task_id: z.string().min(1),
  tx_hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
});

export const PipelineRunAndWaitInputSchema = z.object({
  pipeline_id: z.string().min(1),
  timeout_seconds: z.number().int().min(10).max(600).optional().default(120),
  poll_interval_seconds: z.number().int().min(1).max(30).optional().default(2),
  mode: z.enum(['local_signer', 'external_signer']).optional().default('local_signer'),
});

export const BudgetStatusInputSchema = z.object({});

// ============================================================================
// Output Types
// ============================================================================

export interface BillingInfo {
  estimated_cost_usd: number;
  payment_required: boolean;
  receipt: string | null;
  protocol: string;
}

export interface MetaInfo {
  latency_ms: number;
  endpoint: string;
  timestamp: string;
}

export interface ToolSuccess<T = unknown> {
  ok: true;
  data: T;
  billing: BillingInfo;
  meta: MetaInfo;
}

export interface ToolError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ToolResult<T = unknown> = ToolSuccess<T> | ToolError;

// ============================================================================
// Pipeline Types
// ============================================================================

export type PipelineTaskStatus =
  | 'pending'
  | 'running'
  | 'sign_pending'
  | 'deferred'
  | 'success'
  | 'failed'
  | 'abandoned';

export interface EvmTxData {
  chain_id: string;
  to: string;
  value: string;
  data: string;
  gas: string;
  from: string;
}

export interface PipelineTask {
  task_id: string;
  action_type: string;
  status: PipelineTaskStatus;
  description?: string;
  task_description?: string;
  short_description?: string;
  tx_hash?: string;
  tx_data?: TransactionData;
  evm_tx_data?: EvmTxData;
  log?: string | null;
}

export interface TransactionData {
  to: string;
  data: string;
  value?: string;
  gas?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  chainId?: number;
}

export interface PipelineRunResult {
  ok: true;
  status: 'success' | 'failed' | 'timeout' | 'needs_external_signature' | 'in_progress';
  pipeline_id: string;
  tasks: Array<{
    task_id: string;
    status: string;
    tx_hash?: string;
    tx_data?: TransactionData;
  }>;
  tx_hashes: string[];
  meta: MetaInfo;
}

// ============================================================================
// Confirmation Token Types
// ============================================================================

export interface ConfirmationTokenData {
  createdAt: number;
  expiresAt: number;
  normalizedParamsHash: string;
}

export interface NormalizedSwapParams {
  from_chain: string;
  from_token: string;
  from_amount: string;
  to_chain: string;
  to_token: string;
  wallet_address: string;
  slippage: number;
}

// ============================================================================
// Budget Types
// ============================================================================

export interface CallRecord {
  timestamp: number;
  endpoint: string;
  cost_usd: number;
}

export interface BudgetStatus {
  spent_today_usd: number;
  remaining_today_usd: number;
  calls_last_minute: number;
  last_calls: CallRecord[];
}

// ============================================================================
// Tool Handler Types
// ============================================================================

export interface ToolHandler {
  validate: (args: unknown) => string | null;
  run: (args: unknown) => Promise<unknown>;
}

export type ToolRegistry = Record<string, ToolHandler>;

// ============================================================================
// Elsa API Response Types
// ============================================================================

export interface ElsaSearchTokenResponse {
  tokens: Array<{
    name: string;
    symbol: string;
    address: string;
    chain: string;
    decimals: number;
    price_usd?: string;
    logo_url?: string;
  }>;
}

export interface ElsaTokenPriceResponse {
  token_address: string;
  chain: string;
  price_usd: string;
  price_change_24h?: number;
  market_cap?: string;
  volume_24h?: string;
}

export interface ElsaBalancesResponse {
  balances: Array<{
    chain: string;
    token_address: string;
    symbol: string;
    balance: string;
    balance_usd: string;
    decimals: number;
  }>;
  total_usd: string;
}

export interface ElsaPortfolioResponse {
  wallet_address: string;
  total_value_usd: string;
  chains: Array<{
    chain: string;
    value_usd: string;
    tokens: Array<{
      symbol: string;
      address: string;
      balance: string;
      value_usd: string;
    }>;
  }>;
}

export interface ElsaAnalyzeWalletResponse {
  wallet_address: string;
  risk_score: number;
  activity_summary: {
    total_transactions: number;
    first_seen: string;
    last_active: string;
  };
  labels: string[];
}

export interface ElsaSwapQuoteResponse {
  quote_id: string;
  from_chain: string;
  from_token: string;
  from_amount: string;
  from_amount_usd: string;
  to_chain: string;
  to_token: string;
  to_amount: string;
  to_amount_usd: string;
  to_amount_min: string;
  price_impact: string;
  gas_estimate_usd: string;
  route: string[];
}

export interface ElsaExecuteSwapResponse {
  pipeline_id: string;
  status: string;
  tasks?: PipelineTask[];
  message?: string;
}

export interface ElsaPipelineStatusResponse {
  pipeline_id: string;
  status: PipelineTask[];  // API returns tasks as 'status' array
  timestamp?: string;
}

export interface ElsaSubmitTxHashResponse {
  task_id: string;
  status: string;
  message?: string;
}
