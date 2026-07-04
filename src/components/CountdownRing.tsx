"use client";

import { useEffect, useRef } from "react";
import { formatClock } from "@/lib/format";

const MINT = "#00CC99";
const RED = "#CA191B";

/**
 * Circular countdown for the live bid timer. The arc depletes over `totalSeconds` and the digits
 * turn red in the final seconds. Driven by requestAnimationFrame writing straight to the DOM (no
 * per-frame React re-render and no CSS transition), which keeps it smooth across browsers.
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
	const stroke = 7;
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;

	const arcRef = useRef<SVGCircleElement>(null);
	const labelRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const totalMs = Math.max(1, totalSeconds * 1000);
		let raf = 0;
		const tick = () => {
			const remaining = Math.max(0, targetEpochMs - Date.now());
			const fraction = Math.min(1, remaining / totalMs);
			const urgent = remaining > 0 && remaining < 5000;
			const arc = arcRef.current;
			if (arc) {
				arc.style.strokeDasharray = `${circumference * fraction} ${circumference}`;
				arc.style.stroke = urgent ? RED : MINT;
			}
			const label = labelRef.current;
			if (label) {
				label.textContent = formatClock(remaining);
				label.style.color = urgent ? RED : "#ffffff";
			}
			if (remaining > 0) {
				raf = requestAnimationFrame(tick);
			}
		};
		tick(); // paint the correct state immediately, then animate frame-by-frame
		return () => cancelAnimationFrame(raf);
	}, [targetEpochMs, totalSeconds, circumference]);

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
					ref={arcRef}
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={MINT}
					strokeWidth={stroke}
					strokeLinecap="round"
					strokeDasharray={`${circumference} ${circumference}`}
				/>
			</svg>
			<div className="absolute inset-0 flex items-center justify-center">
				<span
					ref={labelRef}
					className="font-mono text-xl font-bold tabular-nums text-white"
				/>
			</div>
		</div>
	);
}
