const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class Database {
  constructor(databaseFile) {
    this.db = new sqlite3.Database(databaseFile, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
      } else {
        console.log("Connected to the SQLite database.");
      }
    });
  }

  getKursus(kursistNavn, callback) {
    const query = `SELECT kursus FROM kursister WHERE navn = ?`;
    this.db.get(query, [kursistNavn], callback);
  }
}

class Server {
  constructor(port, db) {
    this.app = express();
    this.port = port;
    this.db = db;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(bodyParser.json());
    this.app.use(express.static(path.join(__dirname, "../public")));
  }

  setupRoutes() {
    this.app.post("/kursusbevis", (req, res) => {
      const { kursistNavn, kursusTitel } = req.body;

      this.db.getKursus(kursistNavn, (err, row) => {
        if (err) {
          res.status(500).json({ error: "Database error" });
          console.error(err.message);
          return;
        }

        if (row) {
          const kursusArray = JSON.parse(row.kursus);
          const isEnrolled = kursusArray.includes(kursusTitel);

          if (isEnrolled) {
            res.redirect(
              `/pages/bevis.html?navn=${encodeURIComponent(
                kursistNavn
              )}&kursus=${encodeURIComponent(kursusTitel)}`
            );
          } else {
            res.status(404).json({ message: "Kursist ikke fundet in valgte kursus" });
          }
        } else {
          res.status(404).json({ message: "Kursist ikke fundet" });
        }
      });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });
  }
}

//Forbinder til database og starter server
const database = new Database(path.join(__dirname, "database.sqlite"));
const server = new Server(3000, database);
server.start();
