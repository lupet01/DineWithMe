# EPIC 7.3: Payment Webhook Handler - Quick Reference

## Webhook Endpoint

```
POST /api/payments/webhook
```

**No authentication required** (validated by signature)

## Paystack Configuration

### Dashboard Setup

1. Go to https://dashboard.paystack.com/
2. Navigate to Settings > API Keys & Webhooks
3. Set Webhook URL: `https://your-domain.com/api/payments/webhook`
4. Enable events:
   - `charge.success`
   - `charge.failed`
5. Copy webhook secret (not needed, uses API secret key)

## Supported Events

### charge.success

Payment succeeded on Paystack.

**Actions**:
- Mark payment as SUCCEEDED
- Confirm seat (HELD → CONFIRMED)
- Emit `payment_succeeded` analytics

### charge.failed

Payment failed on Paystack.

**Actions**:
- Mark payment as FAILED
- Emit `payment_failed` analytics
- Seat remains HELD (will expire)

## Security

### Signature Validation

```typescript
const signature = request.headers.get("x-paystack-signature");
const isValid = paystack.verifyWebhookSignature(body, signature);
```

**Algorithm**: HMAC SHA512
**Key**: PAYSTACK_SECRET_KEY

### Idempotency

Handler checks payment status before processing:
- Already SUCCEEDED → return success
- Already FAILED → return success
- Not found → return success

## Testing

### Local Testing

```bash
# 1. Set environment
export PAYSTACK_SECRET_KEY=sk_test_your_key

# 2. Start server
npm run dev

# 3. Use ngrok
ngrok http 3001

# 4. Set webhook URL in Paystack
https://your-ngrok-url.ngrok.io/api/payments/webhook
```

### Test with Paystack CLI

```bash
npm install -g @paystack/cli
paystack login
paystack webhook listen --port 3001
paystack webhook forward http://localhost:3001/api/payments/webhook
```

### Manual Simulation

```bash
# Generate signature
node -e "
const crypto = require('crypto');
const payload = '{\"event\":\"charge.success\",\"data\":{\"reference\":\"cm...\",\"status\":\"success\"}}';
const sig = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(payload).digest('hex');
console.log(sig);
"

# Send webhook
curl -X POST http://localhost:3001/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: <signature>" \
  -d '{"event":"charge.success","data":{"reference":"cm...","status":"success"}}'
```

## Error Handling

**Always returns 200** to prevent Paystack retries.

**Exceptions**:
- Invalid signature: 401 (Paystack will retry)

**Logging**:
- All events logged
- Errors logged with context
- Critical errors (seat confirmation failure) logged separately

## Monitoring

**Watch for**:
- Invalid signatures (potential attack)
- Payment succeeded but seat not confirmed (needs manual fix)
- High payment failure rate

## Files

- **Webhook**: `apps/web/src/app/api/payments/webhook/route.ts`
- **Test**: `test-payment-webhook.ts`
- **Docs**: `EPIC_7.3_COMPLETE.md`
