"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiLogOut } from "react-icons/fi";
import { Avatar } from "@/components/Avatar";
import { clearToken, loginUrl } from "@/lib/auth";
import { useAuth } from "@/lib/useAuth";

export function NavBar() {
	const { user, ready } = useAuth();
	const pathname = usePathname();

	// The stream overlay is a standalone full-screen surface for OBS — never show the nav there.
	if (pathname?.endsWith("/overlay")) {
		return null;
	}

	return (
		<header className="sticky top-0 z-50 border-b border-white/5 bg-deepCharcoal/80 backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5">
				<Link href="/" className="flex items-center gap-2">
					<span className="grid h-9 w-9 place-items-center rounded-lg bg-deepRed font-black text-white">
						A
					</span>
					<span className="text-lg font-bold tracking-tight">
						aimcup <span className="text-gradient font-black">auctions</span>
					</span>
				</Link>

				<nav className="flex items-center gap-4">
					{ready && user ? (
						<>
							<Link
								href="/dashboard"
								className="hidden text-sm text-white/70 transition hover:text-white sm:block"
							>
								My auctions
							</Link>
							<div className="flex items-center gap-2 rounded-full border border-white/10 bg-tuned/60 py-1 pl-1 pr-3">
								<Avatar osuId={user.osuId} src={user.avatarUrl} size={28} />
								<span className="text-sm font-medium">{user.username}</span>
								{user.admin && (
									<span className="rounded bg-deepRed/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-deepRed">
										admin
									</span>
								)}
							</div>
							<button
								onClick={() => clearToken()}
								title="Sign out"
								className="rounded-lg p-2 text-white/50 transition hover:bg-white/5 hover:text-white"
							>
								<FiLogOut size={18} />
							</button>
						</>
					) : (
						<a
							href={loginUrl(pathname || "/")}
							className="rounded-lg bg-deepRed px-4 py-2 text-sm font-semibold text-white transition hover:bg-deepRed/85"
						>
							Sign in with osu!
						</a>
					)}
				</nav>
			</div>
		</header>
	);
}
