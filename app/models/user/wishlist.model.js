const { Schema, default: mongoose } = require("mongoose");

const wishlistSchema = new Schema({
    restId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant"
    },
    supplementSeller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupplementSeller',
    },
    gymId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    strict: true,
    collection: "wishlists",
    timestamps: true,
    versionKey: false
})

exports.WISHLIST_MODEL = mongoose.model("wishlists", wishlistSchema);

