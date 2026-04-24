const mongoose = require('mongoose');
const { Schema } = mongoose;
import { duration, goal, category, itemType } from '../../constants/foodPackage.constants';

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
   ],
   default: [] 
 }

const foodPackageSchema = new Schema(
   {
      packageId :{
         type: Schema.Types.ObjectId,
         ref: 'restaurantPackage',       
        },
      goal: {
         type: Number,
         default: goal.GAIN_WEIGHT,
         enum: goal,
      },
      duration: {
         type: Number,
         default: duration.WEEKLY,
         enum: duration,
      },
      price: {
         type: Number,
         default: 0,
      },
      termAndCondition: {
         type: String,
         default: '',
      },
      restaurants: {
         type:[
               {
                  _id : {
                     type: mongoose.Schema.Types.ObjectId,
                     ref: 'Restaurant',
                  },
                  status:{
                     type:Boolean,
                     default:false
                  },
                  categories: categories,
               },
            ]
         },
      name: {
         type: String,
         default: '',
      },
      description: {
         type: String,
         default: '',
      },
      image :{
        type: String,
        default:""
      },
      isDeleted: {
         type: Boolean,
         default: false,
      },
      upTo: {
         type: Number,
         default: 1,
      },
      status: {
         type: Boolean,
         default: true,
      },
      createdAt: {
         type: Number,
         default: () => new Date().getTime(),
      },
      updatedAt: {
         type: Number,
         default: () => new Date().getTime(),
      },
   },
   {
      strict: true,
      collection: 'foodPackage',
      timestamps: true,
      versionKey: false,
   }
);

exports.PackageFoodModel = mongoose.model('foodPackage', foodPackageSchema);
