import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

export const MP_CONFIG = {
  accessToken:
    process.env.MP_ACCESS_TOKEN ||
    'TEST-MOCK-MERCADOPAGO-SANDBOX-TOKEN',
  webhookSecret: process.env.MP_WEBHOOK_SECRET || 'test_webhook_secret_key_dev',
  backUrls: {
    success:
      process.env.MP_BACK_URL_SUCCESS ||
      (process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL.replace(/\/$/, '')}/checkout/success` : 'surfrental://checkout/success'),
    failure:
      process.env.MP_BACK_URL_FAILURE ||
      (process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL.replace(/\/$/, '')}/checkout/failure` : 'surfrental://checkout/failure'),
    pending:
      process.env.MP_BACK_URL_PENDING ||
      (process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL.replace(/\/$/, '')}/checkout/pending` : 'surfrental://checkout/pending'),
  },
  notificationUrl:
    process.env.MP_NOTIFICATION_URL ||
    (process.env.PUBLIC_URL
      ? `${process.env.PUBLIC_URL.replace(/\/$/, '')}/api/payments/webhook`
      : process.env.API_BASE_URL
      ? `${process.env.API_BASE_URL.replace(/\/$/, '')}/payments/webhook`
      : 'http://localhost:3000/api/payments/webhook'),
  currency: 'ARS',
};

export const mpClient = new MercadoPagoConfig({
  accessToken: MP_CONFIG.accessToken,
  options: { timeout: 10000 },
});

export const mpPreference = new Preference(mpClient);
export const mpPayment = new Payment(mpClient);
