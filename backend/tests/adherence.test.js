const assert = require('assert');

// Simulate the adherence calculation logic from healthController
function calculateAdherence(logs, medications) {
  // Filters out "As Needed" medications from calculations to avoid penalization
  const regularMeds = medications.filter(m => m.frequency !== 'As Needed');
  const regularMedsMap = new Map(regularMeds.map(m => [m._id.toString(), m]));

  const relevantLogs = logs.filter(log => regularMedsMap.has(log.medicationId.toString()));
  
  if (relevantLogs.length === 0) return 100; // default perfect score if no logs are present

  const takenCount = relevantLogs.filter(log => 
    log.status === 'Taken On Time' || log.status === 'Taken Late'
  ).length;

  const totalDenominator = relevantLogs.length; // total scheduled instances that were logged/due

  return Math.round((takenCount / totalDenominator) * 100);
}

// Simulate delay calculation from healthController
function calculateDelayMinutes(scheduledSlot, takenDate) {
  const [schedH, schedM] = scheduledSlot.split(':').map(Number);
  const schedDate = new Date(takenDate);
  schedDate.setHours(schedH, schedM, 0, 0);

  const diffMs = takenDate.getTime() - schedDate.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  return diffMins > 0 ? diffMins : 0;
}

// ------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------
function runTests() {
  console.log('--- RUNNING MEDICATION ADHERENCE UNIT TESTS ---');

  // Test Case 1: Adherence Calculation
  const mockMeds = [
    { _id: '1', name: 'Metformin', frequency: 'Twice daily' },
    { _id: '2', name: 'Lisinopril', frequency: 'Once daily' },
    { _id: '3', name: 'Ibuprofen', frequency: 'As Needed' } // Should be excluded
  ];

  const mockLogs = [
    { medicationId: '1', status: 'Taken On Time' },
    { medicationId: '1', status: 'Taken Late' },
    { medicationId: '2', status: 'Skipped' },
    { medicationId: '2', status: 'Missed' },
    { medicationId: '3', status: 'Taken On Time' } // "As Needed" log
  ];

  const score = calculateAdherence(mockLogs, mockMeds);
  console.log(`Test 1: Adherence Score Calculation (Expected: 50, Got: ${score})`);
  assert.strictEqual(score, 50, 'Adherence calculation failed to exclude As Needed or count correct intake statuses');

  // Test Case 2: Delay Calculation
  const scheduled = '08:00';
  const takenAt = new Date();
  takenAt.setHours(8, 45, 0, 0); // 8:45 AM local time
  const delay = calculateDelayMinutes(scheduled, takenAt);
  console.log(`Test 2: Delay calculation (Expected: 45, Got: ${delay})`);
  assert.strictEqual(delay, 45, 'Delay calculations failed to compute correct lateness delta minutes');

  // Test Case 3: Empty logs returns 100%
  const emptyScore = calculateAdherence([], mockMeds);
  console.log(`Test 3: Empty logs adherence (Expected: 100, Got: ${emptyScore})`);
  assert.strictEqual(emptyScore, 100, 'Empty logs should default to perfect score');

  console.log('--- ALL UNIT TESTS PASSED SUCCESSFULLY ---');
}

runTests();
