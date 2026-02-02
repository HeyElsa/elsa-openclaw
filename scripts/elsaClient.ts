import { callElsaApi } from './x402Client.js';
import type {
  ElsaSearchTokenResponse,
  ElsaTokenPriceResponse,
  ElsaBalancesResponse,
  ElsaPortfolioResponse,
  ElsaAnalyzeWalletResponse,
  ElsaSwapQuoteResponse,
  ElsaExecuteSwapResponse,
  ElsaPipelineStatusResponse,
  ElsaSubmitTxHashResponse,
} from './types.js';

// ============================================================================
// Elsa API Methods
// ============================================================================

export async function searchToken(query: string, limit: number = 10) {
  return callElsaApi<ElsaSearchTokenResponse>('/api/search_token', {
    symbol_or_address: query,
    limit,
  });
}

export async function getTokenPrice(tokenAddress: string, chain: string = 'base') {
  return callElsaApi<ElsaTokenPriceResponse>('/api/get_token_price', {
    token_address: tokenAddress,
    chain,
  });
}

export async function getBalances(walletAddress: string) {
  return callElsaApi<ElsaBalancesResponse>('/api/get_balances', {
    wallet_address: walletAddress,
  });
}

export async function getPortfolio(walletAddress: string) {
  return callElsaApi<ElsaPortfolioResponse>('/api/get_portfolio', {
    wallet_address: walletAddress,
  });
}

export async function analyzeWallet(walletAddress: string) {
  return callElsaApi<ElsaAnalyzeWalletResponse>('/api/analyze_wallet', {
    wallet_address: walletAddress,
  });
}

export async function getSwapQuote(params: {
  from_chain: string;
  from_token: string;
  from_amount: string;
  to_chain: string;
  to_token: string;
  wallet_address: string;
  slippage: number;
}) {
  return callElsaApi<ElsaSwapQuoteResponse>('/api/get_swap_quote', params);
}

export async function executeSwap(params: {
  from_chain: string;
  from_token: string;
  from_amount: string;
  to_chain: string;
  to_token: string;
  wallet_address: string;
  slippage: number;
  dry_run: boolean;
}) {
  return callElsaApi<ElsaExecuteSwapResponse>('/api/execute_swap', params);
}

export async function getPipelineStatus(pipelineId: string) {
  return callElsaApi<ElsaPipelineStatusResponse>('/api/get_transaction_status', {
    pipeline_id: pipelineId,
  });
}

export async function submitTransactionHash(taskId: string, txHash: string) {
  return callElsaApi<ElsaSubmitTxHashResponse>('/api/submit_transaction_hash', {
    task_id: taskId,
    tx_hash: txHash,
  });
}
