export const UPDATE_STATUS_CHANGED = "update:status-changed";
export const UPDATE_RESTART_NOW = "update:restart-now";
export const UPDATE_CHECK_NOW = "update:check-now";
export const UPDATE_AUTO_UPDATE_GET = "update:auto-update-get";
export const UPDATE_AUTO_UPDATE_SET = "update:auto-update-set";

export type UpdateStatus =
  | { state: "idle" }
  | { state: "available"; version: string }
  | { state: "downloading" }
  | { state: "ready" }
  | { state: "error"; message: string };
