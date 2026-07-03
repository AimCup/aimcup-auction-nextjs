"use client";

import {
	FiClock,
	FiDollarSign,
	FiLayers,
	FiPercent,
	FiTrendingUp,
	FiUsers,
	FiZap,
} from "react-icons/fi";
import { formatCredits } from "@/lib/format";
import { Auction } from "@/lib/types";

export function SettingsExplainer({ auction }: { auction: Auction }) {
	const s = auction.settings;
	const items = [
		{
			icon: FiDollarSign,
			title: "Starting balance",
			value: formatCredits(s.startingBalance),
			text: "Credits every captain starts with to build their roster.",
		},
		{
			icon: FiZap,
			title: "Max bid",
			value: formatCredits(s.maxBid),
			text: `Bidding exactly ${formatCredits(s.maxBid)} opens a ${s.maxBidWindowSeconds || 10}s window for other captains to counter with their own max bid; the winner is then drawn at random from everyone who maxed.`,
		},
		{
			icon: FiTrendingUp,
			title: "Minimum increment",
			value: formatCredits(s.minIncrement),
			text: `Every raise must be at least ${formatCredits(s.minIncrement)} above the current bid.`,
		},
		{
			icon: FiPercent,
			title: "Budget safety cap",
			value: `${s.maxBidPercent}%`,
			text: `Until a captain owns ${s.teamSizeForPercentLimit} players they can't bid more than ${s.maxBidPercent}% of their balance — so everyone can field a full team.`,
		},
		{
			icon: FiUsers,
			title: "Maximum team size",
			value: s.maxTeamSize > 0 ? `${s.maxTeamSize}` : "∞",
			text:
				s.maxTeamSize > 0
					? `Each captain can win at most ${s.maxTeamSize} players; once full they can no longer bid.`
					: "No team size limit.",
		},
		{
			icon: FiLayers,
			title: "Stages",
			value: `${auction.stages.length}`,
			text:
				auction.stages.length > 1
					? "Unsold players are re-auctioned in later stages with different timings."
					: "A single stage: every player is auctioned once.",
		},
		{
			icon: FiClock,
			title: "Bid timer",
			value: `${auction.stages[0]?.biddingTimeSeconds ?? 30}s`,
			text: `Players open for ${auction.stages[0]?.biddingTimeSeconds ?? 30}s; each new bid resets the clock to ${auction.stages[0]?.biddingTimeAfterBidSeconds ?? 15}s.`,
		},
	];

	return (
		<div className="grid gap-3 sm:grid-cols-2">
			{items.map((it) => {
				const Icon = it.icon;
				return (
					<div
						key={it.title}
						className="rounded-xl border border-white/5 bg-tuned/40 p-4"
					>
						<div className="mb-1.5 flex items-center gap-2 text-mintGreen">
							<Icon size={16} />
							<span className="text-sm font-semibold text-white">
								{it.title}
							</span>
							<span className="ml-auto font-mono text-sm font-bold text-mintGreen">
								{it.value}
							</span>
						</div>
						<p className="text-xs leading-relaxed text-white/50">{it.text}</p>
					</div>
				);
			})}
		</div>
	);
}
