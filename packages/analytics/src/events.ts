// Central event registry with strong typing

export const AnalyticsEvents = {
  // User events
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
  USER_LOGIN: "user_login",
  USER_LOGOUT: "user_logout",
  USER_ROLE_CHANGED: "user_role_changed",

  // API access events
  API_ACCESS_GRANTED: "api_access_granted",
  API_ACCESS_DENIED: "api_access_denied",

  // Profile events
  PROFILE_VIEWED: "profile_viewed",

  // Restaurant events
  RESTAURANT_CREATED: "restaurant_created",
  RESTAURANT_PROFILE_UPDATED: "restaurant_profile_updated",
  RESTAURANT_MEDIA_UPLOADED: "restaurant_media_uploaded",
  RESTAURANT_MEDIA_DELETED: "restaurant_media_deleted",
  RESTAURANT_APPROVED: "restaurant_approved",
  RESTAURANT_PAUSED: "restaurant_paused",

  // Dinner events
  DINNER_CREATED: "dinner_created",
  DINNER_CREATED_WITH_THEME: "dinner_created_with_theme",
  DINNER_CANCELLED: "dinner_cancelled",
  DINNER_STATUS_CHANGED: "dinner_status_changed",
  DINNER_LIST_VIEWED: "dinner_list_viewed",
  DINNER_DETAIL_VIEWED: "dinner_detail_viewed",

  // Seat events
  SEAT_HOLD_REQUESTED: "seat_hold_requested",
  SEAT_HELD_SUCCESS: "seat_held_success",
  SEAT_HELD_FAILED: "seat_held_failed",
  SEAT_HOLD_EXPIRED: "seat_hold_expired",
  SEAT_CONFIRM_REQUESTED: "seat_confirm_requested",
  SEAT_CONFIRMED: "seat_confirmed",
  SEAT_CONFIRM_FAILED: "seat_confirm_failed",
  SEAT_CANCEL_REQUESTED: "seat_cancel_requested",
  SEAT_CANCELLED: "seat_cancelled",
  SEAT_CANCEL_DENIED: "seat_cancel_denied",
  SEAT_CHECK_IN_SUCCESS: "seat_check_in_success",
  SEAT_CHECK_IN_DENIED: "seat_check_in_denied",
  SEAT_NO_SHOW_MARKED: "seat_no_show_marked",
  SEAT_RELEASED: "seat_released",

  // User dinner events
  MY_DINNERS_VIEWED: "my_dinners_viewed",

  // Feedback events
  FEEDBACK_PROMPT_ELIGIBLE: "feedback_prompt_eligible",
  FEEDBACK_PROMPT_NOT_ELIGIBLE: "feedback_prompt_not_eligible",
  FEEDBACK_SUBMITTED: "feedback_submitted",
  FEEDBACK_PERSON_SIGNAL_RECORDED: "feedback_person_signal_recorded",

  // Connection events
  MUTUAL_INTEREST_CREATED: "mutual_interest_created",
  CONNECTIONS_VIEWED: "connections_viewed",

  // Trust events
  TRUST_RECALCULATED: "trust_recalculated",

  // Theme events
  THEME_ENABLED_FOR_RESTAURANT: "theme_enabled_for_restaurant",
  THEME_DISABLED_FOR_RESTAURANT: "theme_disabled_for_restaurant",

  // Payment events
  PAYMENT_INTENT_CREATED: "payment_intent_created",
  PAYMENT_SUCCEEDED: "payment_succeeded",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_VERIFIED: "payment_verified",
  PAYMENT_REFUNDED: "payment_refunded",
  REFUND_FAILED: "refund_failed",

  // Email events
  EMAIL_SENT: "email_sent",
} as const;

export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

// Event payload types
export interface UserCreatedEvent {
  userId: string;
  email: string;
  timestamp: string;
}

export interface UserUpdatedEvent {
  userId: string;
  fields: string[];
  timestamp: string;
}

export interface UserDeletedEvent {
  userId: string;
  timestamp: string;
}

export interface UserLoginEvent {
  userId: string;
  method: "email" | "oauth";
  timestamp: string;
}

export interface UserLogoutEvent {
  userId: string;
  timestamp: string;
}

export interface UserRoleChangedEvent {
  targetUserId: string;
  targetEmail: string;
  previousRole: string;
  newRole: string;
  changedBy: string;
  changerEmail: string;
  timestamp: string;
}

export interface ApiAccessGrantedEvent {
  userId: string;
  email: string;
  role: string;
  requestId: string;
  timestamp: string;
}

