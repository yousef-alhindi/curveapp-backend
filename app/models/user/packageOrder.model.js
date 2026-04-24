import mongoose from 'mongoose';
import { paymentMethod, status } from '../../constants/order.constants';

const packageOrderSchema = new mongoose.Schema({
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   restaurentCartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'foodPackCart',
      required: true,
   },
   addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
   },
   orderId: {
      type: String,
      default: '12345678',
   },
   packageType: {
      type: Number,
      enum: [0, 1, 2], // 1: food Package || 2: Gym Package
      default: 0,
   },
   // deliveryAmount: {
   //    type: Number,
   //    default: 0,
   // },
   totalAmount: {
      type: Number,
      default: 0,
   },
   discountedAmount: {
      type: Number,
      default: 0,
   },
   promoCodeId: {
      type: String,
      default: '',
   },
   paymentMethod: {
      type: Number,
      enum: Object.values(paymentMethod),
      default: paymentMethod.APPLEPAY,
   },
   paymentId: {
      // type: mongoose.Schema.Types.ObjectId,
      // ref: 'Payment',
      type: String,
      default: 's3rcn4b3ba465k6k6hh5n4',
   },
   startDate: {
      type: Number,
      //default: new Date().getTime(),
   },
   time: {
      type: Number, //in millisecond
   },
   expired: {
      type: Boolean,
      default: false,
   },
   dates: [
      {
         date: { type: Number },
         status: { type: Number, enum: [0, 1], default: 1 }, //0 pause || 1 active
         orderStatus: { type: Number, enum: Object.values(status), default: status.PENDING }, // PENDING: 1,PREPARING: 2,ONTHEWAY: 3,DELIVERED: 4,CANCEL:5,
         driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', default: null },
         rejectedBy: [
            {
               deliveryBoyId: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'Delivery',
                  default: null,
               },
               rejectReason: {
                  type: String,
               },
            },
         ],
         accepted: {
            type: Boolean,
            default: false,
         },
         isPickUp: {
            type: Boolean,
            default: false,
         },
         pickupTime: {
            type: Number,
         },
         isDelivered: {
            type: Boolean,
            default: false,
         },
         deliveredTime: {
            type: Number,
         },
      },
   ],
   anySuggestion: {
      type: String,
      default: '',
   },
   status: {
      type: Number,
      enum: Object.values(status),
      default: status.PENDING,
   },
   packageDetails: {
      categories: [],
   },
   isDeleted: {
      type: Boolean,
      default: false,
   },
   cancellationReason: {
      type: String,
      default: '',
   },
   cancellationDate: {
      type: Date,
      default: null,
   },
   createdAt: {
      type: Number,
      default: () => new Date().getTime(),
   },
   updatedAt: {
      type: Number,
      default: () => new Date().getTime(),
   },
   migrateBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
   },
   isMigrate: {
      type: Boolean,
      default: false,
   },
   suspended:{
      type: Boolean,
      default: false,
   },
   suspendReason:{
      type: String,
      default: '',
   },
   suspendedDate:{
      type: Number,
      default:null
   }
});

packageOrderSchema.path('dates').schema.set('_id', false);

const PackageOrderModel = mongoose.model('PackageOrder', packageOrderSchema);
export default PackageOrderModel;
