/**
 * Shared types for dinner API responses
 */

export interface ThemeInfo {
  id: string;
  key: string;
  title: string;
  shortDescription: string;
}

export interface ThemeDetail extends ThemeInfo {
  whatToExpect: string;
  boundaries: string;
  conversationStarters: string[];
}

export interface DinnerListItem {
  id: string;
  theme: ThemeInfo;
  description: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  restaurant: {
    id: string;
    name: string;
    city: string | null;
    cuisine: string | null;
    heroImageUrl: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  seats: {
    total: number;
    available: number;
    confirmed: number;
  };
}

export interface DinnerDetail {
  id: string;
  theme: ThemeDetail;
  description: string | null;
  startsAt: string;
  endsAt: string;
  seatCount: number;
  status: string;
  pricePerSeatCents: number | null;
  createdAt: string;
  updatedAt: string;
  restaurant: {
    id: string;
    name: string;
    description: string | null;
    cuisine: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    website: string | null;
    heroImageUrl: string | null;
  };
  seats: {
    total: number;
    available: number;
    confirmed: number;
    held: number;
    attended: number;
  };
  /** DinnerMedia (kind: DINNER_LISTING) URLs, ordered by displayOrder; falls back to the restaurant's hero photo when a dinner has none of its own. Optional so existing API consumers that don't set it (e.g. /api/dinners/:id) aren't broken. */
  photos?: string[];
}

export interface DinnerListResponse {
  success: true;
  data: {
    dinners: DinnerListItem[];
    count: number;
    filters: {
      city?: string;
      from?: string;
      to?: string;
    };
  };
}

export interface DinnerDetailResponse {
  success: true;
  data: DinnerDetail;
}

export interface UserDinner {
  id: string;
  theme: ThemeInfo;
  description: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  /** Count of CONFIRMED/ATTENDED/COMPLETED seats across the whole dinner, not just this user's own seat. */
  confirmedSeatCount: number;
  restaurant: {
    id: string;
    name: string;
    cuisine: string | null;
    city: string | null;
    address: string | null;
    heroImageUrl: string | null;
  };
  seat: {
    id: string;
    status: string;
    confirmedAt: string | null;
    checkedInAt: string | null;
  };
}

export interface UserDinnersResponse {
  success: true;
  data: {
    upcoming: UserDinner[];
    past: UserDinner[];
  };
}
