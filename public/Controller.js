var Id = 0;
const CardContainer = document.getElementById("Holder")
var CurrentCard = null

const Liked = [];
const Seen = [];

async function SetNextUser() {
    if(CurrentCard){
        CurrentCard.remove(); 
    }
    console.log("Next")

    const Response = await fetch("/get-Random", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Seen: Seen }),
    })
    try {
 const Found = await Response.json();

        const card = document.createElement("div");
        card.className = "profile-card";

        id = Found.id
        Seen.push(id);

        const ImageSection = document.createElement("div");
        ImageSection.className = "image-section";

        const NewImage = document.createElement("img");
        NewImage.src = "/" + Found.ProfilePicture;
        NewImage.alt= "User photo"

        ImageSection.appendChild(NewImage)

        const InfoSection = document.createElement("div");
        InfoSection.className = "info-section";

        const Name = document.createElement("h2");
        Name.innerHTML = Found.Username;
        InfoSection.appendChild(Name);

        const Klase = document.createElement("p");
        Klase.className = "location";
        Klase.innerHTML = Found.Class
        InfoSection.appendChild(Klase);

        const Description = document.createElement("p");
        Description.className = "bio";
        Description.innerHTML = Found.Description;
        InfoSection.appendChild(Description);

        Id = Found.id

        card.appendChild(ImageSection);
        card.appendChild(InfoSection);

        CardContainer.insertBefore(card, CardContainer.firstChild)
        enableSwipe(card);
        CurrentCard = card;
    } catch(Err){
        console.log("Ran out")
    }

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
    Liked.push(Id)
}

window.onload = function () {
    SetNextUser()
}

window.onbeforeunload = function () {
    SaveLikes()
}

function enableSwipe(card) {
    let startX = 0;
    let currentX = 0;
    let dragging = false;

    const threshold = 100;

    const start = (x) => {
        startX = x;
        dragging = true;
        card.style.transition = "none";
    };

    const move = (x) => {
        if (!dragging) return;
        currentX = x - startX;
        card.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.05}deg)`;

        if (currentX > 0) {
            card.classList.add("swipe-right");
            card.classList.remove("swipe-left");
        } else {
            card.classList.add("swipe-left");
            card.classList.remove("swipe-right");
        }
    };

    const end = () => {
        dragging = false;
        card.style.transition = "transform 0.25s ease";

        if (Math.abs(currentX) > threshold) {
            const direction = currentX > 0 ? 1 : -1;
            card.style.transform = `translateX(${direction * window.innerWidth}px) rotate(${direction * 20}deg)`;
            card.style.opacity = "0";

            setTimeout(() => {
                if (direction === 1) {
                    SetLike();
                    SetNextUser();
                }
                if (direction === -1) {
                    SetNextUser();
                }}, 250);
        } else {
            card.style.transform = "translateX(0)";
            card.classList.remove("swipe-left", "swipe-right");
        }

        currentX = 0;
    };

    /* Touch */
    card.addEventListener("touchstart", e => start(e.touches[0].clientX));
    card.addEventListener("touchmove", e => move(e.touches[0].clientX));
    card.addEventListener("touchend", end);

    /* Mouse */
    card.addEventListener("mousedown", e => start(e.clientX));
    window.addEventListener("mousemove", e => move(e.clientX));
    window.addEventListener("mouseup", end);
}