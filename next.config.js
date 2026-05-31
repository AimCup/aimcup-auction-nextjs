/** @type {import('next').NextConfig} */
const nextConfig = {
	// Emit a self-contained server bundle (.next/standalone) for a small production Docker image.
	output: "standalone",
	reactStrictMode: false,
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "**" },
			{ protocol: "http", hostname: "**" },
		],
	},
	env: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
	},
};

module.exports = nextConfig;
