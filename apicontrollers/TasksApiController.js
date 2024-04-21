import { check, body, validationResult } from "express-validator";
import apiResponse from "../helpers/apiResponse.js";
import MongooseTaskManager from '../managers/MongooseTaskManager.js';


class TasksApiController {
    constructor() {
        this.TaskManager = new MongooseTaskManager();
    }
    /**
     * Converts to POJO
     */
    includeData(data) {
        // Here we can choose what data to include
        return {
            id: data.id,
            task: data.task,
            priority: data.priority,
            estimated_time: data.estimated_time,
            createdAt: data.createdAt,
        }
    }

    /**
     * Note List.
     * 
     * @returns {Object}
     */
    list = async (req, res) => {
        try {
            const todoId = req.params.id
            const allTasks = await this.TaskManager.fetchTasks(todoId);
            if (allTasks.length > 0) {
                const tasks = allTasks.map(document => this.includeData(document));
                return apiResponse.successResponseWithData(res, "Operation success", tasks);
            } else {
                return apiResponse.successResponseWithData(res, "Operation success", []);
            }
            //});
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.errorResponse(res, err);
        }
    }

    /**
     * Note Detail.
     * 
     * @param {string}      id
     * 
     * @returns {Object}
     */
    detail = async (req, res) => {
        try {
            const todo = await this.TodoManager.getTodoById(req.user, req.params.id);

            if (todo !== null) {
                let todoData = this.includeData(todo);
                return apiResponse.successResponseWithData(res, "Operation success", todoData);
            } else {
                return apiResponse.successResponseWithData(res, "Operation success", {});
            }
            //});
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.errorResponse(res, err);
        }
    }

    /**
     * Note Create.
     * 
     * @param {string}      task 
     * @param {string}      priority
     * @param {number}      estimated_time
     * @param {string}      created_at
      * 
     * @returns {Object}
     */
    create = [
        // a list of callbacks
        check("task", "Task must not be empty.").isLength({ min: 1 }).trim(),
        check("priority", "Body may be empty.").trim(),
        check("estimated_time", "Estimated time muust be a number").isNumeric(),
        body("*").escape(),
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
                } else {
                    //Save note.
                    const todoId = req.params.id
                    const createdTask = await this.TaskManager.addTask(
                        todoId, 
                        req.body.task, 
                        req.body.priority,
                        req.body.estimated_time,
                        req.body.created_at,
                        
                    );
                    if (!createdTask) {
                        return apiResponse.errorResponse(res, 'Could not create task');
                    } else {
                        let taskData = this.includeData(createdTask);
                        return apiResponse.successResponseWithData(res, "Task add Success.", taskData);
                    };
                }
            } catch (err) {
                //throw error in json response with status 500. 
                return apiResponse.errorResponse(res, err);
            }
        }
    ]

    /**
 * Note Update.
 * 
 * @param {string}      task 
 * @param {string}      priority
 * @param {number}      estimated_time
 * 
 * @returns {Object}
 */
    update = [
        check("task", "Task must not be empty.").isLength({ min: 1 }).trim(),
        check("priority", "Body may be empty.").trim(),
        check("estimated_time", "Estimated time muust be a number").isNumeric(),
        body("*").escape(),
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
                } else {
                    //pick the user.id
                    const todoId = req.params.id
                    const taskId = req.params.childid
                    const foundTask = await this.TaskManager.getTaskById(todoId, taskId);

                    if (foundTask === null) {
                        return apiResponse.notFoundResponse(res, "Task not exists with this id or You are not authorized ");
                    } else {
                        //update note.
                        const task = {
                            task: req.body.task,
                            priority: req.body.priority,
                            estimated_time: req.body.estimated_time,
                            id: taskId 
                        };

                        const updatedTask = await this.TaskManager.changeTask(task, todoId);
                        if (!updatedTask) {
                            return apiResponse.errorResponse(res, 'Could not update task');
                        } else {
                            let taskData = this.includeData(task);
                            return apiResponse.successResponseWithData(res, "Task update Success.", taskData);
                        }
                    }
                }
            } catch (err) {
                //throw error in json response with status 500. 
                return apiResponse.errorResponse(res, err);
            }
        }
    ]

    /**
     * Note Delete.
     * 
     * @param {string}      id
     * 
     * @returns {Object}
     */
    delete = [
        async (req, res) => {
            try {
                //k wNote.findById(req.params.id, function (err, foundNote) {
                    const todoId = req.params.id
                    const taskId = req.params.childid
                const foundTask = await this.TaskManager.getTaskById(todoId, taskId);
                if (foundTask === null) {
                    return apiResponse.notFoundResponse(res, "Task not exists with this id");
                } else {
                    //delete note.
                    const removedTask = await this.TaskManager.removeTask(todoId, taskId);
                    if (!removedTask) {
                        return apiResponse.errorResponse(res, 'Could not delete the Task');
                    } else {
                        return apiResponse.successResponse(res, "Task delete Success.");
                    }

                }

            } catch (err) {
                //throw error in json response with status 500. 
                return apiResponse.errorResponse(res, err);
            }
        }
    ]
}

export default TasksApiController;