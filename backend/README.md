# Backend Documentation

This is the backend part of the fullstack project built with Node.js, Express, and MongoDB.

## Installation Requirements

To set up the backend, ensure you have the following installed:

- Node.js
- Express
- Mongoose
- Body-parser (optional, for parsing request bodies)
- CORS (optional, for handling cross-origin requests)

## Installation Steps

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Initialize a new Node.js project:
   ```
   npm init -y
   ```

3. Install the necessary packages:
   ```
   npm install express mongoose body-parser cors
   ```

## Project Structure

- `src/app.js`: Entry point of the backend application.
- `src/controllers/index.js`: Handles requests for different routes.
- `src/models/index.js`: Defines data models for MongoDB.
- `src/routes/index.js`: Sets up the routes for the application.
- `src/config/db.js`: Configuration for connecting to the MongoDB database.

## Running the Application

To run the backend application, use the following command:

```
node src/app.js
```

Make sure your MongoDB server is running before starting the application.