export interface ApiAccessDeniedEvent {
  userId?: string;
  email?: string;
  role?: string;
  requiredRoles?: string[];
  reason: "unauthenticated" | "insufficient_permissions";
  requestId: string;
  timestamp: string;
}

export interface ProfileViewedEvent {
  userId: string;
  email: string;
  role: string;
  timestamp: string;
}

export interface RestaurantCreatedEvent {
  restaurantId: string;
  restaurantName: string;
  userId: string;
  email: string;
  timestamp: string;
}

export interface RestaurantProfileUpdatedEvent {
  restaurantId: string;
  restaurantName: string;
  userId: string;
  fields: string[];
  timestamp: string;
}

export interface RestaurantMediaUploadedEvent {
  restaurantId: string;
  restaurantName: string;
  userId: string;
  mediaType: "HERO" | "GALLERY";
  mediaId: string;
  timestamp: string;
}

export interface RestaurantMediaDeletedEvent {
  restaurantId: string;
  restaurantName: string;
  userId: string;
  mediaType: "HERO" | "GALLERY";
  mediaId: string;
  timestamp: string;
}

export interface RestaurantApprovedEvent {
  restaurantId: string;
  restaurantName: string;
  approvedBy: string;
  approverEmail: string;
  emailSent?: boolean;
  timestamp: string;
}

export interface RestaurantPausedEvent {
  restaurantId: string;
  restaurantName: string;
  pausedBy: string;
  pauserEmail: string;
  reason?: string;
  timestamp: string;
}

export interface DinnerCreatedEvent {
  dinnerId: string;
  restaurantId: string;
  restaurantName: string;
  themeId: string;
  themeKey: string;
  themeTitle: string;
  seatCount: number;
  startsAt: string;
  userId: string;
  timestamp: string;
}

export interface DinnerCreatedWithThemeEvent {
  dinnerId: string;
  restaurantId: string;
  restaurantName: string;
  themeId: string;
  themeKey: string;
  themeTitle: string;
  seatCount: number;
  startsAt: string;
  userId: string;
  timestamp: string;
}

export interface DinnerCancelledEvent {
  dinnerId: string;
  restaurantId: string;
  restaurantName: string;
  userId: string;
  scheduledAt: string;
  releasedSeats: number;
  timestamp: string;
}

export interface DinnerStatusChangedEvent {
  dinnerId: string;
  restaurantId: string;
  restaurantName: string;
  userId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
}

export interface DinnerListViewedEvent {
  userId?: string;
  filters: {
    city?: string;
    theme?: string;
    from?: string;
    to?: string;
  };
  resultCount: number;
  totalCount?: number;
  timestamp: string;
}

export interface DinnerDetailViewedEvent {
  userId?: string;
  dinnerId: string;
  restaurantId: string;
  theme: string;
  seatsAvailable: number;
  timestamp: string;
}

export interface SeatHoldRequestedEvent {
  userId: string;
  dinnerId: string;
  timestamp: string;
}

export interface SeatHeldSuccessEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  holdExpiresAt: string;
  timestamp: string;
}

export interface SeatHeldFailedEvent {
  userId: string;
  dinnerId: string;
  reason: string;
  timestamp: string;
}

export interface SeatHoldExpiredEvent {
  seatId: string;
  dinnerId: string;
  userId: string | null;
  expiredAt: string;
  timestamp: string;
}

export interface SeatConfirmRequestedEvent {
  userId: string;
  seatId: string;
  dinnerId: string;
  timestamp: string;
}

export interface SeatConfirmedEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  timestamp: string;
}

export interface SeatConfirmFailedEvent {
  userId: string;
  seatId: string;
  reason: string;
  timestamp: string;
}

export interface SeatReleasedEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  timestamp: string;
}

export interface SeatCancelRequestedEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  hoursUntilDinner: number;
  timestamp: string;
}

export interface SeatCancelledEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  hoursUntilDinner: number;
  timestamp: string;
}

export interface SeatCancelDeniedEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  reason: string;
  hoursUntilDinner: number;
  timestamp: string;
}

export interface SeatCheckInSuccessEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  minutesUntilStart: number;
  timestamp: string;
}

export interface SeatCheckInDeniedEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  reason: string;
  minutesUntilStart: number;
  timestamp: string;
}

export interface SeatNoShowMarkedEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  dinnerTheme: string;
  minutesAfterStart: number;
  timestamp: string;
}

export interface MyDinnersViewedEvent {
  userId: string;
  tab: "upcoming" | "past";
  dinnerCount: number;
  timestamp: string;
}

export interface FeedbackPromptEligibleEvent {
  userId: string;
  dinnerId: string;
  dinnerTheme: string | null;
  timestamp: string;
}

