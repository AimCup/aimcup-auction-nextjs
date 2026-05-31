"use client";

import { useMutation } from "@apollo/client";
import { motion } from "framer-motion";
import { FiCheckCircle, FiClock } from "react-icons/fi";
import { useToast } from "@/components/Toast";
import { SET_CAPTAIN_READY } from "@/lib/graphql";
import { Captain } from "@/lib/types";

/**
 * Readiness check shown before the auction starts (and again while paused). Captains confirm their
 * readiness here; everyone sees a live counter of how many captains are ready. Managers may still
 * start/resume even if not all captains have confirmed.
 */
export function ReadyPanel({
	auctionId,
	captains,
	myCaptain,
	paused,
}: {
	auctionId: string;
	captains: Captain[];
	myCaptain: Captain | null;
	paused?: boolean;
}) {
	const toast = useToast();
	const [setReady, { loading }] = useMutation(SET_CAPTAIN_READY);

	const total = captains.length;
	const readyCount = captains.filter((c) => c.ready).length;
	const allReady = total > 0 && readyCount === total;
	const pct = total === 0 ? 0 : (readyCount / total) * 100;

	async function toggle() {
		if (!myCaptain) return;
		try {
			const res = await setReady({
				variables: { auctionId, ready: !myCaptain.ready },
			});
			const r = res.data.setCaptainReady;
			toast(
				r.ready ? "You are marked ready" : "Readiness cleared",
				r.ready ? "success" : "info",
			);
		} catch (e: any) {
			toast(e.message ?? "Failed to update readiness", "error");
		}
	}

	return (
		<div className="rounded-2xl border border-white/5 bg-tuned/40 p-5">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/50">
					<FiCheckCircle className="text-mintGreen" />
					{paused ? "Re-confirm readiness" : "Captain readiness"}
				</h3>
				<span
					className={`font-mono text-sm font-bold ${
						allReady ? "text-mintGreen" : "text-white/70"
					}`}
				>
					{readyCount}/{total} ready
				</span>
			</div>

			<div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
				<motion.div
					className="h-full rounded-full bg-mintGreen"
					initial={false}
					animate={{ width: `${pct}%` }}
					transition={{ type: "spring", stiffness: 200, damping: 30 }}
				/>
			</div>

			{paused && (
				<p className="mb-3 flex items-center gap-2 text-xs text-yellow-200/80">
					<FiClock size={13} />
					The auction is paused — captains must confirm readiness again before it resumes.
				</p>
			)}

			{myCaptain ? (
				<button
					onClick={toggle}
					disabled={loading}
					className={`w-full rounded-lg py-2.5 font-bold transition disabled:opacity-50 ${
						myCaptain.ready
							? "border border-mintGreen/40 bg-mintGreen/10 text-mintGreen hover:bg-mintGreen/20"
							: "bg-mintGreen text-deepCharcoal hover:bg-mintGreen/85"
					}`}
				>
					{myCaptain.ready ? "✓ You are ready — tap to undo" : "I'm ready"}
				</button>
			) : (
				<p className="rounded-lg bg-white/5 px-3 py-2 text-center text-xs text-white/50">
					Captains confirm readiness here or with{" "}
					<code className="text-mintGreen">/ready</code> on Discord.
				</p>
			)}

			{!allReady && total > 0 && (
				<p className="mt-3 text-center text-[11px] text-white/30">
					Waiting on{" "}
					{captains
						.filter((c) => !c.ready)
						.map((c) => c.username)
						.join(", ")}
				</p>
			)}
		</div>
	);
}
