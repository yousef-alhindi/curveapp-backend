import mongoose from 'mongoose';
import { orderType, paymentMethod, status } from '../../constants/order.constants';
import { deliveryOption } from '../../constants/cart.constants';

const supplementOrderSchema = new mongoose.Schema({
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   supplementCartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'supplementCarts',
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
   totalItemAmount: {
      type: Number,
      default: 0,
   },
   deliveryAmount: {
      type: Number,
      default: 0,
   },
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
      default: "",
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
   anySuggestion: {
      type: String,
      default: '',
   },
   status: {
      type: Number,
      enum: Object.values(status),
      default: status.PENDING,
   },
   deliveryOption: {
      type: Number,
      default: 1,
      enum: Object.values(deliveryOption), //takeAway: 0, delivery: 1
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
   orderRating: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplementOrderRating',
   },
   createdAt: {
      type: Number,
      default: () => new Date().getTime(),
   },
   updatedAt: {
      type: Number,
      default: () => new Date().getTime(),
   },
});

const SupplementOrderModel = mongoose.model('SupplementOrder', supplementOrderSchema);
export default SupplementOrderModel;
