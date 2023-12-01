class Review {
    constructor(username, text, positive) {
        this.username = username;
        this.text = text;
        this.positive = positive;
        this.positiveVotes = 0;
        this.negativeVotes = 0;
        this.voters = {};
    }

    upvote(username) {
        if (this.username === username) {
            return 'You cannot upvote your own review';
        }

        if (this.voters[username] === 'downvote') {
            this.negativeVotes -= 1;
            this.positiveVotes += 1;
        } else if (!this.voters[username]) {
            this.positiveVotes += 1;
        } else {
            return 'You have already upvoted this review';
        }

        this.voters[username] = 'upvote';
        return null;
    }

    downvote(username) {
        if (this.username === username) {
            return 'You cannot downvote your own review';
        }

        if (this.voters[username] === 'upvote') {
            this.positiveVotes -= 1;
            this.negativeVotes += 1;
        } else if (!this.voters[username]) {
            this.negativeVotes += 1;
        } else {
            return 'You have already downvoted this review';
        }

        this.voters[username] = 'downvote';
        return null;
    }
}

module.exports = { Review };
