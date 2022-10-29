//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://admin-petar:Watermelon555@cluster0.qwyg9.mongodb.net/todolistDB?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = {
  name: String,
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Exercise"
})

const item2 = new Item({
  name: "Do homework"
})

const item3 = new Item({
  name: "Read a Book"
})

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)

app.get("/", function(req, res) {
  Item.find({}, function(err, dbItems) {
    if (dbItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted");
        }
      });
      res.redirect("/")
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: dbItems
      });
    }
  })
});

app.get("/:listName", function(req, res) {
  const listName = _.capitalize(req.params.listName);

  List.findOne({
    name: listName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list

        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + listName)
      } else {
        // Show existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      }
    }
  })

});

app.get("/about", function(req, res) {
  res.render("about");
});


app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  })

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    })
  }


});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, results) {
      if (!err) {
        res.redirect("/" + listName);
      }
    })
  }

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
