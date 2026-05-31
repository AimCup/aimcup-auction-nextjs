"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FiPlus, FiSave, FiTrash2 } from "react-icons/fi";
import { useToast } from "@/components/Toast";
import {
	GET_AUCTION,
	UPDATE_META,
	UPDATE_SETTINGS,
	UPDATE_STAGES,
} from "@/lib/graphql";
import { Auction, AuctionSettings, AuctionStage } from "@/lib/types";

function NumberField({
	label,
	hint,
	value,
	onChange,
}: {
	label: string;
	hint?: string;
	value: number;
	onChange: (v: number) => void;
}) {
	return (
		<label className="flex flex-col gap-1">
			<span className="text-xs font-medium text-white/70">{label}</span>
			<input
				type="number"
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 outline-none focus:border-mintGreen"
			/>
			{hint && <span className="text-[11px] text-white/35">{hint}</span>}
		</label>
	);
}

export default function SettingsPage() {
	const { auctionId } = useParams<{ auctionId: string }>();
	const toast = useToast();
	const { data, refetch } = useQuery(GET_AUCTION, {
		variables: { id: auctionId },
	});
	const auction: Auction | undefined = data?.auction;
	const editable = auction?.state === "SCHEDULED";

	const [updateSettings] = useMutation(UPDATE_SETTINGS);
	const [updateMeta] = useMutation(UPDATE_META);
	const [updateStages] = useMutation(UPDATE_STAGES);

	const [settings, setSettings] = useState<AuctionSettings | null>(null);
	const [stages, setStages] = useState<AuctionStage[]>([]);
	const [meta, setMeta] = useState({ banner: "", guildId: "", channelId: "" });

	useEffect(() => {
		if (auction) {
			setSettings(auction.settings);
			setStages(auction.stages);
			setMeta({
				banner: auction.banner ?? "",
				guildId: auction.guildId ?? "",
				channelId: auction.channelId ?? "",
			});
		}
	}, [auction?.id]); // eslint-disable-line react-hooks/exhaustive-deps

	if (!auction || !settings) return <p className="text-white/50">Loading…</p>;

	function patch(key: keyof AuctionSettings, value: number) {
		setSettings((s) => (s ? { ...s, [key]: value } : s));
	}

	async function saveSettings() {
		try {
			const { __typename, ...input } = settings as any;
			await updateSettings({ variables: { auctionId, input } });
			toast("Settings saved", "success");
			await refetch();
		} catch (e: any) {
			toast(e.message ?? "Failed", "error");
		}
	}

	async function saveMeta() {
		try {
			await updateMeta({ variables: { auctionId, input: meta } });
			toast("Saved", "success");
			await refetch();
		} catch (e: any) {
			toast(e.message ?? "Failed", "error");
		}
	}

	async function saveStages() {
		try {
			const input = stages.map((s) => ({
				biddingTimeSeconds: s.biddingTimeSeconds,
				biddingTimeAfterBidSeconds: s.biddingTimeAfterBidSeconds,
				gapTimeSeconds: s.gapTimeSeconds,
			}));
			await updateStages({ variables: { auctionId, stages: input } });
			toast("Stages saved", "success");
			await refetch();
		} catch (e: any) {
			toast(e.message ?? "Failed", "error");
		}
	}

	function updateStage(i: number, key: keyof AuctionStage, value: number) {
		setStages((prev) =>
			prev.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)),
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-bold">Settings & stages</h1>
			{!editable && (
				<div className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
					Bidding settings and stages are locked once the auction starts. You can
					still update the banner and Discord channel.
				</div>
			)}

			{/* Bidding settings */}
			<section className="rounded-2xl border border-white/5 bg-tuned/50 p-6">
				<h2 className="mb-4 font-bold">Bidding rules</h2>
				<fieldset
					disabled={!editable}
					className="grid gap-4 disabled:opacity-50 sm:grid-cols-2 lg:grid-cols-3"
				>
					<NumberField
						label="Starting balance"
						hint="Credits each captain starts with"
						value={settings.startingBalance}
						onChange={(v) => patch("startingBalance", v)}
					/>
					<NumberField
						label="Max bid (instant win)"
						hint="A bid of exactly this amount wins instantly"
						value={settings.maxBid}
						onChange={(v) => patch("maxBid", v)}
					/>
					<NumberField
						label="Minimum increment"
						hint="Smallest legal raise"
						value={settings.minIncrement}
						onChange={(v) => patch("minIncrement", v)}
					/>
					<NumberField
						label="Players before % cap lifts"
						hint="Roster size that removes the percentage cap"
						value={settings.teamSizeForPercentLimit}
						onChange={(v) => patch("teamSizeForPercentLimit", v)}
					/>
					<NumberField
						label="Max bid % of balance"
						hint="Cap while the roster is still small"
						value={settings.maxBidPercent}
						onChange={(v) => patch("maxBidPercent", v)}
					/>
					<NumberField
						label="Max description length"
						value={settings.maxDescriptionLength}
						onChange={(v) => patch("maxDescriptionLength", v)}
					/>
				</fieldset>
				{editable && (
					<button
						onClick={saveSettings}
						className="mt-5 flex items-center gap-2 rounded-lg bg-deepRed px-4 py-2 text-sm font-semibold"
					>
						<FiSave /> Save rules
					</button>
				)}
			</section>

			{/* Meta */}
			<section className="rounded-2xl border border-white/5 bg-tuned/50 p-6">
				<h2 className="mb-4 font-bold">Banner & Discord</h2>
				<div className="grid gap-4 sm:grid-cols-3">
					<label className="flex flex-col gap-1 sm:col-span-3">
						<span className="text-xs font-medium text-white/70">Banner URL</span>
						<input
							value={meta.banner}
							onChange={(e) => setMeta({ ...meta, banner: e.target.value })}
							placeholder="https://…"
							className="rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 outline-none focus:border-mintGreen"
						/>
					</label>
					<label className="flex flex-col gap-1">
						<span className="text-xs font-medium text-white/70">
							Discord guild id
						</span>
						<input
							value={meta.guildId}
							onChange={(e) => setMeta({ ...meta, guildId: e.target.value })}
							className="rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 outline-none focus:border-mintGreen"
						/>
					</label>
					<label className="flex flex-col gap-1">
						<span className="text-xs font-medium text-white/70">
							Discord channel id
						</span>
						<input
							value={meta.channelId}
							onChange={(e) => setMeta({ ...meta, channelId: e.target.value })}
							className="rounded-lg border border-white/10 bg-deepCharcoal px-3 py-2 outline-none focus:border-mintGreen"
						/>
					</label>
				</div>
				<button
					onClick={saveMeta}
					className="mt-5 flex items-center gap-2 rounded-lg bg-deepRed px-4 py-2 text-sm font-semibold"
				>
					<FiSave /> Save
				</button>
			</section>

			{/* Stages */}
			<section className="rounded-2xl border border-white/5 bg-tuned/50 p-6">
				<div className="mb-1 flex items-center justify-between">
					<h2 className="font-bold">Stages</h2>
					<span className="text-xs text-white/40">
						Each stage re-auctions unsold players with its own timings.
					</span>
				</div>
				<div className="mt-4 flex flex-col gap-3">
					{stages.map((stage, i) => (
						<div
							key={i}
							className="rounded-xl border border-white/5 bg-deepCharcoal/40 p-4"
						>
							<div className="mb-3 flex items-center justify-between">
								<span className="font-semibold">Stage {i + 1}</span>
								{editable && stages.length > 1 && (
									<button
										onClick={() =>
											setStages((p) => p.filter((_, idx) => idx !== i))
										}
										className="rounded-lg p-1.5 text-white/40 hover:bg-deepRed/10 hover:text-deepRed"
									>
										<FiTrash2 size={15} />
									</button>
								)}
							</div>
							<fieldset
								disabled={!editable}
								className="grid gap-3 disabled:opacity-50 sm:grid-cols-3"
							>
								<NumberField
									label="Bid time (s)"
									hint="Before any bid"
									value={stage.biddingTimeSeconds}
									onChange={(v) => updateStage(i, "biddingTimeSeconds", v)}
								/>
								<NumberField
									label="Bid time after bid (s)"
									hint="Resets on each new bid"
									value={stage.biddingTimeAfterBidSeconds}
									onChange={(v) =>
										updateStage(i, "biddingTimeAfterBidSeconds", v)
									}
								/>
								<NumberField
									label="Gap (s)"
									hint="Between players (min 3)"
									value={stage.gapTimeSeconds}
									onChange={(v) => updateStage(i, "gapTimeSeconds", v)}
								/>
							</fieldset>
						</div>
					))}
				</div>
				{editable && (
					<div className="mt-4 flex gap-3">
						<button
							onClick={() =>
								setStages((p) => [
									...p,
									{
										index: p.length,
										biddingTimeSeconds: 30,
										biddingTimeAfterBidSeconds: 15,
										gapTimeSeconds: 5,
									},
								])
							}
							className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
						>
							<FiPlus /> Add stage
						</button>
						<button
							onClick={saveStages}
							className="flex items-center gap-2 rounded-lg bg-deepRed px-4 py-2 text-sm font-semibold"
						>
							<FiSave /> Save stages
						</button>
					</div>
				)}
			</section>
		</div>
	);
}