export interface FeedbackPromptNotEligibleEvent {
  userId: string;
  dinnerId: string;
  dinnerTheme: string | null;
  reason: string;
  timestamp: string;
}

export interface FeedbackSubmittedEvent {
  userId: string;
  dinnerId: string;
  dinnerTheme: string | null;
  overallSentiment: string;
  comfortLevel: string;
  wouldDineAgain: boolean | null | undefined;
  personSignalsCount: number;
  mutualInterestsCreated: number;
  timestamp: string;
}

export interface FeedbackPersonSignalRecordedEvent {
  userId: string;
  dinnerId: string;
  targetUserId: string;
  wouldDineAgain: boolean;
  mutualInterest: boolean;
  timestamp: string;
}

export interface MutualInterestCreatedEvent {
  userAId: string;
  userBId: string;
  dinnerId: string;
  dinnerTheme: string | null;
  timestamp: string;
}

export interface ConnectionsViewedEvent {
  userId: string;
  connectionCount: number;
  timestamp: string;
}

export interface TrustRecalculatedEvent {
  adminUserId: string;
  adminEmail: string;
  totalEvaluated: number;
  flaggedCount: number;
  timestamp: string;
}

export interface ThemeEnabledForRestaurantEvent {
  restaurantId: string;
  restaurantName: string;
  themeId: string;
  themeKey: string;
  themeTitle: string;
  userId: string;
  timestamp: string;
}

export interface ThemeDisabledForRestaurantEvent {
  restaurantId: string;
  restaurantName: string;
  themeId: string;
  themeKey: string;
  themeTitle: string;
  userId: string;
  timestamp: string;
}

export interface PaymentIntentCreatedEvent {
  paymentIntentId: string;
  userId: string;
  dinnerId: string;
  seatId: string;
  amount: number;
  currency: string;
  provider: string;
  restaurantId: string;
  restaurantName: string;
  timestamp: string;
}

export interface PaymentSucceededEvent {
  paymentIntentId: string;
  userId: string;
  dinnerId: string;
  seatId: string;
  amount: number;
  currency: string;
  provider: string;
  providerReference: string;
  timestamp: string;
}

export interface PaymentFailedEvent {
  paymentIntentId: string;
  userId: string;
  dinnerId: string;
  seatId: string;
  amount: number;
  currency: string;
  provider: string;
  reason?: string;
  timestamp: string;
}

export interface PaymentVerifiedEvent {
  paymentIntentId: string;
  userId: string;
  status: string;
  amount: number;
  reference: string;
  timestamp: string;
}

export interface PaymentRefundedEvent {
  paymentIntentId: string;
  userId: string;
  dinnerId: string;
  seatId: string;
  amount: number;
  currency: string;
  provider: string;
  reason?: string;
  timestamp: string;
}

export interface RefundFailedEvent {
  paymentIntentId: string;
  userId: string;
  dinnerId: string;
  seatId: string;
  amount: number;
  currency: string;
  provider: string;
  reason: string;
  error: string;
  timestamp: string;
}

export interface EmailSentEvent {
  emailType: string;
  recipient: string;
  success: boolean;
  dinnerId?: string;
  userId?: string;
  error?: string;
  timestamp: string;
}

