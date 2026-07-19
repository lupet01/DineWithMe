/**
 * Unified authentication module
 * 
 * This module consolidates all authentication logic into a single location
 * with proper separation between API routes and server components.
 * 
 * Usage:
 * - API routes: Use functions from './api'
 * - Server components: Use functions from './server'
 * - Shared types and utilities: Use from './core'
 */

// Core types and utilities
export type { AuthUser } from "./core";
export { hasRole, validateRole, getAuthenticatedUser, getOrSyncUser } from "./core";

// API route helpers
export {
  requireAuth,
  requireRole,
  isErrorResponse,
  getRequestId,
  createErrorResponse,
  type ApiErrorResponse,
} from "./api";

// Server component helpers
export {
  getAuthUser,
  getOrCreateAuthUser,
  requireAuthUser,
  requireUserRole,
  checkUserRole,
} from "./server";

// Backwards compatibility aliases
export { getAuthUser as getCurrentUser } from "./server";
