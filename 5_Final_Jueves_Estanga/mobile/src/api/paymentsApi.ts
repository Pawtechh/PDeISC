import { apiSlice } from './apiSlice';

export interface PreferenceResponse {
  paymentId: string;
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  monto: number;
  currency: string;
}

export interface PreAuthResponse {
  holdId: string;
  rentalId: string;
  montoGarantia: number;
  estado: string;
  mensaje: string;
}

export interface PaymentRecord {
  id: string;
  rentalId: string;
  mpPreferenceId?: string | null;
  mpPaymentId?: string | null;
  monto: number;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO' | 'PRE_AUTORIZADO' | 'DEBITADO';
  tipo: string;
  createdAt: string;
}

export const paymentsApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createPreference: builder.mutation<
      { status: string; data: PreferenceResponse },
      { rentalId: string; installments?: number }
    >({
      query: (body) => ({
        url: '/payments/preference',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Payment'],
    }),

    createPreAuth: builder.mutation<
      { status: string; data: PreAuthResponse },
      { rentalId: string; cardToken: string; montoGarantia?: number }
    >({
      query: (body) => ({
        url: '/payments/pre-auth',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Payment'],
    }),

    simulatePayment: builder.mutation<
      { status: string; data: { payment: PaymentRecord; status: string } },
      { rentalId: string; status: 'approved' | 'rejected' | 'pending'; tipo?: string }
    >({
      query: (body) => ({
        url: '/payments/simulate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Payment', 'Rental'],
    }),

    getRentalPayments: builder.query<{ status: string; data: PaymentRecord[] }, string>({
      query: (rentalId) => `/payments/rental/${rentalId}`,
      providesTags: ['Payment'],
    }),
  }),
});

export const {
  useCreatePreferenceMutation,
  useCreatePreAuthMutation,
  useSimulatePaymentMutation,
  useGetRentalPaymentsQuery,
} = paymentsApi;
