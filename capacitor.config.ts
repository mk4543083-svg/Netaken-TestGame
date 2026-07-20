// Capacitor config for Android APK export.
// After running `bun run build`, follow README instructions to `npx cap add android && npx cap sync && npx cap open android`.
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.netaken.absolutecinema",
  appName: "NETA-KEN Absolute Cinema",
  webDir: ".output/public",
  server: { androidScheme: "https" },
};

export default config;
