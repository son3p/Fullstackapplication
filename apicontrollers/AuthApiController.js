import { check, body, validationResult } from "express-validator";

//helper file to prepare responses.
import apiResponse from "../helpers/apiResponse.js";
import Authenticator from '../middlewares/auth/MongooseJwtApiAuthenticator.js';

import UserModel from "../models/UserModel.js";

class AuthApiController {
	/**
	 * User registration.
	 *
	 * @param {string}      username
	 * @param {string}      email
	 * @param {string}      password
	 *
	 * @returns {Object}
	 */
	static register = [
		// Validate fields.
		check("username").isLength({ min: 1 }).trim().withMessage("Username must be specified.")
			.isAlphanumeric().withMessage("Username has non-alphanumeric characters."),
		check("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
			.isEmail().withMessage("Email must be a valid email address.").custom(async (value) => {
				try {
					const user = await UserModel.findOne({ email: value }).lean();
					if (user) {
						return ("E-mail already in use");
					}
				} 
				catch(error) {
					return error;
				}
			}),
		check("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
		// Sanitize fields.
		body("username").escape(),
		body("email").escape(),
		body("password").escape(),
		// Process request after validation and sanitization.
		(req, res, next) => {
			try {
				// Extract the validation errors from a request.
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					// Display sanitized values/errors messages.
					return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
				} else {

					Authenticator.registerApi(req, res, next);

				}
			} catch (error) {
				//throw error in json response with status 500.
				return apiResponse.errorResponse(res, error);
			}
		}];

	/**
	 * User login.
	 *
	 * @param {string}      email
	 * @param {string}      password
	 *
	 * @returns {Object}
	 */
	static login = [
		check("username").isLength({ min: 1 }).trim().withMessage("Username must be specified."),
		check("password").isLength({ min: 1 }).trim().withMessage("Password must be specified."),
		body("username").escape(),
		body("password").escape(),
		(req, res, next) => {
			try {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
				} else {
					Authenticator.loginApi(req, res, next);
				}
			} catch (err) {
				return apiResponse.errorResponse(res, err);
			}

		}
	];

}

export default AuthApiController;
