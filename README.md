# 🐦 Twitter Clone

A full-stack Twitter clone built with **React**, **Node.js**, **Express**, and **MongoDB** featuring advanced authentication, multi-language support, and subscription-based posting.

---

## ✨ Features

### 🔔 **1. Keyword-Based Push Notifications**
- Real-time browser notifications for tweets containing specific keywords
- Default keywords: **"cricket"** and **"science"**
- Full tweet content shown in notification popup
- **Enable/Disable** notifications from profile page
- Uses browser's native Notification API
- User-customizable keyword list

---

### 🎤 **2. Audio Tweet Upload**
- **Record voice** directly in browser and post as tweet
- **OTP authentication** via email before upload
- **Maximum audio length:** 5 minutes
- **Maximum file size:** 100 MB
- **Upload time restriction:** 2:00 PM - 7:00 PM IST only
- Upload blocked outside allowed time window
- Audio preview before upload
- Pause/Resume recording capability

---

### 🔑 **3. Forgot Password with Email/Phone**
- Reset password using **email** or **phone number**
- **One request per day** limit (prevents abuse)
- Warning message on second attempt
- **Random password generator** feature:
  - Combination of uppercase and lowercase letters only
  - No special characters
  - No numbers
  - Example: `AbCdEfGhIjKl`
- Password reset link sent via email/SMS

---

### 💳 **4. Subscription Plans with Payment Gateway**
Integration with **Razorpay** payment gateway for tweet posting limits:

| Plan | Price | Tweets/Month |
|------|-------|--------------|
| **Free** | ₹0 | 1 tweet |
| **Bronze** | ₹100/month | 3 tweets |
| **Silver** | ₹300/month | 5 tweets |
| **Gold** | ₹1000/month | Unlimited |

**Features:**
- Email invoice with plan details after successful payment
- **Payment window:** 10:00 AM - 11:00 AM IST **only**
- Payment blocked outside time window
- Tweet counter resets monthly
- Auto-downgrade to Free plan after expiry

---

### 🌍 **5. Multi-Language Support (6 Languages)**
Supported languages:
- 🇬🇧 **English**
- 🇪🇸 **Spanish**
- 🇮🇳 **Hindi**
- 🇵🇹 **Portuguese**
- 🇨🇳 **Chinese**
- 🇫🇷 **French**

**Language Switch Authentication:**
- **French:** Email OTP verification required
- **Other languages:** Mobile number OTP verification required
- **English:** No authentication needed
- All pages and UI elements translated
- Language preference saved

---

### 🔐 **6. Login Tracking & Browser-Based Authentication**

**System/Device Information Tracked:**
- Browser type and version
- Operating System (Windows, macOS, Linux, etc.)
- Device type (Desktop, Mobile, Laptop)
- IP address with geolocation
- Login timestamp
- Logout timestamp

**Browser-Based Authentication Rules:**
- **Google Chrome:** OTP sent via email (authentication required)
- **Microsoft Edge/IE:** Direct access without authentication
- **Mobile devices:** Access **only** between 10:00 AM - 1:00 PM
  - Blocked outside this time window
- **Other browsers:** Standard login

**Login History Dashboard:**
- View all login attempts
- See device, browser, OS, IP, and location
- Current session highlighted
- Last 50 login records stored
- Success/Failed login status

---

## 🛠️ Tech Stack

**Frontend:**
- React 18
- React Router v6
- Axios
- Tailwind CSS
- Lucide React Icons

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Nodemailer (Email)
- Twilio (SMS)
- Razorpay (Payments)

**Additional Libraries:**
- ua-parser-js (Browser detection)
- geoip-lite (IP geolocation)
- Multer (File uploads)
- bcryptjs (Password hashing)

---



## 📖 Usage

### **1. Push Notifications**
```
1. Go to Profile page
2. Enable "Push Notifications" toggle
3. Add keywords: "cricket", "science"
4. Receive notifications when tweets match keywords
5. Click notification to view full tweet
```

### **2. Audio Tweet Upload**
```
1. Click microphone icon on tweet form
2. Record audio (max 5 minutes)
3. Time restriction: 2 PM - 7 PM IST only
4. System sends OTP to email
5. Enter OTP to verify
6. Audio uploaded as tweet
```

### **3. Forgot Password**
```
1. Click "Forgot Password?" on login page
2. Enter email or phone number
3. Choose "Generate Random Password" option
4. Password sent via email/SMS (uppercase + lowercase letters only)
5. Login with new password
6. Change password in settings
Note: Only 1 request per day allowed
```

### **4. Subscription Purchase**
```
1. Go to Subscription page
2. Choose plan (Bronze/Silver/Gold)
3. Payment window: 10:00 AM - 11:00 AM IST only
4. Complete Razorpay payment
5. Receive invoice via email
6. Tweet based on plan limits
```

### **5. Change Language**
```
1. Go to Language Settings
2. Select language (Spanish/Hindi/Portuguese/Chinese/French)
3. For French: Enter email OTP
4. For others: Enter mobile OTP
5. All pages translated to selected language
```

### **6. View Login History**
```
1. Navigate to Login History page
2. See current session details:
   - Browser (Chrome/Edge/Firefox)
   - Operating System
   - Device type (Desktop/Mobile)
   - IP address and location
   - Login/logout times
3. View past 50 login attempts
```

---

## 🔐 Security Features

### **Browser-Based Authentication**
- **Chrome:** Email OTP verification mandatory
- **Edge:** Direct access (no OTP)
- **Mobile:** Time-restricted (10 AM - 1 PM only)

### **Login Tracking**
- All login attempts stored in database
- Device fingerprinting
- IP-based geolocation
- Session duration tracking
- Suspicious activity detection

### **Password Security**
- bcrypt password hashing
- JWT token authentication
- Random password generator (letters only)
- Rate limiting on forgot password

### **Time-Based Restrictions**
- Audio uploads: 2 PM - 7 PM IST
- Payments: 10 AM - 11 AM IST
- Mobile access: 10 AM - 1 PM

---

## 🌟 Key Highlights

✅ **Real-time push notifications** with keyword monitoring  
✅ **Audio tweets** with OTP verification and time restrictions  
✅ **Smart password recovery** with daily limits  
✅ **Flexible subscription plans** with Razorpay integration  
✅ **6 language support** with OTP verification  
✅ **Advanced login tracking** with browser-based rules  
✅ **Time-based access control** for security  
✅ **Complete login history** dashboard  

---

