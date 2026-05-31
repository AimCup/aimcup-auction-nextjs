/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				// Matches /ac/aimcup-frontend
				deepCharcoal: "#151120",
				deepRed: "#CA191B",
				flatRed: "rgb(239 55 57)",
				mintGreen: "#00CC99",
				tuned: "#241e38",
				tunedLight: "#2e2747",
				primary: {
					light: "#FFFFFF",
					DEFAULT: "#f5f5f5",
					dark: "#151120",
				},
			},
			keyframes: {
				"fade-in": {
					"0%": { opacity: "0", transform: "translateY(6px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				"pulse-ring": {
					"0%": { boxShadow: "0 0 0 0 rgba(0,204,153,0.5)" },
					"70%": { boxShadow: "0 0 0 10px rgba(0,204,153,0)" },
					"100%": { boxShadow: "0 0 0 0 rgba(0,204,153,0)" },
				},
			},
			animation: {
				"fade-in": "fade-in 0.35s ease-out",
				"pulse-ring": "pulse-ring 1.8s infinite",
			},
		},
	},
	plugins: [require("daisyui")],
	daisyui: {
		themes: [
			{
				aimcup: {
					primary: "#CA191B",
					secondary: "#00CC99",
					accent: "#00CC99",
					neutral: "#241e38",
					"base-100": "#151120",
					"base-200": "#1c172b",
					"base-300": "#241e38",
					info: "#3abff8",
					success: "#00CC99",
					warning: "#fbbd23",
					error: "#CA191B",
				},
			},
		],
	},
};
