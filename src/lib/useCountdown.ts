"use client";

import { useEffect, useState } from "react";

/** Returns remaining milliseconds until an epoch-ms target, ticking smoothly to zero. */
export function useCountdown(targetEpochMs: number | null | undefined): number {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 200);
		return () => clearInterval(id);
	}, []);

	if (!targetEpochMs) return 0;
	return Math.max(0, targetEpochMs - now);
}
