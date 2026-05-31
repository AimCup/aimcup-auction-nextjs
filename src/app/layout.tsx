import type { Metadata } from "next";
import { ReactNode } from "react";
import { ApolloWrapper } from "@/components/ApolloWrapper";
import { NavBar } from "@/components/NavBar";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const SITE_URL = "https://auction.aimcup.xyz";
const DESCRIPTION =
	"Live player auctions for aimcup tournaments — captains bid in real time from the web or Discord to build their teams.";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: "AimCup Auctions",
		template: "%s · AimCup Auctions",
	},
	description: DESCRIPTION,
	applicationName: "AimCup Auctions",
	keywords: [
		"osu!",
		"aimcup",
		"auction",
		"tournament",
		"draft",
		"captains",
		"players",
	],
	icons: { icon: "/aim_logo.svg" },
	openGraph: {
		type: "website",
		siteName: "AimCup Auctions",
		title: "AimCup Auctions",
		description: DESCRIPTION,
		url: SITE_URL,
		locale: "en_US",
	},
	twitter: {
		card: "summary_large_image",
		title: "AimCup Auctions",
		description: DESCRIPTION,
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" data-theme="aimcup">
			<body className="min-h-screen bg-deepCharcoal text-primary-light">
				<ApolloWrapper>
					<ToastProvider>
						<NavBar />
						<main>{children}</main>
					</ToastProvider>
				</ApolloWrapper>
			</body>
		</html>
	);
}
