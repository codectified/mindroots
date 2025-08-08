/**
 * RadicalPosition Search Test Cases
 * 
 * Run these tests after implementing the /radical-search endpoint
 * to validate all the biradical fix scenarios work correctly.
 */

const API_BASE = 'http://localhost:5001/api'; // Adjust to your backend URL

// Test helper function
async function testRadicalSearch(testName, radicals, searchType, expectedBehavior) {
  const url = `${API_BASE}/radical-search?` + new URLSearchParams({
    radicals: JSON.stringify(radicals),
    searchType,
    L1: 'arabic',
    L2: 'english'
  }).toString();
  
  console.log(`\n🧪 Testing: ${testName}`);
  console.log(`📡 URL: ${url}`);
  console.log(`🔍 Expected: ${expectedBehavior}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success: Found ${data.total} roots`);
      console.log(`📋 Sample results:`, data.roots.slice(0, 3).map(r => r.arabic || r.english));
      return data;
    } else {
      console.error(`❌ Error:`, data);
      return null;
    }
  } catch (error) {
    console.error(`❌ Network Error:`, error.message);
    return null;
  }
}

// Main test suite
async function runAllTests() {
  console.log('🚀 Starting RadicalPosition Search Tests\n');
  console.log('=' * 50);
  
  // Test Case 1: R1=ك, R2=ت, R3=blank → biradicals only
  await testRadicalSearch(
    'Biradical Only (R3 blank)',
    [
      { radical: 'ك', position: 1 },
      { radical: 'ت', position: 2 }
    ],
    'biradical_only',
    'Only 2-radical roots like كت'
  );
  
  // Test Case 2: R1=ك, R2=ت, R3="NoR3" → biradicals only  
  await testRadicalSearch(
    'Biradical Only (R3="NoR3")',
    [
      { radical: 'ك', position: 1 },
      { radical: 'ت', position: 2 }
    ],
    'biradical_only',
    'Only 2-radical roots like كت (explicit NoR3)'
  );
  
  // Test Case 3: R1=ك, R2=ت, R3=ت → biradicals + matching triradicals
  await testRadicalSearch(
    'Biradical + Matching Triradical (R3=R2)',
    [
      { radical: 'ك', position: 1 },
      { radical: 'ت', position: 2 },
      { radical: 'ت', position: 3 }
    ],
    'biradical_and_matching_triradical',
    'Both كت (biradical) AND كتت (if exists)'
  );
  
  // Test Case 4: R1=ك, R2=ت, R3=ب → exact triradical match
  await testRadicalSearch(
    'Exact Triradical Match',
    [
      { radical: 'ك', position: 1 },
      { radical: 'ت', position: 2 },
      { radical: 'ب', position: 3 }
    ],
    'exact_match',
    'Only كتب (exact triradical match)'
  );
  
  // Test Case 5: R1=ك only → all roots starting with ك
  await testRadicalSearch(
    'Partial Match (R1 only)',
    [
      { radical: 'ك', position: 1 }
    ],
    'flexible',
    'All roots starting with ك'
  );
  
  // Test Case 6: Extended roots (4+ radicals)
  await testRadicalSearch(
    'Extended Roots (4+ radicals)',
    [
      { radical: 'ك', position: 1 },
      { radical: 'ت', position: 2 },
      { radical: 'ب', position: 3 }
    ],
    'extended_and_longer',
    'Quadriliteral+ roots starting with كتب'
  );
  
  // Test Case 7: Common biradical ر-د
  await testRadicalSearch(
    'Common Biradical رد',
    [
      { radical: 'ر', position: 1 },
      { radical: 'د', position: 2 }
    ],
    'biradical_only',
    'Only 2-radical roots like رد'
  );
  
  // Test Case 8: R1=ر, R2=د, R3=د → biradicals + matching triradicals
  await testRadicalSearch(
    'رد + رdd Pattern',
    [
      { radical: 'ر', position: 1 },
      { radical: 'د', position: 2 },
      { radical: 'د', position: 3 }
    ],
    'biradical_and_matching_triradical',
    'Both رد (biradical) AND ردد (if exists)'
  );
  
  console.log('\n' + '=' * 50);
  console.log('🏁 Tests completed!');
  console.log('\n📝 Manual verification steps:');
  console.log('1. Check that biradical-only searches return roots with exactly 2 radicals');
  console.log('2. Verify R3=R2 case returns both bi- and tri-radical matches');
  console.log('3. Confirm exact matches return only the specified pattern');
  console.log('4. Test extended search returns 4+ radical roots');
  console.log('5. Validate that partial searches work for incomplete patterns');
}

// Legacy endpoint tests for backward compatibility
async function testLegacyEndpoints() {
  console.log('\n🔄 Testing Legacy Endpoint Compatibility\n');
  
  // Test old /rootbyletters endpoint
  const legacyUrl = `${API_BASE}/rootbyletters?r1=ك&r2=ت&r3=NoR3&L1=arabic&L2=english`;
  console.log(`📡 Testing legacy: ${legacyUrl}`);
  
  try {
    const response = await fetch(legacyUrl);
    const data = await response.json();
    console.log(`✅ Legacy endpoint works: Found ${data.total || data.length} roots`);
  } catch (error) {
    console.error(`❌ Legacy endpoint failed:`, error.message);
  }
}

// Performance test
async function performanceTest() {
  console.log('\n⚡ Performance Test\n');
  
  const start = performance.now();
  
  await testRadicalSearch(
    'Performance - Single Radical',
    [{ radical: 'ك', position: 1 }],
    'flexible',
    'All roots with ك (performance test)'
  );
  
  const end = performance.now();
  console.log(`⏱️ Query took ${Math.round(end - start)}ms`);
}

// Error handling tests
async function errorHandlingTests() {
  console.log('\n🚨 Error Handling Tests\n');
  
  // Test invalid radicals format
  const invalidUrl = `${API_BASE}/radical-search?radicals=invalid&searchType=flexible&L1=arabic`;
  console.log('🧪 Testing invalid radicals format...');
  
  try {
    const response = await fetch(invalidUrl);
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Correctly rejected invalid format');
    } else {
      console.log('❌ Should have rejected invalid format');
    }
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
  }
  
  // Test missing L1 parameter
  const missingL1Url = `${API_BASE}/radical-search?radicals=[{"radical":"ك","position":1}]&searchType=flexible`;
  console.log('🧪 Testing missing L1 parameter...');
  
  try {
    const response = await fetch(missingL1Url);
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Correctly rejected missing L1');
    } else {
      console.log('❌ Should have rejected missing L1');
    }
  } catch (error) {
    console.error('❌ Missing L1 test failed:', error.message);
  }
}

// Run all tests
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runAllTests()
    .then(() => testLegacyEndpoints())
    .then(() => performanceTest())
    .then(() => errorHandlingTests())
    .catch(console.error);
} else {
  // Browser environment
  window.runRadicalSearchTests = runAllTests;
  window.testLegacyEndpoints = testLegacyEndpoints;
  window.performanceTest = performanceTest;
  window.errorHandlingTests = errorHandlingTests;
  
  console.log('💻 Browser environment detected. Run tests with:');
  console.log('runRadicalSearchTests()');
  console.log('testLegacyEndpoints()');
  console.log('performanceTest()');
  console.log('errorHandlingTests()');
}

module.exports = {
  runAllTests,
  testLegacyEndpoints,
  performanceTest,
  errorHandlingTests,
  testRadicalSearch
};