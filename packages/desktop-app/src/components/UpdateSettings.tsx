import { useEffect, useState } from "react";

export function UpdateSettings() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    void window.updateStatus.getAutoUpdateEnabled().then(setEnabled);
  }, []);

  return (
    <section>
      <h3>Updates</h3>
      <p className="settings-hint">
        Off by default - a new version instead shows a popup with an Update Now button. Turn this
        on to download and apply updates automatically in the background.
      </p>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            window.updateStatus.setAutoUpdateEnabled(e.target.checked);
          }}
        />
        Automatically download and install updates
      </label>
    </section>
  );
}
