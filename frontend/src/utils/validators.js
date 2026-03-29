export const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
export const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/\d/.test(password)) errors.push('One number');
  return errors;
};
export const validateUsername = (username) => /^[a-zA-Z0-9_]{3,30}$/.test(username);
