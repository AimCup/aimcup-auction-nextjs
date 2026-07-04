"use client";

import { useSubscription } from "@apollo/client";
import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiMessageSquare } from "react-icons/fi";
import { AUCTION_CHAT_SUB } from "@/lib/graphql";
import { ChatEmbed, ChatMessage } from "@/lib/types";

const MAX_FEED = 60;
const DEFAULT_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

/** A feed message plus a stable, position-independent key so trimming the buffer doesn't remount rows. */
type FeedItem = ChatMessage & { _key: number };

/**
 * Collapsible read-only live feed for the public auction page. Mirrors the auction's linked Discord
 * channel (bot bid/sold embeds + channel chatter). Sending messages from the web has been removed —
 * everyone reads, nobody posts from here.
 */
export function LiveChat({
	auctionId,
	hasChannel,
	defaultOpen = true,
}: {
	auctionId: string;
	hasChannel: boolean;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen);
	const [feed, setFeed] = useState<FeedItem[]>([]);
	const seq = useRef(0);
	const scrollRef = useRef<HTMLDivElement>(null);

	useSubscription(AUCTION_CHAT_SUB, {
		variables: { auctionId },
		onData: ({ data }) => {
			const msg: ChatMessage | undefined = data.data?.auctionChat;
			if (msg) {
				setFeed((f) => [...f, { ...msg, _key: seq.current++ }].slice(-MAX_FEED));
			}
		},
	});

	// Keep the feed pinned to the latest message (on open and as new messages arrive).
	useEffect(() => {
		const el = scrollRef.current;
		if (open && el) el.scrollTop = el.scrollHeight;
	}, [feed, open]);

	return (
		<div className="overflow-hidden rounded-2xl border border-white/5 bg-tuned/40">
			<button
				onClick={() => setOpen((o) => !o)}
				className="flex w-full items-center justify-between gap-2 px-5 py-3.5 text-left transition hover:bg-white/5"
			>
				<span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/50">
					<FiMessageSquare className="text-mintGreen" />
					Live feed
					{feed.length > 0 && (
						<span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white/60">
							{feed.length}
						</span>
					)}
				</span>
				<FiChevronDown
					size={18}
					className={`shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="border-t border-white/5">
					<div
						ref={scrollRef}
						className="flex max-h-80 flex-col gap-3 overflow-y-auto px-4 py-4"
					>
						{feed.length === 0 ? (
							<p className="py-6 text-center text-xs text-white/30">
								{hasChannel
									? "Messages from the linked Discord channel appear here."
									: "No messages yet. This auction isn't linked to a Discord channel."}
							</p>
						) : (
							feed.map((m) => <ChatRow key={m._key} msg={m} />)
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function formatTime(ts: string | null): string | null {
	if (!ts) return null;
	const d = new Date(ts);
	if (isNaN(d.getTime())) return null;
	return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** One feed row: avatar gutter + author/time header, then content, optional banner image and embed. */
function ChatRow({ msg }: { msg: ChatMessage }) {
	const time = formatTime(msg.at);
	return (
		<div className="flex gap-2.5">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={msg.avatarUrl || DEFAULT_AVATAR}
				alt=""
				className="h-8 w-8 shrink-0 rounded-full object-cover"
				onError={(e) => {
					if (e.currentTarget.src !== DEFAULT_AVATAR)
						e.currentTarget.src = DEFAULT_AVATAR;
				}}
			/>
			<div className="min-w-0 flex-1">
				<div className="flex items-baseline gap-2">
					<span className="truncate text-sm font-semibold text-white/90">
						{msg.author}
					</span>
					{time && <span className="text-[10px] text-white/30">{time}</span>}
				</div>
				{msg.content && (
					<p className="whitespace-pre-wrap break-words text-sm text-white/70">
						{msg.content}
					</p>
				)}
				{msg.embed && <EmbedCard embed={msg.embed} />}
			</div>
		</div>
	);
}

/** Compact rendering of a Discord rich embed (accent bar + author/title/description + inline fields). */
function EmbedCard({ embed }: { embed: ChatEmbed }) {
	const accent = embed.color || "#4f545c";
	const fields = embed.fields ?? [];
	return (
		<div
			className="mt-1.5 rounded-r-md border-l-4 bg-deepCharcoal/50 px-3 py-2"
			style={{ borderLeftColor: accent }}
		>
			{embed.authorName && (
				<div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-white/60">
					{embed.authorIcon && (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={embed.authorIcon}
							alt=""
							className="h-4 w-4 rounded-full"
							onError={(e) => {
								e.currentTarget.style.display = "none";
							}}
						/>
					)}
					{embed.authorName}
				</div>
			)}
			{embed.title && (
				<div className="text-sm font-bold text-white/90">{embed.title}</div>
			)}
			{embed.description && (
				<div className="mt-0.5 whitespace-pre-wrap break-words text-xs text-white/60">
					{embed.description}
				</div>
			)}
			{fields.length > 0 && (
				<div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
					{fields.map((f, i) => (
						<div key={`${f.name}-${i}`} className="text-xs">
							<span className="font-semibold text-white/70">{f.name}: </span>
							<span className="text-white/55">{f.value}</span>
						</div>
					))}
				</div>
			)}
			{embed.image && (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={embed.image}
					alt=""
					className="mt-1.5 max-h-32 rounded-md object-cover"
					onError={(e) => {
						e.currentTarget.style.display = "none";
					}}
				/>
			)}
		</div>
	);
}
