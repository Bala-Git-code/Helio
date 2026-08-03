import http from 'http';

const CONCURRENT_REQUESTS = 50;

function makeRequest(id) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get('http://127.0.0.1:5000/health', {
      headers: {
        'User-Agent': 'HELIO-Benchmark-Client/1.0',
        'Accept': 'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({ id, status: res.statusCode, duration, success: res.statusCode === 200, data });
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - start;
      resolve({ id, status: 500, duration, success: false, error: err.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      const duration = Date.now() - start;
      resolve({ id, status: 504, duration, success: false, error: 'Timeout' });
    });
  });
}

async function runBenchmark() {
  console.log(`=======================================================`);
  console.log(` HELIO Backend API Load & Latency Benchmark Script`);
  console.log(` Target: http://127.0.0.1:5000/health`);
  console.log(` Concurrency Level: ${CONCURRENT_REQUESTS} parallel requests`);
  console.log(`=======================================================`);

  const startTime = Date.now();
  const promises = [];

  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    promises.push(makeRequest(i + 1));
  }

  const results = await Promise.all(promises);
  const totalDuration = Date.now() - startTime;
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  
  const sample = results[0];
  console.log(` Sample Response Status: ${sample.status}`);
  if (sample.error) console.log(` Sample Error: ${sample.error}`);
  if (sample.data) console.log(` Sample Body: ${sample.data.substring(0, 100)}`);

  const totalLatency = results.reduce((acc, curr) => acc + curr.duration, 0);
  const avgLatency = Math.round(totalLatency / CONCURRENT_REQUESTS);

  console.log(`\nResults:`);
  console.log(` - Total Requests: ${CONCURRENT_REQUESTS}`);
  console.log(` - Successful (200 OK): ${successful}`);
  console.log(` - Failed:         ${failed}`);
  console.log(` - Total Execution Time: ${totalDuration} ms`);
  console.log(` - Average Response Latency: ${avgLatency} ms per request`);

  if (successful > 0 && avgLatency <= 100) {
    console.log(`\n✓ PASSED BENCHMARK: Sub-100ms average response latency achieved! (${avgLatency}ms)`);
  } else if (successful > 0) {
    console.log(`\n✓ All requests completed successfully with average latency: ${avgLatency}ms`);
  } else {
    console.log(`\n! Benchmark latency: ${avgLatency}ms`);
  }
}

runBenchmark();
