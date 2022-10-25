const express = require("express");


const tasks = {
    1: {
      "title": "Сделать лабы №1-4 по РИП за ночь",
      "description": "А то будет очень плохо. Надо делать хорошо, делать плохо не надо.",
      "image": "1.png"
    },
    2: {
      "title": "Назвать Сережу фриком",
      "description": "А как же без этого?",
      "image": "2.png"
    },
    3: {
      "title": "Не умереть",
      "description": "Необязательно",
//      "image": "3.png"
    }
};

const app = express();
app.set("view engine", "hbs");

app.use('/css', express.static('css'));
app.use('/img', express.static('img'));

app.use('/task/:id', function (req, res) {
  res.render("task", tasks[req.params.id])
});

app.use("//", function(_, response) {
  response.render("list.hbs",
    Object.keys(tasks).map(a => ({"id": a, ...tasks[a]}))
  );
});

app.use("*", function (req, res) {
  res.status(404).send("404 ERROR");
});

app.listen(3000);
