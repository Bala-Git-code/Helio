const notificationsAuditLog = [];

/**
 * Log and simulate sending a WhatsApp message
 */
exports.sendMessage = async (toPhone, messageText, type = 'reminder') => {
  const logEntry = {
    to: toPhone,
    message: messageText,
    type,
    sentAt: new Date(),
    status: 'delivered'
  };

  notificationsAuditLog.push(logEntry);
  console.log(`[WhatsApp Service] Simulating WhatsApp Meta API call to ${toPhone}:`);
  console.log(`--------------------------------------------------`);
  console.log(messageText);
  console.log(`--------------------------------------------------`);
  
  return {
    success: true,
    messageId: `wamid.HBgL${Math.random().toString(36).substring(2).toUpperCase()}`,
    status: 'delivered'
  };
};

/**
 * Get audit logs of all sent WhatsApp messages
 */
exports.getAuditLogs = () => {
  return notificationsAuditLog;
};
