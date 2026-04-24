import jwt from "jsonwebtoken";
import { db } from "../config/index";
require("dotenv").config();

export const generateJwtToken = (data, time) => {
    const secretKey = db.SECRET_KEY;
    try {
        let token;
        if (time) {
            token = jwt.sign(data, secretKey, { expiresIn: time });
        } else {
            token = jwt.sign(data, secretKey);
        }
        return {
            status: 1,
            token,
        };
    } catch (error) {
        console.log(error);
        return {
            status: 0,
            error: error,
        };
    }
};
