class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const errorMiddlewares = (err, req, res, next) => {
    err.message = err.message || "Internal Server Error";
    err.statusCode = err.statusCode || 500;
    console.error(err);

    if(err.code === 11000) {
        err.message = `Duplicate value entered for ${Object.keys(err.keyValue)} field, please choose another value`;
        err.statusCode = 400;
    }

    if(err.name === "JsonWebTokenError") {
        err.message = "JSON Web Token is invalid, try again";
        err.statusCode = 400;
    }
    if(err.name === "TokenExpiredError") {
        err.message = "JSON Web Token is expired, try again";
        err.statusCode = 400;
    }
    if(err.name === "CastError") {
        err.message = `Resource not found. Invalid: ${err.path}`;
        err.statusCode = 400;
    }

    const errorMessage = err.errors? Object.values(err.errors).map(error => error.message).join(" "): err.message;
    return res.status(err.statusCode).json({
        success: false,
        message: errorMessage,
    });
}

export default ErrorHandler;    