const generateRandomPassword = (length = 12) => {
  const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz';
  const allLetters = uppercaseLetters + lowercaseLetters;
  
  let password = '';
  password += uppercaseLetters[Math.floor(Math.random() * uppercaseLetters.length)];
  password += lowercaseLetters[Math.floor(Math.random() * lowercaseLetters.length)];
  
  for (let i = 2; i < length; i++) {
    password += allLetters[Math.floor(Math.random() * allLetters.length)];
  }
  
  password = password.split('').sort(() => Math.random() - 0.5).join('');
  return password;
};

const generateResetToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
};

module.exports = {
  generateRandomPassword,
  generateResetToken
};
