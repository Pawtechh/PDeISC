import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

export const MP_CONFIG = {
  accessToken:
    process.env.MP_ACCESS_TOKEN ||
    'TEST-MOCK-MERCADOPAGO-SANDBOX-TOKEN',
  webhookSecret: process.env.MP_WEBHOOK_SECRET || 'test_webhook_secret_key_mdp',
  backUrls: {
    success: process.env.MP_BACK_URL_SUCCESS || 'surfrental://checkout/success',
    failure: process.env.MP_BACK_URL_FAILURE || 'surfrental://checkout/failure',
    pending: process.env.MP_BACK_URL_PENDING || 'surfrental://checkout/pending',
  },
  notificationUrl:
    process.env.MP_NOTIFICATION_URL || 'https://api.surfrentalmdp.com/api/payments/webhook',
  currency: 'ARS',
};

export const mpClient = new MercadoPagoConfig({
  accessToken: MP_CONFIG.accessToken,
  options: { timeout: 10000 },
});

export const mpPreference = new Preference(mpClient);
export const mpPayment = new Payment(mpClient);
