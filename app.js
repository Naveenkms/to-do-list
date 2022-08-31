//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")


const app = express();



app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect('mongodb+srv://admin:admin123@cluster0.octuh.mongodb.net/todolistDB')

const itemSchema = {
  name:String
};

const Item = mongoose.model("Item", itemSchema);

const apple = new Item({
  name:"apple"
});

const banana = new Item({
  name:"banana"
});

const cherry = new Item({
  name:"cherry"
});

const defaultItems = [apple, banana, cherry];

const listSchema = {
  name : String,
  items: [itemSchema]
}

const List = mongoose.model("List", listSchema);





app.get("/", function(req, res) {


  

  
Item.find(function(err, items){
  if(items.length === 0){
    Item.insertMany(defaultItems, function(err){
      if(err){
        console.log(err);
      }else{
        console.log("New item inserted successfully");
      }
    }) 
    res.redirect("/");
  } else{
    res.render("list", {listTitle: "Today", newListItems: items});
  }
})
 

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })

  if(listName === "Today") {
    item.save();

   res.redirect("/")
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName)
     
    })
  }
  


});

app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox ;
  const listTitle = req.body.listName;

  if(listTitle === "Today") {
    Item.findByIdAndRemove (checkedItemId, function(err) {
      if(!err) {
        console.log("removed checked item");
      }
  
      res.redirect("/")
  
    })
  } else {
   List.findOneAndUpdate({name: listTitle},{$pull:{items:{_id:checkedItemId} }}, function(err, foundList) {

    if(!err) {
      res.redirect("/" + listTitle);
    } else{
      console.log("err")
    }
   })
  }
  
  


})

app.get("/:customListName", function(req, res) {
 const customListName = _.capitalize(req.params.customListName) ;

 List.findOne({name: customListName}, function(err, foundList) {
  if(!err) {
    if(!foundList){
      const list = new List({
        name: customListName,
        items: defaultItems
       })
      
       list.save();
       res.redirect("/"+customListName)
    } else{
      res.render("list", {listTitle: customListName, newListItems: foundList.items})
    }
  }
 })


})

app.get("/about", function(req, res){
  res.render("about");
});



let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
