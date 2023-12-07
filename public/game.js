const RAWG_API_KEY = '48288ff667454f7681cb863cb83b9b82';

const token = localStorage.getItem('token');

const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('id');

async function upvoteReview(reviewId) {
    const response = await fetch(`/upvote/${gameId}/${reviewId}`, {
        method: 'POST',
        headers: {
            'Authorization': token
        }
    });

    const jsonData = await response.json();

    if (jsonData.message === "Upvote successful") {
        const review = document.getElementById(`review${reviewId}`);

        review.querySelector('.positive-icon').textContent = `🔼 ${jsonData.positiveVotes}`;
        review.querySelector('.negative-icon').textContent = `🔽 ${jsonData.negativeVotes}`;
    } else {
        alert(`Error: ${jsonData.message}`);
    }
}

async function downvoteReview(reviewId) {
    const response = await fetch(`/downvote/${gameId}/${reviewId}`, {
        method: 'POST',
        headers: {
            'Authorization': token
        }
    });

    const jsonData = await response.json();

    if (jsonData.message === "Downvote successful") {
        const review = document.getElementById(`review${reviewId}`);

        review.querySelector('.positive-icon').textContent = `🔼 ${jsonData.positiveVotes}`;
        review.querySelector('.negative-icon').textContent = `🔽 ${jsonData.negativeVotes}`;
    } else {
        alert(`Error: ${jsonData.message}`);
    }
}

async function deleteReview(reviewId) {
    if (!confirm("Are you sure you want to delete this review?")) {
        return;
    }

    try {
        const response = await fetch(`/review/${gameId}`, {
            method: 'DELETE',
            body: JSON.stringify({ reviewId }),
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
        });

        const jsonData = await response.json();

        if (jsonData.message === "Review deleted successfully") {
            document.getElementById(`review${reviewId}`).remove();
        } else {
            alert(`Error: ${jsonData.message}`);
        }
    } catch (error) {
        alert(`Error: ${error}`);
    }
}

const reviewModal = new bootstrap.Modal('#backdropModal');

let selectedReviewId;

async function openEditModal(reviewId) {
    const review = document.getElementById(`review${reviewId}`);
    const reviewText = review.querySelector('.card-text').textContent;

    selectedReviewId = reviewId;

    document.getElementById('modalText').value = reviewText;

    reviewModal.show();
}

async function editReview() {
    const reviewText = document.getElementById('modalText').value;

    try {
        const response = await fetch(`/review/${gameId}`, {
            method: 'PUT',
            body: JSON.stringify({ reviewId: selectedReviewId, reviewText }),
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
        });

        const jsonData = await response.json();

        if (jsonData.message === "Review edited successfully") {
            const review = document.getElementById(`review${selectedReviewId}`);

            review.querySelector('.card-text').textContent = reviewText;
        } else {
            alert(`Error: ${jsonData.message}`);
        }
    } catch (error) {
        alert(`Error: ${error}`);
    }

    reviewModal.hide();
}

const DEFAULT_ITEM = document.getElementById('defaultItem');

DEFAULT_ITEM.removeAttribute('id');

function addReview(data, reviewId) {
    const reviewList = document.getElementById('reviewList');
    const review = DEFAULT_ITEM.cloneNode(true);

    review.setAttribute('id', `review${reviewId}`);

    const emoji = data.positive ? '👍' : '👎';

    review.querySelector('.icon-link').href = `/reviews.html?user=${data.username}`;
    review.querySelector('.review-picture').src = data.profilePicture;
    review.querySelector('.card-subtitle').textContent = `${data.username} ${emoji}`;
    review.querySelector('.card-text').textContent = data.text;

    const positiveIcon = review.querySelector('.positive-icon');
    const negativeIcon = review.querySelector('.negative-icon');

    positiveIcon.textContent = `🔼 ${data.positiveVotes}`;
    negativeIcon.textContent = `🔽 ${data.negativeVotes}`;

    if (token) {
        positiveIcon.addEventListener('click', () => upvoteReview(reviewId));
        negativeIcon.addEventListener('click', () => downvoteReview(reviewId));
    } else {
        positiveIcon.disabled = true;
        negativeIcon.disabled = true;
    }

    const editButton = review.querySelector('.btn-primary');
    const deleteButton = review.querySelector('.btn-danger');

    if (token && data.username === localStorage.getItem('currentUser')) {
        editButton.addEventListener('click', () => openEditModal(reviewId));
        deleteButton.addEventListener('click', () => deleteReview(reviewId));
    } else {
        editButton.remove();
        deleteButton.remove();
    }

    reviewList.appendChild(review);
}

async function fetchRawgData(endpoint) {
    try {
        const response = await fetch(`https://api.rawg.io/api/${endpoint}?key=${RAWG_API_KEY}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        alert(`Error: ${error}`);

        return null;
    }
}

async function fetchServerData(gameId) {
    try {
        const response = await fetch(`/game/${gameId}`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        alert(`Error: ${error}`);

        return null;
    }
}

async function loadAndDisplayReviews() {
    const serverData = await fetchServerData(gameId);
    const backgroundImage = (await fetchRawgData(`games/${gameId}`)).background_image;

    document.querySelector('.card-img-top').src = backgroundImage;
    document.querySelector('.card-header').textContent = serverData.title;

    let counter = 0;

    for (const data of serverData.reviews) {
        addReview(data, counter);

        counter += 1;
    }
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
        const currentUser = localStorage.getItem('currentUser');
        const loggedInAccount = document.getElementById('loggedInAccount');
        const profilePicture = await getProfilePicture(token);

        document.getElementById('profilePicture').src = profilePicture;
        document.getElementById('reviewsButton').href = `/reviews.html?user=${currentUser}`;

        loggedInAccount.hidden = false;
    } else {
        const loggedOutAccount = document.getElementById('loggedOutAccount');

        loggedOutAccount.hidden = false;
    }
}

document.getElementById('modalSubmit').addEventListener('click', async () => {
    await editReview();
});

document.getElementById('logOutButton').addEventListener('click', function () {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
});

updateAccountSection();
loadAndDisplayReviews();
