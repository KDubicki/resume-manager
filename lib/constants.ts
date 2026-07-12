// There is no auth yet (see README's NEXTAUTH_* env vars, marked optional/future).
// Every Resume is scoped to this single placeholder user until real
// authentication lands; queries already filter by userId so that swap-in is
// additive, not a rewrite.
export const DEMO_USER_ID = "demo-user";
