// src/lib/paymongo.ts
// PayMongo Payment Integration Service

import { API_BASE_URL } from '../config/environment';
import { authFetch } from './api';

// PayMongo payment method types
export type PaymentMethodType = 'gcash' | 'grab_pay' | 'paymaya' | 'card';

export interface PaymentIntent {
  id: string;
  type: string;
  attributes: {
    amount: number;
    currency: string;
    description: string;
    status: string;
    client_key: string;
    payment_method_allowed: string[];
    next_action?: {
      type: string;
      redirect?: {
        url: string;
        return_url: string;
      };
    };
  };
}

export interface CreatePaymentRequest {
  amount: number;
  projectId: string;
  projectName: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  checkoutUrl?: string;
  paymentIntentId?: string;
  error?: string;
}

/**
 * Create a PayMongo checkout session for investment
 * This calls our backend which then communicates with PayMongo API
 */
export async function createPaymentCheckout(
  request: CreatePaymentRequest
): Promise<PaymentResponse> {
  console.log('🏦 Creating PayMongo checkout for:', request);
  
  try {
    const response = await authFetch(`${API_BASE_URL}/payments/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: request.amount,
        projectId: request.projectId,
        projectName: request.projectName,
        description: request.description || `Investment in ${request.projectName}`,
      }),
    });
    
    console.log('✅ PayMongo checkout response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ PayMongo checkout error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payment checkout',
    };
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(paymentIntentId: string): Promise<any> {
  try {
    const response = await authFetch(`${API_BASE_URL}/payments/status/${paymentIntentId}`);
    return response;
  } catch (error: any) {
    console.error('❌ Payment status check error:', error);
    return {
      success: false,
      error: error.message || 'Failed to check payment status',
    };
  }
}

/**
 * Get payment history for current user
 */
export async function getPaymentHistory(): Promise<any> {
  try {
    const response = await authFetch(`${API_BASE_URL}/payments/history`);
    return response;
  } catch (error: any) {
    console.error('❌ Payment history error:', error);
    return {
      success: false,
      payments: [],
      error: error.message || 'Failed to get payment history',
    };
  }
}
