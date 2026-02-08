async function SetMatches() {
    const SentData = await fetch("/Matches", {
        method: "POST",
    })

    const profiles = await SentData.json();

    console.log(profiles)
    const container = document.getElementById("cards-container");

    profiles.forEach(user => {
        // Create main card
        const card = document.createElement("div");
        card.className = "profile-card";

        card.innerHTML = `
            <link rel="stylesheet" href="/styleMatches.css">
        <img src="/${user.ProfilePicture}" alt="/${user.Username}">
        <div class="user-info">
            <h3>${user.Username}</h3>
            <p>${user.Contact_Instructions}</p>
        </div>
    `;

        // Add card to page
        container.appendChild(card);
    });
}

window.onload = function () {
    SetMatches();
}