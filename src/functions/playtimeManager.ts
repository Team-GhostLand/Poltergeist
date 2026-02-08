import Bot from "classes/Bot.js";
import { Collection } from "discord.js";
import { lstatSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { mainCodeDir } from "../index.js";
import Strings from "../strings.json" with { type: "json" };
import { logError, logErrorMsg, logInfo } from "./logger.js";
import { isEmpty, preciseRound } from "./utils.js";

type worldPlaytime = { w/*world*/: string, t/*time (min)*/: number }[] //Compacted to singular chars to save space in DB (as I found out the hard way, 512chr ain't much)
type globalPlaytime = { c/*combined time (min)*/: number, l/*last online (epoch)*/?: number, s/*separate times*/: worldPlaytime }

export function getRawPlaytimes() {
	const fromFullPath = join(mainCodeDir, "../data/statdirs/");
	let output = new Collection<{ user: string, world: string }, number>();

	try {for (const statFolder of readdirSync(fromFullPath)) {
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
	}}

	catch (e){
		logErrorMsg(e, Strings.logs_stats_parse_error);
	}

	return output;
}

export function getProcessedPlaytimes(from: Collection<{ user: string, world: string }, number>): Collection<string, worldPlaytime> {
	const output = new Collection<string, worldPlaytime>();

	for (const [k, v] of from) {
		const minutes = v / 20 / 60;
		let user = output.get(k.user);
		if (!user) user = output.set(k.user, []).get(k.user) as [];

		user.push({ w: k.world, t: preciseRound(minutes, 2) });
	}

	return output;
}

export function findPlaytime(from: worldPlaytime, world: string){
	let index = 0;
	for (const v of from){
		if (v.w === world) return index;
		index++;
	}
	return -1;
}

export function mergePlaytimes(src: globalPlaytime|{}, add: worldPlaytime): globalPlaytime {
	let sum = 0;
	if (isEmpty(src)){
		for (const v of add) sum += v.t;
		return {c: sum, s: add};
	}

	const output = src as globalPlaytime;
	for (const entry of add) {
		const index = findPlaytime(output.s, entry.w);
		if (index === -1) output.s.push(entry);
		else if (entry.t !== output.s[index].t) output.s[index] = entry;
	}

	for (const entry of output.s) sum += entry.t;
	if (sum !== output.c){
		output.c = sum;
		output.l = Date.now();
	}

	return output;
}

export async function updatePlaytimes(client: Bot) {
	const accounts = await client.db.accounts.findMany({ where: {} });
	const playtimes = getProcessedPlaytimes(getRawPlaytimes());
	for (const account of accounts) {
		const newPlaytime = playtimes.get(account.mcuuid);
		if (!newPlaytime) continue;
		let oldPlaytime = {};
		try { oldPlaytime = JSON.parse(account.playtime) } catch {} //No need for specific catch logic - if JSON was invalid, we treat it like it wasn't even there.
		logInfo(Strings.logs_dbfix_playtime, account.mcuuid);
		client.db.accounts.update({
			where: { mcuuid: account.mcuuid },
			data: { playtime: JSON.stringify(mergePlaytimes(oldPlaytime, newPlaytime)) }
		});
	}
}