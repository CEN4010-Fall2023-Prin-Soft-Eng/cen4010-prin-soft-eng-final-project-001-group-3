const { Review } = require('./review');
const fs = require('fs').promises;

class Game {
    constructor(id, title, reviews, reviewers) {
        this.id = id;
        this.title = title;

        for (const review of reviews) {
            review.__proto__ = Review.prototype;
        }

        this.reviews = reviews;
        this.reviewers = reviewers;  // Track usernames that have submitted reviews
    }

    addReview(username, text) {
        if (this.reviewers.includes(username)) {
            return 'You have already added a review';
        }

        this.reviews.push(new Review(username, text));
        this.reviewers.push(username);

        return null;
    }

    save() {
        return fs.writeFile(`./games/${this.id}.json`, JSON.stringify(this));
    }

    static find(id) {
        return fs.readFile(`./games/${id}.json`, 'utf8')
            .then(JSON.parse)
            .then((game) => new Game(game.id, game.title, game.reviews, game.reviewers))
            .catch(() => null);
    }
}

module.exports = { Game };