document.addEventListener('DOMContentLoaded', function () {
    function toggleEditProfile(editing) {
        document.getElementById('description').readOnly = !editing;
        document.getElementById('profilePictureDisplay').style.display = 'inline-block';
        document.getElementById('profilePicture').style.display = editing ? 'inline-block' : 'none';
        document.getElementById('saveProfileBtn').style.display = editing ? 'inline-block' : 'none';
        document.getElementById('editProfileBtn').style.display = editing ? 'none' : 'inline-block';
    }

    document.getElementById('editProfileBtn').addEventListener('click', function () {
        toggleEditProfile(true);
    });

    document.getElementById('saveProfileBtn').addEventListener('click', function () {
        toggleEditProfile(false);
    });

    document.getElementById('profilePicture').addEventListener('change', function () {
        const reader = new FileReader();
        reader.onload = function (event) {
            document.getElementById('profilePictureDisplay').src = event.target.result;
        };
        reader.readAsDataURL(this.files[0]);
    });

    document.getElementById('profileUpdateForm').addEventListener('submit', async function (event) {
        event.preventDefault();
        const formData = new FormData(this);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/save-profile', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': token
                }
            });

            const result = await response.json();

            alert(result.message);
        } catch (error) {
            alert("Error updating profile:" + error);
        }
    });

    async function loadProfileData() {
        const token = localStorage.getItem('token');
        const response = await fetch('/profile-data', {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });

        const result = await response.json();

        document.getElementById('description').value = result.description;
        document.getElementById('profilePictureDisplay').src = result.profilePicture;
    }

    document.getElementById('seeReviewsLink').href = '/reviews.html?user=' + localStorage.getItem('currentUser');

    loadProfileData();
});
