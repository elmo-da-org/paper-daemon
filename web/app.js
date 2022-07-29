// Packages
const express = require('express');
const chalk = require('chalk');
const path = require('path');
const bodyparser = require('body-parser');
const session = require('express-session');
const app = express();
const port = 5210;
let cors = require("cors");

// Modules
const routing_module = require('./routes/routes');
const routing_module2 = require('./routes/requests');

const viewsPath = path.join(__dirname, './views')
const expiryDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

app.set('views', viewsPath);
app.set('view engine', 'ejs');
app.use(cors());
app.set('trust proxy', 1);
app.use(session({
	secret: 'SKMAHJODWHASJNMD785421984521jds421IsKW8AS82LPASOW',
	resave: true,
	saveUninitialized: true,
    expires: expiryDate,
    name: '_____s'
}));

app.use(bodyparser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use((req, res, next) => {
    if ((req.baseUrl + req.path) == ('/servers' || '/settings')) {
        if (req.session.loggedin) { 
            next();
        } else {
            res.redirect('/login')
            res.end();

            return;
        }
    } else {
        next();

        return;
    }
});
  
// custom error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

routing_module.createRoutes(app);
routing_module2.createRoutes(app);


app.listen(port, () => console.log(chalk.green('[SUCCESS-WEB] ') + chalk.reset(`Started Express.JS server on ${port}`)))