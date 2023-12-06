const { Game } = require('./game');
const { User } = require('./user');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const secretKey = 'the-secret-key';

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
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

    jwt.verify(token, secretKey, (error, decoded) => {
        if (error) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = decoded; // Set user information in the request
        next(); // Move on to the next middleware
    });
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('./public'));
app.use("/uploads", express.static('uploads'));

{
    const fs = require('fs');

    if (!fs.existsSync('accounts')) {
        fs.mkdirSync('accounts');
    }

    if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
    }

    if (!fs.existsSync('games')) {
        fs.mkdirSync('games');
    }
}

const DEFAULT_PICTURE = "https://e7.pngegg.com/pngimages/753/432/png-clipart-user-profile-2018-in-sight-user-conference-expo-business-default-business-angle-service-thumbnail.png";

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
            hashedPassword,
            DEFAULT_PICTURE,
            ""
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

        const token = jwt.sign({ username }, secretKey, { expiresIn: '365d' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // Limit file size to 1MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
            cb(null, true);
        } else {
            cb(new Error("Only .jpg and .png files are accepted"), false);
        }
    }
});

/**
 * @swagger
 * /save-profile:
 *   post:
 *     summary: Update a user's profile
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: formData
 *         name: description
 *         description: The description of the user.
 *       - in: formData
 *         name: profilePicture
 *         description: The profile picture of the user.
 *     responses:
 *       201:
 *         description: Profile updated successfully
 *       500:
 *         description: Internal Server Error
 */
app.post('/save-profile', verifyToken, upload.single('profilePicture'), async (req, res) => {
    const { username } = req.user;
    const description = req.body.description;
    const picturePath = req.file ? req.file.path : null;
    const userProfilePath = `accounts/${username}.json`;

    try {
        const data = await fs.readFile(userProfilePath);
        const userProfile = JSON.parse(data.toString());

        // Update only the relevant fields
        if (description) userProfile.description = description;
        if (picturePath) userProfile.profilePicture = picturePath;

        await fs.writeFile(userProfilePath, JSON.stringify(userProfile, null, 2));

        res.status(201).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /profile-data:
 *   get:
 *     summary: Get the profile data of the logged-in user
 *     security:
 *       - Bearer: []
 *     responses:
 *       200:
 *         description: Profile data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
app.get('/profile-data', verifyToken, async (req, res) => {
    try {
        const { username } = req.user;
        const user = await User.find(username);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        res.status(200).json({ profilePicture: user.profilePicture, description: user.description });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


/**
 * @swagger
 * /user/reviews/{username}:
 *   get:
 *     summary: Get all reviews by user
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         description: The username of the user.
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       404:
 *         description: No reviews found for the specified username
 *       500:
 *         description: Internal Server Error
 */
app.get('/user/reviews/:username', verifyToken, async (req, res) => {
    try {
        const username = req.params.username;
        const gameFiles = await fs.readdir('games');
        const matchingReviews = [];

        for (const file of gameFiles) {
            const fileContent = await fs.readFile(`games/${file}`, 'utf8');
            const gameData = JSON.parse(fileContent);
            const userReviews = gameData.reviews.filter(review => review.username === username);

            if (userReviews.length > 0) {
                matchingReviews.push({
                    id: gameData.id,
                    title: gameData.title,
                    review: userReviews[0],
                });
            }
        }

        if (matchingReviews.length > 0) {
            res.status(200).json(matchingReviews);
        } else {
            res.status(404).json({ error: 'No reviews found for the specified username' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
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
 *       - in: formData
 *         name: positive
 *         required: true
 *         description: Whether the review is positive or negative.
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
        const { reviewText, positive } = req.body;
        const { username } = req.user;
        const game = await Game.find(gameId);

        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        const errorMessage = game.addReview(username, reviewText, positive);

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
    try {
        const { gameId } = req.params;
        const { reviewText } = req.body;
        const { username } = req.user;
        const game = await Game.find(gameId);

        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        const errorMessage = game.editReview(username, reviewText);

        if (errorMessage) {
            return res.status(403).json({ message: errorMessage });
        }

        await game.save();

        res.status(201).json({ message: 'Review edited successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
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
    try {
        const { gameId } = req.params;
        const { username } = req.user;
        const game = await Game.find(gameId);

        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        const errorMessage = game.deleteReview(username);

        if (errorMessage) {
            return res.status(403).json({ message: errorMessage });
        }

        await game.save();

        res.status(201).json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
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

        res.status(200).json({ message: 'Upvote successful', positiveVotes: review.positiveVotes, negativeVotes: review.negativeVotes });
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

        res.status(200).json({ message: 'Downvote successful', positiveVotes: review.positiveVotes, negativeVotes: review.negativeVotes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /games:
 *   get:
 *     summary: List the top 10 latest games
 *     security:
 *       - Bearer: []
 *     responses:
 *       200:
 *         description: Games listed successfully
 *       500:
 *         description: Internal Server Error
 */
app.get('/games', async (req, res) => {
});

/**
 * @swagger
 * /games/{id}:
 *   get:
 *     summary: Get a game by ID
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     description: The ID of the game to retrieve.
 *     responses:
 *       200:
 *         description: Game retrieved successfully
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal Server Error
 */
app.get('/game/:id', async (req, res) => {
    try {
        const gameDetails = await Game.find(req.params.id);

        if (gameDetails) {
            for (const review of gameDetails.reviews) {
                const user = await User.find(review.username);
                review.profilePicture = user.profilePicture;
            }
            res.status(200).json(gameDetails);
        } else {
            res.status(404).send('Game not found');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

const port = process.env.PORT || 5678;

console.log(`Server listening at ${port}`);
app.listen(port);
