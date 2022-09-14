const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const { Parser } = require("json2csv");
const data = {
  authors: [],
  books: [],
  magazines: [],
  sortedData: [],
};
// const getData = () => data;
function getData() {
  return data;
}

const streamToPromise = (stream, event = "end") => {
  return new Promise((resolve, reject) => {
    if (event !== "error") {
      stream.on(event, resolve);
    } else {
      stream.on("error", reject);
    }
  });
};

const main = async () => {
  const parser = (store) =>
    parse({ columns: true, delimiter: ";" }, (err, data) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      store.push(...data);
    });

  const magazines = streamToPromise(
    fs
      .createReadStream(__dirname + "/CSV/magazines.csv")
      .pipe(parser(data.magazines))
  );

  const authors = streamToPromise(
    fs
      .createReadStream(__dirname + "/CSV/authors.csv")
      .pipe(parser(data.authors))
  );

  const books = streamToPromise(
    fs.createReadStream(__dirname + "/CSV/books.csv").pipe(parser(data.books))
  );

  const success = await Promise.allSettled([magazines, authors, books]);
  console.log(success);
  const writeStream = fs.createWriteStream("./output/output.json");
  writeStream.write(JSON.stringify(data));
  writeStream.end();
};

main();

app.get("/", (req, res) => {
  res.send("Server is Working fine!!!");
});

// Get Magazine by ISBN
app.get("/book/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const book = data.books.find((book) => book.isbn === isbn);
  if (book) {
    res.send(book);
  } else {
    res.status(404).send("Book not found");
  }
});

// Get Magazine by ISBN
app.get("/magazine/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const magazine = data.magazines.find((magazine) => magazine.isbn === isbn);
  if (magazine) {
    res.status(200).json({ success: true, magazine });
  } else {
    res.status(404).json({
      success: false,
      message: "Magazine not found",
    });
  }
});

// Find all books and magazines by author mail id
app.get("/author/:email", (req, res) => {
  const email = req.params.email;
  console.log(email);
  const books = data.books.filter((book) => book.authors === email);
  const magazines = data.magazines.filter(
    (magazine) => magazine.authors === email
  );
  if (books.length > 0 || magazines.length > 0) {
    res.status(200).json({ success: true, books, magazines });
  } else {
    res.status(404).json({
      success: false,

      message: "Author not found",
    });
  }
});

// Sort books and magazines by title
console.log("Books", data.books[0]);
app.get("/save", (req, res) => {
  data.sortedData = [...data.books, ...data.magazines];
  // sort by title
  data.sortedData.sort((a, b) => {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (a[keysA[0]] < b[keysB[0]]) {
      return -1;
    }
    if (a[keysA[0]] > b[keysB[0]]) {
      return 1;
    }
    return 0;
  });

  // Convert JSON to CSV


  const writeStream = fs.createWriteStream('./output/newData.csv');

  try {
    const parser = new Parser();
    const csv = parser.parse(data.sortedData);
    writeStream.write(csv);
    writeStream.end();
  } catch (err) {
    console.error(err);
  }

  if (data.sortedData) {
    res.status(200).json({ success: true, data: data.sortedData });
  } else {
    res.status(404).json({
      success: false,
      message: "Author not found",
    });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

// ﻿title
