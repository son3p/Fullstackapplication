import express from 'express';
// we need a router to chain them
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'API Todos' });
});

export default router;