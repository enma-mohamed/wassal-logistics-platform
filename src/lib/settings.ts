import fs from "fs";
import path from "path";

const settingsPath = path.join(process.cwd(), "src", "lib", "settings.json");

export interface SystemSettings {
  otpEnabled: boolean;
  manualFeesEnabled: boolean;
  forceWeight: boolean;
}

const defaultSettings: SystemSettings = {
  otpEnabled: true,
  manualFeesEnabled: true,
  forceWeight: true,
};

export function getSystemSettings(): SystemSettings {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf8");
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error("Error reading settings:", error);
  }
  return defaultSettings;
}

export function saveSystemSettings(settings: SystemSettings): boolean {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing settings:", error);
    return false;
  }
}
