// import type { Config } from "tailwindcss";

// export default {
//     darkMode: ["class"],
//     content: [
//     "./pages/**/*.{js,ts,jsx,tsx,mdx}",
//     "./components/**/*.{js,ts,jsx,tsx,mdx}",
//     "./app/**/*.{js,ts,jsx,tsx,mdx}",
//   ],
//   theme: {
//   	extend: {
//   		colors: {
//   			background: 'hsl(var(--background))',
//   			foreground: 'hsl(var(--foreground))',
//   			card: {
//   				DEFAULT: 'hsl(var(--card))',
//   				foreground: 'hsl(var(--card-foreground))'
//   			},
//   			popover: {
//   				DEFAULT: 'hsl(var(--popover))',
//   				foreground: 'hsl(var(--popover-foreground))'
//   			},
//   			primary: {
//   				DEFAULT: 'hsl(var(--primary))',
//   				foreground: 'hsl(var(--primary-foreground))'
//   			},
//   			secondary: {
//   				DEFAULT: 'hsl(var(--secondary))',
//   				foreground: 'hsl(var(--secondary-foreground))'
//   			},
//   			muted: {
//   				DEFAULT: 'hsl(var(--muted))',
//   				foreground: 'hsl(var(--muted-foreground))'
//   			},
//   			accent: {
//   				DEFAULT: 'hsl(var(--accent))',
//   				foreground: 'hsl(var(--accent-foreground))'
//   			},
//   			destructive: {
//   				DEFAULT: 'hsl(var(--destructive))',
//   				foreground: 'hsl(var(--destructive-foreground))'
//   			},
//   			border: 'hsl(var(--border))',
//   			input: 'hsl(var(--input))',
//   			ring: 'hsl(var(--ring))',
//   			chart: {
//   				'1': 'hsl(var(--chart-1))',
//   				'2': 'hsl(var(--chart-2))',
//   				'3': 'hsl(var(--chart-3))',
//   				'4': 'hsl(var(--chart-4))',
//   				'5': 'hsl(var(--chart-5))'
//   			}
//   		},
//   		borderRadius: {
//   			lg: 'var(--radius)',
//   			md: 'calc(var(--radius) - 2px)',
//   			sm: 'calc(var(--radius) - 4px)'
//   		}
//   	}
//   },
//   plugins: [],
// } satisfies Config;

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
	  "./pages/**/*.{js,ts,jsx,tsx,mdx}",
	  "./components/**/*.{js,ts,jsx,tsx,mdx}",
	  "./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	// If you want dark mode toggling, set: darkMode: ["class"],
	theme: {
	  extend: {
		colors: {
		  // Main page background (light)
		  iconHover: {
			DEFAULT: "#0F6B78",
		  },
		  primary: {
			DEFAULT: "#75BDC4",
			foreground: "#FFFFFF",
		  },
		  background: "#FAFAFA",
		  // Primary text color on light backgrounds
		  foreground: "#1A1A1A",
		  // Sidebar background (dark teal or any brand color)
		  sidebar: "#03363D",
		  // Sidebar text color (usually white or near-white)
		  "sidebar-foreground": "#FFFFFF",
		  // Accent color (e.g., pink button in the screenshot)
		  accent: "#75BDC4",
		  //accent: "#FF4081",
		  // Neutral greys for borders, charts, etc.
		  muted: "#EFEFEF",
		  success: {
			DEFAULT: "#10B981",
			foreground: "#FFFFFF",
		  },
		  warning: {
			DEFAULT: "#F59E0B",
			foreground: "#FFFFFF",
		  },
		  error: {
			DEFAULT: "#EF4444",
			foreground: "#FFFFFF",
		  },
		  // ...
		},
		fontFamily: {
		  sans: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
		},
	  },
	},
	plugins: [],
  }
  