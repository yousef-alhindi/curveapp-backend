var cron = require('node-cron');
const moment = require('moment-timezone');

const { Order_Subcription_Model } = require('../models/restaurant/subscriptionOrder.model');
const { Offer_Order_Model } = require('../models/restaurant/offerOrder.model');
const { default: AdminPackageOrderModel } = require('../models/user/adminPackageOrder.model');
const { default: PackageOrderModel } = require('../models/user/packageOrder.model');
const { default: GymSubscriptions } = require('../models/gym/gymSubscriptions');

exports.expiredGymSubscriptions = cron.schedule("0 0 * * *", async () => {
   try {
      const currentTime = new Date().getTime();

      const updatedSubscriptions = await GymSubscriptions.updateMany(
         { startDate: { $lte: currentTime }, endDate: { $gte: currentTime } },
         { $set: { active: true } }
      );

      const expiredSubscriptions = await GymSubscriptions.updateMany(
         { $or: [{ endDate: { $lt: currentTime } }, { startDate: { $gt: currentTime } }] },
         { $set: { active: false } }
      );

      console.log(`${updatedSubscriptions.modifiedCount} subscriptions set to active`);
      console.log(`${expiredSubscriptions.modifiedCount} subscriptions set to inactive`);
   } catch (error) {
      console.error("Error updating subscriptions:", error);
   }
});

exports.reminder = cron.schedule('0 0 * * *', async () => {
   let data = await Order_Subcription_Model.find({ subscriptionExpired: { $lt: new Date() } });
   let ids = data.map((obj) => obj.restId);
   let result = await Offer_Order_Model.updateMany(
      { restId: { $in: ids }, isPurchasedBysubscription: true },
      { $set: { isActive: false } },
      { new: true }
   );
});



//TImeZone Issue in Existing CRON
// exports.cronToUpdateAdminAndRestaurantPackagesDeliveryStatus = cron.schedule(
//    '* * * * * *',
//    async () => {

// //         console.log(`🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈
// //                                     🚀🎉✅ Packages Update Cron.✅ 🎉🚀
// // 🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈`);


//     const currentDateTime = new Date();
//     const currentDate = new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), currentDateTime.getDate()).getTime(); // Get current date in milliseconds

//     // Get the current time in milliseconds
//     const currentTime = currentDateTime.getTime();

//     // Calculate the time one hour from now
//     const oneHourLater = currentTime + 60 * 60 * 1000; // 1 hour in milliseconds

//     const resPackageOrdersData = await PackageOrderModel.find({});
//     // const adminPackageOrdersData = await AdminPackageOrderModel.find({});

//     const filteredOrdersForRestaurant = resPackageOrdersData.filter(order => {
//         return order.dates.some(dateEntry => {

//             const isSameDate = dateEntry.date === currentDate; // Check if the date matches and status is 1

//             const isWithinOneHour = order.time >= currentTime && order.time <= oneHourLater;  // Check if the order time is within the next hour

//             return isSameDate && dateEntry.status === 1 && isWithinOneHour; // All conditions must be true
//         }); 
//     });

//     for (const order of filteredOrdersForRestaurant) {
//         // Find the index of the date entry that matches the current date
//         const dateEntryIndex = order.dates.findIndex(dateEntry => dateEntry.date === currentDate);


//         if (dateEntryIndex !== -1) {                     // If a matching date entry is found, update the orderStatus
//             order.dates[dateEntryIndex].orderStatus = 2; // Update orderStatus to 2
//         }
//     }

//     // Optionally, save the updated orders back to the database
//     for (const order of filteredOrdersForRestaurant) {
//         await PackageOrderModel.updateOne({ _id: order._id }, { $set: { dates: order.dates } });
//     }

//     // Log the updated orders
//     console.log('Updated Orders:', filteredOrdersForRestaurant);
//    }
// );


// exports.cronToUpdateAdminAndRestaurantPackagesDeliveryStatus = cron.schedule(
//   '*/1 * * * *',
//     async () => {

//       // Set the time zone to Asia/Kolkata (IST)
//       // const timeZone = 'Asia/Kolkata';

//       // const currentDateTime = moment().tz(timeZone); 
//       // const currentDate = currentDateTime.startOf('day').valueOf();

//       // const currentTimestamp = moment().tz(timeZone).valueOf();
//       // console.log("Current Timestamp:", currentTimestamp);

//       // // Add one hour to the current time
//       // const oneHourLaterTimestamp = moment().tz(timeZone).add(1, 'hour').valueOf();
//       // console.log("One Hour Later Timestamp:", oneHourLaterTimestamp);

//       // const resPackageOrdersData = await PackageOrderModel.find({});

//       const timeZone = 'Asia/Kolkata';

//       const currentDateTime = moment().tz(timeZone);
//       const currentDate = currentDateTime.startOf('day').valueOf();

//       const oneHourLater = currentDate + 60 * 60 * 1000;

//       const resPackageOrdersData = await PackageOrderModel.find({
//         dates: {
//           $elemMatch: {
//             date: { $gte: currentDate, $lt: oneHourLater },
//             orderStatus: 1,
//             status: 1,
//             isDelivered: false,
//           },
//         },
//       });


//       const filteredOrdersForRestaurant = resPackageOrdersData.filter(order => {
//         return order.dates.some(dateEntry => {
//           const isSameDate = dateEntry.date === currentDate;

