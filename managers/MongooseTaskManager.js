import chalk from 'chalk';
import Task from '../models/TaskModel.js';

class MongooseTaskManager {
    constructor() {
        // For note manager, so that we remember the class used 
        this.TaskModel = Task;
    }

    async initialize(app = null) {
        // No Initialization required in this class
        // return stats if somebody wants to check
        return true;
    }

    async fetchTasks(todoId) {
        try {
            // No lean here so we can use toObject
            //pick the user.id
            const allTasksBelongingToTodo = await this.TaskModel.find({ belongsTo: todoId });
            // Convert mongoose _id to id
            const allTaskObjects = allTasksBelongingToTodo.map(element => {
                return element.toObject()
            })
            console.log(chalk.blueBright.inverse('All Tasks loaded'));
            return allTaskObjects
        } catch (e) {
            console.log(chalk.blueBright.inverse('Empty Tasks loaded'));
            return []
        }
    }

    async addTask(todoId, task, priority, estimated_time, created_at) {
        // Check that we have a selected user
        if (todoId) {
            // The uniqueness for the title is now per user!
            //pick the user.id
            // The lean option autogenerates a pojo
            const haveDuplicateTask = await this.TaskModel.findOne({ belongsTo: todoId, task }).lean();
            if (!haveDuplicateTask) {
                const newTask = {
                    task: task, // or shorter just title
                    priority: priority,
                    estimated_time: estimated_time,
                    created_at: created_at,
                    belongsTo: todoId
                };
                // Here we get a database document back, we like to return a POJO, plain javascript object back so we stay neutral to the db tech.
                const addedTaskDocument = await this.TaskModel.create(newTask);

                if (addedTaskDocument) {
                    console.log(chalk.green.inverse('New Task added!'));
                    // Convert from Mongoose to plain object
                    const savedTask = addedTaskDocument.toObject();
                    return savedTask;
                } else
                    console.log(chalk.red.inverse('Error in db creating the new task!'))
            } else
                console.log(chalk.red.inverse('Task task taken!'))
        } else
            console.log(chalk.red.inverse('No user given!'))

        // here when something wrong
        return null;

    }

    async removeTask(todoId, taskId) {
        // The uniqueness for the note is id! Then check if user same as belongsTo
        // The populate is mongoose way of filling in the data for the child property,
        // in this case the 'belongsTo' property, when executing the query
        const selectedTaskById = await this.TaskModel.findById(taskId).populate('belongsTo');

        if (selectedTaskById) {
            // Here we security check that this note really belongs to the user!
            // How would YOU do if the user is the admin user? 
            if (selectedTaskById.belongsTo.id == todoId) {
                const removedTaskDocument = await this.TaskModel.findByIdAndDelete(taskId);
                console.log(chalk.green.inverse('Task removed!' + removedTaskDocument));
                return removedTaskDocument.toObject();
            } else {
                console.log(chalk.red.inverse(`Todo id and task id do not correlate! No deletion made!`))
                return null;
            }
        } else {
            console.log(chalk.red.inverse(`No task found with id = ${taskId} !`))
            return null;
        }
    }

    async changeTask(task, todoId) {

        // Here we need to get the full document to be able to do save
        // Here we use mongoose to only select the combination of id and user, ie secured access
        // No lean() here so that we can use save
        //pick user.id
        const taskToChangeDocument = await this.TaskModel.findOne({ _id: task.id, belongsTo: todoId });

        if (taskToChangeDocument) {

            // The title should be unique for user so check so that we do not already have
            // for this user a document with this title!
            const oldTask = taskToChangeDocument.task;
            // check so that we dont have an other note title with the same new title
            let sameTodoTask = null;
            if (oldTask == task.task)
                //pick user.id
                sameTodoTask = await this.TaskModel.findOne({ _id: task.id, belongsTo: todoId });

            if (!sameTodoTask) {
                // It is ok to change title for user
                taskToChangeDocument.task = task.task;
                taskToChangeDocument.estimated_time = task.estimated_time;
                taskToChangeDocument.priority = task.priority;
                console.log(chalk.green.inverse('Task changed!'));

                const changedTaskDocument = await taskToChangeDocument.save();
                //Give back the changed as plain object
                return changedTaskDocument.toObject();
            } else
                console.log(chalk.red.inverse('Task with same task exists for this user!'))

        } else
            console.log(chalk.red.inverse('Task to change not found!'))

        // all paths except success comes here
        return null;
    }


    async getTaskById(todoId, taskId) {
        try {
            // On a query we can use lean to get a plain JavaScript object
            // Use mongoose criteria for id and belongsTo user
            const foundTask = await this.TaskModel.findOne({ _id: taskId, belongsTo: todoId });
    
            if (foundTask) {
                console.log(chalk.green.inverse('Got task: ' + foundTask.task));
                // Convert to POJO
                return foundTask.toObject();
            } else {
                console.log(chalk.red.inverse(`Task not found with id =${taskId} or You are not authorized!`));
                return null;
            }
        } catch (err) {
            console.log(chalk.red.inverse('Error while fetching task:', err));
            return null;
        }
    }

}

export default MongooseTaskManager;