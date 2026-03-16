const matchesContainer = document.getElementById("matchesContainer");
const emptyState = document.getElementById("emptyState");
const loading = document.getElementById("loadingIndicator");

async function SetMatches() {
    const SentData = await fetch("/Matches", {
        method: "POST",
    })

    const profiles = await SentData.json();

    matchesContainer.innerHTML = "";
    loading.style.display = "none";
    if (profiles.length === 0) {
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";

    profiles.forEach(match => {
        const card = document.createElement("div");
        card.className = "match-card";
        var LinkToPicture
        if(match.ProfilePicture){
            LinkToPicture = match.ProfilePicture
        }else{
            LinkToPicture = "/Default.png"
        }
        card.innerHTML = `
            <img src="${LinkToPicture}" alt="${match.Username}">
            <div class="match-info">
                <h3>${match.Username}</h3>
                <p>${match.Contact_Instructions}</p>
            </div>
        `;

        matchesContainer.appendChild(card);
    });
}

window.onload = function () {
    SetMatches();
}