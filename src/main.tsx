import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import { I18nProvider } from "@/i18n/I18nProvider";
import { publishAppVersion } from "@/lib/version";
import "@/styles.css";

// Publish the build's version (window global + <meta name="app-version">) before the app renders,
// so it's available to the bug-report widget's auto-detect and any other tooling from the very
// first paint — see src/lib/version.ts.
publishAppVersion();

const root = document.getElementById("root");
if (!root) throw new Error("xchtip.app: #root element not found");

createRoot(root).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
