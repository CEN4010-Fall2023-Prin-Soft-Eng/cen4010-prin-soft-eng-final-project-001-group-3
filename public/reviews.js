const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('user');
const token = localStorage.getItem('token');

const myOwnPage = username === localStorage.getItem('currentUser');

if (!myOwnPage) {
    document.getElementById('usernameTitle').innerText = `${username}'s Reviews`;
}

document.addEventListener('DOMContentLoaded', async function () {
    const response = await fetch(`/user/reviews/${username}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
        },
    });

    const data = await response.json();
    const reviewsContainer = document.getElementById('reviews-container');

    let counter = 0;

    data.forEach(entry => {
        const emoji = entry.review.positive ? "👍" : "👎";
        const gameDiv = document.createElement('div');
        const index = counter;

        gameDiv.className = 'card my-3';
        gameDiv.id = index;

        const header = document.createElement('h5');

        header.className = 'card-header';
        header.innerText = entry.title + " " + emoji;

        gameDiv.appendChild(header);

        const reviewDiv = document.createElement('div');

        reviewDiv.className = 'card-body';

        const text = document.createElement('p');

        text.className = 'card-text';
        text.innerText = entry.review.text;

        reviewDiv.appendChild(text);

        const votes = document.createElement('p');

        votes.className = 'card-text';
        votes.innerText = "🔼 " + entry.review.positiveVotes + " 🔽 " + entry.review.negativeVotes;

        reviewDiv.appendChild(votes);

        if (myOwnPage) {
            const editButton = document.createElement('button');
            editButton.className = 'btn btn-secondary';
            editButton.id = 'editButton-' + entry.id;
            editButton.innerText = 'Edit';
            editButton.onclick = () => openEditBox(index, entry.review.text, entry.id, token);
            reviewDiv.appendChild(editButton);

            const editTextBox = document.createElement('textarea');
            editTextBox.style.display = 'none';
            editTextBox.id = `editBox-${entry.id}-${index}`;
            reviewDiv.appendChild(editTextBox);

            const saveButton = document.createElement('button');
            saveButton.className = 'btn btn-success';
            saveButton.innerText = 'Save';
            saveButton.style.display = 'none';
            saveButton.id = 'saveButton-' + entry.id;
            saveButton.onclick = () => saveEditedReview(index, entry.id, token);

            reviewDiv.appendChild(saveButton);
        }

        gameDiv.appendChild(reviewDiv);

        reviewsContainer.appendChild(gameDiv);

        counter += 1;
    });
});

function openEditBox(index, currentText, gameId, token) {
    const editTextBox = document.getElementById(`editBox-${gameId}-${index}`);
    const saveButton = document.getElementById(`saveButton-${gameId}`);

    editTextBox.value = currentText;
    editTextBox.style.display = 'block';
    saveButton.style.display = 'block';
}

async function saveEditedReview(index, gameId, token) {
    try {
        const editedText = document.getElementById(`editBox-${gameId}-${index}`).value;

        const response = await fetch(`/review/${gameId}`, {
            method: 'PUT',
            body: JSON.stringify({ reviewText: editedText }),
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        document.getElementById(`editBox-${gameId}-${index}`).style.display = 'none';
    } catch (error) {
        console.error('Error saving edited review:', error);
    }
    location.reload();
}

async function getProfilePicture(token) {
    const response = await fetch('/profile-data', {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    });

    const data = await response.json();

    return data.profilePicture;
}

async function updateAccountSection() {
    if (token !== null) {
        const loggedInAccount = document.getElementById('loggedInAccount');
        const profilePicture = await getProfilePicture(token);

        document.getElementById('profilePicture').src = profilePicture;

        loggedInAccount.hidden = false;
    } else {
        const loggedOutAccount = document.getElementById('loggedOutAccount');

        loggedOutAccount.hidden = false;
    }
}

updateAccountSection();