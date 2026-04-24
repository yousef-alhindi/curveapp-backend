// require('dotenv').config();
import dotenv from 'dotenv';
dotenv.config();

export const db = {
   // DB_NAME : 'curve_db',
   // DB_USERNAME :'curve_user',
   // DB_PASSWORD : 'Cu!rve!ed9aVTU',
   // SERVER_IP :'157.241.64.194',
   // LOCAL_IP : '127.0.0.1',
   // DB_PORT : '27017',

   // S3_USER :'S3_user',
   // BUCKET_REGION : 'me-south-1',
   // BUCKET_NAME :'curve-bucket',
   // S3_ACCESS_KEY :'AKIAW3MEFK3KAPLEMCJH',
   // S3_SECRET_KEY :'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',

   // FIREBASE_SERVER_KEY : 'AAAAXqKfu_A:APA91bHpRxvcTcajXNAzSJdESYwvQQIBkO78svtCOnRupAv0e8lRu4PS7JdPDoOVy3svDLzvPwzjIMOjj8uDkMMnXVa6uIUif4l2Nozl4hWhO2QCQdYnimIafsUGk8lpIlNZkzjJD0Lq',

   // SECRET_KEY :'hsdiuuuiuiziuhiuhugzuyikjzuggyiuhiuhjbhjgiyhiuhhhyihiuhbhuiy',
   NODE_ENV: process.env.NODE_ENV,
   DB_NAME: process.env.DB_NAME,
   DB_USERNAME: process.env.DB_USERNAME,
   DB_PASSWORD: process.env.DB_PASSWORD,
   SERVER_IP: process.env.SERVER_IP,
   LOCAL_IP: process.env.LOCAL_IP,
   DB_PORT: process.env.DB_PORT,
   S3_USER: process.env.S3_USER,
   BUCKET_REGION: process.env.BUCKET_REGION,
   BUCKET_NAME: process.env.BUCKET_NAME,
   S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
   S3_SECRET_KEY: process.env.S3_SECRET_KEY,

   FIREBASE_SERVER_KEY: process.env.FIREBASE_SERVER_KEY,

   SECRET_KEY: process.env.SECRET_KEY,
};
