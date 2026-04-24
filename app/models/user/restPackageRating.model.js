const mongoose = require('mongoose')
const { Schema } = mongoose

const restPackageRatingSchema = new Schema({
    restId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    star: {
        type: Number,
        default: 0,
    },
    orderId :{
        type: mongoose.Schema.Types.ObjectId,
        ref: "PackageOrder"
    },
    review: {
        type: String,
        default: ''
    },
    status: {
        type: Boolean,
        default: true
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
    strict: true,
    collection: "RestPackageRating",
    timestamps: true,
    versionKey: false
})

exports.REST_PACK_RATING_MODEL = mongoose.model("RestPackageRating", restPackageRatingSchema);

