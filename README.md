# My Fullstack Project

This is a fullstack application built with Angular for the frontend and Node.js with Express for the backend, using MongoDB as the database.

## Project Structure

```
my-fullstack-project
├── backend
│   ├── src
│   │   ├── app.js
│   │   ├── controllers
│   │   ├── models
│   │   ├── routes
│   │   └── config
│   ├── package.json
│   └── README.md
├── frontend
│   ├── src
│   │   ├── app
│   │   ├── assets
│   │   └── environments
│   ├── angular.json
│   ├── package.json
│   └── README.md
└── README.md
```

## Installation Requirements

### Backend

- Node.js
- Express
- Mongoose
- Body-parser (optional, for parsing request bodies)
- CORS (optional, for handling cross-origin requests)

To set up the backend, navigate to the backend directory and run the following commands:

```
cd backend
npm init -y
npm install express mongoose body-parser cors
```

### Frontend

- Angular CLI
- Angular core and common packages

To set up the frontend, navigate to the frontend directory and run the following commands:

```
cd frontend
ng new my-angular-app
cd my-angular-app
npm install
```

## Usage

After installing the necessary packages, you can start the backend and frontend servers to run the application. Make sure to configure your MongoDB connection in the backend before starting the server.

# oss