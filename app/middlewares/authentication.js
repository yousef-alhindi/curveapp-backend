import jwt from 'jsonwebtoken';
require('dotenv').config();

import AdminModel from '../models/admin/admin.model';
import UserModel from '../models/user/user.model';
import { RestaurantModel } from '../models/restaurant/restaurant.model';
import { Delivery_Model } from '../models/delivery/delivery.model';
import { db } from '../config/index';
import { SupplementSellerModel } from '../models/supplement/supplementSeller.model';
import { GymModel } from '../models/gym/gym.model';
import { GroceryModel } from '../models/grocery/grocery.model';

export const verifyUserToken = async (req, res, next) => {
   let { accesstoken } = req.headers;
   if (!accesstoken) {
      // return res.status(401).json({
      //    "status": 401,
      //    "message": "Access token is required or no access token provided."
      //  })
      req.userData = null;
      return next();
   }

   else {
      jwt.verify(accesstoken, db.SECRET_KEY, async function (err, decoded) {
         if (!err) {
            req.tokenData = decoded;
            let user = await findUser(accesstoken);
            if (user.status == 1) {
               req.userData = user.data;
            }
            // else {
            //    return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
            // }
            return next();
         } else {
            return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
         }
      });
   }
};

export const setUserToken = async (req, res, next) => {
   let { accesstoken } = req.headers;
   if (!!accesstoken) {
      jwt.verify(accesstoken, db.SECRET_KEY, async function (err, decoded) {
         if (!err) {
            let user = await findUser(accesstoken);
            if (user.status == 1) {
               req.userData = user.data;
            }
            next();
         } else next()
      });
   } else {
      next();
   }
};

export const verifyAdminToken = async (req, res, next) => {
   let { accesstoken } = req.headers;
   if (!accesstoken)
      return res.status(403).send({
         auth: false,
         message: 'No token Provided',
      });

   jwt.verify(accesstoken, db.SECRET_KEY, async function (err, decoded) {
      if (!err) {
         let admin = await AdminModel.findOne({ accessToken: accesstoken });
         if (!admin) {
            res.status(403).json({ message: 'Invalid Access Token' });
            return;
         }
         req.adminData = admin;
         next();
      } else {
         return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
      }
   });
};

export const verifyRestaurantToken = async (req, res, next) => {
   let { accesstoken } = req.headers;
   if (!accesstoken) {
      return res.status(403).send({
         auth: false,
         message: 'No token Provided',
      });
   }
   jwt.verify(accesstoken, db.SECRET_KEY, async function (err, decoded) {
      if (!err) {
         req.tokenData = decoded;
         let rest = await findRestaurant(accesstoken);
         if (rest.status == 1) {
            if (rest?.data?.isBlocked) {
               return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
            }

            req.restaurantData = rest.data;
         } else {
            if (!req.originalUrl.includes("auth/")) {
               return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
            }
         }
         next();
      } else {
         return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
      }
   });
};

export const verifyGroceryToken = async (req, res, next) => {
   let { accesstoken } = req.headers;
   if (!accesstoken) {
      return res.status(403).send({
         auth: false,
         message: 'No token Provided',
      });
   }
   jwt.verify(accesstoken, db.SECRET_KEY, async function (err, decoded) {
      if (!err) {
         req.tokenData = decoded;
         let rest = await findGrocery(accesstoken);
         if (rest.status == 1) {
            if (rest?.data?.isBlocked) {
               return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
            }

            req.restaurantData = rest.data;
         } else {
            if (!req.originalUrl.includes("auth/")) {
               return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
            }
         }
         next();
      } else {
         return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
      }
   });
};

export const generateToken = () => {
   let token = jwt.sign({ access: 'access-token' }, db.SECRET_KEY, {
      expiresIn: '2 days',
   });
   return token;
};

async function findUser(accesstoken) {
   try {
      let user = await UserModel.findOne({ accessToken: accesstoken });
      if (!user) {
         return {
            status: 0,
            data: {},
         };
      }
      return {
         status: 1,
         data: user,
      };
   } catch (error) {
      return {
         status: 0,
         error: error,
      };
   }
}

async function findRestaurant(accesstoken) {
   try {
      let rest = await RestaurantModel.findOne({ accessToken: accesstoken });
      if (!rest) {
         return {
            status: 0,
            data: {},
         };
      }
      return {
         status: 1,
         data: rest,
      };
   } catch (error) {
      return {
         status: 0,
         error: error,
      };
   }
}

