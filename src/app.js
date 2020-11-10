const path = require('path');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cronTask = require('./middlewares/cron')

const app = express();

// conecction to db
mongoose.connect('mongodb://localhost/Gariboldi')
.then(db => console.log("Db Connected"))
.catch(err => console.log(err));

// Importing Routes
const index = require('./routes/index');
const { appendFileSync } = require('fs');

// Settings
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));

// Routes
app.use('/', index)

// Starting Server
app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
});

//Cron jobs
cronTask();
