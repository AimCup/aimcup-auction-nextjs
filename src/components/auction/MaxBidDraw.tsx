"use client";

import { motion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Captain, Player } from "@/lib/types";

/** Pixel width of one reel slot (avatar + label). */
const SLOT = 84;

/**
 * The max-bid "roulette". When the max-bid window closes the server picks a winner at random; this
 * component plays the reveal: a horizontal reel of the contending captains spins and decelerates,
 * landing on the winner under the centre marker, then showcases them.
 *
 * The winner is known up front (the server already drew them), so the animation is deterministic —
 * the reel is built so the winner is the final resting slot, and the spin is timed to land shortly
 * before {@code targetEpochMs} (the end of the MAX_BID_DRAW phase, when the player is awarded).
 */
export function MaxBidDraw({
	candidates,
	winner,
	player,
	targetEpochMs,
}: {
	candidates: Captain[];
	winner: Captain | null;
	player: Player | null;
	targetEpochMs: number;
}) {
	const viewportRef = useRef<HTMLDivElement>(null);
	const [vw, setVw] = useState(0);
	const [landed, setLanded] = useState(false);

	useLayoutEffect(() => {
		const measure = () => setVw(viewportRef.current?.clientWidth ?? 0);
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, []);

	// Build the reel: several passes over the contenders, then plant the winner a few slots from the
	// end (TAIL) — not as the very last slot. That way, when the reel stops with the winner under the
	// centre marker, there are still slots to its right, so it reads as centred rather than stuck at
	// the edge with empty space beside it.
	const { reel, stopIndex } = useMemo(() => {
		if (candidates.length === 0 || !winner) {
			return { reel: [] as Captain[], stopIndex: 0 };
		}
		const TAIL = 4;
		const reps = Math.max(8, Math.ceil(32 / candidates.length));
		const arr: Captain[] = [];
		for (let r = 0; r < reps; r++) arr.push(...candidates);
		const stop = arr.length - 1 - TAIL;
		arr[stop] = winner;
		return { reel: arr, stopIndex: stop };
	}, [candidates, winner]);

	const centerX = (i: number) => vw / 2 - (i * SLOT + SLOT / 2);
	// Land ~1.1s before the phase ends so the winner is showcased before the player is awarded. The
	// 4200ms cap keeps the spin comfortably inside the server's ~5s draw even if the client clock runs
	// behind the server (otherwise the component unmounts at the real deadline before the reel lands).
	const spinMs = Math.max(
		1200,
		Math.min(4200, targetEpochMs - Date.now() - 1100),
	);

	return (
		<div className="flex h-full flex-col items-center justify-center gap-3">
			<p className="text-[11px] font-bold uppercase tracking-widest text-deepRed">
				Max bid draw
				{candidates.length > 1 ? ` · ${candidates.length} captains` : ""}
			</p>

			<div
				ref={viewportRef}
				className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-deepCharcoal/70 py-3"
			>
				{/* Centre marker the reel lands under. */}
				<div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[84px] -translate-x-1/2 rounded-lg border-2 border-amber-300/80 bg-amber-300/5" />
				{vw > 0 && reel.length > 0 && (
					<motion.div
						className="flex"
						style={{ width: reel.length * SLOT }}
						initial={{ x: centerX(Math.min(2, stopIndex)) }}
						animate={{ x: centerX(stopIndex) }}
						transition={{ duration: spinMs / 1000, ease: [0.12, 0.7, 0.1, 1] }}
						onAnimationComplete={() => setLanded(true)}
					>
						{reel.map((c, i) => (
							<div
								key={`${c.id}-${i}`}
								className="flex shrink-0 flex-col items-center justify-center gap-1"
								style={{ width: SLOT }}
							>
								<Avatar osuId={c.osuId} src={c.avatarUrl} size={52} />
								<span className="max-w-[80px] truncate text-[10px] text-white/60">
									{c.username}
								</span>
							</div>
						))}
					</motion.div>
				)}
			</div>

			{landed && winner ? (
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 22 }}
					className="flex items-center gap-3 rounded-xl border border-amber-300/50 bg-amber-300/10 px-4 py-2"
				>
					<Avatar osuId={winner.osuId} src={winner.avatarUrl} size={36} />
					<div className="text-sm leading-tight">
						<span className="font-black text-amber-200">{winner.username}</span>{" "}
						<span className="text-white/70">wins</span>{" "}
						<span className="font-semibold text-white">
							{player?.username ?? "the player"}
						</span>
					</div>
				</motion.div>
			) : (
				<p className="text-xs text-white/40">Drawing the winner…</p>
			)}
		</div>
	);
}