async function findGrocery(accesstoken) {
   try {
      let rest = await GroceryModel.findOne({ accessToken: accesstoken });
      if (!rest) {
         return {
            status: 0,
            data: {},
         };
      }
      return {
         status: 1,
         data: rest,
      };
   } catch (error) {
      return {
         status: 0,
         error: error,
      };
   }
}

export const verifyUserLogin = async (req, res, next) => {
   if (req.userData) {
      next();
   } else {
      return res.status(403).json({ auth: false, message: 'Unauthorized user/User not Loged in' });
   }
};

export const verifyDeliveryToken = async (req, res, next) => {
   // console.log(req.headers)
   let { accesstoken } = req.headers;
   // console.log("Admin Token : : ",accesstoken)
   if (!accesstoken)
      return res.status(403).send({
         auth: false,
         message: 'No token Provided',
      });

   jwt.verify(accesstoken, db.SECRET_KEY, async function (err, decoded) {
      if (!err) {
         let user = await Delivery_Model.findOne({ accessToken: accesstoken });
         if (!user) {
            res.status(403).json({ message: 'Invalid Access Token' });
            return;
         }
         req.deliveryData = user;
         next();
      } else {
         return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
      }
   });
};

export const verifyUserTokenForDelete = (req, res, next) => {
   try {
      let { accesstoken } = req.headers;
      if (!accesstoken) {
         req.userData = undefined;
         next();
      } else {

         const decoded = jwt.verify(accesstoken, db.SECRET_KEY);
         req.userData = decoded;
         // return decoded;
         next();
      }
   } catch (error) {
      // If the token is invalid or expired, return null
      console.error('Token verification failed:', error.message);
      return null;
   }
}


export const verifySupplementToken = async (req, res, next) => {
   let { accesstoken } = req.headers;
   if (!accesstoken) {
      return res.status(403).send({
         auth: false,
         message: 'No token Provided',
      });
   }
   jwt.verify(accesstoken, db.SECRET_KEY, async function (err, decoded) {
      if (!err) {
         req.tokenData = decoded;
         let supplement = await findSupplement(accesstoken);
         if (supplement.status == 1) {
            if (supplement?.data?.isBlocked) {
               return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
            }

            req.supplementData = supplement.data;
         } else {
            if (!req.originalUrl.includes("auth/")) {
               return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
            }
            //return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
         }
         next();
      } else {
         return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
      }
   });
};

async function findSupplement(accesstoken) {
   try {
      let supplement = await SupplementSellerModel.findOne({ accessToken: accesstoken });
      if (!supplement) {
         return {
            status: 0,
            data: {},
         };
      }
      return {
         status: 1,
         data: supplement,
      };
   } catch (error) {
      return {
         status: 0,
         error: error,
      };
   }
}

export const verifyGymToken = async (req, res, next) => {
   let { accesstoken } = req.headers;
   if (!accesstoken) {
      return res.status(403).send({
         auth: false,
         message: 'No token Provided',
      });
   }
   jwt.verify(accesstoken, db.SECRET_KEY, async function (err, decoded) {
      if (!err) {
         req.tokenData = decoded;
         let gym = await findGym(accesstoken);
         if (gym.status == 1) {
            if (gym?.data?.isBlocked) {
               return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
            }

            req.gymData = gym.data;
         } else {
            if (!req.originalUrl.includes("auth/")) {
               return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
            }
            //return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
         }
         next();
      } else {
         return res.status(401).json({ auth: false, message: 'Session Expired, Please Login Again' });
      }
   });
};

async function findGym(accesstoken) {
   try {
      let gym = await GymModel.findOne({ accessToken: accesstoken });
      if (!gym) {
         return {
            status: 0,
            data: {},
         };
      }
      return {
         status: 1,
         data: gym,
      };
   } catch (error) {
      return {
         status: 0,
         error: error,
      };
   }
}

export const optionalVerifyUserToken = async (req, res, next) => {
   try {
      const accesstoken = req.headers.accesstoken;

      if (!accesstoken) {
         return res.status(401).json({
            success: false,
            message: "Access token required"
         });
      }

      jwt.verify(accesstoken, db.SECRET_KEY, async (err, decoded) => {
         if (err) {
            return res.status(401).json({
               success: false,
               message: "Invalid or expired access token"
            });
         }

         const userId = decoded._id;

         const user = await UserModel.findById(userId);

         if (!user) {
            return res.status(401).json({
               success: false,
               message: "User not found"
            });
         }

         req.userData = user;
         req.tokenData = decoded;

         next();
      });

   } catch (error) {
      console.error(error);
      return res.status(500).json({
         success: false,
         message: "Something went wrong"
      });
   }
};
