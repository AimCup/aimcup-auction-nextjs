"use client";

import { AuctionState } from "@/lib/types";

const STYLES: Record<AuctionState, { label: string; className: string; dot: string }> = {
	SCHEDULED: {
		label: "Scheduled",
		className: "bg-white/10 text-white/70",
		dot: "bg-white/50",
	},
	RUNNING: {
		label: "Live",
		className: "bg-mintGreen/15 text-mintGreen",
		dot: "bg-mintGreen animate-pulse",
	},
	PAUSED: {
		label: "Paused",
		className: "bg-yellow-400/15 text-yellow-300",
		dot: "bg-yellow-300",
	},
	FINISHED: {
		label: "Finished",
		className: "bg-white/5 text-white/40",
		dot: "bg-white/30",
	},
};

export function StatusBadge({ state }: { state: AuctionState }) {
	const s = STYLES[state];
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}
		>
			<span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
			{s.label}
		</span>
	);
}
