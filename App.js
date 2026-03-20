const express = require("express");
const ejs = require('ejs');
const flash = require('express-flash');
const session = require('express-session');
const bcrypt = require("bcrypt");
const path = require("node:path");
const { Sequelize, DataTypes, ARRAY, Op, and, or } = require("sequelize");
const bodyParser = require('body-parser');
const fileUpload = require("express-fileupload");
const { configDotenv } = require("dotenv");
require("dotenv").config();

var uuidv4 = require('uuid');
const fs = require("fs");

const app = express();
const Port = process.env.PORT || 3000;

const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    auth: {
        user: process.env.Auth_Email,
        pass: process.env.Auth_Password,
    }
})

app.use(express.json());
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true, parameterLimit: 10000000000 }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
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

const post = sequelize.define("TestDatabase00", {
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
        allowNull: false,
    },
    Bio: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    Description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    Contact_Instructions: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    Verified: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    OTP: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    NewOne: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    Specialty: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    Hobbies: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    Ambitions: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    Motivation: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    UserReports: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    Blocked: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
    },
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
        if (Password.length < 8){
            res.render("Register.ejs", { Error: "Password too short" });
        }else if ((await Count) != null) {
            res.render("Register.ejs", { Error: "Email already in use" });
        } else {
            const HashedPassword = await bcrypt.hash(Password, 10);

            const OTP = (Math.floor((Math.random() * 9000) + 1000)).toString()

            const MailOptions = {
                from: process.env.Auth_Email,
                to: Email,
                subject: "Verify your email",
                html: "<p>Enter <b>" + OTP + "</b> lai verificētu savu kontu</p><p>Paldies ka pievienojāties mājaslapai</p>",

            }

            transporter.sendMail(MailOptions)
            const HashedOTP = await bcrypt.hash(OTP, 10);
            console.log(OTP)

            const NewPost = await post.create({ Username, Password: HashedPassword, Email, Class, UserReports: 0, Blocked: [], Likes: [], Description: "", Contact_Instructions: "", OTP: HashedOTP, ProfilePicture: "Default.png", NewOne: false, Bio: "", Hobbies: "", Ambitions: "", Specialty: "", Motivation: ""});

            res.render("Login.ejs", { Error: "" });
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

app.post("/Reset", async (req, res) => {
    const Email = req.body.Email;
    try {
        const User = await post.findOne({
            where: {
                Email: Email,
            },
        })

        if (User) {
            const Pass = generatePassword();
console.log(Pass)
            const MailOptions = {
                from: process.env.Auth_Email,
                to: Email,
                subject: "New Generated Password",
                html: "<p>Here is your new generated account password <b>" + Pass + "</b></p> <p>Nedalaties ar šo paroli!</p>",
            }

            transporter.sendMail(MailOptions)
            const HashedOTP = await bcrypt.hash(Pass, 10);

            User.Password = HashedOTP
            await User.save();

            res.render("PasswordReset.ejs", { Error: "New Password has been sent to your email" });
        } else {
            res.render("PasswordReset.ejs", { Error: "Email does not exist" });
        }

    } catch (err) {
        res.render("PasswordReset.ejs", { Error: "Something went wrong" });
    }
})

function generatePassword() {
    const length = 8
    const charset = "@#$&*0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$&*0123456789abcdefghijklmnopqrstuvwxyz"
    var password = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        password += charset.charAt(Math.floor(Math.random() * n));
    }
    return password;
}

