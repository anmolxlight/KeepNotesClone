/**
 * Test All API Services
 * 
 * Run this script to test all your API keys:
 * node scripts/test-all-services.js
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testGemini() {
  console.log('\n🤖 Testing Gemini AI...');
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('❌ Gemini API key not set');
    return false;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say "Hello from Gemini!"' }] }],
          generationConfig: { maxOutputTokens: 50 }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('✅ Gemini AI working!');
      console.log('📝 Response:', text);
      return true;
    } else {
      console.log('❌ Gemini API error:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Gemini connection error:', error.message);
    return false;
  }
}

async function testDeepgram() {
  console.log('\n🎙️  Testing Deepgram...');
  const apiKey = process.env.DEEPGRAM_API_KEY;
  
  if (!apiKey || apiKey === 'your_deepgram_api_key_here') {
    console.log('❌ Deepgram API key not set');
    return false;
  }

  try {
    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true',
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

    if (response.ok) {
      const data = await response.json();
      const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      console.log('✅ Deepgram working!');
      console.log('📝 Transcription:', transcript?.substring(0, 50) + '...');
      return true;
    } else {
      console.log('❌ Deepgram API error:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Deepgram connection error:', error.message);
    return false;
  }
}

async function testPinecone() {
  console.log('\n🔍 Testing Pinecone...');
  const apiKey = process.env.PINECONE_API_KEY;
  const environment = process.env.PINECONE_ENVIRONMENT || 'us-east1-aws';
  const indexName = process.env.PINECONE_INDEX_NAME || 'noted';
  
  if (!apiKey || apiKey === 'your_pinecone_api_key_here') {
    console.log('❌ Pinecone API key not set');
    return false;
  }

  console.log('🔄 Testing Pinecone API connection...');
  
  try {
    // First, try to list indexes using the control plane API
    const listResponse = await fetch(
      'https://api.pinecone.io/indexes',
      {
        method: 'GET',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
        }
      }
    );

    if (listResponse.ok) {
      const data = await listResponse.json();
      console.log('✅ Pinecone API connection successful!');
      console.log('📊 Available indexes:', data.indexes?.length || 0);
      
      if (data.indexes && data.indexes.length > 0) {
        console.log('📝 Index names:', data.indexes.map(idx => idx.name).join(', '));
        
        // Try to find our target index
        const targetIndex = data.indexes.find(idx => idx.name === indexName);
        if (targetIndex) {
          console.log(`✅ Found target index "${indexName}"`);
          console.log('🔗 Index host:', targetIndex.host);
          return true;
        } else {
          console.log(`⚠️  Target index "${indexName}" not found`);
          console.log('💡 Available indexes:', data.indexes.map(idx => idx.name).join(', '));
          console.log('📝 To fix: Create an index named "noted" or update PINECONE_INDEX_NAME in .env');
          return false;
        }
      } else {
        console.log('⚠️  No indexes found in your Pinecone project');
        console.log('📝 To fix: Create an index in your Pinecone dashboard');
        console.log('🔗 Visit: https://app.pinecone.io/');
        return false;
      }
    } else {
      const errorText = await listResponse.text().catch(() => 'Unknown error');
      console.log('❌ Pinecone API error:', listResponse.status, listResponse.statusText);
      console.log('💡 Error details:', errorText);
      
      if (listResponse.status === 401) {
        console.log('🔑 This is an authentication error. Check your API key.');
      } else if (listResponse.status === 403) {
        console.log('🚫 This is a permission error. Check your API key permissions.');
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Pinecone connection error:', error.message);
    console.log('💡 This might be a network issue or API key problem');
    return false;
  }
}

async function main() {
  console.log('🔧 Testing All API Services...');
  console.log('================================');

  const results = {
    gemini: await testGemini(),
    deepgram: await testDeepgram(),
    pinecone: await testPinecone()
  };

  console.log('\n📊 Summary:');
  console.log('============');
  console.log(`🤖 Gemini AI:  ${results.gemini ? '✅ Working' : '❌ Failed'}`);
  console.log(`🎙️  Deepgram:   ${results.deepgram ? '✅ Working' : '❌ Failed'}`);
  console.log(`🔍 Pinecone:   ${results.pinecone ? '✅ Working' : '❌ Failed'}`);

  const workingCount = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 ${workingCount}/3 services working correctly`);

  if (workingCount === 3) {
    console.log('🎉 All services are ready! Your app should work perfectly.');
  } else {
    console.log('\n📝 Next steps:');
    if (!results.gemini) console.log('   • Get Gemini API key: https://makersuite.google.com/app/apikey');
    if (!results.deepgram) console.log('   • Get Deepgram API key: https://console.deepgram.com/ (free $200 credit)');
    if (!results.pinecone) console.log('   • Check Pinecone index setup: https://app.pinecone.io/');
    console.log('   • Update .env file with working API keys');
    console.log('   • Restart your Expo server: npx expo start --clear');
  }
}

main().catch(console.error); 