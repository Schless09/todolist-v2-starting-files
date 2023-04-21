const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// "mongodb://localhost:27017/todolistDB"

mongoose.connect(
  `mongodb+srv://schless09devtools:RWftzydOu40CJUUl@cluster0.qpm18gx.mongodb.net/todolistDB`,
  {
    useNewUrlParser: true,
  }
);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Walk the dog",
});

const item2 = new Item({
  name: "Make coffee",
});

const item3 = new Item({
  name: "Feed the kids",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("Successfully saved all items to DB");
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/:customListname", async (req, res) => {
  const customListName = _.capitalize(req.params.customListname);
  try {
    const list = await List.findOne({ name: customListName });
    if (!list) {
      const newList = new List({
        name: customListName,
        items: defaultItems,
      });
      await newList.save();
      console.log(`Successfully created list ${customListName}`);
      res.redirect(`/${customListName}`);
    } else {
      console.log(`List ${customListName} already exists`);
      res.render("list", {
        listTitle: list.name,
        newListItems: list.items,
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    try {
      await item.save();
      console.log("Successfully saved item to DB");
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      res.redirect(`/${listName}`);
    } catch (err) {
      console.log(err);
    }
  }
});

app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  try {
    if (listName === "Today") {
      await Item.findByIdAndRemove(checkedItemId);
      console.log("Successfully deleted checked item from DB");
      res.redirect("/");
    } else {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      console.log("Successfully deleted checked item from custom list");
      res.redirect(`/${listName}`);
    }
  } catch (err) {
    console.log(err);
  }
});

// app.get("/<%= %>", function (req, res) {
//   res.render("list", { listTitle: "Work List", newListItems: workItems });
// });

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
