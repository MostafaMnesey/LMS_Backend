import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";
export const hash = ({ password, salt = process.env.SALT }) => {
  
  return bcrypt.hashSync(password, Number(salt));
};
export const compare = ({ password, hash }) => {
  return bcrypt.compareSync(password, hash);
};

export const encryptText = ({ text }) => {
  return CryptoJS.AES.encrypt(text, process.env.ENCRYPT_KEY).toString();
};

export const decryptText = ({ text }) => {
  const bytes = CryptoJS.AES.decrypt(text, process.env.ENCRYPT_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
