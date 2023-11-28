const fs = require('fs').promises;

class User {
    constructor(username, password, profilePicture, description) {
        this.username = username;
        this.password = password;
        this.profilePicture = profilePicture;
        this.description = description;
    }

    save() {
        return fs.writeFile(`./accounts/${this.username}.json`, JSON.stringify(this));
    }

    static find(username) {
        return fs.readFile(`./accounts/${username}.json`, 'utf8')
            .then(JSON.parse)
            .then((user) => new User(user.username, user.password, user.profilePicture, user.description))
            .catch(() => null);
    }
}

module.exports = { User };