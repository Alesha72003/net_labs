const express = require("express");
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const { Client } = require('pg')
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const Sequelize = require('sequelize');
const models = require('./models');

const { createProxyMiddleware } = require('http-proxy-middleware');
const adminGroupId = 1;

const app = express();

app.use(cookieParser());

app.use(session({
  secret: "secret",
  resave: false ,
  saveUninitialized: true ,
}))

const permissions = {
  1: createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }),
  2: createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }),
}

app.use(passport.initialize())
app.use(passport.session())

app.use("/admin", mustAuthenticated, async (req, res, next) => {
  if (permissions[req.session.middlewareGroup]) {
    permissions[req.session.middlewareGroup](req, res);
  } else {
    return res.status(403).send("Access denied");
  }
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json())

passport.use(new LocalStrategy(function verify(username, password, cb) {
  models.User.findOne({
    where: {
      username
    },
    include: {
      model: models.Group,
      attributes: ["id", "name"]
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

passport.serializeUser((userObj, done) => { done(null, userObj) });
passport.deserializeUser((userObj, done) => { done (null, userObj) });
app.use(passport.authenticate('session'));

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

app.set("view engine", "hbs");

app.use('/css', express.static('css'));
app.use('/img', express.static('img'));

app.post("/login", passport.authenticate('local'), async (req, res) => { 
  req.session.middlewareGroup = (await models.User_Group.findOne({where: {UserId: req.user.id}, order: [['GroupId', 'ASC']]})).GroupId;
  res.send({
    id: req.user.id, 
    username: req.user.username,
    admin: Boolean(req.session.middlewareGroup),
    canUpdate: true,
    Groups: req.user.Groups
  });
});

app.get("/login", (req, res) => {
  res.render("login.hbs", {
    message: req.session.messages ? req.session.messages.pop() : null,
    referer: req.query.referer || '/'
  });
});

// app.use('/logout', function (req, res, next) {
//   if (!req.user) {
//     return res.redirect('/');
//   }
//   req.logout(function(err) {
//     if (err) { return next(err); }
//   });
//   res.redirect('/login');
// });

app.use('/logout', (req, res) => {
  if (!req.user) {
    return res.send("OK");
  }
  req.logout(err => {
    if (err) { 
      return res.status(500).send(err);
    }
    return res.send("OK")
  });
});

app.get('/task/:id', mustAuthenticated, checkAccessToTask, async function (req, res) {
  let data = await models.Task.findOne({
    where: {
      id: req.params.id
    },
    include: {
      model: models.Group,
      attributes: ['id', 'name'],
    }
  });
  if (!data) {
    res.status(404).send("Task not found");
  }
  if (req.get("Accept").split(",")[0].trim() == 'application/json') {
    return res.send(data);
  }
  return res.render("task", data.dataValues);
});

app.put('/task/:id', mustAuthenticated, checkAccessToTask, async (req, res) => {
  const accepted = new Set(['taskname', 'description', 'status', 'GroupId', 'deadlineAt']);
  if (!Object.keys(req.body).map(el => accepted.has(el)).reduce((el, base) => base = base && el, true)) {
    let notAcceptedItems = Object.keys(req.body).filter(el => !accepted.has(el))
    return res.status(400).send(`'${notAcceptedItems.join('\', \'')}' is protected or not valid items`);
  }
  let record = await models.Task.findOne({
    attributes: ['id'],
    where: {
      id: req.params.id
    }
  });
  if (!record) {
    res.status(404).send("Not found record");
  }

  try {
    record.update(req.body);
  } catch(err) {
    return res.status(500).send(err);
  }

  return res.status(200).send('OK');
});

app.post('/task/create', mustAuthenticated, async (req, res) => {
  const accepted = new Set(['taskname', 'description', 'status', 'GroupId', 'deadlineAt']);
  if (!Object.keys(req.body).map(el => accepted.has(el)).reduce((el, base) => base = base && el, true)) {
    let notAcceptedItems = Object.keys(req.body).filter(el => !accepted.has(el))
    return res.status(400).send(`'${notAcceptedItems.join('\', \'')}' is protected or not valid items`);
  }
  try {
    let newtask = await models.Task.create(req.body);
    return res.status(201).send(newtask);
  } catch(err) {
    return res.status(500).send(err);
  }
});

app.delete('/task/:id', mustAuthenticated, checkAccessToTask, async (req, res) => {
  let record = await models.Task.findOne({
    attributes: ['id'],
    where: {
      id: req.params.id
    }
  });

  if (!record) {
    return res.status(404).send("Task not found");
  }

  try {
    await record.destroy();
    return res.send("Task deleted");
  } catch(err) {
    return res.status(500).send(err);
  }
})

app.get('/user/:id', mustAuthenticated, async (req, res) => {
  let data = await models.User.findOne({
    attributes: ['id', 'username'],
    where: {
      id: req.params.id
    },
    include: {
      model: models.Group,
      attributes: ['id', 'name'],
      required: true,
      include: req.params.id == req.user.id ? null : {
        model: models.User,
        attributes: ['id'],
        required: true,
        where: req.user.id
      }
    }
  });
  if (!data) {
    return res.status(404).send("Not found");
  }
  data.dataValues.Groups = data.dataValues.Groups.map(el => ({id: el.id, name: el.name}));
  return res.send(data.dataValues);
});

app.put('/user/:id', mustAuthenticated, async (req, res) => {
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

app.delete('/user/:id', mustAuthenticated, async (req, res) => {
  if (req.user.id != req.params.id) {
    return res.status(403).send("Access denied");
  }

  let record = await models.User.findOne({
    attributes: ['id'],
    where: {
      id: req.params.id
    }
  });
  try {
    await record.destroy();
    req.logout(function(err) {
      console.log(err);
    });
    res.send("OK");
  } catch(err) {
    res.status(500).send(err);
  }

});

app.post('/user/signup', async (req, res) => {
  const accepted = new Set(['username', 'password']);
  if (!Object.keys(req.body).map(el => accepted.has(el)).reduce((el, base) => base = base && el, true)) {
    let notAcceptedItems = Object.keys(req.body).filter(el => !accepted.has(el))
    return res.status(400).send(`'${notAcceptedItems.join('\', \'')}' is protected or not valid items`);
  }
  if (!req.body.username || !req.body.password) {
    return res.status(400).send("username and password must be in request");
  }
  req.body.passwordhash = crypto.createHash('sha256').update(req.body.password).digest("hex");
  delete req.body.password;
  try {
    await models.User.create(req.body);
    return res.status(201).send("OK");
  } catch(err) {
    return res.status(500).send(err);
  }
});

app.get('/user', (req, res) => {
  if (req.user) {
    return res.send({
      id: req.user.id,
      username: req.user.username,
      admin: req.session.middlewareGroup,
      canUpdate: true,
      Groups: req.user.Groups
    });
  }
  return res.status(401).send("Not authenticated");
});

app.get('/group/:id', mustAuthenticated, async (req, res) => {
  let data = await models.Group.findOne({
    attributes: ['id', "name"],
    where: {
      id: req.params.id
    },
    include: {
      model: models.User,
      required: true,
      attributes: ['id'],
      where: {
        id: req.user.id
      }
    }
  });
  if (!data) {
    return res.status(404).send("Not found");
  }
  let users = await models.User.findAll({
    attributes: ['id', 'username'],
    include: {
      model: models.Group,
      attributes: ['id'],
      where: {
        id: req.params.id
      }
    }
  });
  users.forEach(el => { delete el.dataValues.Groups; });
  data.dataValues.Users = users;
  res.send(data);
});

app.get('/task', mustAuthenticated, async (req, res) => {
  console.log(req.query);
  let whereClause = {}
  if (req.query.title) {
    whereClause.taskname = {
      [Sequelize.Op.like]: `%${req.query.title}%`
    }
  }
  if (req.query.group && !Number.isNaN(Number(req.query.group))) {
    whereClause.GroupId = Number(req.query.group);
  }
  const check = {
    NEW: req.query.new,
    "IN WORK": req.query.in_work,
    COMPLETED: req.query.completed
  };
  if (!Object.keys(check).reduce((acc, el) => acc && (check[el] === 'true'), true)) {
    whereClause.status = {
      [Sequelize.Op.in]: Object.keys(check).filter(el => (check[el] === 'true'))
    }
  }
  console.log(whereClause);
  let data = await models.Task.findAll({
    attributes: ['id', 'taskname'],
    where: whereClause,
    include: {
      model: models.Group,
      attributes: ['id'],
      required: true,
      include: {
        model: models.User,
        attributes: ['id'],
        required: true,
        where: {
          id: req.user.id
        }
      }
    },
    order: [
      ['id', 'ASC']
    ]
  });
  data.forEach(el => { delete el.dataValues.Group; });
  return res.send(data);
});

app.get("//", mustAuthenticated, async function(req, response) {
  let data = await models.Task.findAll({
    attributes: ['id', 'taskname'],
    include: {
      model: models.Group,
      attributes: ['id'],
      required: true,
      include: {
        model: models.User,
        attributes: ['id'],
        required: true,
        where: {
          id: req.user.id
        }
      }
    },
    order: [
      ['id', 'ASC']
    ]
  });
  data.forEach(el => { delete el.dataValues.Group.dataValues.Users })
  if (req.get("Accept").split(",")[0].trim() == 'application/json') {
    return response.send(data);
  }
  return response.render("list.hbs", data);
});

app.use("*", function (req, res) {
  res.status(404).send("404 ERROR");
});



app.listen(3080);
