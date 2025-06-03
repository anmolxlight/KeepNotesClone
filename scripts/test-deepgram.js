/**
 * Test Deepgram API Connection
 * 
 * Run this script to test your Deepgram API key:
 * node scripts/test-deepgram.js
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testDeepgram() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  
  console.log('🔍 Checking Deepgram configuration...');
  console.log('API Key:', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET');
  
  if (!apiKey || apiKey === 'your_deepgram_api_key_here') {
    console.log('❌ Deepgram API key not set in .env file');
    console.log('📝 Get your free API key at: https://console.deepgram.com/');
    console.log('💰 Free $200 credit available');
    return;
  }

  console.log('🔄 Testing Deepgram API connection...');
  
  try {
    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&punctuate=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav'
        })
      }
    );

    console.log('📡 Response status:', response.status, response.statusText);

    if (response.ok) {
      const result = await response.json();
      const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      
      console.log('✅ Deepgram API connection successful!');
      console.log('📝 Test transcription:', transcript);
      console.log('🎉 Voice transcription is ready to use in your app');
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.log('❌ Deepgram API error:', response.status, response.statusText);
      console.log('💡 Error details:', errorText);
      
      if (response.status === 401) {
        console.log('🔑 This is an authentication error. Check your API key.');
      } else if (response.status === 404) {
        console.log('🔍 This is a "not found" error. The endpoint might be wrong.');
      }
    }
  } catch (error) {
    console.log('❌ Network error testing Deepgram:', error.message);
  }
}

// Check if we have dotenv
try {
  require('dotenv');
} catch (e) {
  console.log('Installing dotenv for testing...');
  console.log('Run: npm install dotenv');
  process.exit(1);
}

testDeepgram(); 