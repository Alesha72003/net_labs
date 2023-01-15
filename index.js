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

app.ws('/ws', async function(ws, req) {
  w = await ws
  wscts[req.user.id] = w
  Object.keys(wscts).forEach(element => {
    wscts[element].send(JSON.stringify({
      type: 'chat/userStatusUpdate',
      payload: {
        id: req.user.id,
        status: true
      }
    }))
  });
  
  ws.on('close', function() {
    Object.keys(wscts).forEach(element => {
      wscts[element].send(JSON.stringify({
        type: 'chat/userStatusUpdate',
        payload: {
          id: req.user.id,
          status: false
        }
      }))
    });
    delete wscts[req.user.id]
  });
});


app.get('/chat/:id', mustAuthenticated, checkAccessToTask, async function (req, res) {
  let data = await models.Message.findAll({
    where: {
      to: req.params.id
    },
    include: {
      model: models.User,
      attributes: ['id', 'username'],
    },
    order: [
      ["createdAt", "ASC"]
    ]
  });
  if (!data) {
    return res.status(404).send("Chat not found");
  }
  if (req.get("Accept").split(",")[0].trim() == 'application/json') {
    return res.send(data);
  }
});

app.delete('/chat/:id/:msg', mustAuthenticated, async (req, res) => {
  let record = await models.Message.findOne({
    attributes: ['id'],
    where: {
      id: req.params.msg
    }
  });

  if (!record) {
    return res.status(404).send("Message not found");
  }

  try {
    await record.destroy();
    try{
      wscts[req.params.id].send(JSON.stringify({
        type: 'chat/msgDeleted',
        payload: req.params.req
        
      }))
      console.log('->', newMessage)
    }
    catch{
      console.log("носок не наделся: нет второй ноги")
    }
    return res.send("Message deleted");
  } catch(err) {
    return res.status(500).send(err);
  }
})

app.post('/chat/:id', mustAuthenticated, async (req, res) => {
  // const to = req.params.id
  // const from = req.user.id
  const accepted = new Set(['text']);
  if (!Object.keys(req.body).map(el => accepted.has(el)).reduce((el, base) => base = base && el, true)) {
    let notAcceptedItems = Object.keys(req.body).filter(el => !accepted.has(el))
    return res.status(400).send(`'${notAcceptedItems.join('\', \'')}' is protected or not valid items`);
  }
  let newMessage
  try {
    newMessage = await models.Message.create({
      "from": req.user.id,
      "to": req.params.id,
      "text": req.body.text,
    }, {include: [models.User]});
    await newMessage.reload()
  } catch(err) {
    return res.status(500).send(err);
  }
  if(req.params.id > 0){
    try{
      wscts[req.params.id].send(JSON.stringify({
        type: 'chat/newMessage',
        payload: newMessage
        
      }))
      console.log('->', newMessage)
    }
    catch{
      console.log("носок не наделся: нет второй ноги")
    }
  }
  else{
    // по хорошему надо вытянуть, какой группы таска и кидать только им 
    Object.keys(wscts).filter(el => el != req.user.id).forEach(element => {
      wscts[element].send(JSON.stringify({
        type: 'chat/newMessage',
        payload: {...newMessage.dataValues, status: true}
      }))
      console.log('Отправил по сокету:', element, ' - ', newMessage)
    });
  }
  return res.status(201).send(newMessage);
});

app.listen(3080);
