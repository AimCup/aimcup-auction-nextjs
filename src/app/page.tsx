"use client";

import { useMutation, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { CREATE_AUCTION, RECENT_AUCTIONS } from "@/lib/graphql";
import { formatDateTime } from "@/lib/format";
import { Auction } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";

export default function HomePage() {
	const { user } = useAuth();
	const router = useRouter();
	const toast = useToast();
	const { data, refetch } = useQuery(RECENT_AUCTIONS, {
		variables: { limit: 24 },
	});
	const [createAuction, { loading }] = useMutation(CREATE_AUCTION);

	const [name, setName] = useState("");
	const [startAt, setStartAt] = useState("");

	const auctions: Auction[] = data?.recentAuctions ?? [];

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		try {
			const iso = startAt ? new Date(startAt).toISOString() : null;
			const res = await createAuction({
				variables: { input: { name, startAt: iso } },
			});
			const id = res.data?.createAuction?.id;
			toast("Auction created", "success");
			if (id) router.push(`/dashboard/${id}`);
		} catch (err: any) {
			toast(err.message ?? "Failed to create auction", "error");
		}
	}

	return (
		<div className="mx-auto max-w-[1600px] px-5 py-10">
			{/* Hero */}
			<section className="overflow-hidden rounded-3xl border border-white/5 bg-tuned px-8 py-14">
				<div className="max-w-2xl">
					<h1 className="text-4xl font-black leading-tight sm:text-5xl">
						Live player <span className="text-deepRed">auctions</span> for
						tournament
					</h1>
					<p className="mt-4 text-lg text-white/60">
						Captains bid in real time from the web or Discord. Build teams,
						manage budgets and run the whole draft from one dashboard.
					</p>
				</div>
			</section>

			{/* Create (admins only) */}
			{user?.admin && (
				<section className="mt-8 rounded-2xl border border-white/5 bg-tuned/50 p-6">
					<h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
						<FiPlus /> Create a new auction
					</h2>
					<form
						onSubmit={handleCreate}
						className="flex flex-col gap-3 sm:flex-row sm:items-end"
					>
						<label className="flex flex-1 flex-col gap-1">
							<span className="text-xs uppercase tracking-wide text-white/40">
								Auction name
							</span>
							<input
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="aimcup 2026 — Main Draft"
								className="rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 outline-none focus:border-mintGreen"
							/>
						</label>
						<label className="flex flex-col gap-1">
							<span className="text-xs uppercase tracking-wide text-white/40">
								Start (your local time)
							</span>
							<input
								type="datetime-local"
								value={startAt}
								onChange={(e) => setStartAt(e.target.value)}
								className="rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 outline-none focus:border-mintGreen"
							/>
						</label>
						<button
							disabled={loading}
							className="rounded-lg bg-deepRed px-5 py-2 font-semibold text-white transition hover:bg-deepRed/85 disabled:opacity-50"
						>
							{loading ? "Creating…" : "Create"}
						</button>
					</form>
				</section>
			)}

			{/* Listing */}
			<section className="mt-10">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-xl font-bold">Auctions</h2>
					<button
						onClick={() => refetch()}
						className="text-sm text-white/50 hover:text-white"
					>
						Refresh
					</button>
				</div>
				{auctions.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-white/40">
						No auctions yet.
						{user?.admin
							? " Create the first one above."
							: " Check back soon."}
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{auctions.map((a, i) => (
							<motion.div
								key={a.id}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: Math.min(i * 0.03, 0.3) }}
							>
								<Link
									href={`/${a.id}`}
									className="group block overflow-hidden rounded-2xl border border-white/5 bg-tuned/50 transition hover:border-mintGreen/40 hover:bg-tuned"
								>
									<div
										className="h-28 bg-cover bg-center"
										style={{
											backgroundImage: a.banner
												? `url(${a.banner})`
												: "linear-gradient(135deg,#241e38,#151120)",
										}}
									/>
									<div className="p-4">
										<div className="mb-2 flex items-center justify-between gap-2">
											<h3 className="truncate font-bold group-hover:text-mintGreen">
												{a.name}
											</h3>
											<StatusBadge state={a.state} />
										</div>
										<p className="text-xs text-white/40">
											{a.state === "SCHEDULED"
												? `Starts ${formatDateTime(a.startAt)}`
												: a.state === "FINISHED"
													? "Completed"
													: "In progress"}
										</p>
									</div>
								</Link>
							</motion.div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
