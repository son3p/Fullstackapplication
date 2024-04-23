import chalk from 'chalk';
import Todo from '../models/TodoModel.js';

class MongooseTodoManager {
    constructor() {
        // For note manager, so that we remember the class used 
        this.TodoModel = Todo;
    }

    async initialize(app = null) {
        // No Initialization required in this class
        // return stats if somebody wants to check
        return true;
    }

    async fetchTodos(user) {
        try {
            // No lean here so we can use toObject
            //pick the user.id
            const allTodosBelongingToUser = await this.TodoModel.find({ belongsTo: user.id });
            // Convert mongoose _id to id
            const allTodoObjects = allTodosBelongingToUser.map(element => {
                return element.toObject()
            })
            console.log(chalk.blueBright.inverse('All Todos loaded'));
            return allTodoObjects
        } catch (e) {
            console.log(chalk.blueBright.inverse('Empty todos loaded'));
            return []
        }
    }

    async addTodo(user, todo, category, status, created_at) {
        // Check that we have a selected user
        if (user) {
            // The uniqueness for the title is now per user!
            //pick the user.id
            // The lean option autogenerates a pojo
            const haveDuplicateTodo = await this.TodoModel.findOne({ belongsTo: user.id, todo }).lean();
            if (!haveDuplicateTodo) {
                const newTodo = {
                    todo: todo, // or shorter just title
                    category: category,
                    status: status,
                    created_at: created_at,
                    belongsTo: user.id,
                    createdBy: user.id
                };
                // Here we get a database document back, we like to return a POJO, plain javascript object back so we stay neutral to the db tech.
                const addedTodoDocument = await this.TodoModel.create(newTodo);

                if (addedTodoDocument) {
                    console.log(chalk.green.inverse('New todo added!'));
                    // Convert from Mongoose to plain object
                    const savedTodo = addedTodoDocument.toObject();
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

    async removeTodo(user, id) {
        // The uniqueness for the note is id! Then check if user same as belongsTo
        // The populate is mongoose way of filling in the data for the child property,
        // in this case the 'belongsTo' property, when executing the query
        const selectedTodoById = await this.TodoModel.findById(id).populate('belongsTo');

        if (selectedTodoById) {
            // Here we security check that this note really belongs to the user!
            // How would YOU do if the user is the admin user? 
            if (selectedTodoById.belongsTo.id == user.id) {
                const removedTodoDocument = await this.TodoModel.findByIdAndDelete(id);
                console.log(chalk.green.inverse('Todo removed!' + removedTodoDocument));
                return removedTodoDocument.toObject();
            } else {
                console.log(chalk.red.inverse(`Todo id and user do not correlate! No deletion made!`))
                return null;
            }
        } else {
            console.log(chalk.red.inverse(`No todo found with id = ${id} !`))
            return null;
        }
    }

    async changeTodo(user, todo) {

        // Here we need to get the full document to be able to do save
        // Here we use mongoose to only select the combination of id and user, ie secured access
        // No lean() here so that we can use save
        //pick user.id
        const todoToChangeDocument = await this.TodoModel.findOne({ _id: todo.id, belongsTo: user.id });

        if (todoToChangeDocument) {

            // The title should be unique for user so check so that we do not already have
            // for this user a document with this title!
            const oldTodo = todoToChangeDocument.todo;
            // check so that we dont have an other note title with the same new title
            let sameTodoTodo = null;
            if (oldTodo != todo.todo)
                //pick user.id
                sameTodoTodo = await this.TodoModel.findOne({ todo: todo.todo, belongsTo: user.id });

            if (!sameTodoTodo) {
                // It is ok to change title for user
                todoToChangeDocument.todo = todo.todo;
                console.log(chalk.green.inverse('Todo changed!'));

                const changedTodoDocument = await todoToChangeDocument.save();
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
        const foundTodo = await this.TodoModel.findOne({ _id: id, belongsTo: user.id });

        if (foundTodo) {
            console.log(chalk.green.inverse('Got todo: ' + foundTodo.todo));
            // Convert to POJO
            return foundTodo.toObject();
        } else {
            console.log(chalk.red.inverse(`Todo not found with id =${id} !`))
        }

        return null;
    }

}

export default MongooseTodoManager;