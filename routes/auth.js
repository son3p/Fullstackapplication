import express from 'express';
import AuthApiController from "../apicontrollers/AuthApiController.js";

// we need a router to chain them
const router = express.Router();

router.post("/register", AuthApiController.register);
router.post("/login", AuthApiController.login);

export default router;