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
	showBalance,
	showReady,
}: {
	captains: Captain[];
	onlineOsuIds: number[];
	highestBidderId: string | null;
	showBalance: boolean;
	showReady?: boolean;
}) {
	const online = new Set(onlineOsuIds);
	return (
		<div className="flex flex-col gap-2">
			<h3 className="px-1 text-xs font-semibold uppercase tracking-widest text-white/40">
				Captains ({captains.length})
			</h3>
			{captains.map((c) => {
				const leading = highestBidderId === c.id;
				return (
					<motion.div
						key={c.id}
						layout
						className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition ${
							leading
								? "border-mintGreen/60 bg-mintGreen/10 animate-pulse-ring"
								: "border-white/5 bg-tuned/40"
						}`}
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
