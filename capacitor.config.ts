/**
 * Capacitor config — optional native-app wrapper (Android APK / iOS).
 * The web build in `dist/` is the app's web assets. See README "Native app".
 *
 * Not wired into the default build; requires installing @capacitor/* and an
 * Android/iOS toolchain to produce store binaries.
 */
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gridforge.app",
  appName: "Grid-Forge",
  webDir: "dist",
  backgroundColor: "#05070a",
  android: {
    backgroundColor: "#05070a",
  },
};

export default config;
