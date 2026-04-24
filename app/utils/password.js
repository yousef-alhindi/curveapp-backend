import bcrypt from "bcrypt";
require('dotenv').config();


export const generatePassword = async (pass) => {
    try {
      const saltRounds = parseInt(4);
      const salt = bcrypt.genSaltSync(saltRounds);
      const genPass = bcrypt.hashSync(pass, salt);
      return genPass;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

export const comparePassword = async (plainTextPassword, hashedPassword) => {
    try {
      let password =  await bcrypt.compare(plainTextPassword, hashedPassword);
      return password
    } catch (error) {
      console.log(error);
      return false;
    }
  };