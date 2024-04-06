import express from 'express';
import Authenticator from '../middlewares/auth/MongooseJwtApiAuthenticator.js'
import TodosApiController from '../apicontrollers/TodosApiController.js'

const theTodosApiController = new TodosApiController();

// we need a router to chain them
const router = express.Router();

router.get("/", Authenticator.authenticateApi, theTodosApiController.list)
//router.get("/", theNotesApiController.list)
router.post("/", Authenticator.authenticateApi, theTodosApiController.create);
router.put("/:id", Authenticator.authenticateApi, theTodosApiController.update);
router.delete("/:id", Authenticator.authenticateApi, theTodosApiController.delete);


export default router;