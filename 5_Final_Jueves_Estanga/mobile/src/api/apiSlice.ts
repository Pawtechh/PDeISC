import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './baseQueryWithAuth';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  refetchOnMountOrArgChange: 30,
  refetchOnReconnect: true,
  tagTypes: [
    'Board',
    'Rental',
    'Claim',
    'User',
    'Review',
    'Metrics',
    'Schedule',
    'Payout',
    'Notification',
    'Legal',
    'Payment',
    'OwnerBoards',
    'OwnerEarnings',
    'OwnerRevisions',
    'AgencyRental',
    'AgencyMetrics',
    'LoyaltyBalance',
    'BoardReviews',
    'PendingReviews',
  ],
  endpoints: () => ({}),
});
