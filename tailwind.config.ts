import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        mist: "#f4f7f2",
        moss: "#45624d",
        coral: "#e4685d",
        lemon: "#f3cf5a"
      }
    }
  },
  plugins: []
};

export default config;
