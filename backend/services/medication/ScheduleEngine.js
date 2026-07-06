class ScheduleEngine {
  /**
   * Converts a local date string and time slot in a specific timezone to a UTC Date object
   */
  localToUTC(year, month, day, timeSlot, timezone) {
    const localIso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${timeSlot}:00`;
    const dateUTC = new Date(`${localIso}Z`);

    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const localStr = formatter.format(dateUTC);
      const match = localStr.match(/^(\d{2})\/(\d{2})\/(\d{4}),\s(\d{2}):(\d{2}):(\d{2})$/);
      if (match) {
        const [_, m, d, y, hh, mm, ss] = match;
        const dateBack = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss)));
        const offsetMs = dateBack.getTime() - dateUTC.getTime();
        return new Date(dateUTC.getTime() - offsetMs);
      }
    } catch (err) {
      console.warn(`[ScheduleEngine] Failed localToUTC conversion for ${localIso} in ${timezone}`, err);
    }
    return new Date(`${localIso}Z`); // Fallback if timezone not supported
  }

  /**
   * Get all expected occurrences (UTC Dates) for a medication in a date range window.
   */
  getNextOccurrences(medication, startWindow, endWindow, timezone = 'UTC') {
    const occurrences = [];
    if (!medication.active) return occurrences;

    const startDate = new Date(medication.startDate);
    const endDate = medication.endDate ? new Date(medication.endDate) : null;

    // Iterate day by day in local time of patient
    const currentDay = new Date(startWindow);
    currentDay.setHours(0, 0, 0, 0);

    const endLimit = new Date(endWindow);

    while (currentDay <= endLimit) {
      // Get year, month, day in target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      const parts = formatter.format(currentDay).split('/');
      const month = Number(parts[0]);
      const day = Number(parts[1]);
      const year = Number(parts[2]);

      const currentDayLocal = new Date(year, month - 1, day);

      // Check bounds
      if (currentDayLocal < new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) {
        currentDay.setDate(currentDay.getDate() + 1);
        continue;
      }
      if (endDate && currentDayLocal > new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())) {
        break;
      }

      // Check Frequency rules
      let match = false;
      const dayOfWeek = currentDay.getDay(); // 0 is Sunday, 6 is Saturday

      const freqLower = (medication.frequency || 'daily').toLowerCase();

      if (freqLower === 'daily' || freqLower === 'once daily' || freqLower === 'twice daily' || freqLower === 'thrice daily') {
        match = true;
      } else if (freqLower === 'weekly') {
        // Match day of week of startDate
        if (dayOfWeek === startDate.getDay()) {
          match = true;
        }
      } else if (freqLower === 'weekdays') {
        // Monday (1) to Friday (5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          match = true;
        }
      } else if (freqLower === 'as needed' || freqLower === 'as-needed') {
        // As-needed has no deterministic scheduled instances
        match = false;
      }

      if (match) {
        const times = medication.times && medication.times.length > 0 ? medication.times : ['08:00'];
        times.forEach(timeStr => {
          const utcDate = this.localToUTC(year, month, day, timeStr, timezone);
          if (utcDate >= startWindow && utcDate <= endWindow) {
            occurrences.push({
              expectedTime: utcDate,
              localTime: timeStr
            });
          }
        });
      }

      currentDay.setDate(currentDay.getDate() + 1);
    }

    return occurrences;
  }
}

module.exports = new ScheduleEngine();
