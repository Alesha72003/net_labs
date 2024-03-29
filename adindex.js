const express = require("express");
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const cookieParser = require('cookie-parser');
const redis = require("redis");
const connectRedis = require("connect-redis");
const Sequelize = require('sequelize');
const models = require('./models');
const crypto = require('crypto');
const { Op } = require("sequelize");


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

passport.use(new LocalStrategy(function verify(username, password, cb) {
  models.User.findOne({
    where: {
      username
    }
  }).then(function(user) {
    if (!user) {
      return cb(null, false, { message: 'Incorrect username or password.' });
    }

    let hash = crypto.createHash('sha256').update(password).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(user.passwordhash), Buffer.from(hash))) {
      return cb(null, false, { message: 'Incorrect username or password.' });
    }
    return cb(null, user);
  }, err => cb(err));
}));

app.get('/catalog', async (req, res) => {
  console.log(req.query);
  let whereClause = {}
  if (req.query.title) {
    whereClause.name = {
      [Sequelize.Op.like]: `%${req.query.title}%`
    }
  }
  if ((req.query.min_price && !Number.isNaN(Number(req.query.min_price))) || (req.query.max_price && !Number.isNaN(Number(req.query.max_price)))) {
    whereClause.price = {};
  }
  if (req.query.min_price && !Number.isNaN(Number(req.query.min_price))) {
    whereClause.price[Op.gte] = Number(req.query.min_price);
  }
  if (req.query.max_price && !Number.isNaN(Number(req.query.max_price))) {
    whereClause.price[Op.lte] = Number(req.query.max_price);
  }
  console.log(whereClause);
  let data = await models.Stafs.findAll({
    where: whereClause,
    order: [
      ['id', 'ASC']
    ],
    ...req.query.count && !Number.isNaN(Number(req.query.count)) ? {limit: Number(req.query.count)} : {}
  });
  return res.send(data);
});


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

app.get('/client/:id', mustAuthenticated, async (req, res) => {
  let data = await models.User.findOne({
    attributes: ['id', 'username'],
    where: {
      id: req.params.id
    },
    include: {
      model: models.Group,
      attributes: ['id', 'name'],
      required: true
    }
  });
  if (!data) {
    return res.status(404).send("Not found");
  }
  return res.send(data.dataValues);
});

app.post("/login", passport.authenticate('local'), async (req, res) => { 
  req.session.orders = (await models.Orders.findAll({where: {ClientId: req.user.id}})).GroupId;
  res.send({
    id: req.user.id, 
    username: req.user.username,
    canUpdate: true
  });
});

app.post("/registration", async (req, res) => { 
  let user, cart;
  try{
  user = await models.User.create({
    username: req.body.username,
    passwordhash: crypto.createHash('sha256').update(req.body.password).digest("hex")
  });

  user.reload()

  cart = await models.Orders.create({
    id: -user.dataValues.id,
    ClientId : user.dataValues.id
  })
  }
  catch(err){
    return res.status(501).send('Извините, все пошло по пизде, попробуйте еще раз\n' + err + ' peepeepoopo ' + user);
  }
  
  return res.status(200).send(cart);
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
  res.send('im fine')
})

app.get('/client', (req, res) => {
  if (req.user) {
    return res.send({
      id: req.user.id,
      username: req.user.username,
      canUpdate: true
    });
  }
  return res.status(401).send("Not authenticated");
});

app.put('/client/:id', mustAuthenticated, async (req, res) => {
  if (req.user.id != req.params.id) {
    return res.status(403).send("Access denied");
  }
  const accepted = new Set(['username', 'password']);
  if (!Object.keys(req.body).map(el => accepted.has(el)).reduce((el, base) => base = base && el, true)) {
    let notAcceptedItems = Object.keys(req.body).filter(el => !accepted.has(el))
    return res.status(400).send(`'${notAcceptedItems.join('\', \'')}' is protected or not valid items`);
  }
  let record = await models.User.findOne({
    attributes: ['id'],
    where: {
      id: req.params.id
    }
  });
  if ('password' in req.body) {
    req.body.passwordhash = crypto.createHash('sha256').update(req.body.password).digest("hex");
    delete req.body.password;
  }

  try {
    record.update(req.body);
  } catch(err) {
    return res.status(500).send(err);
  }

  return res.status(200).send('OK');
});

