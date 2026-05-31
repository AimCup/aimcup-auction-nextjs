export function formatCredits(value: number | null | undefined): string {
	if (value == null) return "0";
	return value.toLocaleString("en-US");
}

export function formatRank(value: number | null | undefined): string {
	if (value == null) return "—";
	return "#" + value.toLocaleString("en-US");
}

export function osuAvatar(osuId: number, avatarUrl?: string | null): string {
	return avatarUrl || `https://a.ppy.sh/${osuId}`;
}

export function flagUrl(countryCode: string | null | undefined): string | null {
	if (!countryCode) return null;
	return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
}

/** Returns mm:ss for a positive remaining-milliseconds value (clamped at 0). */
export function formatClock(ms: number): string {
	const total = Math.max(0, Math.ceil(ms / 1000));
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDateTime(iso: string | null | undefined): string {
	if (!iso) return "—";
	try {
		return new Date(iso).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});
	} catch {
		return iso;
	}
}

export function durationBetween(
	startIso: string | null | undefined,
	endIso: string | null | undefined,
): string {
	if (!startIso || !endIso) return "—";
	const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
	if (ms < 0) return "—";
	const totalSeconds = Math.floor(ms / 1000);
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = totalSeconds % 60;
	const parts: string[] = [];
	if (h) parts.push(`${h}h`);
	if (m || h) parts.push(`${m}m`);
	parts.push(`${s}s`);
	return parts.join(" ");
}
