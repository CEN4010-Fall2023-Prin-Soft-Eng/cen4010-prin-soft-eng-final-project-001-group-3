class Review {
    constructor(username, text) {
        this.username = username;
        this.text = text;
        this.votes = 0;
        this.voters = []; // To keep track of who has voted
    }

    upvote(username) {
        if (this.voters.includes(username)) {
            return 'You have already voted on this review';
        }
        if (this.username === username) {
            return 'You cannot upvote your own review';
        }
        this.votes += 1;
        this.voters.push(username);

        return null;
    }

    downvote(username) {
        if (this.voters.includes(username)) {
            return 'You have already voted on this review';
        }

        if (this.username === username) {
            return 'You cannot downvote your own review';
        }
        this.votes -= 1;
        this.voters.push(username);

        return null;
    }
}

module.exports = { Review };