app.get('/cart', mustAuthenticated, async (req, res) => {
  let positions = await models.OrdersToStafs.findAll({
    attributes: ['StafId'],
    where: {
      OrderId: -req.user.id
    }
  })
  data = []
    //console.log(positions[0].dataValues.idstaf)
    data = await Promise.all(positions.map(async el => await models.Stafs.findOne({
      attributes: ['id', 'name', 'price', 'photo'],
      where: {
        id: el.dataValues.StafId
      }
    })));

  if (!data) {
    return res.status(201).send([]);
  }
  res.send(data);
})

app.get('/order/:id', mustAuthenticated, async (req, res) => { //два запроса?
  let positions = await models.OrdersToStafs.findAll({
    attributes: ['StafId'],
    where: {
      OrderId: req.params.id
    }
  })

    data = []
    
    //console.log(positions[0].dataValues.idstaf)
    data = await Promise.all(positions.map(async el => await models.Stafs.findOne({
      attributes: ['id', 'name', 'price', 'photo'],
      where: {
        id: el.dataValues.StafId
      }
    })));

  if (!data) {
    return res.status(404).send('wrong request');
  }
  res.send(data.map(el => el.dataValues));
})


app.get('/myorders', mustAuthenticated, async (req, res) => {
  console.log(req.user)
  let data = await models.Orders.findAll({
    attributes: ['id', 'createdAt'],
    where: {
      ClientId: req.user.id,
      [Sequelize.Op.not]: {
        id: -req.user.id
      }
    }
  })
  res.send(data)
})

app.get('/staf/:id', async (req, res) => {
  let data = await models.Stafs.findOne({
    attributes: ['id', 'name', 'price', 'photo'],
    where: {
      id: req.params.id
    }
  })
  res.send(data)
})

app.post('/staf/:id', mustAuthenticated, async (req, res) => {
  let record = await models.Orders.findOne({
    attributes: ['id'],
    where: {
      id: -req.user.id
    }
  });
  if(!record){
    return res.status(228).send("Ты падаль, я тебя не знаю и не уважаю");
  }
  try {
    let itemtocart = await models.OrdersToStafs.create({
      OrderId: -req.user.id,
      StafId: req.params.id
    });
    return res.status(201).send(itemtocart);
  } 
  catch(err) {
    return res.status(500).send(err);
  }
})

app.post('/rmstaf/:id', mustAuthenticated, async (req, res) => {
  let record = await models.OrdersToStafs.findOne({
    attributes: ['id', 'OrderId', 'StafId'],
    where: {
      OrderId: -req.user.id,
      StafId: req.params.id
    }
  });

  if (!record) {
    return res.status(404).send("Item not found");
  }
  await record.destroy();
  try {
    await record.destroy();
    return res.status(200).send("Item deleted")
  }
  catch(err){
    return res.status(500).send(err);
  }

})

app.post('/createorder', mustAuthenticated, async (req, res) => {
  let newTask = await models.Task.create({
    taskname: `Заказ клиента ${req.user.id}`,
    GroupId: 2,
    status: 'NEW'
  })
  let newOrder = await models.Orders.create({
    ClientId : req.user.id
  })
  let itemsFromCart = await models.OrdersToStafs.findAll({
    attributes: ['id', 'OrderId'],
    where:{
      OrderId: -req.user.id
    }
  })
  itemsFromCart.map(el => el.update({OrderId: newOrder.id}))
  return res.status(201).send({id: newOrder.id})
})

app.listen(3090);
