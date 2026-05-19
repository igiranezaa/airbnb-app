import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'GUEST' | 'HOST' | 'ADMIN';
  suspended: boolean;
  banned: boolean;
  createdAt: string;
  _count?: { bookings: number; listings: number };
}

export interface UserStats {
  totalUsers: number;
  byRole: { role: string; _count: { role: number } }[];
}

export interface ListingStats {
  totalListings: number;
  averagePrice: number;
  byLocation: { location: string; _count: { location: number } }[];
  byType: { type: string; _count: { type: number } }[];
}

export interface AdminDashboardStats {
  gmv: number;
  activeBookings: number;
  fraudAlerts: number;
  supportTickets: number;
  platformUptime: string;
  totalUsers: number;
  totalListings: number;
  recentCancellations?: number;
}

export interface Dispute {
  id: string;
  bookingId: string;
  raisedById: string;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  resolution: string | null;
  evidence: string[];
  createdAt: string;
  updatedAt: string;
  raisedBy: { id: string; name: string; email: string };
  booking: {
    id: string;
    totalPrice: number;
    status: string;
    listing: { title: string; location: string };
    guest: { id: string; name: string };
  };
}

export interface Coupon {
  id: string;
  code: string;
  amount: number;
  userId: string | null;
  issuedById: string;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  issuedBy: { id: string; name: string };
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  before: unknown;
  after: unknown;
  createdAt: string;
  admin: { id: string; name: string; email: string };
}

export interface AdminListing {
  id: string;
  title: string;
  location: string;
  type: 'APARTMENT' | 'HOUSE' | 'VILLA' | 'CABIN';
  pricePerNight: number;
  rating: number | null;
  published: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  host?: { id: string; name: string; email: string };
  _count?: { bookings: number; reviews: number };
}

// ── FR-073: Dashboard Stats ──────────────────────────────────────────────────

export function useAdminDashboardStats() {
  return useQuery<AdminDashboardStats>({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<AdminDashboardStats>('/admin/stats');
      return data;
    },
    refetchInterval: 30_000,
  });
}

// ── Existing stats ───────────────────────────────────────────────────────────

export function useAllUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get<AdminUser[]>('/admin/users');
      return data;
    },
  });
}

export function useUserStats() {
  return useQuery<UserStats>({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const { data } = await api.get<UserStats>('/users/stats');
      return data;
    },
  });
}

export function useListingStats() {
  return useQuery<ListingStats>({
    queryKey: ['listing-stats'],
    queryFn: async () => {
      const { data } = await api.get<ListingStats>('/listings/stats');
      return data;
    },
  });
}

// ── FR-069: User Management ──────────────────────────────────────────────────

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; email?: string; username?: string; role?: string }) =>
      api.patch(`/admin/users/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/suspend`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/ban`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/listings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing-stats'] });
    },
  });
}

export function useAdminListings() {
  return useQuery<AdminListing[]>({
    queryKey: ['admin-listings'],
    queryFn: async () => {
      const { data } = await api.get<AdminListing[]>('/admin/listings');
      return data;
    },
  });
}

export function useApproveListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/listings/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing-stats'] });
    },
  });
}

export function useRejectListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/admin/listings/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing-stats'] });
    },
  });
}

// ── FR-070: Refunds & Coupons ────────────────────────────────────────────────

export function useIssueRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { bookingId: string; amount: number; reason?: string }) =>
      api.post('/admin/refunds', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
  });
}

export function useCoupons() {
  return useQuery<Coupon[]>({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data } = await api.get<Coupon[]>('/admin/coupons');
      return data;
    },
  });
}

export function useIssueCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { userId?: string; amount: number; code: string; expiresAt?: string }) =>
      api.post('/admin/coupons', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}

// ── FR-071: Disputes ─────────────────────────────────────────────────────────

export function useDisputes(status?: string) {
  return useQuery<Dispute[]>({
    queryKey: ['admin-disputes', status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      const { data } = await api.get<Dispute[]>(`/admin/disputes${params}`);
      return data;
    },
  });
}

export function useCreateDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { bookingId: string; reason: string }) =>
      api.post('/admin/disputes', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-disputes'] }),
  });
}

export function useUpdateDisputeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, resolution }: { id: string; status: string; resolution?: string }) =>
      api.patch(`/admin/disputes/${id}/status`, { status, resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
  });
}

export function useAddEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, evidenceUrl }: { id: string; evidenceUrl: string }) =>
      api.post(`/admin/disputes/${id}/evidence`, { evidenceUrl }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-disputes'] }),
  });
}

// ── FR-072: Audit Logs ───────────────────────────────────────────────────────

export function useAuditLogs(page = 1) {
  return useQuery<{ data: AuditLog[]; meta: { total: number; page: number; limit: number; totalPages: number } }>({
    queryKey: ['admin-audit-logs', page],
    queryFn: async () => {
      const { data } = await api.get(`/admin/audit-logs?page=${page}&limit=20`);
      return data;
    },
  });
}
