"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FiShield, FiTrash2, FiUserPlus } from "react-icons/fi";
import { Avatar } from "@/components/Avatar";
import { CountryFlag } from "@/components/CountryFlag";
import { useToast } from "@/components/Toast";
import { ADD_MANAGER, GET_AUCTION, REMOVE_MANAGER } from "@/lib/graphql";
import { Auction } from "@/lib/types";

export default function ManagersPage() {
	const { auctionId } = useParams<{ auctionId: string }>();
	const toast = useToast();
	const { data, refetch } = useQuery(GET_AUCTION, {
		variables: { id: auctionId },
	});
	const auction: Auction | undefined = data?.auction;

	const [addManager] = useMutation(ADD_MANAGER);
	const [removeManager] = useMutation(REMOVE_MANAGER);

	const [osuId, setOsuId] = useState("");
	const [discordId, setDiscordId] = useState("");
	const [busy, setBusy] = useState(false);

	async function handleAdd(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		try {
			await addManager({
				variables: { auctionId, input: { osuId: Number(osuId), discordId } },
			});
			toast("Co-organizer added", "success");
			setOsuId("");
			setDiscordId("");
			await refetch();
		} catch (err: any) {
			toast(err.message ?? "Failed", "error");
		} finally {
			setBusy(false);
		}
	}

	async function remove(id: string) {
		try {
			await removeManager({ variables: { auctionId, managerId: id } });
			await refetch();
		} catch (err: any) {
			toast(err.message ?? "Failed", "error");
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Co-organizers</h1>
				<p className="text-sm text-white/40">
					Co-organizers have full management rights but cannot delete the
					auction.
				</p>
			</div>

			<form
				onSubmit={handleAdd}
				className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-tuned/50 p-5 sm:flex-row sm:items-end"
			>
				<label className="flex flex-1 flex-col gap-1">
					<span className="text-xs uppercase tracking-wide text-white/40">
						osu! id
					</span>
					<input
						required
						value={osuId}
						onChange={(e) => setOsuId(e.target.value)}
						placeholder="e.g. 124493"
						className="rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 outline-none focus:border-mintGreen"
					/>
				</label>
				<label className="flex flex-1 flex-col gap-1">
					<span className="text-xs uppercase tracking-wide text-white/40">
						Discord id (optional)
					</span>
					<input
						value={discordId}
						onChange={(e) => setDiscordId(e.target.value)}
						placeholder="for /pause, /resume…"
						className="rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 outline-none focus:border-mintGreen"
					/>
				</label>
				<button
					disabled={busy}
					className="flex items-center gap-2 rounded-lg bg-deepRed px-4 py-2 text-sm font-semibold disabled:opacity-50"
				>
					<FiUserPlus /> Add
				</button>
			</form>

			<div className="grid gap-2">
				{(auction?.managers ?? []).map((m) => (
					<div
						key={m.id}
						className="flex items-center gap-3 rounded-xl border border-white/5 bg-tuned/40 p-3"
					>
						<Avatar osuId={m.osuId} src={m.avatarUrl} size={40} />
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<CountryFlag countryCode={m.countryCode} />
								<span className="truncate font-semibold">{m.username}</span>
								{m.owner && (
									<span className="flex items-center gap-1 rounded bg-deepRed/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-deepRed">
										<FiShield size={10} /> owner
									</span>
								)}
							</div>
							<p className="text-xs text-white/40">
								osu! {m.osuId}
								{m.discordId ? ` · discord ${m.discordId}` : ""}
							</p>
						</div>
						{!m.owner && (
							<button
								onClick={() => remove(m.id)}
								className="rounded-lg p-2 text-white/40 transition hover:bg-deepRed/10 hover:text-deepRed"
								title="Remove"
							>
								<FiTrash2 size={16} />
							</button>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