// Map event names to their payload types
export interface AnalyticsEventMap {
  [AnalyticsEvents.USER_CREATED]: UserCreatedEvent;
  [AnalyticsEvents.USER_UPDATED]: UserUpdatedEvent;
  [AnalyticsEvents.USER_DELETED]: UserDeletedEvent;
  [AnalyticsEvents.USER_LOGIN]: UserLoginEvent;
  [AnalyticsEvents.USER_LOGOUT]: UserLogoutEvent;
  [AnalyticsEvents.USER_ROLE_CHANGED]: UserRoleChangedEvent;
  [AnalyticsEvents.API_ACCESS_GRANTED]: ApiAccessGrantedEvent;
  [AnalyticsEvents.API_ACCESS_DENIED]: ApiAccessDeniedEvent;
  [AnalyticsEvents.PROFILE_VIEWED]: ProfileViewedEvent;
  [AnalyticsEvents.RESTAURANT_CREATED]: RestaurantCreatedEvent;
  [AnalyticsEvents.RESTAURANT_PROFILE_UPDATED]: RestaurantProfileUpdatedEvent;
  [AnalyticsEvents.RESTAURANT_MEDIA_UPLOADED]: RestaurantMediaUploadedEvent;
  [AnalyticsEvents.RESTAURANT_MEDIA_DELETED]: RestaurantMediaDeletedEvent;
  [AnalyticsEvents.RESTAURANT_APPROVED]: RestaurantApprovedEvent;
  [AnalyticsEvents.RESTAURANT_PAUSED]: RestaurantPausedEvent;
  [AnalyticsEvents.DINNER_CREATED]: DinnerCreatedEvent;
  [AnalyticsEvents.DINNER_CREATED_WITH_THEME]: DinnerCreatedWithThemeEvent;
  [AnalyticsEvents.DINNER_CANCELLED]: DinnerCancelledEvent;
  [AnalyticsEvents.DINNER_STATUS_CHANGED]: DinnerStatusChangedEvent;
  [AnalyticsEvents.DINNER_LIST_VIEWED]: DinnerListViewedEvent;
  [AnalyticsEvents.DINNER_DETAIL_VIEWED]: DinnerDetailViewedEvent;
  [AnalyticsEvents.SEAT_HOLD_REQUESTED]: SeatHoldRequestedEvent;
  [AnalyticsEvents.SEAT_HELD_SUCCESS]: SeatHeldSuccessEvent;
  [AnalyticsEvents.SEAT_HELD_FAILED]: SeatHeldFailedEvent;
  [AnalyticsEvents.SEAT_HOLD_EXPIRED]: SeatHoldExpiredEvent;
  [AnalyticsEvents.SEAT_CONFIRM_REQUESTED]: SeatConfirmRequestedEvent;
  [AnalyticsEvents.SEAT_CONFIRMED]: SeatConfirmedEvent;
  [AnalyticsEvents.SEAT_CONFIRM_FAILED]: SeatConfirmFailedEvent;
  [AnalyticsEvents.SEAT_CANCEL_REQUESTED]: SeatCancelRequestedEvent;
  [AnalyticsEvents.SEAT_CANCELLED]: SeatCancelledEvent;
  [AnalyticsEvents.SEAT_CANCEL_DENIED]: SeatCancelDeniedEvent;
  [AnalyticsEvents.SEAT_CHECK_IN_SUCCESS]: SeatCheckInSuccessEvent;
  [AnalyticsEvents.SEAT_CHECK_IN_DENIED]: SeatCheckInDeniedEvent;
  [AnalyticsEvents.SEAT_NO_SHOW_MARKED]: SeatNoShowMarkedEvent;
  [AnalyticsEvents.SEAT_RELEASED]: SeatReleasedEvent;
  [AnalyticsEvents.MY_DINNERS_VIEWED]: MyDinnersViewedEvent;
  [AnalyticsEvents.FEEDBACK_PROMPT_ELIGIBLE]: FeedbackPromptEligibleEvent;
  [AnalyticsEvents.FEEDBACK_PROMPT_NOT_ELIGIBLE]: FeedbackPromptNotEligibleEvent;
  [AnalyticsEvents.FEEDBACK_SUBMITTED]: FeedbackSubmittedEvent;
  [AnalyticsEvents.FEEDBACK_PERSON_SIGNAL_RECORDED]: FeedbackPersonSignalRecordedEvent;
  [AnalyticsEvents.MUTUAL_INTEREST_CREATED]: MutualInterestCreatedEvent;
  [AnalyticsEvents.CONNECTIONS_VIEWED]: ConnectionsViewedEvent;
  [AnalyticsEvents.TRUST_RECALCULATED]: TrustRecalculatedEvent;
  [AnalyticsEvents.THEME_ENABLED_FOR_RESTAURANT]: ThemeEnabledForRestaurantEvent;
  [AnalyticsEvents.THEME_DISABLED_FOR_RESTAURANT]: ThemeDisabledForRestaurantEvent;
  [AnalyticsEvents.PAYMENT_INTENT_CREATED]: PaymentIntentCreatedEvent;
  [AnalyticsEvents.PAYMENT_SUCCEEDED]: PaymentSucceededEvent;
  [AnalyticsEvents.PAYMENT_VERIFIED]: PaymentVerifiedEvent;
  [AnalyticsEvents.PAYMENT_FAILED]: PaymentFailedEvent;
  [AnalyticsEvents.PAYMENT_REFUNDED]: PaymentRefundedEvent;
  [AnalyticsEvents.REFUND_FAILED]: RefundFailedEvent;
  [AnalyticsEvents.EMAIL_SENT]: EmailSentEvent;
}

// Server-side only events (critical business events)
export const ServerSideEvents = [
  AnalyticsEvents.USER_CREATED,
  AnalyticsEvents.USER_DELETED,
  AnalyticsEvents.RESTAURANT_CREATED,
] as const;

export type ServerSideEventName = typeof ServerSideEvents[number];
