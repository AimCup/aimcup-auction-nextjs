"use client";

import { useCountdown } from "@/lib/useCountdown";

/** Large day/hour/minute/second countdown to the auction start. */
export function BigCountdown({ targetIso }: { targetIso: string | null }) {
	const target = targetIso ? new Date(targetIso).getTime() : 0;
	const remaining = useCountdown(target);

	if (!targetIso) {
		return (
			<div className="text-center text-lg text-white/60">
				Start time not set yet
			</div>
		);
	}

	const totalSeconds = Math.floor(remaining / 1000);
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const cells: [string, number][] = [
		["Days", days],
		["Hours", hours],
		["Minutes", minutes],
		["Seconds", seconds],
	];

	if (remaining <= 0) {
		return (
			<div className="animate-pulse text-center text-2xl font-bold text-mintGreen">
				Starting any moment…
			</div>
		);
	}

	return (
		<div className="flex items-stretch justify-center gap-3">
			{cells.map(([label, value]) => (
				<div
					key={label}
					className="card-surface flex min-w-[72px] flex-col items-center rounded-xl px-3 py-3"
				>
					<span className="font-mono text-3xl font-bold tabular-nums text-white">
						{value.toString().padStart(2, "0")}
					</span>
					<span className="mt-1 text-[10px] uppercase tracking-widest text-white/50">
						{label}
					</span>
				</div>
			))}
		</div>
	);
}
