import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';

// Read environment info from file .env
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

// IT IS NOT RECOMMENDED TO USE .env i production mode due to security
// We use it until we change to Azure settings
// add the .env to git ignore after that, the .env.local always in .gitignore

// If there is a .env.local use that one
//dotenv.config({ path: `.env.local`, override: true });
const environmentSettings = dotenv.config().parsed;
console.log(' Environment settings from .env : ', environmentSettings)
console.log('NODE_ENV:', process.env.NODE_ENV)

// Routers

import indexRouter from './routes/index.js'
import apiRouter from './routes/api.js'
import apiResponse from './helpers/apiResponse.js'


/**
* Create the express web part and connect the modules that is will use
* Express is a routing and middleware web framework that has minimal functionality of its own: 
* An Express application is essentially a series of middleware function calls.
*/
const app = express(); // Creates an Express web application. The express() function is a top-level function exported by the express module.


//don't show the log when it is test
if (process.env.NODE_ENV !== "test") {
	app.use(logger("dev"));
}

import { fileURLToPath } from 'node:url';
const filename = fileURLToPath(import.meta.url);
const dirname =  path.dirname(filename)

// view engine setup
app.set('views', path.join(dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(dirname, 'public')));


//To allow cross-origin requests
app.use(cors());

// =========================================================
// Setup Mongoose based database
// ---------------------------------------------------------

/**
* Infrastructures: Mongoose storage
*/
// Select Mongoose based db
import Storage from './storage/mongoDB/MongooseStorage.js'
await Storage.ConnectCreateAndSeed(app)

/**
* Middlewares: Mongoose/Passport authentication
*/
import AuthStrategy from './middlewares/auth/MongooseJwtApiAuthenticator.js'
// =========================================================
// Initialize the authentication middleware
// ---------------------------------------------------------
AuthStrategy.initialize(app);
// =========================================================

//Route Prefixes
//Route Prefixes
app.use("/", indexRouter);
app.use("/api", apiRouter);


// throw 404 if URL not found
app.all("*", function (req, res) {
	return apiResponse.notFoundResponse(res, "Page not found");
});
/*// catch 404 and forward to error handler
app.use(function (req, res, next) {
	// next(createError(404));
	return apiResponse.notFoundResponse(res, "Page not found");
});
*/

// error handler
app.use(function (err, req, res, next) {
	if (err.name == "UnauthorizedError") {
		return apiResponse.unauthorizedResponse(res, err.message);
	}
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

export default app;
