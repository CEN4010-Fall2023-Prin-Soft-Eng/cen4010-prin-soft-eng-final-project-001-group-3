const fs = require('fs').promises;

class User {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    save() {
        return fs.writeFile(`./accounts/${this.username}.json`, JSON.stringify(this));
    }

    static find(username) {
        return fs.readFile(`./accounts/${username}.json`, 'utf8')
            .then(JSON.parse)
            .then((user) => new User(user.username, user.password))
            .catch(() => null);
    }
}

module.exports = { User };