/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ugmonk inspired palette
        base: {
          50: '#fafaf2',   // オフホワイト（背景）
          100: '#f5f5e8',
          900: '#1a1a1a',  // ダークグレー（テキスト）
        },
        accent: {
          DEFAULT: '#ffd879', // イエローアクセント
          hover: '#ffcc4d',
        },
      },
      spacing: {
        // 余白を豊富に
        'section': '2.4rem',
        'section-lg': '4rem',
      },
      fontFamily: {
        // 日本語対応フォント
        sans: ['Inter', 'Noto Sans JP', 'sans-serif'],
        serif: ['Playfair Display', 'Noto Serif JP', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
