import type { ApplicationStatus } from "@/lib/schemas/application";

// antd preset colors, mapped to the funnel: neutral until sent, warm while
// live, green on an offer, red on a no. Shared so a stage looks the same on
// the list card and above its kanban column.
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  SAVED: "default",
  APPLIED: "blue",
  INTERVIEW: "gold",
  OFFER: "green",
  REJECTED: "red",
};
