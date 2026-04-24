const mongoose = require('mongoose');
const { Schema } = mongoose;

const gymPkgSchema = new mongoose.Schema(
    {
        gymId: {
            type: Schema.Types.ObjectId,
            ref: 'Gym'
        },
        name: {
            type: String,
            default: '',
        },
        durations: [
            {
                duration: {
                    type: Number,
                    enum: [1, 3, 6, 12]
                },
                price: {
                    type: Number,
                    default: 0
                },
            }
        ],
        gender: {
            type: String,
            enum: ['unisex', 'men', 'women'],
        },
        description: {
            type: String,
            default: '',
        },
        termAndCond: {
            type: String,
            default: '',
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
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
            default: false,
        },
        image: {
            type: String,
            default: '',
        },
    },
    {
        strict: true,
        collection: 'GymPkg',
        versionKey: false,
        timestamps: true,
    }
);

gymPkgSchema.index({
    location: '2dsphere',
});

exports.GymPkgModel = mongoose.model('GymPkg', gymPkgSchema);
