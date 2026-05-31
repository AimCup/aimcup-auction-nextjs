"use client";

import { useEffect, useState } from "react";
import { currentUser, TokenPayload } from "./auth";

/** Reactive current-user hook; updates on login/logout across tabs. */
export function useAuth(): { user: TokenPayload | null; ready: boolean } {
	const [user, setUser] = useState<TokenPayload | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const refresh = () => {
			setUser(currentUser());
			setReady(true);
		};
		refresh();
		window.addEventListener("auth-change", refresh);
		window.addEventListener("storage", refresh);
		return () => {
			window.removeEventListener("auth-change", refresh);
			window.removeEventListener("storage", refresh);
		};
	}, []);

	return { user, ready };
}
