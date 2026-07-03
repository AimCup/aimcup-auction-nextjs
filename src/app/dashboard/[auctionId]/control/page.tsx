"use client";

import { useMutation, useSubscription } from "@apollo/client";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
	FiDollarSign,
	FiLink,
	FiPause,
	FiPlay,
	FiSkipForward,
	FiTrash2,
	FiX,
} from "react-icons/fi";
import { Avatar } from "@/components/Avatar";
import { useToast } from "@/components/Toast";
import {
	CHANGE_BALANCE,
	LIVE_AUCTION_SUB,
	PAUSE_AUCTION,
	REMOVE_CAPTAIN_PROXY,
	REMOVE_FROM_TEAM,
	RESUME_AUCTION,
	START_AUCTION,
} from "@/lib/graphql";
import { formatCredits } from "@/lib/format";
import { Captain, LiveAuctionState, Player } from "@/lib/types";

export default function ControlPage() {
	const { auctionId } = useParams<{ auctionId: string }>();
	const toast = useToast();
	const { data } = useSubscription(LIVE_AUCTION_SUB, {
		variables: { auctionId },
	});
	const live: LiveAuctionState | undefined = data?.liveAuction;

	const [startAuction] = useMutation(START_AUCTION);
	const [pauseAuction] = useMutation(PAUSE_AUCTION);
	const [resumeAuction] = useMutation(RESUME_AUCTION);
	const [changeBalance] = useMutation(CHANGE_BALANCE);
	const [removeFromTeam] = useMutation(REMOVE_FROM_TEAM);
	const [removeCaptainProxy] = useMutation(REMOVE_CAPTAIN_PROXY);

	const [editing, setEditing] = useState<Record<string, string>>({});

	async function run(fn: () => Promise<any>, ok: string) {
		try {
			await fn();
			toast(ok, "success");
		} catch (e: any) {
			toast(e.message ?? "Failed", "error");
		}
	}

	if (!live) {
		return <p className="text-white/50">Connecting to the live auction…</p>;
	}

	const paused = live.state === "PAUSED";
	const playerById = new Map(live.players.map((p) => [p.id, p]));

	const totalCaptains = live.captains.length;
	const readyCount = live.captains.filter((c) => c.ready).length;
	const allReady = totalCaptains > 0 && readyCount === totalCaptains;
	const notReadyNames = live.captains
		.filter((c) => !c.ready)
		.map((c) => c.username)
		.join(", ");

	async function startWithReadinessCheck() {
		if (!allReady) {
			const ok = window.confirm(
				`Only ${readyCount}/${totalCaptains} captains are ready` +
					(notReadyNames ? ` (waiting on ${notReadyNames})` : "") +
					".\n\nStart the auction anyway?",
			);
			if (!ok) return;
		}
		await run(() => startAuction({ variables: { auctionId } }), "Auction started");
	}

	async function resumeWithReadinessCheck() {
		if (!allReady) {
			const ok = window.confirm(
				`Only ${readyCount}/${totalCaptains} captains have re-confirmed readiness` +
					(notReadyNames ? ` (waiting on ${notReadyNames})` : "") +
					".\n\nResume the auction anyway?",
			);
			if (!ok) return;
		}
		await run(() => resumeAuction({ variables: { auctionId } }), "Resuming");
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">Control room</h1>
					<p className="text-sm text-white/40">
						State: <span className="font-semibold">{live.state}</span> · Phase:{" "}
						{live.phase} · Stage {live.stageIndex + 1}/{live.totalStages}
					</p>
				</div>
				<div className="flex gap-2">
					{live.state === "SCHEDULED" && (
						<button
							onClick={startWithReadinessCheck}
							className="flex items-center gap-2 rounded-lg bg-mintGreen px-4 py-2 font-bold text-deepCharcoal"
						>
							<FiPlay /> Start
						</button>
					)}
					{live.state === "RUNNING" && (
						<button
							onClick={() =>
								run(
									() => pauseAuction({ variables: { auctionId } }),
									"Pause requested",
								)
							}
							className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 font-bold text-deepCharcoal"
						>
							<FiPause /> Pause
						</button>
					)}
					{paused && (
						<button
							onClick={resumeWithReadinessCheck}
							className="flex items-center gap-2 rounded-lg bg-mintGreen px-4 py-2 font-bold text-deepCharcoal"
						>
							<FiSkipForward /> Resume
						</button>
					)}
				</div>
			</div>

			{live.message && (
				<div className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
					{live.message}
				</div>
			)}

			{(live.state === "SCHEDULED" || paused) && (
				<section className="rounded-xl border border-white/5 bg-tuned/40 p-4">
					<div className="mb-3 flex items-center justify-between">
						<h2 className="font-bold">
							Captain readiness{" "}
							<span
								className={`ml-1 font-mono text-sm ${
									allReady ? "text-mintGreen" : "text-white/60"
								}`}
							>
								{readyCount}/{totalCaptains}
							</span>
						</h2>
						{!allReady && (
							<span className="text-xs text-yellow-200/80">
								You can {paused ? "resume" : "start"} without everyone ready.
							</span>
						)}
					</div>
					<div className="flex flex-wrap gap-2">
						{live.captains.map((c) => (
							<span
								key={c.id}
								className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
									c.ready
										? "border-mintGreen/40 bg-mintGreen/10 text-mintGreen"
										: "border-white/10 bg-deepCharcoal/40 text-white/50"
								}`}
							>
								<span
									className={`h-2 w-2 rounded-full ${
										c.ready ? "bg-mintGreen" : "bg-white/25"
									}`}
								/>
								{c.username}
							</span>
						))}
					</div>
				</section>
			)}

			{live.currentPlayer && (
				<div className="flex items-center gap-3 rounded-xl border border-white/5 bg-tuned/50 p-4">
					<Avatar
						osuId={live.currentPlayer.osuId}
						src={live.currentPlayer.avatarUrl}
						size={48}
					/>
					<div className="flex-1">
						<p className="text-xs text-white/40">Currently up for auction</p>
						<p className="font-bold">{live.currentPlayer.username}</p>
					</div>
					<div className="text-right">
						<p className="text-xs text-white/40">Top bid</p>
						<p className="font-mono text-lg font-bold text-mintGreen">
							{formatCredits(live.highestBid)}
						</p>
						{live.highestBidderUsername && (
							<p className="text-xs text-white/50">
								{live.highestBidderUsername}
							</p>
						)}
					</div>
				</div>
			)}

			{/* Captains: balances */}
			<section>
				<h2 className="mb-3 font-bold">Captains & balances</h2>
				<div className="grid gap-2">
					{live.captains.map((c: Captain) => (
						<div
							key={c.id}
							className="flex items-center gap-3 rounded-xl border border-white/5 bg-tuned/40 p-3"
						>
							<Avatar osuId={c.osuId} src={c.avatarUrl} size={36} />
							<div className="min-w-0 flex-1">
									<span className="truncate font-semibold">{c.username}</span>
									{c.proxy && (
										<span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-200/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
											<FiLink size={10} /> via {c.proxy.username ?? c.proxy.osuId}
											{paused && (
												<button
													onClick={() =>
														run(
															() =>
																removeCaptainProxy({
																	variables: { auctionId, captainId: c.id },
																}),
															"Proxy removed",
														)
													}
													title="Remove proxy"
													className="ml-0.5 rounded p-0.5 hover:bg-deepRed/20 hover:text-deepRed"
												>
													<FiX size={11} />
												</button>
											)}
										</span>
									)}
								</div>
							<span className="font-mono text-mintGreen">
								{formatCredits(c.balance)}
							</span>
							<div className="flex items-center gap-1">
								<input
									type="number"
									value={editing[c.id] ?? ""}
									onChange={(e) =>
										setEditing((s) => ({ ...s, [c.id]: e.target.value }))
									}
									placeholder="new"
									className="w-24 rounded-lg border border-white/10 bg-deepCharcoal px-2 py-1.5 text-sm outline-none focus:border-mintGreen"
								/>
								<button
									onClick={() =>
										run(async () => {
											await changeBalance({
												variables: {
													auctionId,
													input: {
														captainId: c.id,
														balance: Number(editing[c.id] ?? c.balance),
													},
												},
											});
											setEditing((s) => ({ ...s, [c.id]: "" }));
										}, "Balance updated")
									}
									disabled={!editing[c.id]}
									className="rounded-lg bg-deepRed/80 p-2 text-white disabled:opacity-30"
									title="Set balance"
								>
									<FiDollarSign size={15} />
								</button>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Teams: remove sold players (paused only) */}
			<section>
				<div className="mb-3 flex items-center justify-between">
					<h2 className="font-bold">Teams</h2>
					<span className="text-xs text-white/40">
						{paused
							? "Pause active — you can remove & refund players"
							: "Pause the auction to remove sold players"}
					</span>
				</div>
				<div className="grid gap-3 sm:grid-cols-2">
					{live.captains.map((c) => {
						const team = c.teamPlayerIds
							.map((id) => playerById.get(id))
							.filter(Boolean) as Player[];
						return (
							<div
								key={c.id}
								className="rounded-xl border border-white/5 bg-tuned/40 p-4"
							>
								<div className="mb-2 flex items-center gap-2">
									<Avatar osuId={c.osuId} src={c.avatarUrl} size={28} />
									<span className="font-semibold">{c.username}</span>
									<span className="ml-auto text-xs text-white/40">
										{team.length} players
									</span>
								</div>
								{team.length === 0 ? (
									<p className="text-xs text-white/30">No players yet.</p>
								) : (
									<div className="flex flex-col gap-1">
										{team.map((p) => (
											<div
												key={p.id}
												className="flex items-center gap-2 rounded-lg bg-deepCharcoal/50 px-2 py-1.5 text-sm"
											>
												<Avatar osuId={p.osuId} src={p.avatarUrl} size={22} />
												<span className="flex-1 truncate">{p.username}</span>
												<span className="font-mono text-xs text-mintGreen">
													{formatCredits(p.soldPrice ?? 0)}
												</span>
												{paused && (
													<button
														onClick={() =>
															run(
																() =>
																	removeFromTeam({
																		variables: { auctionId, playerId: p.id },
																	}),
																"Player removed & refunded",
															)
														}
														className="rounded p-1 text-white/40 hover:bg-deepRed/10 hover:text-deepRed"
														title="Remove & refund"
													>
														<FiTrash2 size={14} />
													</button>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</section>
		</div>
	);
}
