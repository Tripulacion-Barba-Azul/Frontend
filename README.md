# Frontend of Agatha Christie Death on the Cards, Web version

## Idea
*Agatha Christie: Death on the Cards* is a multiplayer murder mystery card game inspired by the classic works of Agatha Christie. Players assume different roles, each with their own clues and secret objectives, and work together (or against each other) to solve a fictional murder.

This repository contains the frontend for the web version of the card game, built with React.


### API document:
    https://docs.google.com/spreadsheets/d/1yGESwe0XBWM6WqJdIJk8Frrl3bl4HbfxNNSNcHZxcIc/edit?gid=0#gid=0

    
## Configuration

### System Requirements
``` bash
node -v # 22.x
npm -v # Latest
```

### Cloning the Repository

To clone the repository, use the following command:
```bash
git clone https://github.com/Tripulacion-Barba-Azul/Frontend.git
```

### Installing Project Dependencies

After cloning, navigate to the frontend folder and install dependencies:

```bash
cd Frontend
npm install
```

### How to run

Start the development server with:

```bash
npm run dev
```

### Stopping the Server
```bash
Ctrl + C
```

## Docker Setup

### System Requirements for Docker
- Docker (version 20.x or higher)
- Docker Compose (version 2.x or higher)

### Building and Running with Docker

#### Production Mode

1. **Build and run the production container:**
```bash
docker compose up --build
```

2. **Run in background (detached mode):**
```bash
docker compose up -d --build
```

3. **Access the application:**
   - Open your browser and go to: `http://localhost:3000`

#### Development Mode

1. **Run the development container with hot reload:**
```bash
docker compose --profile dev up --build
```

2. **Access the development server:**
   - Open your browser and go to: `http://localhost:5173`

### Docker Commands

#### Stop containers:
```bash
docker compose down
```

#### View running containers:
```bash
docker ps
```

#### View logs:
```bash
docker compose logs -f
```

#### Remove containers and images:
```bash
docker compose down --rmi all
```

#### Build only (without running):
```bash
docker compose build
```

### Docker Architecture

- **Production**: Multi-stage build with Nginx serving static files
- **Development**: Live reload with volume mounting
- **Port mapping**: 
  - Production: `localhost:3000` → container port `80`
  - Development: `localhost:5173` → container port `5173`

## Test coverage

### How to run

```bash
cd Frontend
npm run test -- --coverage
```