app.post("/Authorize", async (req, res) => {
    const { OTP } = req.body;
    const Email = req.session.User.Email
    try {
        const User = await post.findOne({
            where: {
                Email: Email,
            },
        })

        if ((await User) != null) {
            if (await bcrypt.compare(OTP, User.OTP) && User.Verified == null) {
                User.Verified = true
                User.save()
                req.session.User = User;
                res.redirect("/");
            } else {
                res.redirect("/");
            }
        } else {
            res.redirect("/")
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
    User.Motivation = req.body.Motivation;
    User.Ambitions = req.body.Ambitions;
    User.Specialty = req.body.Specialty;
    User.Hobbies = req.body.Hobbies;
    User.Bio = req.body.Bio;


    if (req.files) {
        const OldFile = __dirname + "/Uploads/" + User.ProfilePicture;
        if (fs.existsSync(OldFile) && OldFile != __dirname + "/Uploads/" + "Default.png") {
            fs.unlink(OldFile, (err) => {
                if (err) throw err
                console.log('File deleted successfully')
            });
        }
        const NewFile = await req.files.Image;
        const NewName = uuidv4.v4() + path.extname(NewFile.name);
        const UploadPath = __dirname + "/Uploads/" + NewName;
        console.log(await req.files.Image);

        console.log(NewFile);
        if (NewFile.size < 2097152) {
            NewFile.mv(UploadPath, function (Err) {
                if (Err) return res.status(500).send(Err);

                User.ProfilePicture = NewName
                console.log("File Uploaded");
            })
        }

        User.ProfilePicture = NewName;
    }

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

app.post("/get-Random", async (req, res) => {
    try {
        console.log(await req.body);
        const Seen = await req.body.Seen;
        const Likes = await req.session.User.Likes;
        const Blocked = await req.session.User.Blocked;

        const Combined = [];
        Likes.forEach(El => {
            Combined.push(El);
        });
        Seen.forEach(El => {
            Combined.push(El);
        });
        Blocked.forEach(El => {
            Combined.push(El);
        });

        const Random = await post.findOne({
            order: sequelize.random(),
            where: {
                Email: {
                    [Op.not]: req.session.User.Email,
                },
                id: {
                    [Op.not]: Combined,
                },
                Verified: true,
            }
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

    User.Likes.push(Liked)

    const LikedUser = await post.findOne({
        where: {
            id: Liked,
        },
    })

    const SU = await post.findOne({
        where: {
            Email: req.session.User.Email,
        },
    })
    SU.Likes = User.Likes
    await SU.save();

    if (LikedUser.Likes.includes(req.session.User.id)) {
        LikedUser.NewOne = true
        await LikedUser.save()

        res.send(LikedUser);
    }
    res.send();
})

app.post("/Report", async (req, res) => {
    const User = await req.session.User;
    const ReportedId = await req.body.Value;

    if (!User.Blocked) {
        User.Blocked = [];
    }
    User.Blocked.push(ReportedId)

    const ReportedUser = await post.findOne({
        where: {
            id: ReportedId,
        },
    })

    ReportedUser.UserReports += 1
    ReportedUser.save();

    const SU = await post.findOne({
        where: {
            Email: req.session.User.Email,
        },
    })
    SU.Blocked = User.Blocked
    await SU.save();

    res.send()
})

app.get("/Find", CheckAuthenticated, async (req, res) => {
    try {
        res.render("Find.ejs");
    } catch (err) {
        console.log(err);
    }
})

app.get("/", CheckAuthenticated, (req, res) => {
    console.log("Baija")
    res.render("index.ejs", {layout:false});
})

app.get("/Matches", CheckAuthenticated, (req, res) => {
    res.render("Matches.ejs");
})

app.get("/Policy", (req, res) => {
    res.render("Policy.ejs");
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
    
    const SU = await post.findOne({
        where: {
            Email: req.session.User.Email,
        },
    })
    SU.NewOne = false
    req.session.User.NewOne = false
    await SU.save()

    console.log(Mutuals);
    res.send(Mutuals);
})

app.get("/Login", CheckNotAuthenticated, (req, res) => {
    console.log("Baija2")
    res.render("Login.ejs", { Error: null });
})

app.get("/Reset", CheckNotAuthenticated, (req, res) => {
    res.render("PasswordReset.ejs", { Error: null });
})

app.get("/Register", CheckNotAuthenticated, (req, res) => {
    res.render("Register.ejs", { Error: null });
})

function CheckAuthenticated(req, res, next) {
        console.log("Baija1")
    if (!req.session.User) {
        return res.redirect('/Login')
    }
    next()
}

function CheckNotAuthenticated(req, res, next) {
    console.log("Baija3")
    if (req.session.User) {
        return res.redirect('/')
    }
    next()
}

app.use((req, res) => {
    res.status(404);
    res.send(`<h1>Error 404<h1>`)
})

app.listen(Port, function() {
    console.log(`Listening ${Port}`);
});