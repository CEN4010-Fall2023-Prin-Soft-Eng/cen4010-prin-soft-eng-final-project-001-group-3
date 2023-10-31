const { Game } = require('./game');
const { User } = require('./user');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const express = require('express')
const jwt = require('jsonwebtoken')

const app = express()
const secretKey = 'the-secret-key';

const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'GameReview Server API',
            version: '1.0.0'
        },
        securityDefinitions: {
            Bearer: {
                type: 'apiKey',
                name: 'Authorization',
                scheme: 'bearer',
                in: 'header'
            }
        },
    },
    apis: ['index.js']

};

const swaggerDocs = swaggerJSDoc(swaggerOptions)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

function verifyToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = decoded; // Set user information in the request
        next(); // Move on to the next middleware
    });
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('./public'));

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Register a new user with a username and password
 *     parameters:
 *       - in: formData
 *         name: username
 *         required: true
 *         description: The username of the new user.
 *         schema:
 *           type: string
 *           example: john_doe
 *       - in: formData
 *         name: password
 *         required: true
 *         description: The password of the new user.
 *         schema:
 *           type: string
 *           example: password123
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: Username already exists
 *       500:
 *         description: Internal Server Error
 */
app.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if the username already exists
        const existingUser = await User.find(username);

        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new User(
            username,
            hashedPassword
        );

        await user.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user with username and password
 *     parameters:
 *       - in: formData
 *         name: username
 *         required: true
 *         description: The username of the user.
 *         schema:
 *           type: string
 *           example: john_doe
 *       - in: formData
 *         name: password
 *         required: true
 *         description: The password of the user.
 *         schema:
 *           type: string
 *           example: password123
 *     responses:
 *       201:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid username or password
 *       500:
 *         description: Internal Server Error
 */
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if the username exists
        const user = await User.find(username);

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign({ username }, secretKey, { expiresIn: '1d' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /review/{gameId}:
 *   post:
 *     summary: Add a review to a game
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game.
 *       - in: formData
 *         name: reviewText
 *         required: true
 *         description: The text of the review.
 *     responses:
 *       201:
 *         description: Review added successfully
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal Server Error
 */
app.post('/review/:gameId', verifyToken, async (req, res) => {
    try {
        const { gameId } = req.params;
        const { reviewText } = req.body;
        const { username } = req.user;
        const game = await Game.find(gameId);

        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        const errorMessage = game.addReview(username, reviewText);

        if (errorMessage) {
            return res.status(403).json({ message: errorMessage });
        }

        await game.save();

        res.status(201).json({ message: 'Review added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /review/{gameId}:
 *   put:
 *     summary: Allow user to edit their review
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game.
 *       - in: formData
 *         name: reviewText
 *         required: true
 *         description: The text of the review.
 *     responses:
 *       201:
 *         description: Review edited successfully
 *       403:
 *         description: Review cannot be empty
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal Server Error
 */
app.put('/review/:gameId', verifyToken, async (req, res) => {
});

/**
 * @swagger
 * /review/{gameId}:
 *   delete:
 *     summary: Allow user to delete their review
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game.
 *     responses:
 *       201:
 *         description: Review deleted successfully
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal Server Error
 */
app.delete('/review/:gameId', verifyToken, async (req, res) => {
});

/**
 * @swagger
 * /upvote/{gameId}/{reviewId}:
 *   post:
 *     summary: Upvote a review
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game.
 *       - in: path
 *         name: reviewId
 *         required: true
 *         description: The ID of the review to upvote.
 *     responses:
 *       200:
 *         description: Upvote successful
 *       403:
 *         description: Forbidden (Own review or already voted)
 *       500:
 *         description: Internal Server Error
 */
app.post('/upvote/:gameId/:reviewId', verifyToken, async (req, res) => {
    try {
        const { gameId, reviewId } = req.params;
        const { username } = req.user;
        const game = await Game.find(gameId);

        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        const review = game.reviews[reviewId];

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const errorMessage = review.upvote(username);

        if (errorMessage) {
            return res.status(403).json({ message: errorMessage });
        }

        await game.save();

        res.status(200).json({ message: 'Upvote successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /downvote/{gameId}/{reviewId}:
 *   post:
 *     summary: Downvote a review
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game.
 *       - in: path
 *         name: reviewId
 *         required: true
 *         description: The ID of the review to downvote.
 *     responses:
 *       200:
 *         description: Downvote successful
 *       403:
 *         description: Forbidden (Own review or already voted)
 *       500:
 *         description: Internal Server Error
 */
app.post('/downvote/:gameId/:reviewId', verifyToken, async (req, res) => {
    try {
        const { gameId, reviewId } = req.params;
        const { username } = req.user;
        const game = await Game.find(gameId);

        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        const review = game.reviews[reviewId];

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const errorMessage = review.downvote(username);

        if (errorMessage) {
            return res.status(403).json({ message: errorMessage });
        }

        await game.save();

        res.status(200).json({ message: 'Downvote successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

const port = process.env.PORT || 5678;

console.log(`Server listening at ${port}`);
app.listen(port);
