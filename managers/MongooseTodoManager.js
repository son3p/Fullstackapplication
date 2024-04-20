import chalk from 'chalk';
import Todo from '../models/TodoModel.js';
import Task from '../models/TaskModel.js'

class MongooseTodoManager {
    constructor() {
        // For note manager, so that we remember the class used 
        this.TodoModel = Todo;
        this.TaskModel = Task;
    }

    async initialize(app = null) {
        // No Initialization required in this class
        // return stats if somebody wants to check
        return true;
    }

    async fetchTodos(user) {
        try {
            // Find all todos belonging to the user
            const allTodosBelongingToUser = await this.TodoModel.find({ belongsTo: user.id });
    
            // Iterate over each todo
            const allTodoObjects = await Promise.all(allTodosBelongingToUser.map(async (element) => {
                const todoObject = element.toObject();
                // Fetch tasks for the current todo
                const tasks = await this.fetchTasks(element._id);
                // Add tasks to the todo object
                todoObject.tasks = tasks;
                return todoObject;
            }));
            
            console.log(chalk.blueBright.inverse('All Todos loaded'));
            return allTodoObjects;
        } catch (e) {
            console.log(chalk.blueBright.inverse('Empty todos loaded'));
            return [];
        }
    }

    async fetchTasks(todoId) {
        try {
            // Find all tasks belonging to the specified todoId
            const allTasksBelongingToTodo = await this.TaskModel.find({ belongsTo: todoId });
            
            // Convert tasks to plain objects
            const allTaskObjects = allTasksBelongingToTodo.map(element => {
                const taskObject = element.toObject();
                return taskObject;
            });
            
            return allTaskObjects;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    async addTodo(user, task, body, estimated_time, created_at, priority) {
        // Check that we have a selected user
        if (user) {
            // The uniqueness for the title is now per user!
            //pick the user.id
            // The lean option autogenerates a pojo
            const haveDuplicateTodo = await this.TodoModel.findOne({ belongsTo: user.id, task }).lean();
            if (!haveDuplicateTodo) {
                const newTodo = {
                    task: task, // or shorter just title
                    body: body,  // or shorter just body
                    estimated_time: estimated_time,
                    created_at: created_at,
                    belongsTo: user.id
                };
                // Here we get a database document back, we like to return a POJO, plain javascript object back so we stay neutral to the db tech.
                const addedTodoDocument = await this.TodoModel.create(newTodo);

                if (addedTodoDocument) {
                    console.log(chalk.green.inverse('New todo added!'));
                    // Convert from Mongoose to plain object
                    const savedTodo = addedTodoDocument.toObject();
                    const todoId = savedTodo.id
                    if (!savedTodo.tasks) {
                        savedTodo.tasks = [];
                    }
    
                    await this.addTask(todoId, priority)
                    savedTodo.tasks.push(todoId)
                    return savedTodo;
                } else
                    console.log(chalk.red.inverse('Error in db creating the new todo!'))
            } else
                console.log(chalk.red.inverse('Todo title taken!'))
        } else
            console.log(chalk.red.inverse('No user given!'))

        // here when something wrong
        return null;

    }

    async addTask(todoId, priority) {
        // Check that we have a selected user
        if (todoId) {
            // The uniqueness for the title is now per user!
            //pick the user.id
            // The lean option autogenerates a pojo
            const haveDuplicatetask = await this.TaskModel.findOne({ belongsTo: todoId }).lean();
            if (!haveDuplicatetask) {
                const newTask = {
                    priority: priority,
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
                console.log(chalk.red.inverse('Task title taken!'))
        } else
            console.log(chalk.red.inverse('No user given!'))

        // here when something wrong
        return null;

    }

    async removeTodo(user, id) {
        try {
            // Find the todo by ID
            const selectedTodo = await this.TodoModel.findById(id);
    
            if (!selectedTodo) {
                console.log(chalk.red.inverse(`No todo found with id = ${id} !`));
                return null;
            }
    
            // Check if the todo belongs to the user
            if (selectedTodo.belongsTo.toString() !== user.id) {
                console.log(chalk.red.inverse(`Todo id and user do not correlate! No deletion made!`));
                return null;
            }
    
            // Delete the todo
            const removedTodoDocument = await this.TodoModel.findByIdAndDelete(id);
            console.log(chalk.green.inverse('Todo removed:', removedTodoDocument));
    
            // Find and delete associated tasks
            await this.TaskModel.deleteMany({ belongsTo: id });
            console.log(chalk.green.inverse('Associated tasks removed'));
    
            return removedTodoDocument.toObject();
        } catch (error) {
            console.error(chalk.red.inverse('Error:', error));
            return null;
        }
    }

    async changeTodo(user, todo, priority) {

        // Here we need to get the full document to be able to do save
        // Here we use mongoose to only select the combination of id and user, ie secured access
        // No lean() here so that we can use save
        //pick user.id
        const todoToChangeDocument = await this.TodoModel.findOne({ _id: todo.id, belongsTo: user.id });
    
        if (todoToChangeDocument) {
    
            // The title should be unique for user so check so that we do not already have
            // for this user a document with this title!
            const oldTask = todoToChangeDocument.task;
            // check so that we dont have an other note title with the same new title
            let sameTaskTodo = null;
            if (oldTask != todo.task)
                //pick user.id
                sameTaskTodo = await this.TodoModel.findOne({ task: todo.task, belongsTo: user.id });
    
            if (!sameTaskTodo) {
                // It is ok to change title for user
                todoToChangeDocument.task = todo.task;
                todoToChangeDocument.body = todo.body;
                todoToChangeDocument.estimated_time = todo.estimated_time;
                console.log(chalk.green.inverse('Todo changed!'));
    
                const changedTodoDocument = await todoToChangeDocument.save();
                const childTasks = await this.TaskModel.find({ belongsTo: todo.id })
                for (const task of childTasks) {
                    task.priority = priority; // Use the priority parameter here
                    await task.save()
                }
                //Give back the changed as plain object
                return changedTodoDocument.toObject();
            } else
                console.log(chalk.red.inverse('Todo with same title exists for this user!'))
    
        } else
            console.log(chalk.red.inverse('Todo to change not found!'))
    
        // all paths except success comes here
        return null;
    }


    async getTodoById(user, id) {
        // On a query we can use lean to get a plain javascript object
        // Use mongoose criteria for id and belongsTo user
        //pick user.id
        const foundTodo = await this.TodoModel.findOne({ _id: id, belongsTo: user.id }).populate('tasks');

        if (foundTodo) {
            console.log(chalk.green.inverse('Got todo: ' + foundTodo.task + ':' + foundTodo.body + foundTodo.priority));
            // Convert to POJO
            return foundTodo.toObject();
        } else {
            console.log(chalk.red.inverse(`Todo not found with id =${id} !`))
        }

        return null;
    }

}

export default MongooseTodoManager;