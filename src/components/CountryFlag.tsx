"use client";

import { flagUrl } from "@/lib/format";

export function CountryFlag({
	countryCode,
	className = "",
}: {
	countryCode: string | null | undefined;
	className?: string;
}) {
	const url = flagUrl(countryCode);
	if (!url) return null;
	return (
		<img
			src={url}
			alt={countryCode ?? ""}
			title={countryCode ?? ""}
			width={24}
			height={18}
			className={`inline-block rounded-sm ${className}`}
		/>
	);
}
