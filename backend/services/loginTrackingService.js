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

// ENHANCED: Brave browser detection with User-Agent check
function isBraveBrowser(browserName, userAgent = '') {
  const browserNameLower = (browserName || '').toLowerCase();
  const userAgentLower = (userAgent || '').toLowerCase();
  
  // Check browser name
  const isBraveByName = browserNameLower === 'brave' || browserNameLower.includes('brave');
  
  // Check User-Agent string
  const isBraveByUA = userAgentLower.includes('brave');
  
  const isBrave = isBraveByName || isBraveByUA;
  
  console.log(`🦁 Brave Detection:`);
  console.log(`   Browser Name: ${browserName}`);
  console.log(`   By Name: ${isBraveByName ? '✅' : '❌'}`);
  console.log(`   By User-Agent: ${isBraveByUA ? '✅' : '❌'}`);
  console.log(`   Final: ${isBrave ? '✅ IS BRAVE' : '❌ NOT BRAVE'}`);
  
  return isBrave;
}

// ENHANCED: Microsoft browser detection with User-Agent check
function isMicrosoftBrowser(browserName, userAgent = '') {
  const browserNameLower = (browserName || '').toLowerCase();
  const userAgentLower = (userAgent || '').toLowerCase();
  
  const microsoftBrowsers = ['edge', 'ie', 'internet explorer'];
  const isMSByName = microsoftBrowsers.some(ms => browserNameLower.includes(ms));
  
  // Check User-Agent for Edge
  const isMSByUA = userAgentLower.includes('edg/') || userAgentLower.includes('edge/');
  
  const isMS = isMSByName || isMSByUA;
  
  console.log(`🔷 Microsoft Browser Detection:`);
  console.log(`   Browser Name: ${browserName}`);
  console.log(`   By Name: ${isMSByName ? '✅' : '❌'}`);
  console.log(`   By User-Agent: ${isMSByUA ? '✅' : '❌'}`);
  console.log(`   Final: ${isMS ? '✅ IS MICROSOFT' : '❌ NOT MICROSOFT'}`);
  
  return isMS;
}

// ENHANCED: Chrome detection with dual method
function isChromeBrowser(browserName, userAgent = '') {
  const chromeBrowsers = [
    'chrome', 
    'chromium', 
    'chrome webview', 
    'chrome headless', 
    'chrome mobile',
    'chrome mobile webview'
  ];
  
  const excludedBrowsers = [
    'brave', 
    'edge', 
    'opera', 
    'vivaldi',
    'samsung browser',
    'firefox',
    'safari'
  ];
  
  const browserNameLower = (browserName || '').toLowerCase();
  const userAgentLower = (userAgent || '').toLowerCase();
  
  // Method 1: Check browser name
  const isChromiumBased = chromeBrowsers.some(chrome => browserNameLower.includes(chrome));
  const isExcluded = excludedBrowsers.some(excluded => browserNameLower.includes(excluded));
  const chromeByName = isChromiumBased && !isExcluded;
  
  // Method 2: Direct User-Agent string check
  const userAgentHasChrome = userAgentLower.includes('chrome') && 
                             !userAgentLower.includes('edg/') && 
                             !userAgentLower.includes('edge') &&
                             !userAgentLower.includes('opr/') &&
                             !userAgentLower.includes('opera') &&
                             !userAgentLower.includes('brave') &&
                             !userAgentLower.includes('samsungbrowser') &&
                             !userAgentLower.includes('firefox') &&
                             // Safari can mention Chrome in compatibility
                             !(userAgentLower.includes('safari') && !userAgentLower.includes('chrome/'));
  
  const isChrome = chromeByName || userAgentHasChrome;
  
  console.log(`🔍 Chrome Detection (Enhanced):`);
  console.log(`   Browser Name: ${browserName}`);
  console.log(`   User-Agent: ${userAgent.substring(0, 80)}...`);
  console.log(`   Method 1 (Name): ${chromeByName ? '✅ Chrome' : '❌ Not Chrome'}`);
  console.log(`   Method 2 (UA): ${userAgentHasChrome ? '✅ Chrome' : '❌ Not Chrome'}`);
  console.log(`   Final Result: ${isChrome ? '✅ IS CHROME - OTP REQUIRED' : '❌ NOT CHROME'}`);
  
  return isChrome;
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