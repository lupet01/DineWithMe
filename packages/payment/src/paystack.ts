/**
 * Paystack Payment Provider Service
 * 
 * Handles integration with Paystack API for payment processing
 */

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
  };
}

export interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data: {
    transaction: {
      id: number;
      domain: string;
      reference: string;
      amount: number;
      currency: string;
      status: string;
    };
    integration: number;
    deducted_amount: number;
    channel: string | null;
    merchant_note: string;
    customer_note: string;
    status: string;
    refunded_by: string;
    refunded_at: string;
    created_at: string;
    updated_at: string;
  };
}

export class PaystackService {
  private secretKey: string;
  private baseUrl: string;

  constructor(secretKey: string, baseUrl: string = "https://api.paystack.co") {
    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Initialize a transaction
   * 
   * @param params - Transaction parameters
   * @returns Authorization URL and reference
   */
  async initializeTransaction(params: {
    email: string;
    amount: number; // Amount in kobo (cents)
    reference?: string;
    callback_url?: string;
    metadata?: Record<string, any>;
  }): Promise<PaystackInitializeResponse> {
    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      throw new Error(`Paystack API error: ${error.message || response.statusText}`);
    }

    return response.json() as Promise<PaystackInitializeResponse>;
  }

  /**
   * Verify a transaction
   * 
   * @param reference - Transaction reference
   * @returns Transaction details
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      throw new Error(`Paystack API error: ${error.message || response.statusText}`);
    }

    return response.json() as Promise<PaystackVerifyResponse>;
  }

  /**
   * Verify webhook signature
   * 
   * @param payload - Webhook payload
   * @param signature - Signature from header
   * @returns True if signature is valid
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha512", this.secretKey)
      .update(payload)
      .digest("hex");
    return hash === signature;
  }

  /**
   * Refund a transaction
   * 
   * @param reference - Transaction reference
   * @param amount - Amount to refund (optional, full refund if not specified)
   * @param merchant_note - Internal note for the refund
   * @param customer_note - Note to customer about the refund
   * @returns Refund details
   */
  async refundTransaction(params: {
    reference: string;
    amount?: number;
    merchant_note?: string;
    customer_note?: string;
  }): Promise<PaystackRefundResponse> {
    const response = await fetch(`${this.baseUrl}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: params.reference,
        amount: params.amount,
        merchant_note: params.merchant_note || "Refund processed",
        customer_note: params.customer_note || "Your payment has been refunded",
      }),
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      throw new Error(`Paystack API error: ${error.message || response.statusText}`);
    }

    return response.json() as Promise<PaystackRefundResponse>;
  }
}

/**
 * Create Paystack service instance
 */
export function createPaystackService(secretKey: string): PaystackService {
  return new PaystackService(secretKey);
}
