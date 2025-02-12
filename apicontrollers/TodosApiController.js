import { check, body, validationResult } from "express-validator";
import apiResponse from "../helpers/apiResponse.js";
import MongooseTodoManager from '../managers/MongooseTodoManager.js';


class TodosApiController {
    constructor() {
        this.TodoManager = new MongooseTodoManager();
    }
    /**
     * Converts to POJO
     */
    includeData(data) {
        // Here we can choose what data to include
        return {
            id: data.id,
            todo: data.todo,
            category: data.category,
            status: data.status,
            createdAt: data.createdAt,
            createdBy: data.createdBy,
        }
    }

    /**
     * Note List.
     * 
     * @returns {Object}
     */
    list = async (req, res) => {
        try {
            const allTodos = await this.TodoManager.fetchTodos(req.user);
            if (allTodos.length > 0) {
                const todos = allTodos.map(document => this.includeData(document));
                return apiResponse.successResponseWithData(res, "Operation success", todos);
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
     * @param {string}      todo
     * @param {string}      category
     * @param {string}      status 
     * @param {string}      created_at
      * 
     * @returns {Object}
     */
    create = [
        // a list of callbacks
        check("todo", "Todo must not be empty.").isLength({ min: 1 }).trim(),
        body("*").escape(),
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
                } else {
                    //Save note.
                    const createdTodo = await this.TodoManager.addTodo(
                        req.user, 
                        req.body.todo,
                        req.body.category,
                        req.body.status, 
                        req.body.created_at,
                    );
                    if (!createdTodo) {
                        return apiResponse.errorResponse(res, 'Could not create todo');
                    } else {
                        let todoData = this.includeData(createdTodo);
                        return apiResponse.successResponseWithData(res, "Todo add Success.", todoData);
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
 * @param {string}      todo 
 * @param {string}      category
 * @param {string}      status
 * 
 * @returns {Object}
 */
    update = [
        check("todo", "Todo must not be empty.").isLength({ min: 1 }).trim(),
        body("*").escape(),
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
                } else {
                    //pick the user.id
                    const foundTodo = await this.TodoManager.getTodoById(req.user, req.params.id);

                    if (foundTodo === null) {
                        return apiResponse.notFoundResponse(res, "Todo not exists with this id or You are not authorized ");
                    } else {
                        //update note.
                        const todo = {
                            todo: req.body.todo,
                            category: req.body.category,
                            status: req.body.status,
                            id: req.params.id
                        };

                        const updatedTodo = await this.TodoManager.changeTodo(req.user, todo);
                        if (!updatedTodo) {
                            return apiResponse.errorResponse(res, 'Could not update todo');
                        } else {
                            let todoData = this.includeData(todo);
                            return apiResponse.successResponseWithData(res, "Todo update Success.", todoData);
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
                const foundTodo = await this.TodoManager.getTodoById(req.user, req.params.id);
                if (foundTodo === null) {
                    return apiResponse.notFoundResponse(res, "Todo not exists with this id");
                } else {
                    //delete note.
                    const removedTodo = await this.TodoManager.removeTodo(req.user, req.params.id);
                    if (!removedTodo) {
                        return apiResponse.errorResponse(res, 'Could not delete the todo');
                    } else {
                        return apiResponse.successResponse(res, "Todo delete Success.");
                    }

                }

            } catch (err) {
                //throw error in json response with status 500. 
                return apiResponse.errorResponse(res, err);
            }
        }
    ]
}

export default TodosApiController;