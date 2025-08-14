import dayjs from "dayjs";
import fs from "fs";
import { join } from "path";
import { inspect } from "util";

import { mainCodeDir } from "index.js";
import { logError, logInfo } from "../../functions/logger.js";
import { exit } from "../../functions/utils.js";
import Strings from "../../strings.json" with { type: "json" };
import Bot from "../Bot.js";

export default class ErrorHandler {
    client: Bot;
    constructor(client: Bot) {
        this.client = client;
    }

    async preventErrors(): Promise<void> {
        process.on("uncaughtException", (error, source: string) => {
          const lines = "-".repeat(
            error
              .stack!.split("\n")
              .map((m) => m.length)
              .sort((a, b) => b - a)[0]
            );
            if (process.argv.includes("--show-errors")) {
            logError(
              `${lines}\n[[ Occured at: ${dayjs().format(
                "MMMM Do YYYY, h:mm:ss a"
              )} ]]\n${lines}\n${error.toString()}${
                source ? `\nMore Info: ${source}` : ""
              }`
            );
            } else {
                logError(Strings.logs_error_fatal);
            }
        
            let data = `${lines}\n[[ Occured at: ${dayjs().format(
              "MMMM Do YYYY, h:mm:ss a"
            )} ]]\n${lines}\n${error.toString()}${
              source ? `\nMore Info: ${source}` : ""
            }\n`;
            fs.appendFileSync(join(mainCodeDir, "../data/outputs/errors.txt"), data, {
              encoding: "utf-8",
            });
          
            logInfo("Stopping bot...");
            exit(1);
        });
      
        process.on("unhandledRejection", (reason: any, promise: string = "") => {
            const promiseText = inspect(promise) || "", consoleIgnore = [
                "DiscordAPIError: Unknown Role",
                "DiscordAPIError: Unknown Member",
                "DiscordAPIError: Unknown Message",
                "DiscordAPIError: Unknown Channel",
            ];
            if(!consoleIgnore.includes(reason.toString())) {
                const lines = "-".repeat(
                  (reason.stack || reason.toString())
                    .split("\n")
                    .map((m: string | any[]) => m.length)
                    .sort((a: number, b: number) => b - a)[0]
                );
                if (process.argv.includes("--show-errors")) {
                  logError(
                    `${lines}\n[[ Occured at: ${dayjs().format(
                      "MMMM Do YYYY, h:mm:ss a"
                    )} ]]\n${lines}\n${reason.toString()}${
                      promiseText ? `\nMore Info: ${promiseText}` : ""
                    }`
                  );
                } else {
                  logError(Strings.logs_error);
                }
                let data = `${lines}\n[[ Occured at: ${dayjs().format(
                  "MMMM Do YYYY, h:mm:ss a"
                )} ]]\n${lines}\n${reason.toString()}${
                  promiseText ? `\nMore Info: ${promiseText}` : ""
                }\n`;
                fs.appendFileSync(join(mainCodeDir, "../data/outputs/errors.txt"), data, {
                  encoding: "utf-8",
                });
            }
        });
    }
}