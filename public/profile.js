function toggleEditProfile(editing) {
    document.getElementById('descriptionField').readOnly = !editing;
    document.getElementById('profilePictureField').disabled = !editing;
    document.getElementById('saveButton').disabled = !editing;
    document.getElementById('editButton').disabled = editing;
}

function updateProfilePicture() {
    const reader = new FileReader();

    reader.addEventListener('load', function (event) {
        document.getElementById('profilePictureDisplay').src = event.target.result;
    });

    reader.readAsDataURL(this.files[0]);
}

async function submitForm(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const token = localStorage.getItem('token');

    toggleEditProfile(false);

    try {
        const response = await fetch('/save-profile', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': token,
            }
        });

        const result = await response.json();

        alert(result.message);
    } catch (error) {
        alert(`Error: ${error}`);
    }
}

async function loadProfileData() {
    const token = localStorage.getItem('token');
    const response = await fetch('/profile-data', {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    });

    const result = await response.json();

    document.getElementById('descriptionField').value = result.description;
    document.getElementById('profilePictureDisplay').src = result.profilePicture;
}

document.getElementById('reviewsButton').href = '/reviews.html?user=' + localStorage.getItem('currentUser');

document.getElementById('logOutButton').addEventListener('click', function () {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
});

document.getElementById('profilePictureField').addEventListener('change', updateProfilePicture);

document.getElementById('editButton').addEventListener('click', function () {
    toggleEditProfile(true);
});

document.getElementById('profileEditForm').addEventListener('submit', submitForm);

loadProfileData();
