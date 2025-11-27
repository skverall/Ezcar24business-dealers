const fs = require('fs');
const path = require('path');

// Create a simple PNG generator using Canvas
const { createCanvas, loadImage } = require('canvas');

async function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  
  // Draw background with rounded corners
  const radius = size * 0.176; // iOS app icon corner radius
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();
  
  // Draw car silhouette
  const carScale = size / 1024;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.moveTo(200 * carScale, 600 * carScale);
  ctx.lineTo(200 * carScale, 550 * carScale);
  ctx.quadraticCurveTo(200 * carScale, 520 * carScale, 230 * carScale, 520 * carScale);
  ctx.lineTo(350 * carScale, 520 * carScale);
  ctx.quadraticCurveTo(380 * carScale, 500 * carScale, 420 * carScale, 500 * carScale);
  ctx.lineTo(604 * carScale, 500 * carScale);
  ctx.quadraticCurveTo(644 * carScale, 500 * carScale, 674 * carScale, 520 * carScale);
  ctx.lineTo(794 * carScale, 520 * carScale);
  ctx.quadraticCurveTo(824 * carScale, 520 * carScale, 824 * carScale, 550 * carScale);
  ctx.lineTo(824 * carScale, 600 * carScale);
  ctx.closePath();
  ctx.fill();
  
  // Draw wheels
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(264 * carScale, 620 * carScale, 30 * carScale, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(760 * carScale, 620 * carScale, 30 * carScale, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw wheel centers
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(264 * carScale, 620 * carScale, 15 * carScale, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(760 * carScale, 620 * carScale, 15 * carScale, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${80 * carScale}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('EzCar24', size / 2, 450 * carScale);
  
  ctx.font = `${40 * carScale}px Arial`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('UAE Cars', size / 2, 750 * carScale);
  
  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated icon: ${outputPath} (${size}x${size})`);
}

async function generateSplashScreen(width, height, outputPath) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Center coordinates
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Scale factor
  const scale = Math.min(width, height) / 2732;
  
  // Draw car silhouette (centered)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  
  ctx.beginPath();
  ctx.moveTo(-200, 100);
  ctx.lineTo(-200, 50);
  ctx.quadraticCurveTo(-200, 20, -170, 20);
  ctx.lineTo(-50, 20);
  ctx.quadraticCurveTo(-20, 0, 20, 0);
  ctx.lineTo(204, 0);
  ctx.quadraticCurveTo(244, 0, 274, 20);
  ctx.lineTo(394, 20);
  ctx.quadraticCurveTo(424, 20, 424, 50);
  ctx.lineTo(424, 100);
  ctx.closePath();
  ctx.fill();
  
  // Draw wheels
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(-136, 120, 25, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(360, 120, 25, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw wheel centers
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(-136, 120, 12, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(360, 120, 12, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${120 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('EzCar24', 0, -50);
  
  ctx.font = `${60 * scale}px Arial`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('UAE Cars Marketplace', 0, 250);
  
  ctx.restore();
  
  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated splash screen: ${outputPath} (${width}x${height})`);
}

async function main() {
  try {
    // Generate app icon
    await generateIcon(1024, 'app-icon-1024.png');
    
    // Generate splash screen
    await generateSplashScreen(2732, 2732, 'splash-screen-2732x2732.png');
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

main();
