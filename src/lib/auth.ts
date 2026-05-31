"use client";

const TOKEN_KEY = "auction_token";

export interface TokenPayload {
	osuId: number;
	username: string;
	avatarUrl: string | null;
	admin: boolean;
	exp: number;
}

export function getToken(): string | null {
	if (typeof window === "undefined") return null;
	return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(TOKEN_KEY, token);
	window.dispatchEvent(new Event("auth-change"));
}

export function clearToken() {
	if (typeof window === "undefined") return;
	window.localStorage.removeItem(TOKEN_KEY);
	window.dispatchEvent(new Event("auth-change"));
}

/** Decodes the JWT payload without verifying the signature (display only). */
export function decodeToken(token: string | null): TokenPayload | null {
	if (!token) return null;
	try {
		const payload = token.split(".")[1];
		const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
		const data = JSON.parse(json);
		return {
			osuId: Number(data.sub),
			username: data.username,
			avatarUrl: data.avatarUrl ?? null,
			admin: Boolean(data.admin),
			exp: Number(data.exp),
		};
	} catch {
		return null;
	}
}

export function currentUser(): TokenPayload | null {
	const payload = decodeToken(getToken());
	if (!payload) return null;
	if (payload.exp && payload.exp * 1000 < Date.now()) {
		clearToken();
		return null;
	}
	return payload;
}

export function loginUrl(redirect: string): string {
	const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
	return `${api}/oauth2/authorize/osu?redirect=${encodeURIComponent(redirect)}`;
}
