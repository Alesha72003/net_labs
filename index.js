const express = require("express");
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const cookieParser = require('cookie-parser');
const redis = require("redis");
const connectRedis = require("connect-redis");
const Sequelize = require('sequelize');
const models = require('./models');


const RedisStore = connectRedis(session);
var wscts = {}

const app = express();

var expressWs = require('express-ws')(app);

let redisClient = redis.createClient({
  url: 'redis://forshielders.ru:6379',
  legacyMode: true
});
redisClient.connect()
  .then(() => console.log("Connected to redis!"))
  .catch((e) => {
    console.log("Cannot connect to redis", e);
    throw e;
  });

app.use(cookieParser());

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'secret$%^134',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize())
app.use(passport.session())

app.use(express.urlencoded({ extended: false }));
app.use(express.json())

passport.serializeUser((userObj, done) => { done(null, userObj) });
passport.deserializeUser((userObj, done) => { done (null, userObj) });
app.use(passport.authenticate('session'));

app.set("view engine", "hbs");

app.use('/css', express.static('css'));
app.use('/img', express.static('img'));

function mustAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    let params = new URLSearchParams();
    params.append("referer", req.originalUrl || '/')
    return res.status(401).send("401 NOT AUTHORIZED");
  }
  next();
}

async function checkAccessToTask(req, res, next) {
  let user = models.User.findOne({
    attributes: ['id'],
    where: {
        id: req.user.id
    },
    // TODO: исправить 
    include: {
        model: models.Group,
        attributes: ['id'],
        include: {
            model: models.Task,
            attributes: ['id'],
            where: {
                id: req.params.id
            }
        }
    }
  });
  if (user) {
    return next();
  }
  return res.status(403).send("Access denied");
}

app.post("/login", passport.authenticate('local'), async (req, res) => { 
  req.session.orders = (await models.Orders.findAll({where: {clientidy: req.user.id}})).GroupId;
  res.send({
    id: req.user.id, 
    username: req.user.username,
    canUpdate: true
  });
});

app.get("/login", (req, res) => {
  res.render("login.hbs", {
    message: req.session.messages ? req.session.messages.pop() : null,
    referer: req.query.referer || '/'
  });
});

app.use('/logout', (req, res) => {
  if (!req.user) {
    return res.send("OK");
  }
  req.logout(err => {
    if (err) { 
      return res.status(500).send(err);
    }
    return res.send("OK");
  });
});


app.get('/', (req, res) => {
  res.send('im finey')
})

app.listen(3080);
