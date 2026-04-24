require('dotenv').config();

var aws = require('aws-sdk');
var multer = require('multer');
const multerS3 = require('multer-s3');
import { db } from '../config/index';

aws.config.update({
    secretAccessKey: db.S3_SECRET_KEY,
    accessKeyId: db.S3_ACCESS_KEY,
    region: db.BUCKET_REGION
});

var s3 = new aws.S3();

let uploadAdmin = multer({
    storage: multerS3({
        s3: s3,
        bucket: db.BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        LocationConstraint: multerS3.AWS_DEFAULT_REGION,
        acl: 'private',
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname
            });
        },
        key: function (req, file, cb) {
            console.log("Original Image :", file.originalname);
            cb(null, "Uploads/Admin/" + Date.now() + "/" + file.originalname)

        }
    })
});

let uploadUser = multer({
    storage: multerS3({
        s3: s3,
        bucket: db.BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        LocationConstraint: multerS3.AWS_DEFAULT_REGION,
        acl: 'private',
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname
            });
        },
        key: function (req, file, cb) {
            // console.log("Original Image :", file.originalname);
            cb(null, "Uploads/User/" + Date.now() + "/" + file.originalname)

        }
    })
});

let uploadRestaurant = multer({
    storage: multerS3({
        s3: s3,
        bucket: db.BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        LocationConstraint: multerS3.AWS_DEFAULT_REGION,
        acl: 'private',
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname
            });
        },
        key: function (req, file, cb) {
            // console.log("Original Image :", file.originalname);
            cb(null, "Uploads/Restaurant/" + Date.now() + "/" + file.originalname)

        }
    })
});

let uploadGrocery = multer({
    storage: multerS3({
        s3: s3,
        bucket: db.BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        LocationConstraint: multerS3.AWS_DEFAULT_REGION,
        acl: 'private',
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname
            });
        },
        key: function (req, file, cb) {
            // console.log("Original Image :", file.originalname);
            cb(null, "Uploads/Restaurant/" + Date.now() + "/" + file.originalname)

        }
    })
});

let uploadDelivery = multer({
    storage: multerS3({
        s3: s3,
        bucket: db.BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        LocationConstraint: multerS3.AWS_DEFAULT_REGION,
        acl: 'private',
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname
            });
        },
        key: function (req, file, cb) {
            // console.log("Original Image :", file.originalname);
            cb(null, "Uploads/Delivery/" + Date.now() + "/" + file.originalname)

        }
    })
});

let uploadSupplement = multer({
    storage: multerS3({
        s3: s3,
        bucket: db.BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        LocationConstraint: multerS3.AWS_DEFAULT_REGION,
        acl: 'private',
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname
            });
        },
        key: function (req, file, cb) {
            // console.log("Original Image :", file.originalname);
            cb(null, "Uploads/Supplement/" + Date.now() + "/" + file.originalname)

        }
    })
});

let uploadGym = multer({
    storage: multerS3({
        s3: s3,
        bucket: db.BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        LocationConstraint: multerS3.AWS_DEFAULT_REGION,
        acl: 'private',
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname
            });
        },
        key: function (req, file, cb) {
            // console.log("Original Image :", file.originalname);
            cb(null, "Uploads/Gym/" + Date.now() + "/" + file.originalname)

        }
    })
});


exports.uploadFile = async (req, res, next) => {
    await upload.fields([
        {
            name: 'upload_file',
            maxCount: 5
        }
    ])
        (req, res, (err, some) => {
            if (err) {
                return res.status(422).send({
                    message: err.message,
                    response: null
                });
            }
            next();
        });
};

exports.uploadAdminFile = async (req, res, next) => {
    uploadAdmin.fields([
        {
            name: 'upload_admin_file',
            maxCount: 5
        },
        {
            name: 'upload_user_file',
            maxCount: 5
        }
    ])(req, res, (err, some) => {
        if (err) {
            return res.status(422).send({
                message: err.message,
                response: null
            });
        }
        next();
    });
};

exports.uploadUserFile = async (req, res, next) => {
    uploadUser.fields([
        {
            name: 'upload_user_file',
            maxCount: 15
        }
    ])
        (req, res, (err, some) => {
            if (err) {
                return res.status(422).send({
                    message: err.message,
                    response: null
                });
            }
            next();
        });
};

exports.uploadRestaurantFile = async (req, res, next) => {
    uploadRestaurant.fields([
        {
            name: 'upload_restaurant_file',
            maxCount: 15
        }
    ])
        (req, res, (err, some) => {
            if (err) {
                return res.status(422).send({
                    message: err.message,
                    response: null
                });
            }
            next();
        });
};
exports.uploadGroceryFile = async (req, res, next) => {
    uploadGrocery.fields([
        {
            name: 'upload_grocery_file',
            maxCount: 15
        }
    ])
        (req, res, (err, some) => {
            if (err) {
                return res.status(422).send({
                    message: err.message,
                    response: null
                });
            }
            next();
        });
};

exports.uploadDeliveryFile = async (req, res, next) => {
    uploadDelivery.fields([
        {
            name: 'upload_delivery_file',
            maxCount: 15
        }
    ])
        (req, res, (err, some) => {
            if (err) {
                return res.status(422).send({
                    message: err.message,
                    response: null
                });
            }
            next();
        });
};

exports.uploadSupplementFile = async (req, res, next) => {
    uploadSupplement.fields([
        {
            name: 'upload_supplement_file',
            maxCount: 15
        }
    ])
        (req, res, (err, some) => {
            if (err) {
                return res.status(422).send({
                    message: err.message,
                    response: null
                });
            }
            next();
        });
};

exports.uploadGymFile = async (req, res, next) => {
    uploadGym.fields([
        {
            name: 'upload_gym_file',
            maxCount: 15
        }
    ])
        (req, res, (err, some) => {
            if (err) {
                return res.status(422).send({
                    message: err.message,
                    response: null
                });
            }
            next();
        });
};




