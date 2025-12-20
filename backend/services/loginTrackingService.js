const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const crypto = require('crypto');

function parseUserAgent(userAgent) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  let browserName = result.browser.name || 'Unknown';
  
  if (userAgent.includes('Brave') || userAgent.includes('brave')) {
    browserName = 'Brave';
  }
  
  return {
    browser: {
      name: browserName,
      version: result.browser.version || 'Unknown',
      fullString: `${browserName} ${result.browser.version || ''}`.trim()
    },
    os: {
      name: result.os.name || 'Unknown',
      version: result.os.version || 'Unknown',
      fullString: `${result.os.name} ${result.os.version}`.trim()
    },
    device: {
      type: result.device.type || (result.os.name?.toLowerCase().includes('windows') || 
                                    result.os.name?.toLowerCase().includes('mac') || 
                                    result.os.name?.toLowerCase().includes('linux') ? 'desktop' : 'unknown'),
      vendor: result.device.vendor || 'Unknown',
      model: result.device.model || 'Unknown'
    }
  };
}

function getIPAddress(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         '0.0.0.0';
}

function getLocationFromIP(ipAddress) {
  if (ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress === '::ffff:127.0.0.1') {
    return {
      country: 'Local',
      city: 'Development',
      region: 'Local',
      timezone: 'Local'
    };
  }
  
  const geo = geoip.lookup(ipAddress);
  
  if (geo) {
    return {
      country: geo.country || 'Unknown',
      city: geo.city || 'Unknown',
      region: geo.region || 'Unknown',
      timezone: geo.timezone || 'Unknown'
    };
  }
  
  return {
    country: 'Unknown',
    city: 'Unknown',
    region: 'Unknown',
    timezone: 'Unknown'
  };
}

function generateDeviceFingerprint(userAgent, ipAddress) {
  const data = `${userAgent}-${ipAddress}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

function isChromeBrowser(browserName) {
  const chromeBrowsers = ['chrome', 'chromium', 'chrome webview', 'chrome headless'];
  const isChromiumBased = chromeBrowsers.includes(browserName?.toLowerCase());
  const excludedBrowsers = ['brave', 'edge', 'opera', 'vivaldi'];
  const isExcluded = excludedBrowsers.includes(browserName?.toLowerCase());
  
  return isChromiumBased && !isExcluded;
}

function isMicrosoftBrowser(browserName) {
  const microsoftBrowsers = ['edge', 'ie', 'internet explorer'];
  return microsoftBrowsers.includes(browserName?.toLowerCase());
}

function isBraveBrowser(browserName) {
  return browserName?.toLowerCase() === 'brave';
}

function isMobileDevice(deviceType) {
  return deviceType === 'mobile';
}

// Mobile access from 10 AM to 1 PM IST (default: 10-13)
function isWithinMobileAccessHours(startHour = 10, endHour = 13) {
  const now = new Date();
  
  // Use toLocaleString with Asia/Kolkata timezone to get IST time
  const istTimeString = now.toLocaleString('en-US', { 
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const [hours, minutes] = istTimeString.split(':').map(Number);
  
  console.log(`📱 Mobile Access Check:`);
  console.log(`   Current IST time: ${hours}:${minutes.toString().padStart(2, '0')}`);
  console.log(`   Allowed window: ${startHour}:00 - ${endHour}:00 IST`);
  console.log(`   Access: ${hours >= startHour && hours < endHour ? '✅ GRANTED' : '❌ DENIED'}`);
  
  return hours >= startHour && hours < endHour;
}

function checkMobileAccess(deviceType, user) {
  if (!isMobileDevice(deviceType)) {
    return { allowed: true };
  }
  
  if (user.securitySettings?.mobileAccessRestricted === false) {
    return { allowed: true };
  }
  
  // Default: 10 AM - 1 PM IST (endHour = 13)
  const startHour = user.securitySettings?.mobileAccessStartHour || 10;
  const endHour = user.securitySettings?.mobileAccessEndHour || 13;
  
  if (isWithinMobileAccessHours(startHour, endHour)) {
    return { allowed: true };
  }
  
  // Get current IST time for error message
  const now = new Date();
  const istTimeString = now.toLocaleString('en-US', { 
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return {
    allowed: false,
    reason: `Mobile access is only allowed between ${startHour}:00 and ${endHour}:00 IST. Current IST time: ${istTimeString}`,
    startHour,
    endHour
  };
}

function createLoginTrackingData(req) {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ipAddress = getIPAddress(req);
  const deviceInfo = parseUserAgent(userAgent);
  const location = getLocationFromIP(ipAddress);
  const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);
  const sessionId = crypto.randomBytes(32).toString('hex');
  
  return {
    userAgent,
    ipAddress,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    device: deviceInfo.device.type,
    location,
    deviceFingerprint,
    sessionId,
    loginTime: new Date()
  };
}

module.exports = {
  parseUserAgent,
  getIPAddress,
  getLocationFromIP,
  generateDeviceFingerprint,
  isChromeBrowser,
  isMicrosoftBrowser,
  isBraveBrowser,
  isMobileDevice,
  isWithinMobileAccessHours,
  checkMobileAccess,
  createLoginTrackingData
};