import Bot from "./classes/Bot.js";
import { loadSiteConfig, saveSiteConfig, SiteConfig } from "./functions/configManager.js";
import { logInfo, logError } from "./functions/logger.js";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Token",
};

function jsonResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
        },
    });
}

function verifyAuth(req: Request, config: SiteConfig): boolean {
    const authHeader = req.headers.get("Authorization");
    const tokenHeader = req.headers.get("X-Admin-Token");
    
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : tokenHeader;

    return token === config.adminSecretToken;
}

export function startApiServer(bot: Bot) {
    const port = parseInt(process.env.API_PORT || "3001", 10);

    Bun.serve({
        port,
        async fetch(req) {
            const url = new URL(req.url);

            // Handle CORS preflight
            if (req.method === "OPTIONS") {
                return new Response(null, { headers: CORS_HEADERS });
            }

            const config = loadSiteConfig();

            // -------------------------------------------------------------
            // GET /api/status - Public endpoint for React frontend
            // -------------------------------------------------------------
            if (url.pathname === "/api/status" && req.method === "GET") {
                try {
                    const whitelistedCount = await bot.db.whitelist.count();
                    
                    let computedStatus = config.serverStatusOverride;
                    if (computedStatus === "AUTO") {
                        computedStatus = bot.isReady() ? "ONLINE" : "OFFLINE";
                    }

                    return jsonResponse({
                        online: bot.isReady(),
                        status: computedStatus,
                        countdownTarget: config.countdownTarget,
                        countdownPaused: config.countdownPaused,
                        downloadUrl: config.downloadUrl,
                        modpackVersion: config.modpackVersion,
                        discordInviteUrl: config.discordInviteUrl,
                        discordWidgetId: config.discordWidgetId,
                        whitelistedCount,
                        activePlayers: 0 // Moje rozszerzenie o RCON/Query jeśli będzie dodane
                    });
                } catch (e) {
                    logError("API /api/status error: " + e);
                    return jsonResponse({ error: "Internal Server Error" }, 500);
                }
            }

            // -------------------------------------------------------------
            // POST /api/admin/login - Admin auth check
            // -------------------------------------------------------------
            if (url.pathname === "/api/admin/login" && req.method === "POST") {
                try {
                    const body = await req.json() as { secret?: string };
                    if (body.secret && body.secret === config.adminSecretToken) {
                        return jsonResponse({
                            success: true,
                            token: config.adminSecretToken,
                            config
                        });
                    }
                    return jsonResponse({ success: false, error: "Nieprawidłowe hasło/token administratora" }, 401);
                } catch (e) {
                    return jsonResponse({ error: "Invalid JSON body" }, 400);
                }
            }

            // -------------------------------------------------------------
            // POST /api/admin/config - Update site config (Protected)
            // -------------------------------------------------------------
            if (url.pathname === "/api/admin/config" && req.method === "POST") {
                if (!verifyAuth(req, config)) {
                    return jsonResponse({ error: "Brak autoryzacji (Unauthorized)" }, 401);
                }

                try {
                    const updates = await req.json() as Partial<SiteConfig>;
                    const updated = saveSiteConfig(updates);
                    return jsonResponse({ success: true, config: updated });
                } catch (e) {
                    return jsonResponse({ error: "Błąd podczas zapisu konfiguracji" }, 400);
                }
            }

            // -------------------------------------------------------------
            // POST /api/admin/announcement - Send Discord embed (Protected)
            // -------------------------------------------------------------
            if (url.pathname === "/api/admin/announcement" && req.method === "POST") {
                if (!verifyAuth(req, config)) {
                    return jsonResponse({ error: "Brak autoryzacji" }, 401);
                }

                try {
                    const body = await req.json() as { channelId: string; title: string; message: string };
                    if (!body.channelId || !body.message) {
                        return jsonResponse({ error: "Wymagany channelId i message" }, 400);
                    }

                    const channel = await bot.channels.fetch(body.channelId);
                    if (channel && channel.isTextBased()) {
                        await channel.send({
                            embeds: [{
                                title: body.title || "📢 Ogłoszenie GhostLand",
                                description: body.message,
                                color: 0x0ea5e9, // błękitny
                                timestamp: new Date().toISOString()
                            }]
                        });
                        return jsonResponse({ success: true, message: "Ogłoszenie wysłane pomyślnie" });
                    }
                    return jsonResponse({ error: "Nie odnaleziono kanału tekstowego" }, 404);
                } catch (e) {
                    return jsonResponse({ error: "Błąd wysyłania ogłoszenia: " + e }, 500);
                }
            }

            // -------------------------------------------------------------
            // GET /api/admin/whitelist - Get whitelist entries (Protected)
            // -------------------------------------------------------------
            if (url.pathname === "/api/admin/whitelist" && req.method === "GET") {
                if (!verifyAuth(req, config)) {
                    return jsonResponse({ error: "Brak autoryzacji" }, 401);
                }

                try {
                    const list = await bot.db.whitelist.findMany({
                        include: { account: true }
                    });
                    return jsonResponse({ success: true, count: list.length, data: list });
                } catch (e) {
                    return jsonResponse({ error: "Błąd odczytu bazy" }, 500);
                }
            }

            return jsonResponse({ error: "Endpoint not found" }, 404);
        }
    });

    logInfo(`[API SERVER] Poltergeist API Server uruchomiony na porcie http://localhost:${port}`);
}
