import express from 'express';
import authRouter from './auth.js';
import todoRouter from './todos.js';

// app is a singleton, ie same for all
const app = express();
// No router here, use chain them

app.use("/auth/", authRouter);
app.use("/todos", todoRouter);

// If needed
export default app;