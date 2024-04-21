import chalk from 'chalk';
import Todo from '../models/TodoModel.js';
import Task from '../models/TaskModel.js'

class MongooseTodoManager {
    constructor() {
        this.TodoModel = Todo;
        this.TaskModel = Task;
    }

    async initialize(app = null) {
        
        return true;
    }

    async fetchTodos(user) {
        try {
            
            const allTodosBelongingToUser = await this.TodoModel.find({ belongsTo: user.id });
    
            
            const allTodoObjects = await Promise.all(allTodosBelongingToUser.map(async (element) => {
                const todoObject = element.toObject();
                
                const tasks = await this.fetchTasks(element._id);
                
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
            
            const allTasksBelongingToTodo = await this.TaskModel.find({ belongsTo: todoId });
            
            
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
        if (user) {
            
            const haveDuplicateTodo = await this.TodoModel.findOne({ belongsTo: user.id, task }).lean();
            if (!haveDuplicateTodo) {
                const newTodo = {
                    task: task, 
                    created_at: created_at,
                    belongsTo: user.id
                };
                
                const addedTodoDocument = await this.TodoModel.create(newTodo);
    
                if (addedTodoDocument) {
                    console.log(chalk.green.inverse('New todo added!'));
                    
                    const savedTodo = addedTodoDocument.toObject();
                    const todoId = savedTodo.id
                    if (!savedTodo.tasks) {
                        savedTodo.tasks = [];
                    }
    
                    await this.addTask(todoId, body, estimated_time, priority)
                    savedTodo.tasks.push(todoId)
                    return savedTodo;
                } else {
                    console.log(chalk.red.inverse('Error in db creating the new todo!'))
                    return null;
                }
            } else {
                console.log(chalk.red.inverse('Todo title taken!'))
            }
        } else {
            console.log(chalk.red.inverse('No user given!'))
        }
    
        return null;
    }

    async addTask(todoId, body, estimated_time, priority) {
        
        if (todoId) {
            
            const haveDuplicatetask = await this.TaskModel.findOne({ belongsTo: todoId }).lean();
            if (!haveDuplicatetask) {
                const newTask = {
                    priority: priority,
                    body: body,
                    estimated_time: estimated_time,
                    belongsTo: todoId
                };
                
                const addedTaskDocument = await this.TaskModel.create(newTask);

                if (addedTaskDocument) {
                    console.log(chalk.green.inverse('New Task added!'));
                    
                    const savedTask = addedTaskDocument.toObject();
                    return savedTask;
                } else
                    console.log(chalk.red.inverse('Error in db creating the new task!'))
            } else
                console.log(chalk.red.inverse('Task title taken!'))
        } else
            console.log(chalk.red.inverse('No user given!'))

        
        return null;

    }

    async removeTodo(user, id) {
        try {
            
            const selectedTodo = await this.TodoModel.findById(id);
    
            if (!selectedTodo) {
                console.log(chalk.red.inverse(`No todo found with id = ${id} !`));
                return null;
            }
    
            
            if (selectedTodo.belongsTo.toString() !== user.id) {
                console.log(chalk.red.inverse(`Todo id and user do not correlate! No deletion made!`));
                return null;
            }
    
            
            const removedTodoDocument = await this.TodoModel.findByIdAndDelete(id);
            console.log(chalk.green.inverse('Todo removed:', removedTodoDocument));
    
            
            await this.TaskModel.deleteMany({ belongsTo: id });
            console.log(chalk.green.inverse('Associated tasks removed'));
    
            return removedTodoDocument.toObject();
        } catch (error) {
            console.error(chalk.red.inverse('Error:', error));
            return null;
        }
    }

    async changeTodo(user, todo, priority, body, estimated_time) {

        
        const todoToChangeDocument = await this.TodoModel.findOne({ _id: todo.id, belongsTo: user.id });
    
        if (todoToChangeDocument) {
    
            
            const oldTask = todoToChangeDocument.task;
            
            let sameTaskTodo = null;
            if (oldTask != todo.task)
                
                sameTaskTodo = await this.TodoModel.findOne({ task: todo.task, belongsTo: user.id });
    
            if (!sameTaskTodo) {
                
                todoToChangeDocument.task = todo.task;
                console.log(chalk.green.inverse('Todo changed!'));
    
                const changedTodoDocument = await todoToChangeDocument.save();
                const childTasks = await this.TaskModel.find({ belongsTo: todo.id })
                for (const task of childTasks) {
                    task.priority = priority; 
                    task.body = body;
                    task.estimated_time = estimated_time;
                    await task.save()
                }
                
                return changedTodoDocument.toObject();
            } else
                console.log(chalk.red.inverse('Todo with same title exists for this user!'))
    
        } else
            console.log(chalk.red.inverse('Todo to change not found!'))
    
        
        return null;
    }
    
    async getTodoById(user, id) {
        try {
            
            const foundTodo = await this.TodoModel.findOne({ _id: id, belongsTo: user.id }).populate('tasks');
    
            if (foundTodo) {
                console.log(chalk.green.inverse('Got todo: ' + foundTodo.task));
                
                const todoObject = foundTodo.toObject();
                
                const todoId = id
                const task = await this.getTaskById(todoId); 
                if (task) {
                    todoObject.tasks = task; 
                }
                return todoObject;
            } else {
                console.log(chalk.red.inverse(`Todo not found with id =${id} !`))
                return null; 
            }
        } catch (error) {
            console.error(chalk.red.inverse('Error:', error));
            return null; 
        }
    }

    async getTaskById(todoId) {
        try {
            
            const foundTask = await this.TaskModel.findOne({ belongsTo: todoId });
            
            if (foundTask) {
                console.log(chalk.green.inverse('Got task: ' + foundTask.priority));
                
                return foundTask.toObject();
            } else {
                console.log(chalk.red.inverse(`Task not found for todo with id =${todoId} !`));
                return null; 
            }
        } catch (error) {
            console.error(chalk.red.inverse('Error:', error));
            return null; 
        }
    }

}

export default MongooseTodoManager;