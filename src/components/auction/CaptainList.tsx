"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { CountryFlag } from "@/components/CountryFlag";
import { formatCredits } from "@/lib/format";
import { Captain } from "@/lib/types";

export function CaptainList({
	captains,
	onlineOsuIds,
	highestBidderId,
	maxBidderIds = [],
	maxBidWinnerId = null,
	showBalance,
	showReady,
	currentOsuId,
}: {
	captains: Captain[];
	onlineOsuIds: number[];
	highestBidderId: string | null;
	maxBidderIds?: string[];
	maxBidWinnerId?: string | null;
	showBalance: boolean;
	showReady?: boolean;
	currentOsuId?: number | null;
}) {
	const online = new Set(onlineOsuIds);
	const contenders = new Set(maxBidderIds);
	// While confirming readiness (before start / during pause): pin the viewing captain to the very
	// top, then float ready captains above not-ready ones. The cards animate via framer-motion layout.
	const displayed = showReady
		? [...captains].sort((a, b) => {
				const aSelf = currentOsuId != null && a.osuId === currentOsuId;
				const bSelf = currentOsuId != null && b.osuId === currentOsuId;
				if (aSelf !== bSelf) return aSelf ? -1 : 1;
				if (a.ready !== b.ready) return a.ready ? -1 : 1;
				return 0;
			})
		: captains;
	return (
		<div className="flex flex-col gap-2">
			<h3 className="px-1 text-xs font-semibold uppercase tracking-widest text-white/40">
				Captains ({captains.length})
			</h3>
			{displayed.map((c) => {
				const isWinner = maxBidWinnerId === c.id;
				const isContender = contenders.has(c.id);
				const leading = highestBidderId === c.id;
				const highlight = isWinner
					? "border-amber-300/80 bg-amber-300/15 shadow-[0_0_22px_rgba(252,211,77,0.4)] scale-[1.02]"
					: isContender
						? "border-deepRed/60 bg-deepRed/10 animate-pulse-ring"
						: leading
							? "border-mintGreen/60 bg-mintGreen/10 animate-pulse-ring"
							: "border-white/5 bg-tuned/40";
				return (
					<motion.div
						key={c.id}
						layout
						className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition ${highlight}`}
					>
						<div className="relative">
							<Avatar osuId={c.osuId} src={c.avatarUrl} size={36} />
							{online.has(c.osuId) && (
								<span
									className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-deepCharcoal bg-mintGreen"
									title="Online"
								/>
							)}
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-1.5">
								<CountryFlag countryCode={c.countryCode} />
								<span className="truncate text-sm font-semibold">
									{c.username}
								</span>
								{isWinner ? (
									<span className="shrink-0 rounded bg-amber-300/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-200">
										Won
									</span>
								) : (
									isContender && (
										<span className="shrink-0 rounded bg-deepRed/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-deepRed">
											Max
										</span>
									)
								)}
							</div>
							{showBalance && (
								<span className="font-mono text-xs text-mintGreen">
									{formatCredits(c.balance)}
								</span>
							)}
							{showReady && (
								<span
									className={`text-[10px] font-semibold uppercase tracking-wide ${
										c.ready ? "text-mintGreen" : "text-white/30"
									}`}
								>
									{c.ready ? "Ready" : "Not ready"}
								</span>
							)}
						</div>
						{showReady && (
							<span
								className={`h-2.5 w-2.5 shrink-0 rounded-full ${
									c.ready ? "bg-mintGreen" : "bg-white/20"
								}`}
								title={c.ready ? "Ready" : "Not ready"}
							/>
						)}
						{showBalance && (
							<span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">
								{c.teamPlayerIds.length}
							</span>
						)}
					</motion.div>
				);
			})}
		</div>
	);
}
