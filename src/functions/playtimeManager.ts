import { Collection } from "discord.js";
import { lstatSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { mainCodeDir } from "../index.js";
import Strings from "../strings.json" with { type: "json" };
import { logError, logErrorMsg } from "./logger.js";

export function getRawPlaytimes() {
	const fromFullPath = join(mainCodeDir, "../data/statdirs/");
	let output = new Collection<{ user: string, world: string }, number>();

	for (const statFolder of readdirSync(fromFullPath)) {
		let statFolderFullPath = join(fromFullPath, statFolder)

		if (!lstatSync(statFolderFullPath).isDirectory()) {
			logError(Strings.logs_misplaced_file_in_stats + statFolderFullPath)
			continue;
		}

		for (const statEntry of readdirSync(statFolderFullPath)) {
			let statEntryFullPath = join(statFolderFullPath, statEntry);

			if (!statEntryFullPath.endsWith(".json") || !lstatSync(statEntryFullPath).isFile()) {
				logError(Strings.logs_misplaced_file_in_stats + statEntryFullPath);
				continue;
			}

			let ticks = 0;
			try {
				const ticksRaw = JSON.parse(readFileSync(statEntryFullPath, "utf-8")).stats["minecraft:custom"]["minecraft:play_time"]
				if (typeof ticksRaw === "number") ticks = ticksRaw;
				else {
					ticks = NaN;
					throw { err: ticks, in: statEntryFullPath, details: {
						instead_was: ticksRaw,
						of_type: typeof ticksRaw,
						but_should_be: typeof ticks
					}};
				}
			} catch (e) {
				logErrorMsg(e, Strings.logs_stat_parse_error);
				continue;
			}

			output.set({ user: statEntry.slice(0, -5), world: statFolder }, ticks);
		}
	}

	return output;
}