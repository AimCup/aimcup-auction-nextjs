"use client";

import { useQuery } from "@apollo/client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
	FiExternalLink,
	FiGrid,
	FiPlayCircle,
	FiSettings,
	FiUserPlus,
	FiUsers,
} from "react-icons/fi";
import { StatusBadge } from "@/components/StatusBadge";
import { GET_AUCTION } from "@/lib/graphql";
import { Auction } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";
import { loginUrl } from "@/lib/auth";

const NAV = [
	{ slug: "", label: "Overview", icon: FiGrid },
	{ slug: "players", label: "Players & captains", icon: FiUsers },
	{ slug: "managers", label: "Co-organizers", icon: FiUserPlus },
	{ slug: "settings", label: "Settings & stages", icon: FiSettings },
	{ slug: "control", label: "Control room", icon: FiPlayCircle },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
	const params = useParams();
	const auctionId = params.auctionId as string;
	const pathname = usePathname();
	const { user, ready } = useAuth();

	const { data, loading } = useQuery(GET_AUCTION, {
		variables: { id: auctionId },
	});
	const auction: Auction | undefined = data?.auction;

	const canManage =
		!!user &&
		!!auction &&
		(auction.creatorOsuId === user.osuId ||
			auction.managers.some((m) => m.osuId === user.osuId));

	if (ready && !user) {
		return (
			<div className="grid min-h-[70vh] place-items-center">
				<a
					href={loginUrl(pathname || "/")}
					className="rounded-lg bg-deepRed px-5 py-3 font-semibold"
				>
					Sign in to manage this auction
				</a>
			</div>
		);
	}

	if (!loading && auction && !canManage) {
		return (
			<div className="grid min-h-[70vh] place-items-center text-white/60">
				You are not a manager of this auction.
			</div>
		);
	}

	return (
		<div className="mx-auto flex max-w-[1500px] gap-6 px-5 py-8">
			{/* Sidebar */}
			<aside className="sticky top-24 hidden h-fit w-64 shrink-0 flex-col gap-1 md:flex">
				<div className="mb-3 rounded-xl border border-white/5 bg-tuned/50 p-4">
					<p className="text-[10px] uppercase tracking-widest text-white/40">
						Managing
					</p>
					<p className="mt-1 truncate font-bold">{auction?.name ?? "…"}</p>
					{auction && (
						<div className="mt-2">
							<StatusBadge state={auction.state} />
						</div>
					)}
				</div>
				{NAV.map((item) => {
					const href = `/dashboard/${auctionId}${item.slug ? "/" + item.slug : ""}`;
					const active =
						pathname === href ||
						(item.slug === "" && pathname === `/dashboard/${auctionId}`);
					const Icon = item.icon;
					return (
						<Link
							key={item.slug}
							href={href}
							className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
								active
									? "bg-deepRed/20 font-semibold text-white"
									: "text-white/60 hover:bg-white/5 hover:text-white"
							}`}
						>
							<Icon size={17} />
							{item.label}
						</Link>
					);
				})}
				<Link
					href={`/${auctionId}`}
					target="_blank"
					className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-mintGreen/80 transition hover:bg-mintGreen/10 hover:text-mintGreen"
				>
					<FiExternalLink size={17} />
					Open public page
				</Link>
				<Link
					href={`/${auctionId}/overlay`}
					target="_blank"
					className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-mintGreen/80 transition hover:bg-mintGreen/10 hover:text-mintGreen"
				>
					<FiExternalLink size={17} />
					Open stream overlay
				</Link>
			</aside>

			{/* Mobile nav */}
			<div className="flex-1">
				<div className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
					{NAV.map((item) => {
						const href = `/dashboard/${auctionId}${item.slug ? "/" + item.slug : ""}`;
						const active = pathname === href;
						return (
							<Link
								key={item.slug}
								href={href}
								className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs ${
									active ? "bg-deepRed/20 text-white" : "bg-tuned/50 text-white/60"
								}`}
							>
								{item.label}
							</Link>
						);
					})}
				</div>
				{children}
			</div>
		</div>
	);
}
