document.addEventListener('DOMContentLoaded', function() {
    // Now you can safely add event listeners to your elements.

    document.getElementById('userName').addEventListener('input', function() {
        localStorage.setItem('userName', this.value);
    });

    document.getElementById('profilePicture').addEventListener('change', function() {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('displayPicture').src = e.target.result;
        };
        reader.readAsDataURL(this.files[0]);
    });

    document.getElementById('profileDescription').addEventListener('input', function() {
        localStorage.setItem('userDescription', this.value);
    });

    // When the window is loaded, update the input fields and image based on stored values.
    window.onload = function() {
        // This will set the value to either the stored value or an empty string if there's nothing stored.
        document.getElementById('userName').value = localStorage.getItem('userName') || '';
        document.getElementById('profileDescription').value = localStorage.getItem('userDescription') || '';
        
        // If there's an image stored, update the `src` of the `displayPicture` element.
        // Assuming the image is stored in localStorage in Base64 format.
        const storedImage = localStorage.getItem('profilePicture');
        if (storedImage) {
            document.getElementById('displayPicture').src = storedImage;
        }

        // Here you can also add code to display the reviews if necessary.
    };
});