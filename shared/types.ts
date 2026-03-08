export type UserRole = 'admin' | 'affiliate' | 'user';

export type UserRoleKey = 'ADMIN' | 'AFFILIATE' | 'USER';

export type UserRoleRecord = {
  role: UserRoleKey;
};

export type ReferralCode = {
  id: string;
  code: string;
};

export type AffiliateLink = {
  id: string;
  code: string;
  targetUrl: string;
  programId?: string | null;
  campaignId?: string | null;
  createdAt?: string;
};

export type AdminAffiliateLink = AffiliateLink & {
  affiliate: {
    id: string;
    email: string;
    name?: string | null;
    username?: string | null;
  };
  program: {
    id: string;
    name: string;
  };
  metrics?: {
    totalClicks: number;
    topSource: string | null;
    topMedium: string | null;
    topCampaign: string | null;
  };
};

export type AffiliateLinkMetricItem = {
  value: string | null;
  count: number;
};

export type AdminAffiliateLinkMetrics = {
  link: AdminAffiliateLink;
  totals: {
    totalClicks: number;
    uniqueCookies: number;
    lastClickedAt: string | null;
  };
  utm: {
    sources: AffiliateLinkMetricItem[];
    mediums: AffiliateLinkMetricItem[];
    campaigns: AffiliateLinkMetricItem[];
  };
};

export type UserAffiliateLinkMetrics = {
  link: AffiliateLink;
  totals: {
    totalClicks: number;
    uniqueCookies: number;
    lastClickedAt: string | null;
  };
  utm: {
    sources: AffiliateLinkMetricItem[];
    mediums: AffiliateLinkMetricItem[];
    campaigns: AffiliateLinkMetricItem[];
  };
};

export type UserStatus = 'active' | 'blocked';

export type User = {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  status: UserStatus;
  roles?: UserRoleRecord[];
};

export type Package = {
  id: string;
  name: string;
  description?: string | null;
  price: string; // decimal string
  currency: string;
  commissionRate: string; // decimal string
  isActive: boolean;
  isCustom?: boolean;
  customOptions?: PackageOption[];
};

export type PackageOption = {
  id: string;
  label: string;
  price: number;
};

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'canceled';

export type OrderAttributionType = 'none' | 'affiliate' | 'referral';

export type Order = {
  id: string;
  buyerId: string;
  packageId: string;
  status: OrderStatus;
  amount: string; // decimal string
  currency: string;
  attributionType: OrderAttributionType;
  affiliateId?: string | null;
  referralCode?: string | null;
  referralUserId?: string | null;
  aisheId?: string | null;
  selectedOptions?: string[] | null;
  validUntil?: string | null;
  createdAt: string;
  package?: Package;
};

export type ExtensionRequestStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED';

export type ExtensionRequest = {
  id: string;
  orderId: string;
  userId: string;
  status: ExtensionRequestStatus;
  amount: string;
  currency: string;
  months: number;
  createdAt: string;
  paidAt?: string | null;
  order?: Order;
};

export type AffiliateStats = {
  totalClicks: number;
  totalConversions: number;
  totalEarnings: string;
  pendingEarnings: string;
  paidEarnings: string;
  conversionRate: number;
};

export type ReferralStats = {
  totalReferrals: number;
  successfulReferrals: number;
  totalEarnings: string;
  pendingEarnings: string;
  paidEarnings: string;
};

export type AffiliateCommission = {
  id: string;
  orderId: string;
  affiliateId: string;
  amount: string;
  currency: string;
  status: 'pending' | 'paid' | 'canceled';
  createdAt: string;
  paidAt?: string | null;
  order?: Order;
};

export type ReferralReward = {
  id: string;
  orderId: string;
  referrerId: string;
  referredUserId: string;
  amount: string;
  currency: string;
  status: 'pending' | 'paid' | 'canceled';
  createdAt: string;
  paidAt?: string | null;
  order?: Order;
};
