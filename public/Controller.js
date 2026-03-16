var Id = 0;
const CardContainer = document.getElementById("Holder")
const loader = document.getElementById("loadingIndicator");
var CurrentCard = null

const Liked = [];
const Seen = [];

const noMoreBox = document.getElementById("noMoreUsers");
const cardContainer = document.getElementById("Holder");
const likeBtn = document.getElementById("likeBtn");
const declineBtn = document.getElementById("declineBtn");
const ReportBtn = document.getElementById("ReportBtn");

const Hobbybox = document.getElementById("Hobiji");
const AmbBox = document.getElementById("Ambitions");
const MotivBox = document.getElementById("Motivation");
const SpecialtyBox = document.getElementById("Specialty");
const DescrBox = document.getElementById("Descr");

async function SetNextUser() {
    if (CurrentCard) {
        CurrentCard.remove();
        loader.style.display = "flex";
    }
    console.log("Next")

    const Response = await fetch("/get-Random", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Seen: Seen }),
    })
    loader.style.display = "none";
    try {
        const Found = await Response.json();

        const card = document.createElement("div");
        card.className = "user-card";

        id = Found.id
        Seen.push(id);

        const ImageSection = document.createElement("div");
        ImageSection.className = "image-wrapper";

        const NewImage = document.createElement("img");
        if (Found.ProfilePicture) {
            NewImage.src = "/" + Found.ProfilePicture;
        } else {
            NewImage.src = "/Default.png";
        }
        NewImage.alt = "User photo"

        ImageSection.appendChild(NewImage)

        const InfoSection = document.createElement("div");
        InfoSection.className = "info-section";

        const Name = document.createElement("h2");
        Name.innerHTML = Found.Username + " - " + Found.Class + " Klase"
        InfoSection.appendChild(Name);

        //const Klase = document.createElement("p");
        //Klase.className = "location";
        //Klase.innerHTML = Found.Class
        //InfoSection.appendChild(Klase);

        const Description = document.createElement("p");
        Description.className = "user-bio";
        Description.innerHTML = Found.Description;
        InfoSection.appendChild(Description);

        const MoreInfo = document.createElement("button");
        MoreInfo.className = "Extra-Info";
        MoreInfo.innerHTML = "More info"
        MoreInfo.addEventListener("click", openMore);
        InfoSection.appendChild(MoreInfo);

        Id = Found.id

        card.appendChild(ImageSection);
        card.appendChild(InfoSection);

        CardContainer.insertBefore(card, CardContainer.firstChild)
        enableSwipe(card);
        CurrentCard = card;

        Hobbybox.innerHTML = "Hobiji: " + Found.Hobbies
        SpecialtyBox.innerHTML = "Novirziens: " + Found.Specialty
        AmbBox.innerHTML = "Ambīcijas: " + Found.Ambitions
        MotivBox.innerHTML = "četrrindis potenciālajam vēstuļu draugam: " + Found.Motivation
        DescrBox.innerHTML = "Apraksts: " + Found.Description
    } catch (Err) {
        noMoreBox.style.display = "block";
        CardContainer.style.display = "None";
        likeBtn.disabled = true;
        declineBtn.disabled = true;
        ReportBtn.disabled = true;
        console.log("Ran out")
    }

}

async function SetLike() {
    const Like = await fetch("/add-Like", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Value: id }),
    })

    console.log(Like);
    try {
        const LikeData = await Like.json();
        showMatch(LikeData.Username);
    } catch (Err) {

    }

    Liked.push(Id)
}

window.onload = function () {
    SetNextUser()
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
                }
            }, 250);
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

async function SubmitReport() {
    const Like = await fetch("/Report", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Value: id }),
    })

    console.log(Like);

    Liked.push(Id)

    SetNextUser();
}

const matchPopup = document.getElementById("matchPopup");
const matchedName = document.getElementById("matchedName");

function showMatch(userName) {
    matchedName.textContent = userName;
    matchPopup.style.display = "flex";
}

function closeMatch() {
    matchPopup.style.display = "none";
}

document.getElementById("keepSwiping").addEventListener("click", closeMatch);
document.getElementById("goToChat").addEventListener("click", function () {
    window.location.href = "/Matches"; // adjust if needed
});

const morePanel = document.getElementById("more-panel");

function openMore() {
    morePanel.classList.add("active");
}

function closeMore() {
    morePanel.classList.remove("active");
}
