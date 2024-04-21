import express from 'express';
import Authenticator from '../middlewares/auth/MongooseJwtApiAuthenticator.js'
import TodosApiController from '../apicontrollers/TodosApiController.js'
import TasksApiController from '../apicontrollers/TasksApiController.js';

const theTodosApiController = new TodosApiController();
const theTasksApiController = new TasksApiController();

// we need a router to chain them
const router = express.Router();
router.post("/:id/task", Authenticator.authenticateApi, theTasksApiController.create);
router.get("/:id/task", Authenticator.authenticateApi, theTasksApiController.list);
router.put("/:id/task/:childid", Authenticator.authenticateApi, theTasksApiController.update);
router.delete("/:id/task/:childid", Authenticator.authenticateApi, theTasksApiController.delete);

router.get("/", Authenticator.authenticateApi, theTodosApiController.list)
router.get("/:id", Authenticator.authenticateApi, theTodosApiController.detail)
//router.get("/", theNotesApiController.list)
router.post("/", Authenticator.authenticateApi, theTodosApiController.create);
router.put("/:id", Authenticator.authenticateApi, theTodosApiController.update);
router.delete("/:id", Authenticator.authenticateApi, theTodosApiController.delete);


export default router;