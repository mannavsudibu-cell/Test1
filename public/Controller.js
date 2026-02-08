const NameField = document.getElementById("Name")
const Img = document.getElementById("Img")
const ClassField = document.getElementById("Class")
const Description = document.getElementById("Description")
const IdField = document.getElementById("Id")

const Liked = []

async function SetNextUser() {
    console.log("Next")
    const Response = await fetch("/get-Random")

    const Found = await Response.json();

    id = Found.id
    NameField.innerText = Found.Username
    IdField.innerText = Found.id
    ClassField.innerHTML = Found.Class.Value
    Description.innerHTML = Found.Description
    Img.src = "/" + Found.ProfilePicture
}

function SaveLikes() {
    const Like = fetch("/add-Like", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Value: Liked }),
    })
}

function SetLike() {
    Liked.push(parseInt(IdField.innerHTML))
    console.log(Liked)
}

window.onload = function () {
    SetNextUser()
}

window.onbeforeunload = function () {
    SaveLikes()
}