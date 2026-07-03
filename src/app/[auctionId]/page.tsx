"use client";

import { useQuery, useSubscription } from "@apollo/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiSettings } from "react-icons/fi";
import { Avatar } from "@/components/Avatar";
import { CountryFlag } from "@/components/CountryFlag";
import { BigCountdown } from "@/components/BigCountdown";
import { StatusBadge } from "@/components/StatusBadge";
import { BidHistory } from "@/components/auction/BidHistory";
import { CaptainList } from "@/components/auction/CaptainList";
import { CurrentPlayerCard } from "@/components/auction/CurrentPlayerCard";
import { LiveChat } from "@/components/auction/LiveChat";
import { ReadyPanel } from "@/components/auction/ReadyPanel";
import { SettingsExplainer } from "@/components/auction/SettingsExplainer";
import { TeamsList } from "@/components/auction/TeamsList";
import { GET_AUCTION, LIVE_AUCTION_SUB } from "@/lib/graphql";
import { durationBetween, formatDateTime, formatRank } from "@/lib/format";
import { Auction, Captain, LiveAuctionState, Player } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";

export default function PublicAuctionPage() {
	const { auctionId } = useParams<{ auctionId: string }>();
	const { user } = useAuth();
	const { data: auctionData } = useQuery(GET_AUCTION, {
		variables: { id: auctionId },
	});
	const { data: liveData } = useSubscription(LIVE_AUCTION_SUB, {
		variables: { auctionId },
	});

	const auction: Auction | undefined = auctionData?.auction;
	const live: LiveAuctionState | undefined = liveData?.liveAuction;

	if (!auction) {
		return (
			<div className="grid min-h-[70vh] place-items-center text-white/50">
				Loading auction…
			</div>
		);
	}

	// Prefer live snapshot for roster/state; fall back to the stored auction until the socket connects.
	const state = live?.state ?? auction.state;
	const captains: Captain[] = live?.captains ?? auction.captains;
	const players: Player[] = live?.players ?? auction.players;
	const nonCaptainPlayers = players.filter((p) => !p.captain);
	const onlineOsuIds = live?.onlineOsuIds ?? [];

	const myCaptain =
		(user && captains.find((c) => c.osuId === user.osuId)) || null;
	const canManage =
		!!user &&
		(auction.creatorOsuId === user.osuId ||
			auction.managers.some((m) => m.osuId === user.osuId));

	const running = state === "RUNNING" || state === "PAUSED";
	const paused = state === "PAUSED";
	const finished = state === "FINISHED";
	const scheduled = state === "SCHEDULED";

	const unsold = nonCaptainPlayers.filter((p) => p.status === "UNSOLD");

	return (
		<div className="mx-auto max-w-[1600px] px-4 py-6">
			{/* Header */}
			<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<h1 className="text-2xl font-black">{auction.name}</h1>
					<StatusBadge state={state} />
					{running && (
						<span className="text-sm text-white/40">
							Stage {(live?.stageIndex ?? 0) + 1}/{live?.totalStages ?? auction.stages.length}
						</span>
					)}
				</div>
				{canManage && (
					<Link
						href={`/dashboard/${auctionId}${running ? "/control" : ""}`}
						className="flex items-center gap-2 rounded-lg border border-white/10 bg-tuned/60 px-4 py-2 text-sm font-semibold transition hover:border-mintGreen/40"
					>
						<FiSettings size={15} />
						{running ? "Control room" : "Manage"}
					</Link>
				)}
			</div>

			{live?.pausedByOrganizer && (
				<div className="mb-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-center text-sm font-medium text-yellow-200">
					{live.message ?? "The auction is paused by an organizer — it will resume shortly."}
				</div>
			)}

			{/* 1 — 2 — 3 columns (narrow, wide, narrow) */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
				{/* Column 1 — bid history / placeholder */}
				<div className="order-2 lg:order-1">
					{running ? (
						<BidHistory history={live?.bidHistory ?? []} />
					) : (
						<div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-white/30">
							{finished
								? "The auction has ended."
								: "Live bids will appear here once the auction starts."}
						</div>
					)}
				</div>

				{/* Column 2 — main */}
				<div className="order-1 flex flex-col gap-5 lg:order-2">
					{scheduled && (
						<>
							<div className="rounded-2xl border border-white/5 bg-tuned/40 p-6">
								<p className="mb-3 text-center text-xs uppercase tracking-widest text-white/40">
									Auction starts in
								</p>
								<BigCountdown targetIso={auction.startAt} />
								<p className="mt-3 text-center text-sm text-white/40">
									{formatDateTime(auction.startAt)}
								</p>
							</div>
							<ReadyPanel
								auctionId={auctionId}
								captains={captains}
								myCaptain={myCaptain}
							/>
							<SettingsExplainer auction={auction} />
							<LiveChat
								auctionId={auctionId}
								hasChannel={!!auction.channelId}
							/>
							<div>
								<h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/40">
									Players ({nonCaptainPlayers.length})
								</h3>
								<PlayerGrid players={nonCaptainPlayers} />
							</div>
						</>
					)}

					{running && (
						<>
							{paused && (
								<ReadyPanel
									auctionId={auctionId}
									captains={captains}
									myCaptain={myCaptain}
									paused
								/>
							)}
							{/* Keep the player + bid controls pinned while scrolling through the teams below.
							    Only this card needs the live snapshot; the chat + teams render as soon as the
							    auction is running so they're never hidden waiting on the socket. */}
							{live && (
								<div className="sticky top-20 z-30">
									<CurrentPlayerCard
										auctionId={auctionId}
										auction={auction}
										live={live}
										myCaptain={myCaptain}
									/>
								</div>
							)}
							<LiveChat
								auctionId={auctionId}
								hasChannel={!!auction.channelId}
							/>
							<TeamsList captains={captains} players={players} />
						</>
					)}

					{finished && (
						<>
							<div className="rounded-2xl border border-white/5 bg-tuned/40 p-6 text-center">
								<h2 className="text-xl font-bold">Auction complete 🎉</h2>
								<p className="mt-2 text-sm text-white/50">
									Lasted {durationBetween(auction.startedAt, auction.finishedAt)} ·
									ended {formatDateTime(auction.finishedAt)}
								</p>
							</div>
							<TeamsList captains={captains} players={players} />
							<div>
								<h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/40">
									Unsold players ({unsold.length})
								</h3>
								{unsold.length === 0 ? (
									<p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/30">
										Every player found a team!
									</p>
								) : (
									<PlayerGrid players={unsold} />
								)}
							</div>
						</>
					)}
				</div>

				{/* Column 3 — captains */}
				<div className="order-3">
					<CaptainList
						captains={captains}
						onlineOsuIds={onlineOsuIds}
						highestBidderId={live?.highestBidderId ?? null}
						maxBidderIds={live?.maxBidderIds ?? []}
						maxBidWinnerId={live?.maxBidWinnerId ?? null}
						phase={live?.phase ?? null}
						showBalance={running || finished}
						showReady={scheduled || paused}
						currentOsuId={user?.osuId ?? null}
					/>
				</div>
			</div>
		</div>
	);
}

function PlayerGrid({ players }: { players: Player[] }) {
	if (players.length === 0) {
		return (
			<p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-white/30">
				No players yet.
			</p>
		);
	}
	return (
		<div className="grid gap-2 sm:grid-cols-2">
			{players.map((p) => (
				<div
					key={p.id}
					className="flex items-center gap-3 rounded-xl border border-white/5 bg-tuned/40 p-3"
				>
					<Avatar osuId={p.osuId} src={p.avatarUrl} size={40} />
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-1.5">
							<CountryFlag countryCode={p.countryCode} />
							<span className="truncate text-sm font-semibold">{p.username}</span>
						</div>
						<p className="truncate text-xs text-white/40">
							{formatRank(p.globalRank)}
							{p.description ? ` · ${p.description}` : ""}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}
