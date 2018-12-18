const express = require("express");
const mongoose = require("mongoose");


const axios = require("axios");
const cheerio = require("cheerio");

const db = require("./models");

// remember to use process.env.PORT because 3000 is probably already in use

const PORT = process.env.PORT || 3000;

const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
let MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/hockeyNews";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


// mongoose.connect("mongodb://localhost/hockeyNews", { useNewUrlParser: true });

// Routes

app.get("/scrape", function(req, res) {
  axios.get("http://www.nhl.com/news").then(function(response) {
    const $ = cheerio.load(response.data);

    $("article.article-item").each(function(i, element) {
      let articleData = {};

      articleData.title = $(this)
        .find("h1")
        .text();

      let link = $(this)
      .attr("data-url");
      
      articleData.link = `https://www.nhl.com${link}` 

      db.Article.create(articleData)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });

    res.send("Scrape Complete");
  });
});

app.get("/articles", function(req, res) {

  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });});

app.get("/articles/:id", function(req, res) {

  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {

  db.Note.create(req.body)
    .then(function(dbNote) {
 
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});