import HttpStatus from 'http-status-codes';
export const sendSuccessResponse = (res, data, messageType , statusCode = HttpStatus.OK) => {
    const message = messageType;
    res.status(statusCode).json({
        success: true,
        message : message,
        data,
    });
};

export const sendErrorResponse = (res, messageType, statusCode = HttpStatus.INTERNAL_SERVER_ERROR) => {
    const message = messageType
    res.status(statusCode).json({
        success: false,
        message : message,
        data : []
    });
};
