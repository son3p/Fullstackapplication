import mongoose from 'mongoose'

import User from '../../models/UserModel.js';
import Todo from '../../models/TodoModel.js';

// suppress the warning
mongoose.set('strictQuery', false);

class MongooseStorage {
    constructor({
        host = 'localhost',
        port = 27017,
        dbname,
        useSSL,
        replicaSet,
        auth,

    }) {
        this.host = host;
        this.port = port;
        this.dbname = dbname;
        this.useSSL = useSSL;
        this.replicaSet = replicaSet;
        this.auth = auth;

        this.mongoose = mongoose;
        this.connection = null;
    }

    static async ConnectCreateAndSeed(app) {
        /**
         * Create the MongDB 6connection and assign the service to the app if needed
         */
        try {

            let auth = null;
            if (process.env.MONGODB_AUTH_USERNAME && process.env.MONGODB_AUTH_PASSWORD) {
                auth = {
                    username: process.env.MONGODB_AUTH_USERNAME,
                    password: process.env.MONGODB_AUTH_PASSWORD
                }
                // Running with auth
                app.mongooseStorage = new MongooseStorage({
                    host: process.env.MONGODB_HOST,
                    port: process.env.MONGODB_PORT,
                    dbname: process.env.MONGODB_DBNAME,
                    auth,
                    useSSL: true,
                    replicaSet: 'globaldb'

                });
                
            } else {
                // Running locally
                app.mongooseStorage = new MongooseStorage({
                    host: process.env.MONGODB_HOST,
                    port: process.env.MONGODB_PORT,
                    dbname: process.env.MONGODB_DBNAME,
                });
            }
            await app.mongooseStorage.connect({}); // do not seed before passport is run!

            /**
              * Seed the database, if needed, with some default data.
              * Passport need to be setup before, due to creating Users.
              */
            await app.mongooseStorage.seed();

        } catch (error) {
            console.log('mongooseStorage error! Exiting program.');
            console.error(error);
            // Bail out if problems with the database connection
            return;
        }


    }

    async connect({ host = null, port = null, useSSL = null, replicaSet = null, auth = null, dbname = null }) {
        // Override if set
        if (host)
            this.host = host;
        if (port)
            this.port = port;
        if (useSSL)
            this.useSSL = useSSL;
        if (replicaSet)
            this.replicaSet = replicaSet;
        if (auth)
            this.auth = auth;
        if (dbname)
            this.dbname = dbname;

        let connectionString = `${this.host}:${this.port}/${this.dbname}`;

        if (this.useSSL)
            connectionString = connectionString + `?ssl=true`;
        if (this.replicaSet)
            connectionString = connectionString + `&replicaSet=${this.replicaSet}`;


        const connectionUrl = `mongodb://${connectionString}`;

        if (this.connection) {
            throw new Error(`Already connected to database called ${this.dbname}`);
        }

        try {
            this.mongoose.connect(connectionUrl, {
                auth: this.auth,
                retryWrites: false
            })

            this.connection = this.mongoose.connection;
            this.setupEventHandlers();

            return this.connection;
        } catch (error) {
            console.log('Error in mongooseStorage.connect():', error);
            throw error;
        };

    }

    setupEventHandlers() {
        if (!this.connection) {
            throw new Error('No connection.');
        }

        this.mongoose.connection.on('connected', async () => {
            console.info(`Mongoose connected to ${this.dbname}`)
        });

        this.connection.on('disconnected', async () => {
            console.info(`Mongoose disconnected from ${this.dbname}`)
        });

        this.connection.on('open', async () => {
            console.info(`Mongoose opened database ${this.dbname}`)
        });

        this.connection.on('error', async (error) => {
            console.error('Mongoose connection error:', error);
        });
    }

    async seed() {
        // Initialize database
        const users = await User.find({});

        if (users.length == 0) {
            console.log(`Seeding data to ${this.dbname}`)
            /* REGISTER SOME USERS */
            const admin = await User.register({ username: 'admin', email: 'admin@n.fi', isConfirmed: true, }, 'noviaadmin');
            const quest = await User.register({ username: 'quest', email: 'quest@n.fi', isConfirmed: true, }, 'noviaquest');

            const adminTitle = 'admin work';
            const adminWorkTodo = await Todo.create({ task: adminTitle, body: 'read the text again', belongsTo: admin });

            const questTitle1 = 'quest work 1';
            const questTitle2 = 'quest work 2';
            await Todo.create({ task: questTitle1, body: 'read the text again', belongsTo: quest });
            await Todo.create({ task: questTitle2, body: 'read the text again', belongsTo: quest });

            console.log(`Database ${this.dbname} seeded`);
        } else
            console.log(`Database ${this.dbname} alredy has users, so no data seeded`)

    }
}

export default MongooseStorage;