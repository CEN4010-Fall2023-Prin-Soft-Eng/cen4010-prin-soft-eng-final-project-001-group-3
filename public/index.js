const RAWG_API_KEY = '48288ff667454f7681cb863cb83b9b82';
const ITEMS_PER_PAGE = 10;

// Function to fetch and display games data from JSON with pagination, search, and filters
async function fetchData(searchQuery, platform, genre, tag, page) {
    const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
    const platformParam = platform ? `&platforms=${platform}` : '';
    const genreParam = genre ? `&genres=${genre}` : '';
    const tagParam = tag ? `&tags=${tag}` : '';
    const offset = (page - 1) * ITEMS_PER_PAGE;

    try {
        const response = await fetch(`https://api.rawg.io/api/games?dates=2023-01-01,2023-11-01&ordering=-added&key=${RAWG_API_KEY}&page_size=${ITEMS_PER_PAGE}&page=${page}&offset=${offset}${searchParam}${platformParam}${genreParam}${tagParam}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        alert(`Error: ${error}`);

        return null;
    }
}

const reviewModal = new bootstrap.Modal('#backdropModal');

let selectedGameId;
let selectedGameName;
let selectedPositive;

function openReviewModal(gameId, gameName, positive) {
    let emoji = positive ? '👍' : '👎';

    selectedGameId = gameId;
    selectedGameName = gameName;
    selectedPositive = positive;

    document.getElementById('modalTitle').textContent = `${emoji} Write a Review for ${gameName}`;

    reviewModal.show();
}

async function submitReview() {
    const reviewText = document.getElementById('modalText').value;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/review/${selectedGameId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ reviewText, positive: selectedPositive })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Review added successfully');
        } else {
            alert(`Error while submitting review: ${result.message}`);
        }
    } catch (error) {
        alert(`Error: ${error}`);
    }

    reviewModal.hide();

    document.getElementById('modalText').value = '';
}

const DEFAULT_CARD = document.getElementById('defaultCard');

DEFAULT_CARD.removeAttribute('id');

function displayGamesData(results) {
    const cardList = document.getElementById('cardList');

    if (!Array.isArray(results) || results.length === 0) {
        cardList.textContent = 'No results found for this search.';

        return;
    }

    cardList.innerHTML = '';

    for (const data of results) {
        const card = DEFAULT_CARD.cloneNode(true);

        const image_node = card.querySelector('.card-img-top');

        image_node.src = data.background_image;
        image_node.alt = data.name;

        card.querySelector('a').href = `/game.html?id=${data.id}`;
        card.querySelector('.card-title').textContent = data.name;
        card.querySelector('.positive-icon').onclick = () => openReviewModal(data.id, data.name, true);
        card.querySelector('.negative-icon').onclick = () => openReviewModal(data.id, data.name, false);

        cardList.appendChild(card);
    }
}

function getPageIndex() {
    return parseInt(document.getElementById('pageIndex').textContent);
}

async function searchAndDisplayGamesData() {
    const searchQuery = document.getElementById('searchBar').value;
    const platform = document.getElementById('platformFilter').value;
    const genre = document.getElementById('genreFilter').value;
    const tag = document.getElementById('tagFilter').value;
    const data = await fetchData(searchQuery, platform, genre, tag, getPageIndex());

    displayGamesData(data.results);
}

async function setPageIndex(page) {
    const pageIndex = document.getElementById('pageIndex');
    const nextPage = document.getElementById('nextPage');
    const previousPage = document.getElementById('previousPage');

    nextPage.classList.add('disabled');
    previousPage.classList.add('disabled');
    pageIndex.textContent = page;

    window.scrollTo(0, 0);

    await searchAndDisplayGamesData();

    nextPage.classList.remove('disabled');

    if (page > 1) {
        previousPage.classList.remove('disabled');
    }
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

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);

    options.forEach(option => {
        const opt = document.createElement('option');

        opt.value = option.id;
        opt.textContent = option.name;

        select.appendChild(opt);
    });
}

async function populateFilters() {
    const platformsData = await fetchRawgData('platforms');
    const genresData = await fetchRawgData('genres');
    const tagsData = await fetchRawgData('tags');

    populateSelect('platformFilter', platformsData.results);
    populateSelect('genreFilter', genresData.results);
    populateSelect('tagFilter', tagsData.results);
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
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');

    if (token !== null) {
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

document.getElementById('logOutButton').onclick = () => {
    localStorage.removeItem('token');
    window.location.reload();
};

document.getElementById('searchButton').onclick = async () => {
    await setPageIndex(1);
};

document.getElementById('searchBar').onkeydown = async (event) => {
    if (event.key === 'Enter') {
        await setPageIndex(1);
    }
};

document.getElementById('nextPage').onclick = async () => {
    await setPageIndex(getPageIndex() + 1);
};

document.getElementById('previousPage').onclick = async () => {
    await setPageIndex(getPageIndex() - 1);
};

document.getElementById('modalSubmit').onclick = async () => {
    await submitReview();
};

document.addEventListener('DOMContentLoaded', async () => {
    setPageIndex(1);
    populateFilters();
    updateAccountSection();
});
