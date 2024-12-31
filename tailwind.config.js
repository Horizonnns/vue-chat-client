/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				gray: {
					10: '#828282',
					20: '#1b1b1b',
				},
				blue: {
					10: '#4d8ff1',
				},
			},
		},
	},
	plugins: [],
};
