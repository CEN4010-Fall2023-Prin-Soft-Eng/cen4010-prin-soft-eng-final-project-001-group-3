document.addEventListener('DOMContentLoaded', function() {
    let newProfilePictureDataUrl = null; // Temporary storage for the new profile picture

    // Function to save all profile information in JSON format
    function saveProfileInfo() {
        const profileData = {
            userName: document.getElementById('userNameDisplay').value,
            userDescription: document.getElementById('profileDescriptionDisplay').value,
            profilePicture: newProfilePictureDataUrl || document.getElementById('profilePictureDisplay').src
        };

        // Save the profile data to localStorage
        localStorage.setItem('profileData', JSON.stringify(profileData));
        alert('Profile information saved successfully!');
        
        // Clear the temporary image data URL after saving
        newProfilePictureDataUrl = null;
    }

    // Toggle read-only state of the profile fields and show/hide the file input
    function toggleEditProfile(editing) {
        document.getElementById('userNameDisplay').readOnly = !editing;
        document.getElementById('profileDescriptionDisplay').readOnly = !editing;
        // Always display the profile picture
        document.getElementById('profilePictureDisplay').style.display = 'inline-block';
        // Toggle the file input for profile picture
        document.getElementById('profilePictureInput').style.display = editing ? 'inline-block' : 'none';
        
        // Toggle the Save and Edit buttons
        document.getElementById('saveProfileBtn').style.display = editing ? 'inline-block' : 'none';
        document.getElementById('editProfileBtn').style.display = editing ? 'none' : 'inline-block';
    }

    // Load stored profile information on page load
    function loadProfile() {
        const savedProfileData = JSON.parse(localStorage.getItem('profileData'));
        if (savedProfileData) {
            document.getElementById('userNameDisplay').value = savedProfileData.userName || '';
            document.getElementById('profileDescriptionDisplay').value = savedProfileData.userDescription || '';
            document.getElementById('profilePictureDisplay').src = savedProfileData.profilePicture || '';
        }
    }

    // Initialize the profile data on page load
    loadProfile();

    // Event listener for the Edit Profile button
    document.getElementById('editProfileBtn').addEventListener('click', function() {
        toggleEditProfile(true);
    });

    // Event listener for the Save Profile button
    document.getElementById('saveProfileBtn').addEventListener('click', function() {
        saveProfileInfo();
        toggleEditProfile(false);
    });

    // Event listener for profile picture changes
    document.getElementById('profilePictureInput').addEventListener('change', function() {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Update the display picture src with the selected file's data URL
            newProfilePictureDataUrl = e.target.result; // Store the new data URL temporarily
            document.getElementById('profilePictureDisplay').src = newProfilePictureDataUrl;
        };
        reader.readAsDataURL(this.files[0]);
    });
});