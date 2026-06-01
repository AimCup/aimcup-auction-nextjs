"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { CountryFlag } from "@/components/CountryFlag";
import { CountdownRing } from "@/components/CountdownRing";
import { BidPanel } from "@/components/auction/BidPanel";
import { formatRank } from "@/lib/format";
import { useCountdown } from "@/lib/useCountdown";
import { Auction, Captain, LiveAuctionState, Player } from "@/lib/types";

export function CurrentPlayerCard({
	auctionId,
	auction,
	live,
	myCaptain,
}: {
	auctionId: string;
	auction: Auction;
	live: LiveAuctionState;
	myCaptain: Captain | null;
}) {
	const player = live.currentPlayer;
	const stage = auction.stages[live.stageIndex] ?? auction.stages[0];
	const totalSeconds =
		live.highestBid > 0
			? stage?.biddingTimeAfterBidSeconds ?? 15
			: stage?.biddingTimeSeconds ?? 30;

	return (
		<div className="relative overflow-hidden rounded-2xl border border-white/10 bg-tuned">
			{/* Banner background, faded left → right so the bid panel stays readable */}
			{player?.bannerUrl && (
				<div
					className="absolute inset-0 bg-cover bg-center"
					style={{ backgroundImage: `url(${player.bannerUrl})` }}
				/>
			)}
			<div className="absolute inset-0 bg-gradient-to-r from-deepCharcoal/50 via-deepCharcoal/80 to-tuned" />

			<div className="relative flex min-h-[230px] flex-col gap-4 p-5 md:flex-row">
				{/* Left 2/3 — player info */}
				<div className="flex flex-[2] flex-col">
					<AnimatePresence mode="wait">
						<motion.div
							key={player?.id ?? "none"}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							transition={{ duration: 0.3 }}
							className="flex h-full flex-col"
						>
							{player ? (
								<>
									<div className="flex items-center gap-4">
										<Avatar
											osuId={player.osuId}
											src={player.avatarUrl}
											size={72}
											className="ring-2 ring-white/10"
										/>
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<CountryFlag countryCode={player.countryCode} />
												<h2 className="truncate text-2xl font-black">
													{player.username}
												</h2>
											</div>
											<div className="mt-1 flex items-center gap-4 text-sm text-white/60">
												<span>
													Global{" "}
													<span className="font-semibold text-white">
														{formatRank(player.globalRank)}
													</span>
												</span>
												<span>
													Country{" "}
													<span className="font-semibold text-white">
														{formatRank(player.countryRank)}
													</span>
												</span>
											</div>
										</div>
										<div className="ml-auto hidden sm:block">
											{live.phaseEndsAtEpochMs > 0 &&
												live.phase === "BIDDING" && (
													<CountdownRing
														targetEpochMs={live.phaseEndsAtEpochMs}
														totalSeconds={totalSeconds}
													/>
												)}
											{live.phaseEndsAtEpochMs > 0 &&
												live.phase === "GAP" && (
													<GapBadge
														targetEpochMs={live.phaseEndsAtEpochMs}
													/>
												)}
										</div>
									</div>
									{player.description && (
										<p className="mt-4 max-w-prose rounded-lg bg-deepCharcoal/70 px-3 py-2 text-sm leading-relaxed text-white/85 backdrop-blur-sm">
											{player.description}
										</p>
									)}
									<QualifierStats player={player} />
								</>
							) : (
								<div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-3 text-center text-white/50">
									{live.phase === "GAP" ? (
										<>
											<span>{live.message ?? "Preparing the next player…"}</span>
											{live.phaseEndsAtEpochMs > 0 && (
												<GapBadge targetEpochMs={live.phaseEndsAtEpochMs} />
											)}
										</>
									) : live.phase === "PAUSED" ? (
										live.message ?? "Auction paused"
									) : (
										"Waiting…"
									)}
								</div>
							)}
						</motion.div>
					</AnimatePresence>
				</div>

				{/* Right 1/3 — bid panel */}
				<div className="flex-1 rounded-xl border border-white/10 bg-deepCharcoal/60 p-4 backdrop-blur-sm">
					<BidPanel
						auctionId={auctionId}
						live={live}
						myCaptain={myCaptain}
						maxBid={auction.settings.maxBid}
						minIncrement={auction.settings.minIncrement}
						maxTeamSize={auction.settings.maxTeamSize}
					/>
				</div>
			</div>
		</div>
	);
}

