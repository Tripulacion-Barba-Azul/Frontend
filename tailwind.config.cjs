/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    cursor: {
      auto: 'url("/Cursors/normal.png"), auto',
      default: 'url("/Cursors/normal.png"), auto',
      pointer: 'url("/Cursors/pointer.png"), pointer',
      wait: 'url("/Cursors/normal.png"), wait',
      text: 'url("/Cursors/normal.png"), text',
      move: 'url("/Cursors/normal.png"), move',
      'not-allowed': 'url("/Cursors/normal.png"), not-allowed',
      grab: 'url("/Cursors/pointer.png"), grab',
      grabbing: 'url("/Cursors/pointer.png"), grabbing',
    },
  },
}