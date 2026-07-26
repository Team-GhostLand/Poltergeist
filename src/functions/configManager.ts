import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { mainCodeDir } from "../index.js";
import { logInfo } from "./logger.js";

export interface SiteConfig {
    countdownTarget: string;
    countdownPaused: boolean;
    downloadUrl: string;
    modpackVersion: string;
    serverStatusOverride: "AUTO" | "ONLINE" | "OFFLINE" | "MAINTENANCE" | "LAUNCHED";
    discordInviteUrl: string;
    discordWidgetId: string;
    adminSecretToken: string;
}

const DEFAULT_CONFIG: SiteConfig = {
    countdownTarget: "2026-07-31T18:00:00.000Z",
    countdownPaused: false,
    downloadUrl: "https://ghostland.ovh/modules/ci/?sort=time&order=desc",
    modpackVersion: "8.0.0",
    serverStatusOverride: "AUTO",
    discordInviteUrl: "https://discord.gg/966397518445412413",
    discordWidgetId: "966397518445412413",
    adminSecretToken: process.env.ADMIN_SECRET || "ghostland_admin_secret_2026"
};

function getConfigPath(): string {
    const dir = path.join(mainCodeDir, "../data");
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, "site-config.json");
}

export function loadSiteConfig(): SiteConfig {
    try {
        const filePath = getConfigPath();
        if (existsSync(filePath)) {
            const raw = readFileSync(filePath, "utf-8");
            const parsed = JSON.parse(raw);
            return { ...DEFAULT_CONFIG, ...parsed };
        }
    } catch (e) {
        logInfo("Nie udało się odczytać site-config.json, używanie domyślnej konfiguracji.");
    }
    return { ...DEFAULT_CONFIG };
}

export function saveSiteConfig(config: Partial<SiteConfig>): SiteConfig {
    const current = loadSiteConfig();
    const updated = { ...current, ...config };
    try {
        const filePath = getConfigPath();
        writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
        logInfo("Zaktualizowano site-config.json");
    } catch (e) {
        logInfo("Błąd zapisu site-config.json: " + e);
    }
    return updated;
}
