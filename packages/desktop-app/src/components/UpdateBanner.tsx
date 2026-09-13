import { useEffect, useState } from "react";
import type { UpdateStatus } from "../lib/updateChannel";

export function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus>({ state: "idle" });

  useEffect(() => {
    return window.updateStatus.onStatusChange(setStatus);
  }, []);

  if (status.state === "available") {
    return (
      <div className="update-banner update-banner--available">
        <span>Update v{status.version} is available.</span>
        <button type="button" onClick={() => window.updateStatus.checkNow()}>
          Update Now
        </button>
      </div>
    );
  }

  if (status.state === "downloading") {
    return (
      <div className="update-banner update-banner--downloading">
        Downloading an update &mdash; please don&apos;t close the app until this finishes.
      </div>
    );
  }

  if (status.state === "ready") {
    return (
      <div className="update-banner update-banner--ready">
        <span>An update has been downloaded.</span>
        <button type="button" onClick={() => window.updateStatus.restartNow()}>
          Restart Now
        </button>
      </div>
    );
  }

  return null;
}
