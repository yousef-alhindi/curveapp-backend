const mongoose = require('mongoose');
const { Schema } = mongoose;
const { goal, duration, itemType } = require('../../constants/foodPackage.constants');
const { LENGTH_REQUIRED } = require('http-status-codes');

const categories = {
  type: [
    {
      _id :{
        type: Schema.Types.ObjectId,
        ref: 'RestaurantCategory',
      },
      category: {
        type: String,
        default:""
      },
      totalItems: {
        type: [
          {
            itemName: {
              type: String,
            },
            calories: {
              type: String
            },
            carbs: {
              type: String
            },
            fat: {
              type: String
            },
            protein: {
              type: String
            },
            price: {
              type: Number
            },
            description: {
              type: String
            },
            type: {
              type: Number,
              enum: itemType  // VEG : 1, NON_VEG :2
            },
            image :{
              type: String,
              default:""
            }
          }
        ],
        default: []
      },
      substituteItems: {
        type: [
          {
            itemName: {
              type: String,
            },
            calories: {
              type: String
            },
            carbs: {
              type: String
            },
            fat: {
              type: String
            },
            protein: {
              type: String
            },

            price: {
              type: Number
            },
            description: {
              type: String
            },
            type: {
              type: Number,
              enum: itemType  // VEG : 1, NON_VEG :2
            },
            image :{
              type: String,
              default:""
            }
          }
        ],
        default: []
      },
    }
  ]
}

const restuarantPackageSchema = new Schema(
  {
    packageId: {
      type: String,
    },
    restId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
    },
    name: {
      type: String,
    },
    goal: {
      type: Number,
      enum: goal,        //GAIN_WEIGHT: 1,// LOSE_WEIGHT: 2,// MAINTAIN_WEIGHT: 3
    },
    categories: categories,
    totalItemsCalories :{
      type: Number,
      default: 0,
    },
    SubstituteItemsCalories :{
      type: Number,
      default: 0,
    },
    durations: {
      type: [
        {
          duration: {
            type: Number,
            enum: duration, // WEEKLY: 1, MONTHLY: 2
          },
          packagePrice: {
            type: Number,
            default: 0,
          },
        },
      ]
    },
    description: {
      type: String,
    },
    termsAndCondition: {
      type: String,
    },
    status: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
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
    image :{
      type: String,
      default:""
    }
  },
  {
    timestamps: true,
    strict: true,
    collection: 'restaurantPackage',
    versionKey: false,
  }
);

exports.RestaurantPackageModel = mongoose.model(
  'restaurantPackage',
  restuarantPackageSchema
);
