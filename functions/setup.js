const readline = require('readline');
const { exec } = require('child_process');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setupFirebase() {
  console.log('\n=== Firebase Configuration Setup ===\n');
  
  // Get email configuration
  const emailUser = await question('Enter Gmail address for sending notifications: ');
  const emailPassword = await question('Enter Gmail app-specific password (create one at https://myaccount.google.com/apppasswords): ');
  const websiteUrl = await question('Enter your website URL (e.g., https://yourdomain.com): ');
  
  console.log('\nSetting up Firebase configuration...');
  
  // Set Firebase config values
  const commands = [
    `firebase functions:config:set email.user="${emailUser}"`,
    `firebase functions:config:set email.password="${emailPassword}"`,
    `firebase functions:config:set website.url="${websiteUrl}"`
  ];
  
  for (const cmd of commands) {
    try {
      await new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });
    } catch (error) {
      console.error(`Error executing command: ${cmd}`);
      console.error(error);
      process.exit(1);
    }
  }
  
  console.log('\nFirebase configuration has been set up successfully!');
  
  // Create .env file
  const envContent = `
EMAIL_USER=${emailUser}
EMAIL_PASSWORD=${emailPassword}
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
WEBSITE_URL=${websiteUrl}
  `.trim();
  
  fs.writeFileSync('.env', envContent);
  console.log('\nCreated .env file for local development');
  
  console.log('\n=== Next Steps ===');
  console.log('1. Make sure you have initialized Firebase in your project:');
  console.log('   firebase init');
  console.log('\n2. Deploy your functions:');
  console.log('   cd functions');
  console.log('   npm install');
  console.log('   npm run deploy');
  
  rl.close();
}

setupFirebase().catch(console.error);