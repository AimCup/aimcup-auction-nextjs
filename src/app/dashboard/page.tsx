"use client";

import { useQuery } from "@apollo/client";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { MY_AUCTIONS } from "@/lib/graphql";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/useAuth";

export default function DashboardIndexPage() {
	const { user, ready } = useAuth();
	const { data, loading } = useQuery(MY_AUCTIONS, { skip: !user });

	if (ready && !user) {
		return (
			<div className="grid min-h-[60vh] place-items-center text-white/60">
				Please sign in to manage your auctions.
			</div>
		);
	}

	const auctions = data?.myAuctions ?? [];

	return (
		<div className="mx-auto max-w-5xl px-5 py-10">
			<h1 className="mb-6 text-2xl font-bold">Auctions you manage</h1>
			{loading ? (
				<p className="text-white/50">Loading…</p>
			) : auctions.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-white/40">
					You don&apos;t manage any auctions yet.
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{auctions.map((a: any) => (
						<Link
							key={a.id}
							href={`/dashboard/${a.id}`}
							className="flex items-center justify-between rounded-xl border border-white/5 bg-tuned/50 p-4 transition hover:border-mintGreen/40"
						>
							<div>
								<h3 className="font-semibold">{a.name}</h3>
								<p className="text-xs text-white/40">
									{a.players.length} players · {a.captains.length} captains ·{" "}
									{a.state === "SCHEDULED"
										? `starts ${formatDateTime(a.startAt)}`
										: a.state.toLowerCase()}
								</p>
							</div>
							<StatusBadge state={a.state} />
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
