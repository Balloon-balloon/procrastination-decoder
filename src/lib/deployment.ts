export const IS_STATIC_DEPLOYMENT =
  process.env.NEXT_PUBLIC_STATIC_MODE === "true";

export const STATIC_DEPLOYMENT_HIDDEN_ROUTES = [
  "/decode",
  "/coach",
] as const;
