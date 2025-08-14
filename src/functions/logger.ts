import chalk from "chalk";
import dayjs from "dayjs";
import { WebhookClient } from "discord.js";
import "dotenv/config";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

import { mainCodeDir } from "index";
import Strings from "../strings.json" assert { type: "json" };
import { exit } from "./utils.js";

const saveToFile = (type: string, ...text: string[]) => {
    // Log in file
    if (!existsSync(path.join(mainCodeDir, "../data/outputs/logs")))
        mkdirSync(path.join(mainCodeDir, "../data/outputs/logs"), {recursive: true});
    appendFileSync(
        path.join(mainCodeDir, `../data/outputs/logs/${dayjs().format("DD.MM.YYYY")}.log`),
        `[${type}] | [${dayjs().format("DD.MM.YYYY | HH:mm:ss")}] | ${text}\n`,
        { encoding: "utf-8" }
    );
};

const logToWebhook = (type: string, ...text: string[]) => {
    // Log to webhook
    const webhookClient = new WebhookClient({ url: process.env.LOGGER_WEBHOOK! });
    webhookClient.send({
        content: `[${type}] | [${dayjs().format(
            "DD.MM.YYYY | HH:mm:ss"
        )}] | ${text}\n`,
    });
};

export function logfileSessionOpen(): void {
    saveToFile("SESSION", Strings.logs_logger_startup);
    appendFileSync(
        path.join(mainCodeDir, "../data/outputs/errors.txt"),
        `---------- NEW LOGGING SESSION    ---    ${dayjs().format("DD.MM.YYYY | HH:mm:ss")} ----------\n`,
        { encoding: "utf-8" }
    )
}

export function logInfo(...text: string[]): void {
    // Log in console
    console.log(chalk.bold.blue("[INFO]"), ...text);

    // Log in file
    saveToFile("INFO", ...text);
}

export function logError(...text: string[]): void {
    // Log in console
    console.log(chalk.bold.red("[ERROR]"), ...text);

    saveToFile("ERROR", ...text);
    try{
        logToWebhook("ERROR", ...text);
    }
    catch(e){
        logInfo(Strings.logs_logger_webhook_error)
    }
}

export function logErrorMsg(msg: any, ...text: string[]): void {
    // Log in console
    console.log(chalk.bold.red("[ERROR]"), ...text, msg);

    saveToFile("ERROR", ...text, msg.toJSON());
    try{
        logToWebhook("ERROR", ...text, msg.toJSON());
    }
    catch(e){
        logInfo(Strings.logs_logger_webhook_error)
    }
}

export function logCommand(...text: string[]): void {
    // Log in console
    console.log(chalk.bold.gray("[COMMAND]"), ...text);

    saveToFile("COMMAND", ...text);
}

export function logGuild(...text: string[]): void {
    // Log in console
    console.log(chalk.bold.green("[GUILD]"), ...text);

    saveToFile("GUILD", ...text);
}

export function failStartup(e: any){
    console.error(Strings.logs_logger_init_failed, e);
    exit(1);
}