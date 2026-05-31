"use client";

import { osuAvatar } from "@/lib/format";

export function Avatar({
	osuId,
	src,
	size = 40,
	className = "",
	ring = false,
}: {
	osuId: number;
	src?: string | null;
	size?: number;
	className?: string;
	ring?: boolean;
}) {
	return (
		<img
			src={osuAvatar(osuId, src)}
			alt="avatar"
			width={size}
			height={size}
			style={{ width: size, height: size }}
			className={`shrink-0 rounded-lg bg-tuned object-cover ${
				ring ? "ring-2 ring-mintGreen" : ""
			} ${className}`}
			onError={(e) => {
				(e.currentTarget as HTMLImageElement).src = `https://a.ppy.sh/${osuId}`;
			}}
		/>
	);
}
