const fs = require('fs');
const path = require('path');

console.log('Applying Light Mode fixes...');

<html lang='en'>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no' />
    <title>CLIPBOARD MAX</title>
    <script src='https://cdn.tailwindcss.com'></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              gold: '#D4AF37',
              midnight: '#000000',
              'gold-dim': '#B4941F',
            },
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
              mono: ['Fira Code', 'monospace'],
              blanka: ['Blanka', 'sans-serif'],
            },
            animation: {
              'fade-in': 'fadeIn 0.4s ease-out',
              'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
              'fade-in-down': 'fadeInDown 0.4s ease-out forwards',
              'scale-in': 'scaleIn 0.3s ease-out forwards',
              'slide-in-right': 'slideInRight 0.3s ease-out forwards',
              'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
              'pulse-slow': 'pulse 3s infinite',
              'bounce-subtle': 'bounceSubtle 2s infinite',
            },
            keyframes: {
              fadeIn: { '0