//           // Check if the order time is within the next hour
//           const isWithinOneHour = order.time >= oneHourLaterTimestamp && order.time <= oneHourLater;

//           return isSameDate && dateEntry.status === 1 && isWithinOneHour;
//         });
//       });

//       console.log("filteredOrdersForRestaurant====>", filteredOrdersForRestaurant)
//       // Update the orders
//       for (const order of filteredOrdersForRestaurant) {
//         const dateEntryIndex = order.dates.findIndex(dateEntry => dateEntry.date === currentDate);

//         if (dateEntryIndex !== -1) {
//           // Update the order status to 2 (PREPARING)
//           order.dates[dateEntryIndex].orderStatus = 2;
//         }
//       }

//       // Save the updated orders back to the database
//       for (const order of filteredOrdersForRestaurant) {
//         await PackageOrderModel.updateOne({ _id: order._id }, { $set: { dates: order.dates } });
//       }

//       // Log the updated orders (for debugging)
//       console.log('Updated Orders:', filteredOrdersForRestaurant);
//     },
//     {
//       scheduled: true,
//       timezone: "Asia/Kolkata" // Specify the timezone for this cron job (India Standard Time)
//     }
//   );

// exports.cronToUpdateAdminAndRestaurantPackagesDeliveryStatus = cron.schedule('*/1 * * * *',async () => {
//   try {
//      const timeZone = 'Asia/Kolkata';
//      const currentDateTime = moment().tz(timeZone);
//      const currentDate = currentDateTime.startOf('day').valueOf();
//     //  const oneHourLater = currentDate + 60 * 60 * 1000;
//     //  const upcomingDay = currentDateTime.add(1, 'day').startOf('day').valueOf();

//      const resPackageOrdersData = await PackageOrderModel.find({
//         dates: {
//            $elemMatch: {
//               date: { $gte: currentDate },
//               orderStatus: 1,
//               status: 1,
//               isDelivered: false,
//            },
//         },
//      });

//      if (!resPackageOrdersData.length) {
//         console.log('No matching orders found.');
//         return;
//      }

//      const bulkOperations = resPackageOrdersData.map((order) => ({
//         updateOne: {
//            filter: {
//               _id: order._id,
//               'dates.date': { $eq: currentDate },
//            },
//            update: {
//               $set: { 'dates.$.orderStatus': 2 },
//            },
//         },
//      }));

//      const result = await PackageOrderModel.bulkWrite(bulkOperations);

//      console.log(
//         `Successfully updated ${result.modifiedCount} orders'.`
//      );
//   } catch (error) {
//      console.error('Error in updateOrderStatusInCron:', error);
//   }
// });

exports.cronToUpdateAdminAndRestaurantPackagesDeliveryStatus = cron.schedule('*/1 * * * *', async () => {
   try {
      const timeZone = 'Asia/Kolkata';
      const currentDateTime = moment().tz(timeZone);
      const currentDate = currentDateTime.startOf('day').valueOf();

      // ---------- Update for Package Order Model ----------
      const resPackageOrdersData = await PackageOrderModel.find({
         dates: {
            $elemMatch: {
               date: { $gte: currentDate },
               orderStatus: 1,
               status: 1,
               isDelivered: false,
            },
         },
      });

      if (resPackageOrdersData.length > 0) {
         const bulkOperations = resPackageOrdersData.map((order) => ({
            updateOne: {
               filter: {
                  _id: order._id,
                  'dates.date': { $eq: currentDate },
               },
               update: {
                  $set: { 'dates.$.orderStatus': 2 },
               },
            },
         }));

         const packageResult = await PackageOrderModel.bulkWrite(bulkOperations);
         console.log(`Successfully updated ${packageResult.modifiedCount} package orders.`);
      } else {
         console.log('No matching orders found in PackageOrderModel.');
      }

      // ---------- Update for Admin Package Order Model ----------
      const adminPackageOrdersData = await AdminPackageOrderModel.find({
         restaurants: {
            $elemMatch: {
               dates: {
                  $elemMatch: {
                     date: { $gte: currentDate },
                     orderStatus: 1,
                     status: 1,
                     isDelivered: false,
                  },
               },
            },
         },
      });

      if (adminPackageOrdersData.length > 0) {
         const bulkAdminOperations = adminPackageOrdersData.map((order) => {
            const updatedRestaurants = order.restaurants.map((restaurant) => {
               restaurant.dates = restaurant.dates.map((dateEntry) => {
                  if (
                     dateEntry.date >= currentDate &&
                     dateEntry.orderStatus === 1 &&
                     dateEntry.status === 1 &&
                     !dateEntry.isDelivered
                  ) {
                     dateEntry.orderStatus = 2;
                  }
                  return dateEntry;
               });
               return restaurant;
            });

            return {
               updateOne: {
                  filter: { _id: order._id },
                  update: { $set: { restaurants: updatedRestaurants } },
               },
            };
         });

         const adminResult = await AdminPackageOrderModel.bulkWrite(bulkAdminOperations);
         console.log(`Successfully updated ${adminResult.modifiedCount} admin package orders.`);
      } else {
         console.log('No matching orders found in AdminPackageOrderModel.');
      }
   } catch (error) {
      console.error('Error in cronToUpdateAdminAndRestaurantPackagesDeliveryStatus:', error);
   }
});

