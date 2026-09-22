import { 
  verifyAdminCredentials, 
  createAdminSessionToken, 
  verifyAdminSessionToken 
} from '../src/lib/adminAuth';

async function testAuthSuite() {
  console.log('=== RUNNING ADMIN AUTHENTICATION TEST SUITE ===\n');

  // Test 1: Wrong username
  console.log('1. Testing Wrong Username:');
  const t1 = verifyAdminCredentials('invalid_user', 'dormie_ubu_admin_2026');
  if (t1) throw new Error('Expected invalid_user to fail authentication');
  console.log('   ✅ Passed: Wrong username rejected (401)');

  // Test 2: Wrong password
  console.log('\n2. Testing Wrong Password:');
  const t2 = verifyAdminCredentials('admin-dormie', 'incorrect_password_123');
  if (t2) throw new Error('Expected incorrect password to fail authentication');
  console.log('   ✅ Passed: Wrong password rejected (401)');

  // Test 3: Wrong user + correct pass
  console.log('\n3. Testing Wrong User + Correct Pass:');
  const t3 = verifyAdminCredentials('user_wrong', 'dormie_ubu_admin_2026');
  if (t3) throw new Error('Expected wrong user + correct pass to fail');
  console.log('   ✅ Passed: Wrong user + correct pass rejected (401)');

  // Test 4: Correct user + wrong pass
  console.log('\n4. Testing Correct User + Wrong Pass:');
  const t4 = verifyAdminCredentials('admin-dormie', 'dormie_ubu_admin_wrong');
  if (t4) throw new Error('Expected correct user + wrong pass to fail');
  console.log('   ✅ Passed: Correct user + wrong pass rejected (401)');

  // Test 5: Correct Credentials
  console.log('\n5. Testing Correct Credentials (admin-dormie / dormie_ubu_admin_2026):');
  const t5 = verifyAdminCredentials('admin-dormie', 'dormie_ubu_admin_2026');
  if (!t5) throw new Error('Expected admin-dormie / dormie_ubu_admin_2026 to succeed');
  console.log('   ✅ Passed: Valid credentials authenticated successfully (200)');

  // Test 6: Whitespace resilience
  console.log('\n6. Testing Whitespace resilience:');
  const t6 = verifyAdminCredentials('  admin-dormie  ', '  dormie_ubu_admin_2026  ');
  if (!t6) throw new Error('Expected trimmed credentials to succeed');
  console.log('   ✅ Passed: Whitespace trimmed cleanly');

  // Test 7: Session Token Generation & Verification
  console.log('\n7. Testing HMAC Session Token:');
  const token = createAdminSessionToken('admin-dormie');
  console.log(`   - Generated token: ${token.slice(0, 30)}...`);
  const session = verifyAdminSessionToken(token);
  if (!session || session.username !== 'admin-dormie' || session.role !== 'admin') {
    throw new Error('Expected valid session payload');
  }
  console.log(`   - Verified session: username=${session.username}, role=${session.role}`);
  console.log('   ✅ Passed: HMAC Session Token created and verified correctly');

  // Test 8: Tampered Session Token
  console.log('\n8. Testing Tampered Session Token:');
  const tamperedToken = token.slice(0, -5) + 'xxxxx';
  const tamperedSession = verifyAdminSessionToken(tamperedToken);
  if (tamperedSession) throw new Error('Expected tampered session token to be rejected');
  console.log('   ✅ Passed: Tampered session token rejected');

  console.log('\n🎉 ALL ADMIN AUTHENTICATION TESTS PASSED 100%!\n');
}

testAuthSuite().catch((err) => {
  console.error('❌ Auth test failed:', err);
  process.exit(1);
});
