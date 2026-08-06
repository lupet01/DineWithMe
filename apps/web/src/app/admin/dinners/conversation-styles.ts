import type { ConversationStyle } from "@prisma/client";

/**
 * Shared between the Create/Edit Dinner form (pill selector) and Dinner
 * Detail's read-only Details tab (label lookup) - kept in a plain module
 * (not the "use client" dinner-form.tsx) so server components can import
 * it without pulling in client-component bundling semantics.
 */
export const CONVERSATION_STYLES: Array<{ value: ConversationStyle; label: string }> = [
  { value: "STRUCTURED_ICEBREAKERS", label: "Structured Icebreakers" },
  { value: "OPEN_ENDED", label: "Open-Ended" },
  { value: "DEEP_AND_MEANINGFUL", label: "Deep & Meaningful" },
  { value: "LIGHT_AND_CASUAL", label: "Light & Casual" },
];
