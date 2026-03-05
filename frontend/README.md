# Frontend Fullstack Project

This is the frontend part of the fullstack project built with Angular.

## Installation Requirements

To set up the frontend, ensure you have the following installed:

- Node.js
- Angular CLI

### Installation Steps

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Create a new Angular application:
   ```
   ng new my-angular-app
   ```

3. Navigate into the newly created Angular application directory:
   ```
   cd my-angular-app
   ```

4. Install the necessary packages:
   ```
   npm install
   ```

## Project Structure

The frontend project is structured as follows:

```
frontend
├── src
│   ├── app
│   │   ├── app.component.html
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   └── app-routing.module.ts
│   ├── assets
│   └── environments
│       ├── environment.prod.ts
│       └── environment.ts
├── angular.json
├── package.json
└── README.md
```

## Usage

To run the Angular application, use the following command:

```
ng serve
```

Visit `http://localhost:4200` in your browser to see the application in action.