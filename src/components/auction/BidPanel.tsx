"use client";

import { useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import { FiPlus, FiZap } from "react-icons/fi";
import { useToast } from "@/components/Toast";
import { PLACE_BID, PLACE_MAX_BID } from "@/lib/graphql";
import { formatCredits } from "@/lib/format";
import { Captain, LiveAuctionState } from "@/lib/types";

/**
 * The bidding controls (right third of the current-player card). Only enabled for the captain who
 * is signed in; everyone else sees a read-only panel.
 *
 * A max bid no longer wins instantly — it opens a short window in which other captains may counter
 * with their own max bid, after which the winner is drawn at random. During that window only counter
 * max bids are accepted, so the regular BID controls are disabled and only MAX stays live.
 */
export function BidPanel({
	auctionId,
	live,
	myCaptain,
	maxBid,
	minIncrement,
	maxTeamSize,
}: {
	auctionId: string;
	live: LiveAuctionState;
	myCaptain: Captain | null;
	maxBid: number;
	minIncrement: number;
	maxTeamSize: number;
}) {
	const toast = useToast();
	const [placeBid, { loading: bidding }] = useMutation(PLACE_BID);
	const [placeMaxBid, { loading: maxing }] = useMutation(PLACE_MAX_BID);

	const minNext =
		live.highestBid > 0 ? live.highestBid + minIncrement : minIncrement;
	const currentPlayerId = live.currentPlayer?.id ?? null;
	const [amount, setAmount] = useState(minNext);

	// When a new player comes up for bidding, reset the input back to the opening minimum
	// (otherwise it keeps the amount from the previous player, e.g. a 9000 max bid).
	useEffect(() => {
		setAmount(minIncrement);
	}, [currentPlayerId, minIncrement]);

	// While bidding on the same player, keep the field at or above the next legal bid.
	useEffect(() => {
		setAmount((a) => (a < minNext ? minNext : a));
	}, [minNext]);

	const maxBidders = live.maxBidderIds ?? [];
	const inWindow = live.phase === "MAX_BID_WINDOW";
	const teamFull =
		!!myCaptain &&
		maxTeamSize > 0 &&
		myCaptain.teamPlayerIds.length >= maxTeamSize;
	const myInPool = !!myCaptain && maxBidders.includes(myCaptain.id);
	const leading = !!myCaptain && live.highestBidderId === myCaptain.id;
	// Regular incremental bids only exist in the open BIDDING phase — and never for the captain who
	// already holds the top bid: they can't raise their own bid, another captain must bid first.
	const canRegularBid =
		!!myCaptain && live.phase === "BIDDING" && !teamFull && !leading;
	// A max bid is allowed in BIDDING (to call it) and during the window (to counter), once each, and
	// not by the captain who is already the top bidder (the same self-bid rule the server enforces).
	const canMaxBid =
		!!myCaptain &&
		(live.phase === "BIDDING" || inWindow) &&
		!teamFull &&
		!myInPool &&
		!leading;

	async function doBid() {
		try {
			const res = await placeBid({ variables: { auctionId, amount } });
			const result = res.data.placeBid;
			toast(result.message, result.accepted ? "success" : "error");
		} catch (e: any) {
			toast(e.message ?? "Bid failed", "error");
		}
	}

	async function doMax() {
		try {
			const res = await placeMaxBid({ variables: { auctionId } });
			const result = res.data.placeMaxBid;
			toast(result.message, result.accepted ? "success" : "error");
		} catch (e: any) {
			toast(e.message ?? "Bid failed", "error");
		}
	}

	return (
		<div className="flex h-full flex-col justify-between gap-3">
			<div>
				<p className="text-[11px] uppercase tracking-widest text-white/40">
					{inWindow ? "Max bid called" : "Top bid"}
				</p>
				<p
					className={`font-mono text-3xl font-black ${
						inWindow ? "text-deepRed" : "text-mintGreen"
					}`}
				>
					{formatCredits(live.highestBid)}
				</p>
				<p className="mt-0.5 text-sm text-white/60">
					{inWindow ? (
						<>
							{maxBidders.length} captain{maxBidders.length === 1 ? "" : "s"} in
							the draw — counter or pass
						</>
					) : live.highestBidderUsername ? (
						<>
							by{" "}
							<span className="font-semibold text-white">
								{live.highestBidderUsername}
							</span>
						</>
					) : (
						"No bids yet — open at " + formatCredits(minIncrement)
					)}
				</p>
			</div>

			{myCaptain && (
				<p className="text-xs text-white/40">
					Your balance:{" "}
					<span className="font-mono text-white/80">
						{formatCredits(myCaptain.balance)}
					</span>
				</p>
			)}

			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<input
						type="number"
						value={amount}
						step={minIncrement}
						disabled={!canRegularBid}
						onChange={(e) => setAmount(Number(e.target.value))}
						className="w-full rounded-lg border border-white/10 bg-deepCharcoal/80 px-3 py-2 font-mono outline-none focus:border-mintGreen disabled:opacity-50"
					/>
					<button
						onClick={() => setAmount((a) => a + minIncrement)}
						disabled={!canRegularBid}
						title={`+${minIncrement}`}
						className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2.5 transition hover:bg-white/10 disabled:opacity-40"
					>
						<FiPlus />
					</button>
				</div>

				<div className="flex gap-2">
					<button
						onClick={doBid}
						disabled={!canRegularBid || bidding}
						className="flex-1 rounded-lg bg-mintGreen py-2.5 font-bold text-deepCharcoal transition hover:bg-mintGreen/85 disabled:cursor-not-allowed disabled:opacity-40"
					>
						{leading ? "Raise" : "BID"}
					</button>
					<button
						onClick={doMax}
						disabled={!canMaxBid || maxing}
						title={
							inWindow
								? `Counter with your own max bid of ${formatCredits(maxBid)} credits`
								: `Call a max bid of ${formatCredits(maxBid)} — other captains can counter, then the winner is drawn at random`
						}
						className="flex items-center gap-1.5 rounded-lg bg-deepRed px-3 py-2.5 font-bold text-white transition hover:bg-deepRed/85 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<FiZap size={15} /> {myInPool ? "IN" : "MAX"}
					</button>
				</div>
				<p className="text-center text-[10px] text-white/30">
					{inWindow
						? myInPool
							? "You're in the draw — the winner is picked at random."
							: `Counter with your own max bid of ${formatCredits(maxBid)}`
						: `MAX BID = ${formatCredits(maxBid)} → enters the random draw`}
				</p>

				{!myCaptain && (
					<p className="rounded-lg bg-white/5 px-3 py-2 text-center text-xs text-white/50">
						Only captains can bid.
					</p>
				)}

				{leading && live.phase === "BIDDING" && !teamFull && (
					<p className="rounded-lg bg-mintGreen/10 px-3 py-2 text-center text-xs font-medium text-mintGreen">
						You&apos;re the top bidder — wait for another captain to bid.
					</p>
				)}

				{teamFull && (
					<p className="rounded-lg bg-deepRed/15 px-3 py-2 text-center text-xs font-medium text-deepRed">
						Your team is full ({maxTeamSize} players) — you can no longer bid.
					</p>
				)}
			</div>
		</div>
	);
}
