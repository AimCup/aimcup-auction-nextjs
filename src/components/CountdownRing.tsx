"use client";

import { formatClock } from "@/lib/format";
import { useCountdown } from "@/lib/useCountdown";

/**
 * Circular countdown for the live bid timer. The arc depletes over `totalSeconds` and the digits
 * turn red in the final seconds.
 */
export function CountdownRing({
	targetEpochMs,
	totalSeconds,
	size = 96,
}: {
	targetEpochMs: number;
	totalSeconds: number;
	size?: number;
}) {
	const remaining = useCountdown(targetEpochMs);
	const stroke = 7;
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const fraction = totalSeconds > 0 ? Math.min(1, remaining / (totalSeconds * 1000)) : 0;
	const dash = circumference * fraction;
	const urgent = remaining > 0 && remaining < 5000;

	return (
		<div className="relative" style={{ width: size, height: size }}>
			<svg width={size} height={size} className="-rotate-90">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="rgba(255,255,255,0.08)"
					strokeWidth={stroke}
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={urgent ? "#CA191B" : "#00CC99"}
					strokeWidth={stroke}
					strokeLinecap="round"
					strokeDasharray={`${dash} ${circumference}`}
					style={{ transition: "stroke-dasharray 0.2s linear, stroke 0.3s" }}
				/>
			</svg>
			<div className="absolute inset-0 flex items-center justify-center">
				<span
					className={`font-mono text-xl font-bold tabular-nums ${
						urgent ? "text-deepRed" : "text-white"
					}`}
				>
					{formatClock(remaining)}
				</span>
			</div>
		</div>
	);
}