/**
 * Inter-auction countdown shown during the GAP phase (between one player's bidding ending and the
 * next starting). Derives purely from the broadcast {@code phaseEndsAtEpochMs}, so it works whether
 * or not the just-sold player is still present in the snapshot. The gap is server-enforced ≥ 3s.
 */
function GapBadge({ targetEpochMs }: { targetEpochMs: number }) {
	const remaining = useCountdown(targetEpochMs);
	const seconds = Math.max(0, Math.ceil(remaining / 1000));
	return (
		<div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-mintGreen/30 bg-mintGreen/10 px-4 py-2 text-center">
			<span className="text-[10px] font-bold uppercase tracking-widest text-mintGreen/80">
				Next player in
			</span>
			<span className="font-mono text-3xl font-black tabular-nums text-mintGreen">
				{seconds}
				<span className="ml-0.5 text-base font-semibold text-mintGreen/70">
					s
				</span>
			</span>
		</div>
	);
}

function QualifierStats({ player }: { player: Player }) {
	const hasBest = player.bestMapName || player.bestMapAccuracy != null;
	const hasWorst = player.worstMapName || player.worstMapAccuracy != null;
	const hasQuals = player.qualificationRank != null || hasBest || hasWorst;
	if (!hasQuals) return null;

	const acc = (v: number | null) => (v == null ? "—" : `${v.toFixed(2)}%`);

	return (
		<div className="mt-4 flex flex-col gap-2">
			{player.qualificationRank != null && (
				<div className="flex w-fit items-center gap-2 rounded-lg bg-deepCharcoal/70 px-2.5 py-1.5 text-sm backdrop-blur-sm">
					<span className="rounded-md bg-mintGreen/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-mintGreen">
						Qualifier rank
					</span>
					<span className="font-bold text-white">
						#{player.qualificationRank.toLocaleString()}
					</span>
				</div>
			)}
			{hasBest && (
				<QualMapRow
					label="Best"
					accent="text-mintGreen"
					name={player.bestMapName}
					image={player.bestMapImage}
					accuracy={acc(player.bestMapAccuracy)}
				/>
			)}
			{hasWorst && (
				<QualMapRow
					label="Worst"
					accent="text-flatRed"
					name={player.worstMapName}
					image={player.worstMapImage}
					accuracy={acc(player.worstMapAccuracy)}
				/>
			)}
		</div>
	);
}

function QualMapRow({
	label,
	accent,
	name,
	image,
	accuracy,
}: {
	label: string;
	accent: string;
	name: string | null;
	image: string | null;
	accuracy: string;
}) {
	return (
		<div className="flex items-center gap-3 rounded-lg border border-white/10 bg-deepCharcoal/70 p-2 backdrop-blur-sm">
			{image ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={image}
					alt={name ?? label}
					className="h-10 w-16 shrink-0 rounded object-cover"
				/>
			) : (
				<div className="h-10 w-16 shrink-0 rounded bg-white/5" />
			)}
			<div className="min-w-0 flex-1">
				<p className={`text-[10px] font-bold uppercase tracking-wide ${accent}`}>
					{label} qualifier map
				</p>
				<p className="truncate text-xs text-white/70">{name ?? "—"}</p>
			</div>
			<span className="shrink-0 font-mono text-lg font-black">{accuracy}</span>
		</div>
	);
}
