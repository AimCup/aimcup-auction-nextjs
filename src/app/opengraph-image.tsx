import { ImageResponse } from "next/og";

// Branded 1200x630 social preview, generated at build time. Shown when the link is shared
// (Discord, Slack, Telegram, X, etc.). Dark brand background + AimCup logo + wordmark.
export const alt = "AimCup Auctions — live player auctions for tournaments";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LOGO_SVG =
	'<svg width="254" height="218" viewBox="0 0 254 218" fill="none" xmlns="http://www.w3.org/2000/svg">' +
	'<path d="M127 0L0 218H57.8459L127 99.2945L196.154 218H254L127 0Z" fill="white"/>' +
	'<path d="M92.4229 218H161.577L127 158.647L92.4229 218Z" fill="#CA191B"/></svg>';
const LOGO = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString("base64")}`;

export default function OpengraphImage() {
	return new ImageResponse(
		(
			<div
				style={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#151120",
					gap: 30,
				}}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={LOGO} width={150} height={129} alt="" />
				<div
					style={{
						display: "flex",
						fontSize: 88,
						fontWeight: 800,
						letterSpacing: -2,
					}}
				>
					<span style={{ color: "#ffffff" }}>AimCup</span>
					<span style={{ color: "#CA191B" }}>&nbsp;AUCTIONS</span>
				</div>
				<div
					style={{
						display: "flex",
						fontSize: 32,
						color: "rgba(255,255,255,0.62)",
					}}
				>
					Live player auctions for tournaments
				</div>
			</div>
		),
		{ ...size },
	);
}
