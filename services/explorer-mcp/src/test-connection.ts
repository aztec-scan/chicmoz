// test-connection.ts
import axios from 'axios';
import { exec } from 'child_process';
import * as dns from 'dns';
import * as http from 'http';
import * as https from 'https';

const url = "http://api.sandbox.chicmoz.localhost/v1/dev-api-key/l2/latest-height";
const hostname = "api.sandbox.chicmoz.localhost";

// 1. Test DNS resolution
console.log("\n--- DNS Resolution Test ---");
dns.lookup(hostname, (err, address, family) => {
  console.log(`DNS lookup for ${hostname}:`);
  if (err) {
    console.error(`  Failed: ${err.message}`);
  } else {
    console.log(`  IP: ${address}, IP version: IPv${family}`);
  }

  // Continue with tests regardless of DNS result
  runPingTest();
});

// 2. Ping test
function runPingTest() {
  console.log("\n--- Ping Test ---");
  exec(`ping -c 1 ${hostname}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`  Ping failed: ${error.message}`);
    } else if (stderr) {
      console.log(`  Ping stderr: ${stderr}`);
    } else {
      console.log(`  Ping successful: ${stdout.split('\n')[1]}`);
    }

    // Continue with next test
    runCurlTest();
  });
}

// 3. Curl test
function runCurlTest() {
  console.log("\n--- cURL Test ---");
  exec(`curl -v "${url}"`, (error, stdout, stderr) => {
    console.log("  cURL output:");
    if (error) {
      console.log(`  Error: ${error.message}`);
    }
    if (stderr) {
      console.log(`  Stderr: ${stderr}`);
    }
    console.log(`  Stdout: ${stdout}`);

    // Continue with next test
    runHttpTest();
  });
}

// 4. Node.js http/https module test
function runHttpTest() {
  console.log("\n--- Node.js http module Test ---");
  const requestModule = url.startsWith('https') ? https : http;

  const req = requestModule.get(url, (res) => {
    console.log(`  Status code: ${res.statusCode}`);
    console.log(`  Headers: ${JSON.stringify(res.headers, null, 2)}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`  Response body: ${data}`);
      runAxiosTest();
    });
  });

  req.on('error', (e) => {
    console.log(`  HTTP request error: ${e.message}`);
    runAxiosTest();
  });

  req.end();
}

// 5. Axios test with timeout
function runAxiosTest() {
  console.log("\n--- Axios Test ---");

  // Create axios instance with debugging options
  const axiosInstance = axios.create({
    timeout: 5000, // 5 second timeout
    validateStatus: function (status) {
      return true; // Accept all status codes for debugging
    },
  });

  // Add request interceptor for logging
  axiosInstance.interceptors.request.use(
    (config) => {
      console.log(`  Axios request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`  Headers: ${JSON.stringify(config.headers, null, 2)}`);
      return config;
    },
    (error) => {
      console.log(`  Axios request error: ${error.message}`);
      return Promise.reject(error);
    }
  );

  // Make the request
  axiosInstance.get(url)
    .then(response => {
      console.log(`  Axios status: ${response.status}`);
      console.log(`  Axios response: ${JSON.stringify(response.data, null, 2)}`);
    })
    .catch(error => {
      console.log(`  Axios error: ${error.message}`);
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
        console.log(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
      } else if (error.request) {
        console.log(`  No response received. Request: ${error.request}`);
      }
    })
    .finally(() => {
      console.log("\n--- All tests completed ---");
    });
}
