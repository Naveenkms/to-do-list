//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  process.env.MONGODB_URL
);

const itemSchema = { 
  name: String,
};

const Item = mongoose.model("Item", itemSchema);

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

app
  .route("/")
  .get(function (req, res) {
    List.find(function (err, foundLists) {
      if (err) {
        console.log("error in query");
      } else {
        res.render("listDisplay", { lists: foundLists });
      }
    });
  })
  .post(function (req, res) {
    const { newList } = req.body;

    List.create({ name: newList }, function (err) {
      if (err) return handleError(err);
      else res.redirect("/");
    });
  });

// TO IGNORE FAVICON REQUEST
app.get("/favicon.ico", (req, res) => res.status(204));

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkboxId;
  List.findByIdAndRemove(checkedItemId, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("removed checked list");
    }
    res.redirect("/");
  });
});

app.post("/list", function (req, res) {
  const itemName = req.body.newItem;
  const customListName = _.toLower(req.body.list);

  const item = new Item({
    name: itemName,
  });

  List.findOne({ name: customListName }, function (err, foundList) {
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + customListName);
  });
});

app.post("/list/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listTitle = req.body.listName;

  if (listTitle === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("removed checked item");
      }

      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listTitle },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listTitle);
        } else {
          console.log("err");
        }
      }
    );
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = req.params.customListName;

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      res.render("list", {
        listTitle: customListName,
        newListItems: foundList?.items,
      });
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.listen(port, function () {
  console.log("Server started successfully");
});
