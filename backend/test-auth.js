#!/usr/bin/env node
/**
 * Test script for authentication endpoints
 * Run with: node test-auth.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Authentication Tests\n');
  console.log('='.repeat(50));

  try {
    // Test 1: Register as Profesor
    console.log('\n1️⃣ Register as Profesor');
    console.log('-'.repeat(50));
    const registerProfesorRes = await makeRequest('POST', '/api/auth/register', {
      email: 'dr.ionescu@university.edu',
      password: 'SecurePass123!',
      role: 'profesor',
      nume: 'Ionescu',
      prenume: 'Gheorghe',
      limitaStudenti: 8,
    });
    console.log(`Status: ${registerProfesorRes.status}`);
    console.log(`Response:`, JSON.stringify(registerProfesorRes.data, null, 2));
    const profesorToken = registerProfesorRes.data.data?.token;

    // Test 2: Register as Student
    console.log('\n2️⃣ Register as Student');
    console.log('-'.repeat(50));
    const registerStudentRes = await makeRequest('POST', '/api/auth/register', {
      email: 'student@university.edu',
      password: 'StudentPass456!',
      role: 'student',
      nume: 'Popa',
      prenume: 'Andrei',
    });
    console.log(`Status: ${registerStudentRes.status}`);
    console.log(`Response:`, JSON.stringify(registerStudentRes.data, null, 2));
    const studentToken = registerStudentRes.data.data?.token;

    // Test 3: Try to register with duplicate email
    console.log('\n3️⃣ Register with Duplicate Email (should fail)');
    console.log('-'.repeat(50));
    const duplicateRes = await makeRequest('POST', '/api/auth/register', {
      email: 'dr.ionescu@university.edu',
      password: 'AnotherPass123!',
      role: 'profesor',
      nume: 'Different',
      prenume: 'Name',
    });
    console.log(`Status: ${duplicateRes.status}`);
    console.log(`Response:`, JSON.stringify(duplicateRes.data, null, 2));

    // Test 4: Login with correct credentials
    console.log('\n4️⃣ Login with Correct Credentials');
    console.log('-'.repeat(50));
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'dr.ionescu@university.edu',
      password: 'SecurePass123!',
    });
    console.log(`Status: ${loginRes.status}`);
    console.log(`Response:`, JSON.stringify(loginRes.data, null, 2));

    // Test 5: Login with wrong password
    console.log('\n5️⃣ Login with Wrong Password (should fail)');
    console.log('-'.repeat(50));
    const wrongPassRes = await makeRequest('POST', '/api/auth/login', {
      email: 'dr.ionescu@university.edu',
      password: 'WrongPassword123!',
    });
    console.log(`Status: ${wrongPassRes.status}`);
    console.log(`Response:`, JSON.stringify(wrongPassRes.data, null, 2));

    // Test 6: Access protected route with token
    console.log('\n6️⃣ Access Protected Route with Valid Token');
    console.log('-'.repeat(50));
    if (profesorToken) {
      const protectedRes = await makeRequest('GET', '/api/me', null);
      protectedRes.options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${profesorToken}`,
        },
      };
      console.log(`⚠️  Note: Test this manually with curl:`);
      console.log(`   curl -H "Authorization: Bearer ${profesorToken.slice(0, 20)}..." http://localhost:3000/api/me`);
    }

    // Test 7: Access protected route without token
    console.log('\n7️⃣ Access Protected Route Without Token (should fail)');
    console.log('-'.repeat(50));
    const noTokenRes = await makeRequest('GET', '/api/me', null);
    console.log(`Status: ${noTokenRes.status}`);
    console.log(`Response:`, JSON.stringify(noTokenRes.data, null, 2));

    console.log('\n' + '='.repeat(50));
    console.log('✅ Tests completed!');
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

// Wait a moment for server to start, then run tests
setTimeout(runTests, 1000);
