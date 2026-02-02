import axios, { AxiosInstance, AxiosError } from 'axios';
import { withPaymentInterceptor } from 'x402-axios';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { getConfig } from './env.js';
import { budgetTracker, getEndpointCost } from './budgets.js';
import { UpstreamHttpError } from './errors.js';
import { getLogger, writeAuditLog, nowMs } from './util.js';
import type { BillingInfo, MetaInfo } from './types.js';

// ============================================================================
// X402 Client Setup
// ============================================================================

let clientInstance: AxiosInstance | null = null;
let paymentAddress: string | null = null;

function getPaymentWalletClient() {
  const config = getConfig();
  const account = privateKeyToAccount(config.PAYMENT_PRIVATE_KEY as `0x${string}`);
  paymentAddress = account.address;

  return createWalletClient({
    account,
    chain: base,
    transport: http(config.BASE_RPC_URL),
  });
}

export function getX402Client(): AxiosInstance {
  if (clientInstance) {
    return clientInstance;
  }

  const config = getConfig();
  const walletClient = getPaymentWalletClient();

  const baseAxios = axios.create({
    baseURL: config.ELSA_API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 60_000,
  });

  // Cast to any to handle x402-axios type compatibility with viem wallet client
  clientInstance = withPaymentInterceptor(baseAxios, walletClient as any);
  return clientInstance;
}

export function getPaymentAddress(): string {
  if (!paymentAddress) {
    getPaymentWalletClient();
  }
  return paymentAddress!;
}

// ============================================================================
// API Call Wrapper with Budget Enforcement
// ============================================================================

export interface ApiCallResult<T> {
  data: T;
  billing: BillingInfo;
  meta: MetaInfo;
}

export async function callElsaApi<T>(
  endpoint: string,
  payload: unknown
): Promise<ApiCallResult<T>> {
  const logger = getLogger();
  const startTime = nowMs();
  const estimatedCost = getEndpointCost(endpoint);

  // Enforce budget before attempting call
  budgetTracker.checkBudget(endpoint);

  logger.debug({ endpoint, payload }, 'Calling Elsa API');

  try {
    const client = getX402Client();
    const response = await client.post<T>(endpoint, payload);

    const latencyMs = nowMs() - startTime;

    // Record successful call
    budgetTracker.recordCall(endpoint, estimatedCost);

    // Build billing info
    const billing: BillingInfo = {
      estimated_cost_usd: estimatedCost,
      payment_required: true,
      receipt: null, // x402-axios handles payment automatically; receipt not easily accessible
      protocol: 'x402-v1-compat',
    };

    // Build meta info
    const meta: MetaInfo = {
      latency_ms: latencyMs,
      endpoint,
      timestamp: new Date().toISOString(),
    };

    // Write audit log
    writeAuditLog({
      type: 'api_call',
      endpoint,
      estimated_cost_usd: estimatedCost,
      ok: true,
      latency_ms: latencyMs,
    });

    logger.info({ endpoint, latencyMs, estimatedCost }, 'API call successful');

    return {
      data: response.data,
      billing,
      meta,
    };
  } catch (error) {
    const latencyMs = nowMs() - startTime;

    // Write audit log for failed call
    writeAuditLog({
      type: 'api_call',
      endpoint,
      estimated_cost_usd: estimatedCost,
      ok: false,
      latency_ms: latencyMs,
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof AxiosError) {
      const status = error.response?.status ?? 0;
      const statusText = error.response?.statusText ?? 'Unknown';

      logger.error(
        { endpoint, status, statusText, latencyMs },
        'Elsa API request failed'
      );

      throw new UpstreamHttpError(
        `Elsa API error: ${status} ${statusText}`,
        { status, statusText, url: endpoint }
      );
    }

    throw error;
  }
}
