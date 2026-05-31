"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { setToken } from "@/lib/auth";

export default function AuthCallbackPage() {
	const router = useRouter();
	const [message, setMessage] = useState("Signing you in…");

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const token = params.get("token");
		const redirect = params.get("redirect") || "/";
		const error = params.get("error");

		if (error) {
			setMessage(error);
			const timer = setTimeout(() => router.replace("/"), 2000);
			return () => clearTimeout(timer);
		}
		if (token) {
			setToken(token);
			setMessage("Welcome! Redirecting…");
			const safeRedirect = redirect.startsWith("/") ? redirect : "/";
			const timer = setTimeout(() => router.replace(safeRedirect), 300);
			return () => clearTimeout(timer);
		}
		setMessage("Missing token. Redirecting…");
		const timer = setTimeout(() => router.replace("/"), 1500);
		return () => clearTimeout(timer);
	}, [router]);

	return (
		<div className="grid min-h-[70vh] place-items-center">
			<div className="flex flex-col items-center gap-4">
				<span className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-mintGreen" />
				<p className="text-white/70">{message}</p>
			</div>
		</div>
	);
}
