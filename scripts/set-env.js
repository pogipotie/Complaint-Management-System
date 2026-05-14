const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const targetPath = './src/environments/environment.ts';
const envConfigFile = `export const environment = {
  production: false,
  supabaseUrl: '${process.env.SUPABASE_URL || ''}',
  supabaseKey: '${process.env.SUPABASE_ANON_KEY || ''}',
  googleMapsApiKey: '${process.env.GOOGLE_MAPS_API_KEY || ''}'
};
`;

fs.mkdirSync('./src/environments', { recursive: true });
fs.writeFileSync(targetPath, envConfigFile, 'utf8');
console.log('Environment configured.');
