"use client";

import { useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { useToast } from "@/components/Toast";
import { GET_AUCTION, START_AUCTION } from "@/lib/graphql";
import { formatDateTime } from "@/lib/format";
import { Auction } from "@/lib/types";

export default function OverviewPage() {
	const { auctionId } = useParams<{ auctionId: string }>();
	const router = useRouter();
	const toast = useToast();
	const { data } = useQuery(GET_AUCTION, { variables: { id: auctionId } });
	const [startAuction, { loading }] = useMutation(START_AUCTION);
	const auction: Auction | undefined = data?.auction;

	if (!auction) return <p className="text-white/50">Loading…</p>;

	const captains = auction.captains.length;
	const players = auction.players.filter((p) => !p.captain).length;
	const checks = [
		{ ok: players > 0, label: "At least one player added" },
		{ ok: captains > 0, label: "At least one captain selected" },
		{ ok: auction.stages.length > 0, label: "At least one stage configured" },
	];
	const ready = checks.every((c) => c.ok);

	async function start() {
		try {
			await startAuction({ variables: { auctionId } });
			toast("Auction started!", "success");
			router.push(`/${auctionId}`);
		} catch (e: any) {
			toast(e.message ?? "Could not start", "error");
		}
	}

	const stats = [
		{ label: "Players", value: players },
		{ label: "Captains", value: captains },
		{ label: "Co-organizers", value: auction.managers.length },
		{ label: "Stages", value: auction.stages.length },
	];

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">{auction.name}</h1>
				<p className="text-sm text-white/40">
					{auction.state === "SCHEDULED"
						? `Scheduled to start ${formatDateTime(auction.startAt)}`
						: auction.state === "FINISHED"
							? `Finished ${formatDateTime(auction.finishedAt)}`
							: "Currently " + auction.state.toLowerCase()}
				</p>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{stats.map((s) => (
					<div
						key={s.label}
						className="rounded-xl border border-white/5 bg-tuned/50 p-4"
					>
						<p className="text-3xl font-black">{s.value}</p>
						<p className="text-xs uppercase tracking-wide text-white/40">
							{s.label}
						</p>
					</div>
				))}
			</div>

			{auction.state === "SCHEDULED" && (
				<div className="rounded-2xl border border-white/5 bg-tuned/50 p-6">
					<h2 className="mb-4 text-lg font-bold">Before you start</h2>
					<ul className="flex flex-col gap-2">
						{checks.map((c) => (
							<li key={c.label} className="flex items-center gap-2 text-sm">
								{c.ok ? (
									<FiCheckCircle className="text-mintGreen" />
								) : (
									<FiXCircle className="text-deepRed" />
								)}
								<span className={c.ok ? "text-white/80" : "text-white/50"}>
									{c.label}
								</span>
							</li>
						))}
					</ul>
					<button
						onClick={start}
						disabled={!ready || loading}
						className="mt-5 rounded-lg bg-mintGreen px-6 py-2.5 font-bold text-deepCharcoal transition hover:bg-mintGreen/85 disabled:cursor-not-allowed disabled:opacity-40"
					>
						{loading ? "Starting…" : "Start auction"}
					</button>
					{!ready && (
						<p className="mt-2 text-xs text-white/40">
							Complete the checklist on the Players & Settings tabs first.
						</p>
					)}
				</div>
			)}

			{(auction.state === "RUNNING" || auction.state === "PAUSED") && (
				<Link
					href={`/dashboard/${auctionId}/control`}
					className="w-fit rounded-lg bg-deepRed px-6 py-2.5 font-bold transition hover:bg-deepRed/85"
				>
					Go to control room →
				</Link>
			)}

			<div className="rounded-2xl border border-white/5 bg-tuned/30 p-5 text-sm text-white/60">
				Public auction page:{" "}
				<Link
					href={`/${auctionId}`}
					target="_blank"
					className="text-mintGreen hover:underline"
				>
					/{auctionId}
				</Link>
			</div>
		</div>
	);
}
