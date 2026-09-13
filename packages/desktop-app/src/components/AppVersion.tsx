import { useEffect, useState } from "react";

export function AppVersion() {
  const [version, setVersion] = useState("");

  useEffect(() => {
    void window.appInfo.getVersion().then(setVersion);
  }, []);

  if (!version) return null;

  return <p className="app-version">v{version}</p>;
}
