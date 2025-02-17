const express = require('express');
const cors = require('cors');
// import postRouter from './routers/post.router'
const postRouter = require('./routers/post.router');
// import userRouter from './routers/user.router'
const userRouter = require('./routers/user.router')
const timelineRouter = require('./routers/timeline.router');

const dotenv = require('dotenv');
dotenv.config();
// import { dbConnect } from './configs/database.config'
const { dbConnect } = require('./configs/database.config');
// import timelineRouter from './routers/timeline.router';

dbConnect(); //后端运行时会尝试连接数据库

const app = express();

app.use(cors({
    credentials: true,
    origin: ["http://localhost:4200"]
}));
app.use(express.json());

console.log('aaa', typeof postRouter);

app.use("/api/posts", postRouter);
app.use("/api/users", userRouter);
app.use("/api/timeline", timelineRouter);





const port = process.env.PORT || 3000;
console.log("port", port);
app.listen(port, () => {
    console.log("Website served on http://localhost:" + port);
})