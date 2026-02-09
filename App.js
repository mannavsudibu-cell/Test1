const express = require("express");
const ejs = require('ejs');
const flash = require('express-flash');
const session = require('express-session');
const bcrypt = require("bcrypt");
const path = require("node:path");
const { Sequelize, DataTypes, ARRAY } = require("sequelize");
const bodyParser = require('body-parser');
const fileUpload = require("express-fileupload");
const { configDotenv } = require("dotenv");
const { table } = require("node:console");
const { Where } = require("sequelize/lib/utils");
const { reverse } = require("node:dns");
require("dotenv").config();

const app = express();
const Port = process.env.PORT || 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true, parameterLimit: 10000000000 }));
app.set("view-engine", "ejs");
app.use(express.static(path.join(__dirname, "public")))
app.use(express.static(path.join(__dirname, "Uploads")))

app.use(flash());
app.use(fileUpload())
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    name: "LoggedIn",
    cookie: {
        maxAge: 10000000,
    }
}));

const sequelize = new Sequelize(process.env.URL, {
    dialect: "sqlite",
    storage: "./database.sqlite",
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },

    logging: false
})

sequelize.sync().then(() => { console.log(`Connected`) }).catch((err) => { console.log(err) });

const post = sequelize.define("TestDatabase1", {
    Username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    Class: {
        type: DataTypes.ENUM('10', '11', '12')
    },
    ProfilePicture: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    Likes: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: true,
    },
    Description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    Contact_Instructions: {
        type: DataTypes.STRING,
        allowNull: true,
    }
})

app.use((req, res, next) => {
    res.locals.User = req.session.User;
    next()
})

app.post("/Register", async (req, res) => {
    const { Username, Password, Email, Class } = req.body;
    try {
        const Count = post.findOne({
            where: {
                Email: Email,
            }
        })

        if ((await Count) != null) {
            res.redirect("/Register");
        } else {
            const HashedPassword = await bcrypt.hash(Password, 10);
            const NewPost = await post.create({ Username, Password: HashedPassword, Email, Class, Likes: [], Description: "", Contact_Instructions: ""});
            res.redirect("/Login");
        }
    } catch (err) {
        console.log(err);
    }
})


app.post("/Login", async (req, res) => {
    const { Email, Password } = req.body;
    try {
        const User = await post.findOne({
            where: {
                Email: Email,
            },
        })

        if ((await User) != null) {
            if (await bcrypt.compare(Password, User.Password)) {
                req.session.User = User;
                res.redirect("/");
            } else {
                res.render("Login.ejs", { Error: "Wrong Email or password" });
            }
        } else {
            res.render("Login.ejs", { Error: "Wrong Email or password" })
        }
    } catch (err) {
        console.log(err);
    }
})

app.post("/Logout", (req, res) => {
    req.session.destroy();
    res.clearCookie("LoggedIn");
    res.redirect("/");
})

app.post("/Update", async (req, res) => {
    const User = await post.findOne({
        where: {
            Email: req.session.User.Email,
        },
    })
    User.Username = req.body.Username;
    User.Description = req.body.Description;
    User.Contact_Instructions = req.body.Contact;
    User.Class = req.body.Class;


    if (req.files) {
        const NewFile = await req.files.Image;
        const UploadPath = __dirname + "/Uploads/" + NewFile.name;
        console.log(await req.files.Image);

        console.log(NewFile);
        NewFile.mv(UploadPath, function (Err) {
            if (Err) return res.status(500).send(Err);

            User.ProfilePicture = NewFile.name
            console.log("File Uploaded");
        })

        User.ProfilePicture = NewFile.name;
    }

    console.log(User)

    req.session.User = User

    await User.save();
    res.redirect("/");
})

app.get("/get-posts", async (req, res) => {
    try {
        const AllPosts = await post.findAll();
        res.json(AllPosts);
    } catch (err) {
        console.log(err);
    }
})

app.get("/get-Random", async (req, res) => {
    try {
        const Random = await post.findOne({
            order: sequelize.random()
        });
        res.send(Random)
    } catch (err) {
        console.log(err);
    }
})

app.post("/add-Like", async (req, res) => {
    const User = await req.session.User;
    const Liked = await req.body.Value;
    if (!User.Likes) {
        User.Likes = [];
    }

    Liked.forEach(element => {
        User.Likes.push(element)
    });

    const SU = await post.findOne({
        where: {
            Email: req.session.User.Email,
        },
    })
    SU.Likes = User.Likes
    await SU.save();

    res.send();
})

app.get("/Find", CheckAuthenticated, async (req, res) => {
    try {
        res.render("Find.ejs");
    } catch (err) {
        console.log(err);
    }
})

app.get("/", CheckAuthenticated, (req, res) => {
    res.render("index.ejs");
})

app.get("/Matches", CheckAuthenticated, (req, res) => {
    res.render("Matches.ejs");
})

app.post("/Matches", async (req, res) => {
    const Mutuals = [];

    for (const element of req.session.User.Likes) {
        const PossibleUser = await post.findOne({
            where: { id: element },
        });

        if (
            PossibleUser &&
            PossibleUser.Likes.includes(req.session.User.id)
        ) {
            Mutuals.push(PossibleUser);
        }
    }

    console.log(Mutuals);
    res.send(Mutuals);
})

app.get("/Login", CheckNotAuthenticated, (req, res) => {
    res.render("Login.ejs", { Error: null });
})

app.get("/Register", CheckNotAuthenticated, (req, res) => {
    res.render("Register.ejs");
})

function CheckAuthenticated(req, res, next) {
    if (!req.session.User) {
        return res.redirect('/Login')
    }
    next()
}

function CheckNotAuthenticated(req, res, next) {
    if (req.session.User) {
        return res.redirect('/')
    }
    next()
}

app.use((req, res) => {
    res.status(404);
    res.send(`<h1>Error 404<h1>`)
})

app.listen(Port, () => {
    console.log(`Example app listening at http://localhost:${Port}`);
});
