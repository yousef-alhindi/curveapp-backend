import mongoose from "mongoose";

const orderDeliverySchema = new mongoose.Schema({
    deliveryBoyId :{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Delivery',
    },
    orderId :{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        //required: true,
    },
    restId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        //required: true,
    },
    isPickUp: {
        type: Boolean,
        default: false,
    },
    pickupTime :{
        type: Number,
    },
    isDelivered: {
        type: Boolean,
        default: false,
    },
    deliveredTime : {
        type: Number,
    },
    accepted: {
        type: Boolean,
        default: false,
    },
    rejectedBy :[
        {
            deliveryBoyId:{  type: mongoose.Schema.Types.ObjectId,
                ref: 'Delivery'
            },
            rejectReason :{
                type: String
            }
        }
    ],
    createdAt: {
        type: Number,
        default: () => new Date().getTime(),
    },
    updatedAt: {
        type: Number,
        default: () => new Date().getTime(),
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deliveryBoyRating:{
        type: Number,
        default: 0,
    },
    driverReview:{
        type: String,
        default: "",
    }
},
{
    strict: true,
    collection: 'OrderDelivery',
    versionKey: false,
    timestamps: true,
 })

 
 const OrderDeliveryModel = mongoose.model('OrderDelivery', orderDeliverySchema);
 export default OrderDeliveryModel;
