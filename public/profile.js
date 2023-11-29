document.addEventListener('DOMContentLoaded', function () {
    // Toggle read-only state of the profile fields and show/hide the file input
    function toggleEditProfile(editing) {
        document.getElementById('description').readOnly = !editing;
        // Always display the profile picture
        document.getElementById('profilePictureDisplay').style.display = 'inline-block';
        // Toggle the file input for profile picture
        document.getElementById('profilePicture').style.display = editing ? 'inline-block' : 'none';

        // Toggle the Save and Edit buttons
        document.getElementById('saveProfileBtn').style.display = editing ? 'inline-block' : 'none';
        document.getElementById('editProfileBtn').style.display = editing ? 'none' : 'inline-block';
    }

    // Event listener for the Edit Profile button
    document.getElementById('editProfileBtn').addEventListener('click', function () {
        toggleEditProfile(true);
    });

    // Event listener for the Save Profile button
    document.getElementById('saveProfileBtn').addEventListener('click', function () {
        toggleEditProfile(false);
    });

    // Event listener for profile picture changes
    document.getElementById('profilePicture').addEventListener('change', function () {
        const reader = new FileReader();
        reader.onload = function (event) {
            // Update the display picture src with the selected file's data URL
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
                body: formData,  // FormData will set the correct content-type header
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

    loadProfileData();
});
