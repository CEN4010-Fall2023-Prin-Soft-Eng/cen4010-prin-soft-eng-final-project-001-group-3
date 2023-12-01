const { Review } = require('./review');
const fs = require('fs').promises;
const fetch = require('node-fetch');
const apiKey = '48288ff667454f7681cb863cb83b9b82';

class Game {
    constructor(id, title, reviews, reviewers) {
        this.id = id;
        this.title = title;

        for (const review of reviews) {
            review.__proto__ = Review.prototype;
        }

        this.reviews = reviews;
        this.reviewers = reviewers;
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

    static async find(id) {
        try {
            const fileData = await fs.readFile(`./games/${id}.json`, 'utf8');
            const game = JSON.parse(fileData);
            return new Game(game.id, game.title, game.reviews, game.reviewers);
        } catch (error) {
            try {
                const response = await fetch(`https://api.rawg.io/api/games/${id}?key=${apiKey}`);
                const data = await response.json();

                if (data.detail === "Not found.") {
                    return null;
                }

                return new Game(data.id, data.name, [], []);
            } catch (error) {
                console.error('Error fetching from RAWG API: ', error);
                return null;
            }
        }
    }
}

module.exports = { Game };