/**
 * Disable if you like to use the memory based NoteManager
 * If using the MongooseNoteManager this has to be run
 */
import jwtSigner from "jsonwebtoken";
import passport from "passport";
// Strategies
import {ExtractJwt} from 'passport-jwt';
import {Strategy as JwtStrategy} from 'passport-jwt';

import UserModel from '../../models/UserModel.js';
import apiResponse from "../../helpers/apiResponse.js";

// Read environment info from file .env
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

// IT IS NOT RECOMMENDED TO USE .env i production mode due to security
// We use it until we change to Azure settings
// add the .env to git ignore after that, the .env.local always in .gitignore

// If there is a .env.local use that one
dotenv.config({ path: `.env.local`, override: true });
const environmentSettings = dotenv.config().parsed;
console.log(' Environment settings from .env : ', environmentSettings)
console.log('NODE_ENV:', process.env.NODE_ENV)



const JWTSecret = process.env.JWT_SECRET; 
const JWTIssuer = process.env.JWT_ISSUER; 

class MongooseJwtApiAuthenticator {
    constructor() {
    }

    // Will trigger the onJwtAuthentication callback above when called
    static authenticateApi = passport.authenticate('jwt', { session: false })
    
    static initialize(app) {

        /**
         * Use Mongoose strategy for SESSION COOKIE BASED AUTHENTICATION
         */
        /*passport.use(new LocalStrategy(UserModel.authenticate()));
        passport.serializeUser(UserModel.serializeUser());
        passport.deserializeUser(UserModel.deserializeUser());
        
        // Passport setup, only needed for session based
        app.use(passport.initialize());
        */

        /**
         * Use passport JWT strategy for JWT TOKEN BEARER AUTHENTICATION
         */
        // Options to specify for my JWT based strategy.
        const opts = {

            // Specifies how the jsonwebtoken should be extracted from the incoming request message
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            //Supply the secret key to be using within strategy for the sign-in.
            secretOrKey: JWTSecret
        }

        // Use the JWT Strategy for authentication
        passport.use(new JwtStrategy(opts, MongooseJwtApiAuthenticator.onJwtAuthenticate));

        console.log('MongooseJwtApiAuthenticator activated')

    }

    // This will be called when using jwt authentication
    // This is the method that really checks if the user exists in the db
    static onJwtAuthenticate(jwtPayload, done) {

        // The done is the callback provided by passport
        // Search the user with jwt.payload sub(ject) field
        UserModel.findOne({ _id: jwtPayload.sub })
            .then(user => {
                // User exist
                if (user) {
                    return done(null, user);
                }
                // User doesn't exist
                else {
                    return done(null, false);
                }
            })
            .catch(error => {
                return done(error, false);
            } )
    }

    // register a new user in the db
    static registerApi(req, res, next) {
        UserModel.register(new UserModel({
            username: req.body.username,
            email: req.body.email,
            isConfirmed: true, // to avoid mail required
        }), req.body.password, function (error, user) {

            if (error) {
                return apiResponse.errorResponse(res, error);
            }
            const userData = {
                id: user.id,
                username: user.username,
                email: user.email,
                isConfirmed: user.isConfirmed,
                createdAt: user.createdAt
            };

            return apiResponse.successResponseWithData(res, "Successful registration", userData);
        });
    }

    // Tries to login the user,which then will be given Bearer token which should be used in 
    // later calls to the api paths
    //Checks that a user exist with the correct hashed password, that the user isConfirmed and active (the status)
    static loginApi(req, res, next) {
        // Check so that the email exists and that the password is same as for the user
        UserModel.findOne({ username: req.body.username }).then(user => {
            if (user) {
                user.authenticate(req.body.password, function (error, authenticatedUser, passwordError) {
                    if (error)
                        return apiResponse.errorResponse(res, { error });
                    if (passwordError)
                        return apiResponse.unauthorizedResponse(res, passwordError);

                    //Check account confirmation.
                    if (authenticatedUser.isConfirmed) {
                        // Check User's account active or not.
                        if (authenticatedUser.status) {
                            // Only hardcode in dev mode, this so we can test with same user getting same token
                            const iatTimestamp = new Date('July 1, 2023, 12:00:00').getTime()
                            const expTimestamp = iatTimestamp + 1200;
                            const userData = {
                                username: authenticatedUser.username, //Add the username so the receiver can show it
                                iss: JWTIssuer,
                                sub: authenticatedUser.id,
                                // ONLY HARDCODE THESE IN DEVELOPMENT MODE
                                // THIS WILL GENERATE THE SAME TOKEN FOR THE SAME USER EVERYTIME
                                // IN PRODUCTION MODE LET THE LIBRARU GENERATE IT SO TOKENS ARE DIFFERENT ON EACH LOGIN
                                iat: iatTimestamp,
                                exp: expTimestamp
                            };
                            //Prepare JWT token for authentication
                            const jwtPayload = userData;

                            //Generated JWT token with Payload and secret.
                            const token = jwtSigner.sign(jwtPayload, JWTSecret);
                            
                            userData.token = token;


                            return apiResponse.successResponseWithData(res, "Successful login", userData);
                        } else {
                            return apiResponse.unauthorizedResponse(res, "Account is not active. Please contact admin.");
                        }
                    } else {
                        return apiResponse.unauthorizedResponse(res, "Account is not confirmed. Please confirm your account.");
                    }
                });

            } else {

                return apiResponse.unauthorizedResponse(res, "No user with that Username.");
            }
        });
    }
}


export default MongooseJwtApiAuthenticator;