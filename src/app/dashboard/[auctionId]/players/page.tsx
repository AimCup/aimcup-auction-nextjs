"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
	FiAward,
	FiLink,
	FiTrash2,
	FiUpload,
	FiUserPlus,
	FiX,
} from "react-icons/fi";
import { Avatar } from "@/components/Avatar";
import { CountryFlag } from "@/components/CountryFlag";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import {
	ADD_PLAYER,
	GET_AUCTION,
	IMPORT_PLAYERS,
	REMOVE_CAPTAIN_PROXY,
	REMOVE_PLAYER,
	SET_CAPTAIN,
	SET_CAPTAIN_PROXY,
	UNSET_CAPTAIN,
} from "@/lib/graphql";
import { formatRank } from "@/lib/format";
import { Auction, Captain, ImportResult, Player } from "@/lib/types";

export default function PlayersPage() {
	const { auctionId } = useParams<{ auctionId: string }>();
	const toast = useToast();
	const { data, refetch } = useQuery(GET_AUCTION, {
		variables: { id: auctionId },
	});
	const auction: Auction | undefined = data?.auction;

	const [addPlayer] = useMutation(ADD_PLAYER);
	const [importPlayers] = useMutation(IMPORT_PLAYERS);
	const [removePlayer] = useMutation(REMOVE_PLAYER);
	const [setCaptain] = useMutation(SET_CAPTAIN);
	const [unsetCaptain] = useMutation(UNSET_CAPTAIN);
	const [setCaptainProxy] = useMutation(SET_CAPTAIN_PROXY);
	const [removeCaptainProxy] = useMutation(REMOVE_CAPTAIN_PROXY);

	const [osuId, setOsuId] = useState("");
	const [description, setDescription] = useState("");
	const [qualificationRank, setQualificationRank] = useState("");
	const [bestBeatmapUrl, setBestBeatmapUrl] = useState("");
	const [bestAccuracy, setBestAccuracy] = useState("");
	const [worstBeatmapUrl, setWorstBeatmapUrl] = useState("");
	const [worstAccuracy, setWorstAccuracy] = useState("");
	const [csv, setCsv] = useState("");
	const [busy, setBusy] = useState(false);
	const [importResult, setImportResult] = useState<ImportResult | null>(null);

	const [captainModal, setCaptainModal] = useState<Player | null>(null);
	const [discordId, setDiscordId] = useState("");

	// Batch selection for deleting players.
	const [selected, setSelected] = useState<Set<string>>(new Set());

	// Proxy assignment.
	const [proxyModal, setProxyModal] = useState<Captain | null>(null);
	const [proxyOsuId, setProxyOsuId] = useState("");
	const [proxyDiscordId, setProxyDiscordId] = useState("");

	const editable = auction?.state === "SCHEDULED";
	const maxLen = auction?.settings.maxDescriptionLength ?? 360;
	const players = auction?.players ?? [];
	const captains = auction?.captains ?? [];
	const captainFor = (p: Player): Captain | null =>
		captains.find((c) => c.playerId === p.id) ?? null;

	async function handleAdd(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		try {
			await addPlayer({
				variables: {
					auctionId,
					input: {
						osuId: Number(osuId),
						description,
						qualificationRank:
							qualificationRank.trim() === ""
								? null
								: Number(qualificationRank),
						bestBeatmapUrl: bestBeatmapUrl.trim() || null,
						bestAccuracy:
							bestAccuracy.trim() === "" ? null : Number(bestAccuracy),
						worstBeatmapUrl: worstBeatmapUrl.trim() || null,
						worstAccuracy:
							worstAccuracy.trim() === "" ? null : Number(worstAccuracy),
					},
				},
			});
			toast("Player added", "success");
			setOsuId("");
			setDescription("");
			setQualificationRank("");
			setBestBeatmapUrl("");
			setBestAccuracy("");
			setWorstBeatmapUrl("");
			setWorstAccuracy("");
			await refetch();
		} catch (err: any) {
			toast(err.message ?? "Failed", "error");
		} finally {
			setBusy(false);
		}
	}

	async function handleImport() {
		if (!csv.trim()) return;
		setBusy(true);
		try {
			const res = await importPlayers({ variables: { auctionId, csv } });
			const result: ImportResult = res.data.importPlayers;
			setImportResult(result);
			toast(
				`Imported ${result.imported.length} players, ${result.errors.length} errors`,
				result.errors.length ? "info" : "success",
			);
			await refetch();
		} catch (err: any) {
			toast(err.message ?? "Import failed", "error");
		} finally {
			setBusy(false);
		}
	}

	async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) setCsv(await file.text());
	}

	async function confirmCaptain() {
		if (!captainModal) return;
		try {
			await setCaptain({
				variables: {
					auctionId,
					input: { playerId: captainModal.id, discordId },
				},
			});
			toast(`${captainModal.username} is now a captain`, "success");
			setCaptainModal(null);
			setDiscordId("");
			await refetch();
		} catch (err: any) {
			toast(err.message ?? "Failed", "error");
		}
	}

	async function toggleCaptain(player: Player) {
		if (player.captain) {
			await unsetCaptain({ variables: { auctionId, playerId: player.id } });
			await refetch();
		} else {
			setCaptainModal(player);
		}
	}

	async function remove(player: Player) {
		await removePlayer({ variables: { auctionId, playerId: player.id } });
		setSelected((s) => {
			const next = new Set(s);
			next.delete(player.id);
			return next;
		});
		await refetch();
	}

	function toggleSelect(id: string) {
		setSelected((s) => {
			const next = new Set(s);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function toggleSelectAll() {
		setSelected((s) =>
			s.size === players.length
				? new Set()
				: new Set(players.map((p) => p.id)),
		);
	}

	async function deleteSelected() {
		if (selected.size === 0) return;
		setBusy(true);
		try {
			await Promise.all(
				[...selected].map((playerId) =>
					removePlayer({ variables: { auctionId, playerId } }),
				),
			);
			toast(`Removed ${selected.size} player(s)`, "success");
			setSelected(new Set());
			await refetch();
		} catch (err: any) {
			toast(err.message ?? "Failed to remove players", "error");
		} finally {
			setBusy(false);
		}
	}

	async function confirmProxy() {
		if (!proxyModal || !proxyOsuId.trim()) return;
		try {
			await setCaptainProxy({
				variables: {
					auctionId,
					input: {
						captainId: proxyModal.id,
						osuId: Number(proxyOsuId),
						discordId: proxyDiscordId.trim() || null,
					},
				},
			});
			toast(`Proxy set for ${proxyModal.username}`, "success");
			setProxyModal(null);
			setProxyOsuId("");
			setProxyDiscordId("");
			await refetch();
		} catch (err: any) {
			toast(err.message ?? "Failed to set proxy", "error");
		}
	}

	async function removeProxy(captain: Captain) {
		try {
			await removeCaptainProxy({
				variables: { auctionId, captainId: captain.id },
			});
			toast("Proxy removed", "success");
			await refetch();
		} catch (err: any) {
			toast(err.message ?? "Failed to remove proxy", "error");
		}
	}

	const allSelected = players.length > 0 && selected.size === players.length;

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-bold">Players & captains</h1>

			{!editable && (
				<div className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
					The auction has started — the roster is locked.
				</div>
			)}

			{editable && (
				<div className="grid gap-4 lg:grid-cols-2">
					{/* Add single */}
					<form
						onSubmit={handleAdd}
						className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-tuned/50 p-5"
					>
						<h2 className="flex items-center gap-2 font-bold">
							<FiUserPlus /> Add a player
						</h2>
						<input
							required
							value={osuId}
							onChange={(e) => setOsuId(e.target.value)}
							placeholder="osu! user id (e.g. 124493)"
							className="rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 outline-none focus:border-mintGreen"
						/>
						<textarea
							value={description}
							maxLength={maxLen}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Short description (optional)"
							className="h-20 resize-none rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 outline-none focus:border-mintGreen"
						/>

						{/* Qualifier stats (optional) */}
						<div className="rounded-lg border border-white/5 bg-deepCharcoal/40 p-3">
							<p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
								Qualifier stats (optional)
							</p>
							<input
								value={qualificationRank}
								type="number"
								onChange={(e) => setQualificationRank(e.target.value)}
								placeholder="Final qualifier rank (e.g. 12)"
								className="mb-2 w-full rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 text-sm outline-none focus:border-mintGreen"
							/>
							<div className="mb-2 flex gap-2">
								<input
									value={bestBeatmapUrl}
									onChange={(e) => setBestBeatmapUrl(e.target.value)}
									placeholder="Best play beatmap link"
									className="min-w-0 flex-[2] rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 text-sm outline-none focus:border-mintGreen"
								/>
								<input
									value={bestAccuracy}
									type="number"
									step="0.01"
									onChange={(e) => setBestAccuracy(e.target.value)}
									placeholder="Acc %"
									className="w-24 shrink-0 rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 text-sm outline-none focus:border-mintGreen"
								/>
							</div>
							<div className="flex gap-2">
								<input
									value={worstBeatmapUrl}
									onChange={(e) => setWorstBeatmapUrl(e.target.value)}
									placeholder="Worst play beatmap link"
									className="min-w-0 flex-[2] rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 text-sm outline-none focus:border-mintGreen"
								/>
								<input
									value={worstAccuracy}
									type="number"
									step="0.01"
									onChange={(e) => setWorstAccuracy(e.target.value)}
									placeholder="Acc %"
									className="w-24 shrink-0 rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 text-sm outline-none focus:border-mintGreen"
								/>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-xs text-white/30">
								{description.length}/{maxLen}
							</span>
							<button
								disabled={busy}
								className="rounded-lg bg-deepRed px-4 py-2 text-sm font-semibold disabled:opacity-50"
							>
								Add player
							</button>
						</div>
					</form>

					{/* Import CSV */}
					<div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-tuned/50 p-5">
						<h2 className="flex items-center gap-2 font-bold">
							<FiUpload /> Import from CSV
						</h2>
						<p className="text-xs text-white/40">
							Columns:{" "}
							<code className="text-mintGreen">
								username, osuId, description, qualificationRank, bestBeatmapUrl,
								bestBeatmapAccuracy, worstBeatmapUrl, worstBeatmapAccuracy
							</code>{" "}
							(header optional).{" "}
							<span className="text-white/60">
								username, osuId and qualificationRank are required
							</span>
							; the rest may be left empty.
						</p>
						<input
							type="file"
							accept=".csv,text/csv"
							onChange={handleFile}
							className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-deepRed file:px-3 file:py-1.5 file:text-white"
						/>
						<textarea
							value={csv}
							onChange={(e) => setCsv(e.target.value)}
							placeholder={
								"username,osuId,description,qualificationRank,bestBeatmapUrl,bestBeatmapAccuracy,worstBeatmapUrl,worstBeatmapAccuracy\nCookiezi,124493,insane aim,1,https://osu.ppy.sh/beatmaps/5468482,98.52,https://osu.ppy.sh/beatmaps/5001883,91.20"
							}
							className="h-24 resize-none rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 font-mono text-xs outline-none focus:border-mintGreen"
						/>
						<button
							onClick={handleImport}
							disabled={busy || !csv.trim()}
							className="self-start rounded-lg bg-deepRed px-4 py-2 text-sm font-semibold disabled:opacity-50"
						>
							Import
						</button>
						{importResult && importResult.errors.length > 0 && (
							<div className="max-h-32 overflow-auto rounded-lg border border-deepRed/30 bg-deepRed/10 p-3 text-xs">
								{importResult.errors.map((er, i) => (
									<div key={i} className="text-deepRed/90">
										Line {er.line} ({er.username || er.osuId}): {er.reason}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Player list */}
			<div className="rounded-2xl border border-white/5 bg-tuned/30 p-4">
				<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
					<h2 className="font-bold">
						Roster <span className="text-white/40">({players.length})</span>
					</h2>
					<div className="flex items-center gap-3">
						{editable && players.length > 0 && (
							<label className="flex items-center gap-2 text-xs text-white/50">
								<input
									type="checkbox"
									checked={allSelected}
									onChange={toggleSelectAll}
									className="h-4 w-4 accent-deepRed"
								/>
								Select all
							</label>
						)}
						{editable && selected.size > 0 && (
							<button
								onClick={deleteSelected}
								disabled={busy}
								className="flex items-center gap-1.5 rounded-lg bg-deepRed px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
							>
								<FiTrash2 size={13} /> Delete selected ({selected.size})
							</button>
						)}
						<span className="text-xs text-white/40">
							{captains.length} captains
						</span>
					</div>
				</div>
				{players.length === 0 ? (
					<p className="py-8 text-center text-white/40">No players yet.</p>
				) : (
					<div className="grid gap-2">
						{players.map((p) => {
							const captain = captainFor(p);
							return (
								<div
									key={p.id}
									className={`flex items-center gap-3 rounded-xl border p-3 ${
										p.captain
											? "border-mintGreen/30 bg-mintGreen/5"
											: "border-white/5 bg-deepCharcoal/40"
									}`}
								>
									{editable && (
										<input
											type="checkbox"
											checked={selected.has(p.id)}
											onChange={() => toggleSelect(p.id)}
											className="h-4 w-4 shrink-0 accent-deepRed"
											title="Select for batch delete"
										/>
									)}
									<Avatar osuId={p.osuId} src={p.avatarUrl} size={40} />
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<CountryFlag countryCode={p.countryCode} />
											<span className="truncate font-semibold">{p.username}</span>
											{p.captain && (
												<span className="rounded bg-mintGreen/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-mintGreen">
													captain
												</span>
											)}
										</div>
										<p className="truncate text-xs text-white/40">
											{formatRank(p.globalRank)} · {p.description || "—"}
										</p>
										{captain?.proxy && (
											<p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-amber-200/90">
												<FiLink size={11} />
												Proxy: {captain.proxy.username ?? captain.proxy.osuId}
												{editable && (
													<button
														onClick={() => removeProxy(captain)}
														title="Remove proxy"
														className="rounded p-0.5 text-white/40 hover:bg-deepRed/10 hover:text-deepRed"
													>
														<FiX size={12} />
													</button>
												)}
											</p>
										)}
									</div>
									{editable && (
										<div className="flex items-center gap-1">
											{p.captain && captain && (
												<button
													onClick={() => setProxyModal(captain)}
													title={captain.proxy ? "Replace proxy" : "Add proxy"}
													className={`rounded-lg p-2 transition ${
														captain.proxy
															? "text-amber-200 hover:bg-amber-200/10"
															: "text-white/40 hover:bg-white/5 hover:text-white"
													}`}
												>
													<FiLink size={16} />
												</button>
											)}
											<button
												onClick={() => toggleCaptain(p)}
												title={p.captain ? "Remove captain" : "Make captain"}
												className={`rounded-lg p-2 transition ${
													p.captain
														? "text-mintGreen hover:bg-mintGreen/10"
														: "text-white/40 hover:bg-white/5 hover:text-white"
												}`}
											>
												<FiAward size={16} />
											</button>
											<button
												onClick={() => remove(p)}
												title="Remove"
												className="rounded-lg p-2 text-white/40 transition hover:bg-deepRed/10 hover:text-deepRed"
											>
												<FiTrash2 size={16} />
											</button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			<Modal
				open={!!captainModal}
				onClose={() => setCaptainModal(null)}
				title={`Make ${captainModal?.username} a captain`}
			>
				<p className="mb-3 text-sm text-white/60">
					Provide the captain&apos;s Discord id so they can bid with{" "}
					<code className="text-mintGreen">/bid</code>.
				</p>
				<input
					value={discordId}
					onChange={(e) => setDiscordId(e.target.value)}
					placeholder="Discord id (e.g. 184473450884726784)"
					className="mb-4 w-full rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 outline-none focus:border-mintGreen"
				/>
				<button
					onClick={confirmCaptain}
					disabled={!discordId.trim()}
					className="w-full rounded-lg bg-mintGreen py-2.5 font-bold text-deepCharcoal disabled:opacity-50"
				>
					Confirm captain
				</button>
			</Modal>

			<Modal
				open={!!proxyModal}
				onClose={() => setProxyModal(null)}
				title={`Proxy for ${proxyModal?.username}`}
			>
				<p className="mb-3 text-sm text-white/60">
					A proxy bids and confirms readiness on this captain&apos;s behalf. While a
					proxy is set, only the proxy can act — the captain is locked out. The proxy
					must not be a player in the auction.
				</p>
				<input
					value={proxyOsuId}
					onChange={(e) => setProxyOsuId(e.target.value)}
					placeholder="Proxy osu! user id"
					className="mb-3 w-full rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 outline-none focus:border-mintGreen"
				/>
				<input
					value={proxyDiscordId}
					onChange={(e) => setProxyDiscordId(e.target.value)}
					placeholder="Proxy Discord id (optional)"
					className="mb-4 w-full rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 outline-none focus:border-mintGreen"
				/>
				<button
					onClick={confirmProxy}
					disabled={!proxyOsuId.trim()}
					className="w-full rounded-lg bg-mintGreen py-2.5 font-bold text-deepCharcoal disabled:opacity-50"
				>
					Save proxy
				</button>
			</Modal>
		</div>
	);
}
