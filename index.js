const express = require('express')
const app = express()
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const { User } = require('./user');
const jwt = require('jsonwebtoken');
const secretKey = 'the-secret-key';

const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'GameReview Server API',
            version: '1.0.0'
        }
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
 *     summary: Create a new user
 *     description: Register a new user with a username and password.
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
 *     summary: Login a user.
 *     description: Login a user with a username and password.
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

const port = process.env.PORT || 5678;

console.log(`Server listening at ${port}`);
app.listen(port);
