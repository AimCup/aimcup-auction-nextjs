import type { Metadata } from "next";
import { ReactNode } from "react";
import { ApolloWrapper } from "@/components/ApolloWrapper";
import { NavBar } from "@/components/NavBar";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
	title: "aimcup auctions",
	description: "Live player auctions for aimcup tournaments",
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
