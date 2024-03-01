require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const connectDB = require('./server/config/db');
const session = require('express-session');
const path = require('path');
const { isActiveRoute } = require('./server/helpers/routeHelpers');

const app = express();
const PORT = 3000 || process.env.PORT;

// Connect to DB
connectDB();


app.use(express.urlencoded({extended: true})); 
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));  
   

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
    // cookie: { maxAge: new Date (Date.now() + (3600000))}
}))


app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

app.locals.isActiveRoute = isActiveRoute;

app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/admin'));

app.use((err, req, res, next) => {
    console.error(err.stack); // Выводит стек ошибки в консоль
    res.status(500).send('Что-то сломалось!');
});


app.listen(PORT, ()=>{
    console.log(`App listening on port ${PORT}`);
})