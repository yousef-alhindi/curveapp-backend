const mongoose = require('mongoose');
const { Schema } = mongoose;
const {duration } = require('../../constants/foodPackage.constants');

const adminFoodPackageCartSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    restaurants :[
        {
            _id:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Restaurant',
            },
            amount:{
                type: Number,
                default: 0,
            },
            // startDate : {
            //     type: Number,
            //     //default: new Date().getTime(),
            // },
            // time :{
            //     type: Number, //in millisecond
            // },
            // expired : {
            //     type: Boolean,
            //     default: false,
            // },
        }
    ],
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'foodPackage',
    },
    totalAmount: {
        type: Number,
        default: 0,
    },
    status: {
        type: Number,
        default: 1  // active : 1 / inactive :0
    },
    isDeleted: {
        type: Boolean,
        default: false,
     },
    createdAt: {
        type: Number,
        default: new Date().getTime(),
     },
    updatedAt: {
        type: Number,
        default: new Date().getTime(),
     },
}, {
    collection: "adminFoodPackCart",
    timestamps: true,
})

exports.AdminFoodPackCartModel = mongoose.model("adminFoodPackCart", adminFoodPackageCartSchema);

