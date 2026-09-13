export const UPDATE_STATUS_CHANGED = "update:status-changed";
export const UPDATE_RESTART_NOW = "update:restart-now";

export type UpdateStatus =
  | { state: "idle" }
  | { state: "downloading" }
  | { state: "ready" }
  | { state: "error"; message: string };
