import { isCelebrateError } from 'celebrate';

const errorHandler = {
  handleError() {
    const handleValidationError = (err, req, res, next) => {
      const code = 400;
      let details = [];
      if (err.details) {
        err.details.forEach((error) => {
          details.push(error.message);
        });
      }
      return res.status(code).json({
        success: false,
        message: details.join(', '), // Join messages into a single string
        data: {},
      });
    };

    return (err, req, res, next) => {
      if (isCelebrateError(err) || err.IsValidation) {
        handleValidationError(err, req, res, next);
      } else {
        next(err); // Pass non-validation errors to the default error handler
      }
    };
  },
};

export default errorHandler;
