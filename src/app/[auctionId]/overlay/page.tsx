"use client";

import { useQuery, useSubscription } from "@apollo/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AUCTION_CHAT_SUB, GET_AUCTION, LIVE_AUCTION_SUB } from "@/lib/graphql";
import { osuAvatar, flagUrl } from "@/lib/format";
import { MaxBidDraw } from "@/components/auction/MaxBidDraw";
import {
	Auction,
	Captain,
	ChatEmbed,
	ChatMessage,
	LiveAuctionState,
	Player,
} from "@/lib/types";
import "./overlay.css";

type SaleResult = {
	playerName: string;
	osuId: number;
	avatarUrl: string | null;
	price: number;
	captainName: string | null;
	sold: boolean;
};

/** A relayed Discord message plus a stable, position-independent key for React. */
type FeedItem = ChatMessage & { _key: number };

const MAX_FEED = 30;
const MAX_RECENT = 3;
const DEFAULT_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

/**
 * OBS / Twitch stream overlay. A fixed 1920x1080 frame driven entirely by the GraphQL live
 * subscription (no bespoke websocket). The design mirrors the original standalone overlay.
 */
export default function OverlayPage() {
	const { auctionId } = useParams<{ auctionId: string }>();
	const { data: auctionData } = useQuery(GET_AUCTION, {
		variables: { id: auctionId },
	});
	const { data: liveData } = useSubscription(LIVE_AUCTION_SUB, {
		variables: { auctionId },
	});

	const auction: Auction | undefined = auctionData?.auction;
	const live: LiveAuctionState | undefined = liveData?.liveAuction;

	const [feed, setFeed] = useState<FeedItem[]>([]);
	const [recent, setRecent] = useState<SaleResult[]>([]);
	const [now, setNow] = useState(() => Date.now());
	const tracker = useRef<{ playerId?: string }>({});
	const feedSeq = useRef(0);

	// Live feed = messages from the auction's linked Discord channel. Each item gets a stable,
	// position-independent key so trimming the buffer doesn't remount (and re-animate) every row.
	useSubscription(AUCTION_CHAT_SUB, {
		variables: { auctionId },
		onData: ({ data }) => {
			const msg: ChatMessage | undefined = data.data?.auctionChat;
			if (msg) {
				const item: FeedItem = { ...msg, _key: feedSeq.current++ };
				setFeed((f) => [...f, item].slice(-MAX_FEED));
			}
		},
	});

	// Local ticking clock for the countdown.
	useEffect(() => {
		const t = setInterval(() => setNow(Date.now()), 100);
		return () => clearInterval(t);
	}, []);

	// Transparent page so OBS can key the overlay onto the stream.
	useEffect(() => {
		const html = document.documentElement;
		const prevBody = document.body.style.background;
		const prevHtml = html.style.background;
		document.body.style.background = "transparent";
		html.style.background = "transparent";
		return () => {
			document.body.style.background = prevBody;
			html.style.background = prevHtml;
		};
	}, []);

	// Track the most recently auctioned players (sold) from successive live snapshots.
	useEffect(() => {
		if (!live) return;
		const cur = live.currentPlayer;
		const prev = tracker.current;

		// A player left the bidding block — record them in the "recently auctioned" list (sold only).
		if (prev.playerId && prev.playerId !== cur?.id) {
			const p = live.players.find((x) => x.id === prev.playerId);
			if (p && p.status === "SOLD") {
				const cap = live.captains.find((c) => c.id === p.soldToCaptainId);
				const result: SaleResult = {
					playerName: p.username,
					osuId: p.osuId,
					avatarUrl: p.avatarUrl,
					price: p.soldPrice ?? 0,
					captainName: cap?.username ?? null,
					sold: true,
				};
				setRecent((r) =>
					[result, ...r.filter((x) => x.osuId !== result.osuId)].slice(
						0,
						MAX_RECENT,
					),
				);
			}
		}

		tracker.current = { playerId: cur?.id };
	}, [live]);

	const phase = live?.phase ?? "WAITING_TO_START";
	const player = live?.currentPlayer ?? null;
	const bidding = phase === "BIDDING" && !!player;
	const maxWindow = phase === "MAX_BID_WINDOW" && !!player;
	const maxDraw = phase === "MAX_BID_DRAW" && !!player;
	const maxContenders = live?.maxBidderIds?.length ?? 0;
	const drawCandidates: Captain[] = maxDraw
		? (live?.maxBidderIds ?? [])
				.map((id) => (live?.captains ?? []).find((c) => c.id === id))
				.filter((c): c is Captain => !!c)
		: [];
	const drawWinner: Captain | null = maxDraw
		? (live?.captains ?? []).find((c) => c.id === live?.maxBidWinnerId) ?? null
		: null;
	const secondsLeft = live
		? Math.max(0, (live.phaseEndsAtEpochMs - now) / 1000)
		: 0;

	// During the GAP the just-sold player is still the snapshot's currentPlayer (the engine keeps
	// currentPlayerId set until the next player comes up), so derive the sold-view directly from it
	// rather than from a stale id-change-gated value — otherwise the previous round's player shows.
	const gapResult: SaleResult | null =
		phase === "GAP" && player && (player.status === "SOLD" || player.status === "UNSOLD")
			? {
					playerName: player.username,
					osuId: player.osuId,
					avatarUrl: player.avatarUrl,
					price: player.soldPrice ?? 0,
					captainName:
						(live?.captains ?? []).find((c) => c.id === player.soldToCaptainId)
							?.username ?? null,
					sold: player.status === "SOLD",
				}
			: null;
	const showSold = !!gapResult;

	const playerById = useMemo(
		() => new Map((live?.players ?? []).map((p) => [p.id, p])),
		[live?.players],
	);
	const captains = live?.captains ?? [];
	const startingBalance = auction?.settings.startingBalance ?? 14000;

	return (
		<div className="overlay-screen">
			<div className="root">
				{/* LEFT */}
				<div className="left-col">
					{/* Player card */}
					<div className="card player-card" style={{ position: "relative" }}>
						{player ? (
							<>
								<div className="player-card__top">
									<div className="avatar-wrap">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											className="avatar-img"
											src={osuAvatar(player.osuId, player.avatarUrl)}
											alt=""
										/>
										<div className="avatar-ring" />
									</div>
									<div className="player-header">
										<div className="player-name">{player.username}</div>
										{player.countryCode && (
											<div className="player-country">
												{flagUrl(player.countryCode) && (
													// eslint-disable-next-line @next/next/no-img-element
													<img
														className="player-country__flag"
														src={flagUrl(player.countryCode)!}
														alt=""
													/>
												)}
												{player.countryCode}
											</div>
										)}
										<div className="stats-row">
											<StatChip
												label="Quals"
												value={
													player.qualificationRank != null
														? "#" + player.qualificationRank.toLocaleString()
														: "—"
												}
											/>
											<StatChip
												label="Global"
												value={
													player.globalRank != null
														? "#" + player.globalRank.toLocaleString()
														: "—"
												}
											/>
											{player.countryRank != null && (
												<StatChip
													label="Country"
													value={"#" + player.countryRank.toLocaleString()}
												/>
											)}
										</div>
									</div>
								</div>

								{(player.bestMapName || player.bestMapAccuracy != null) && (
									<MapRow
										label="Best"
										name={player.bestMapName}
										image={player.bestMapImage}
										accuracy={player.bestMapAccuracy}
									/>
								)}
								{(player.worstMapName || player.worstMapAccuracy != null) && (
									<MapRow
										label="Worst"
										name={player.worstMapName}
										image={player.worstMapImage}
										accuracy={player.worstMapAccuracy}
									/>
								)}

								{player.description && (
									<div className="player-msg">{player.description}</div>
								)}
							</>
						) : (
							<div className="idle-view" style={{ padding: "40px 0" }}>
								<div className="idle-view__dot" />
								<div className="idle-view__title">
									{phase === "PAUSED"
										? "Auction paused"
										: phase === "FINISHED"
											? "Auction complete"
											: "Next player TBA"}
								</div>
								<div className="idle-view__sub">Stand by</div>
							</div>
						)}
					</div>

					{/* Bid card */}
					<div className="card bid-card">
						{bidding ? (
							<div>
								<div className="bid-label">Current Bid</div>
								<div className="bid-amount">
									{live!.highestBid > 0
										? live!.highestBid.toLocaleString()
										: "0"}
								</div>
								<div className="bid-leader">
									{live!.highestBidderUsername
										? `↑ ${live!.highestBidderUsername}`
										: ""}
								</div>
								<div className="bid-divider" />
								<div className="timer-row">
									<div
										className={`timer${secondsLeft <= 10 ? " urgent" : ""}`}
									>
										{secondsLeft.toFixed(1)}
									</div>
									<div className="timer-lbl">seconds left</div>
								</div>
							</div>
						) : maxWindow ? (
								<div>
									<div className="bid-label">Max bid called</div>
									<div className="bid-amount">
										{live!.highestBid > 0
											? live!.highestBid.toLocaleString()
											: "0"}
									</div>
									<div className="bid-leader">
										{maxContenders} captain{maxContenders === 1 ? "" : "s"} in
										the draw
									</div>
									<div className="bid-divider" />
									<div className="timer-row">
										<div
											className={`timer${secondsLeft <= 10 ? " urgent" : ""}`}
										>
											{secondsLeft.toFixed(1)}
										</div>
										<div className="timer-lbl">seconds to counter</div>
									</div>
								</div>
							) : maxDraw ? (
								<MaxBidDraw
									candidates={drawCandidates}
									winner={drawWinner}
									player={player}
									targetEpochMs={live?.phaseEndsAtEpochMs ?? 0}
								/>
							) : showSold && gapResult ? (
							<div className={`sold-view${gapResult.sold ? "" : " no-bid"}`}>
								<div className="sold-view__tag">
									{gapResult.sold ? "SOLD" : "No Bids"}
								</div>
								<div className="sold-view__name">{gapResult.playerName}</div>
								<div className="sold-view__detail">
									{gapResult.sold
										? `${gapResult.captainName} · ${gapResult.price.toLocaleString()}`
										: "Skipped"}
								</div>
								{live!.phaseEndsAtEpochMs > 0 && (
									<div className="gap-next">
										Next player in
										<span className="gap-next__num">
											{Math.ceil(secondsLeft)}
										</span>
										s
									</div>
								)}
							</div>
						) : phase === "GAP" && live && live.phaseEndsAtEpochMs > 0 ? (
							<div className="idle-view">
								<div className="idle-view__dot" />
								<div className="idle-view__title">
									{live.message ?? "Up next"}
								</div>
								<div className="gap-next">
									Next player in
									<span className="gap-next__num">
										{Math.ceil(secondsLeft)}
									</span>
									s
								</div>
							</div>
						) : (
							<div className="idle-view">
								<div className="idle-view__dot" />
								<div className="idle-view__title">
									{phase === "FINISHED"
										? "Auction Complete"
										: phase === "PAUSED"
											? "Paused by organizer"
											: "Waiting for Auction to Start"}
								</div>
								<div className="idle-view__sub">Stand by</div>
							</div>
						)}
					</div>

					{/* Remaining players */}
					<div className="card remaining-card">
						<span className="remaining-card__label">Players left to auction</span>
						<span className="remaining-card__val">
							{live?.remainingCount ?? 0}
							<small> remaining</small>
						</span>
					</div>

					{/* Recently auctioned (last 3 sold) */}
					<div className="card recent-card">
						<div className="recent-title">Recently auctioned</div>
						{recent.length === 0 ? (
							<div className="recent-empty">No players sold yet</div>
						) : (
							recent.map((r) => (
								<div className="recent-item" key={`${r.osuId}-${r.price}`}>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										className="recent-avatar"
										src={osuAvatar(r.osuId, r.avatarUrl)}
										alt=""
									/>
									<div className="recent-info">
										<div className="recent-name">{r.playerName}</div>
										<div className="recent-sub sold">
											{r.captainName ?? "—"}
										</div>
									</div>
									<div className="recent-price">
										{r.price.toLocaleString()}
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* RIGHT — live feed (messages from the linked Discord channel) */}
				<div className="right-col">
					<div className="card chat-card">
						<div className="chat-title">Live Feed</div>
						<div className="chat-feed">
							{feed.length === 0 ? (
								<div className="recent-empty">
									Messages from the linked Discord channel appear here.
								</div>
							) : (
								feed.map((m) => (
									<ChatEmbedCard
										key={m._key}
										author={m.author}
										avatarUrl={m.avatarUrl}
										content={m.content}
										timestamp={m.at}
										embed={m.embed}
									/>
								))
							)}
						</div>
					</div>
				</div>

				{/* BOTTOM — team carousel */}
				<div className="card bar">
					{captains.length > 0 && (
						<div
							className="bar-track"
							style={{
								animationDuration: `${Math.max(30, captains.length * 6)}s`,
							}}
						>
							{[0, 1].map((dup) =>
								captains.map((c) => {
									const team = c.teamPlayerIds
										.map((id) => playerById.get(id))
										.filter(Boolean) as Player[];
									const pct = Math.max(
										0,
										Math.min(100, (c.balance / startingBalance) * 100),
									);
									const leading = live?.highestBidderId === c.id;
									return (
										<div
											className={`team-card${leading ? " leading" : ""}`}
											key={`${dup}-${c.id}`}
										>
											<div className="team-card__row">
												<span className="team-card__name">{c.username}</span>
												<span className="team-card__budget">
													{c.balance.toLocaleString()}
												</span>
											</div>
											<div className="team-bar-track">
												<div
													className="team-bar-fill"
													style={{ width: `${pct}%` }}
												/>
											</div>
											<div className="team-card__players">
												{team.length ? (
													team.map((p) => (
														<div className="team-card__player" key={p.id}>
															{p.username}
														</div>
													))
												) : (
													<div
														className="team-card__player"
														style={{ opacity: 0.3 }}
													>
														—
													</div>
												)}
											</div>
										</div>
									);
								}),
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function formatFeedTime(ts: string | null): string | null {
	if (!ts) return null;
	const d = new Date(ts);
	if (isNaN(d.getTime())) return null;
	return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Renders one Live-Feed item one-to-one with Discord: an avatar gutter plus either a plain message
 * (author header + content) or a rich embed (accent bar, author row, title, description, inline
 * field grid, thumbnail, footer + timestamp). Mirrors {@code DiscordChatRelay}'s flattened embed.
 */
function ChatEmbedCard({
	author,
	avatarUrl,
	content,
	timestamp,
	embed,
}: {
	author: string;
	avatarUrl: string | null;
	content: string;
	timestamp: string | null;
	embed: ChatEmbed | null;
}) {
	const accent = embed?.color || "#4f545c";
	const fields = embed?.fields ?? [];
	const headTime = formatFeedTime(timestamp);
	const footerTime = formatFeedTime(embed?.timestamp ?? null);

	return (
		<div className="feed-row">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				className="feed-row__avatar"
				src={avatarUrl || DEFAULT_AVATAR}
				alt=""
				onError={(e) => {
					if (e.currentTarget.src !== DEFAULT_AVATAR)
						e.currentTarget.src = DEFAULT_AVATAR;
				}}
			/>
			<div className="feed-row__body">
				<div className="feed-msg__head">
					<span className="feed-msg__author">{author}</span>
					{headTime && <span className="feed-msg__time">{headTime}</span>}
				</div>
				{content && <div className="feed-msg__content">{content}</div>}

				{embed && (
					<div className="embed" style={{ borderLeftColor: accent }}>
						<div className="embed__grid">
							<div className="embed__content">
								{embed.authorName && (
									<div className="embed__author">
										{embed.authorIcon && (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												className="embed__author-icon"
												src={embed.authorIcon}
												alt=""
												onError={(e) => {
													e.currentTarget.style.display = "none";
												}}
											/>
										)}
										<span className="embed__author-name">
											{embed.authorName}
										</span>
									</div>
								)}
								{embed.title && (
									<div className="embed__title">{embed.title}</div>
								)}
								{embed.description && (
									<div className="embed__desc">{embed.description}</div>
								)}
								{fields.length > 0 && (
									<div className="embed__fields">
										{fields.map((f, i) => (
											<div
												key={`${f.name}-${i}`}
												className={`embed__field ${
													f.inline
														? "embed__field--inline"
														: "embed__field--block"
												}`}
											>
												<span className="embed__field-name">{f.name}</span>
												<span className="embed__field-value">{f.value}</span>
											</div>
										))}
									</div>
								)}
							</div>

							{embed.thumbnail && (
								<div className="embed__thumb-cell">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										className="embed__thumb"
										src={embed.thumbnail}
										alt=""
										onError={(e) => {
											e.currentTarget.style.display = "none";
										}}
									/>
								</div>
							)}

							{embed.image && (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									className="embed__image"
									src={embed.image}
									alt=""
									onError={(e) => {
										e.currentTarget.style.display = "none";
									}}
								/>
							)}

							{(embed.footer || footerTime) && (
								<div className="embed__footer">
									{embed.footerIcon && (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											className="embed__footer-icon"
											src={embed.footerIcon}
											alt=""
											onError={(e) => {
												e.currentTarget.style.display = "none";
											}}
										/>
									)}
									{embed.footer && (
										<span className="embed__footer-text">{embed.footer}</span>
									)}
									{embed.footer && footerTime && (
										<span className="embed__footer-sep">•</span>
									)}
									{footerTime && (
										<span className="embed__footer-time">{footerTime}</span>
									)}
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function StatChip({ label, value }: { label: string; value: string }) {
	return (
		<div className="stat-chip">
			<span className="stat-chip__lbl">{label}</span>
			<span className="stat-chip__val">{value}</span>
		</div>
	);
}

function MapRow({
	label,
	name,
	image,
	accuracy,
}: {
	label: string;
	name: string | null;
	image: string | null;
	accuracy: number | null;
}) {
	return (
		<div className="map-row">
			<div className="map-row__left">
				{image && (
					// eslint-disable-next-line @next/next/no-img-element
					<img className="map-row__thumb" src={image} alt="" />
				)}
				<div className="map-row__text">
					<div className="map-row__label">{label}</div>
					<div className="map-row__name">{name ?? "—"}</div>
				</div>
			</div>
			<div className="map-row__pct">
				{accuracy != null ? accuracy.toFixed(2) + "%" : "—"}
			</div>
		</div>
	);
}
