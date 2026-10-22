import { apiSlice } from './apiSlice';

export interface LegalDocumentItem {
  slug: string;
  filename: string;
  title: string;
  version: string;
  lastUpdated: string;
  category: 'GENERAL' | 'OWNER' | 'RENTAL' | 'OPERATIVO' | 'SEGUROS' | 'CONSUMER' | 'LOYALTY' | 'SEGURIDAD' | 'PAGOS';
  description: string;
  sha256Hash: string;
  fileSizeBytes: number;
}

export interface LegalDocumentDetail extends LegalDocumentItem {
  content: string;
}

export interface SignDocumentPayload {
  documentSlug: string;
  documentHash: string;
  rentalId?: string;
  signatureData?: string;
}

export interface SignDocumentResponse {
  success: boolean;
  signatureId: string;
  auditToken: string;
  documentSlug: string;
  documentHash: string;
  timestamp: string;
  ipAddress: string;
  verified: boolean;
  legalFramework: string;
  jurisdiction: string;
}

export interface VerifySignatureResponse {
  auditToken: string;
  documentSlug: string;
  documentHash: string;
  userId: string;
  rentalId?: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  verified: boolean;
  documentIntegrity: 'INTACTO' | 'MODIFICADO_POSTERIORMENTE';
  status: string;
  jurisdiction: string;
  verifiedAt: string;
}

export interface RentalContractResponse {
  rentalId: string;
  documentSlug: string;
  contractMarkdown: string;
  sha256Hash: string;
  timestamp: string;
  consumer: {
    id: string;
    nombre: string;
    email: string;
    dni?: string;
  };
  board: {
    id: string;
    marca: string;
    modelo: string;
  };
}

export const legalApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getLegalDocuments: builder.query<LegalDocumentItem[], void>({
      query: () => '/legal/documents',
      transformResponse: (response: { data: LegalDocumentItem[] }) => response.data,
      providesTags: ['Legal'],
    }),
    getLegalDocumentBySlug: builder.query<LegalDocumentDetail, string>({
      query: (slug) => `/legal/documents/${slug}`,
      transformResponse: (response: { data: LegalDocumentDetail }) => response.data,
      providesTags: (_result, _error, slug) => [{ type: 'Legal', id: slug }],
    }),
    signDocument: builder.mutation<SignDocumentResponse, SignDocumentPayload>({
      query: (body) => ({
        url: '/legal/sign',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: SignDocumentResponse }) => response.data,
      invalidatesTags: ['Legal'],
    }),
    verifySignature: builder.query<VerifySignatureResponse, string>({
      query: (auditToken) => `/legal/verify/${auditToken}`,
      transformResponse: (response: { data: VerifySignatureResponse }) => response.data,
    }),
    getRentalContract: builder.query<RentalContractResponse, string>({
      query: (rentalId) => `/legal/rental/${rentalId}/contract`,
      transformResponse: (response: { data: RentalContractResponse }) => response.data,
    }),
    signBiometric: builder.mutation<
      SignDocumentResponse,
      {
        rentalId?: string;
        rental_id?: string;
        documentSlug?: string;
        documentHash?: string;
        signatureHash?: string;
        signature_hash?: string;
        timestamp?: string;
      }
    >({
      query: (body) => ({
        url: '/legal/sign-biometric',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: SignDocumentResponse }) => response.data,
      invalidatesTags: ['Legal'],
    }),
  }),
});

export const {
  useGetLegalDocumentsQuery,
  useGetLegalDocumentBySlugQuery,
  useSignDocumentMutation,
  useSignBiometricMutation,
  useVerifySignatureQuery,
  useGetRentalContractQuery,
} = legalApi;
