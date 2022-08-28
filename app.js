const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

mongoose.connect("mongodb+srv://admin-Rohit:teddy123@cluster0.evicgs9.mongodb.net/todolist");

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const day = date();

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Work"
});
const item2 = new Item({
  name: "Exercise"
});
const item3 = new Item({
  name: "Chill"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = new mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        } else{
          console.log("Items saved Successfully");
        }
      });
      res.redirect('/');
    }
    else{
      res.render("list", { listTitle: day, newListItems: foundItems});
    }
  })
});
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      } else{
        //Show an existing list
        res.render("list", { listTitle: customListName, newListItems: foundList.items});

      }
    }
  })

});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if(listName === day){
    item.save();
    res.redirect('/');
  } else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName)
    })
  }

});

app.post("/delete", function(req, res){
  const checkedItemId=req.body.checkbox;
  const listName = req.body.listName;
  if(listName === day){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err);
      } else{
        console.log("Successfully deleted an Item");
        res.redirect('/');
      }
    });
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect('/' + listName);
      }
    })
  }

})




app.listen(process.env.PORT||3000, function() {
  console.log("Server is ready!");
});
