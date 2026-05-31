"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { formatCredits } from "@/lib/format";
import { Captain, Player } from "@/lib/types";

export function TeamsList({
	captains,
	players,
}: {
	captains: Captain[];
	players: Player[];
}) {
	const playerById = new Map(players.map((p) => [p.id, p]));

	return (
		<div>
			<h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/40">
				Teams
			</h3>
			<div className="grid gap-3 sm:grid-cols-2">
				{captains.map((c) => {
					const team = c.teamPlayerIds
						.map((id) => playerById.get(id))
						.filter(Boolean) as Player[];
					const spent = team.reduce((sum, p) => sum + (p.soldPrice ?? 0), 0);
					return (
						<motion.div
							layout
							key={c.id}
							className="rounded-xl border border-white/5 bg-tuned/40 p-3"
						>
							<div className="mb-2 flex items-center gap-2">
								<Avatar osuId={c.osuId} src={c.avatarUrl} size={32} />
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-bold">{c.username}</p>
									<p className="font-mono text-[11px] text-mintGreen">
										{formatCredits(c.balance)} left · {formatCredits(spent)} spent
									</p>
								</div>
								<span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">
									{team.length}
								</span>
							</div>
							<div className="flex flex-col gap-1">
								<AnimatePresence>
									{team.map((p) => (
										<motion.div
											key={p.id}
											initial={{ opacity: 0, height: 0, scale: 0.9 }}
											animate={{ opacity: 1, height: "auto", scale: 1 }}
											exit={{ opacity: 0, height: 0 }}
											transition={{ type: "spring", stiffness: 300, damping: 28 }}
											className="flex items-center gap-2 rounded-lg bg-deepCharcoal/50 px-2 py-1"
										>
											<Avatar osuId={p.osuId} src={p.avatarUrl} size={20} />
											<span className="flex-1 truncate text-xs">
												{p.username}
											</span>
											<span className="font-mono text-[11px] text-mintGreen">
												{formatCredits(p.soldPrice ?? 0)}
											</span>
										</motion.div>
									))}
								</AnimatePresence>
								{team.length === 0 && (
									<p className="py-1 text-center text-[11px] text-white/25">
										No players won yet
									</p>
								)}
							</div>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
