"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiZap } from "react-icons/fi";
import { Avatar } from "@/components/Avatar";
import { formatCredits } from "@/lib/format";
import { BidEvent } from "@/lib/types";

export function BidHistory({ history }: { history: BidEvent[] }) {
	// newest first
	const ordered = [...history].reverse();
	return (
		<div className="flex h-full flex-col">
			<h3 className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-white/40">
				Bid history
			</h3>
			{ordered.length === 0 ? (
				<div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-white/30">
					No bids on this player yet.
				</div>
			) : (
				<div className="flex flex-col gap-1.5">
					<AnimatePresence initial={false}>
						{ordered.map((bid, i) => (
							<motion.div
								key={`${bid.captainId}-${bid.amount}-${bid.at}`}
								initial={{ opacity: 0, x: -16, scale: 0.96 }}
								animate={{ opacity: 1, x: 0, scale: 1 }}
								transition={{ type: "spring", stiffness: 320, damping: 26 }}
								className={`flex items-center gap-2 rounded-lg border p-2 ${
									i === 0
										? "border-mintGreen/40 bg-mintGreen/10"
										: "border-white/5 bg-tuned/40"
								}`}
							>
								<Avatar
									osuId={0}
									src={bid.captainAvatarUrl}
									size={26}
								/>
								<span className="min-w-0 flex-1 truncate text-xs font-medium">
									{bid.captainUsername}
								</span>
								{bid.maxBid && (
									<FiZap size={12} className="text-deepRed" title="Max bid" />
								)}
								{bid.source === "DISCORD" && (
									<span className="text-[9px] uppercase text-indigo-300/70">
										dc
									</span>
								)}
								<span className="font-mono text-xs font-bold text-mintGreen">
									{formatCredits(bid.amount)}
								</span>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}
		</div>
	);
}
