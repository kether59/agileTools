# Planning Poker Application

A real-time Planning Poker application for Agile teams, built with Vue.js and Node.js.

## Features

- Real-time Planning Poker sessions using WebSocket
- User authentication and session management
- Persistent storage of game sessions and user data
- Modern, responsive UI
- Dockerized deployment

## Project Structure

```
planning-poker/
├── frontend/         # Vue.js frontend application
├── backend/          # Node.js API server
├── docker/           # Docker configuration files
└── docker-compose.yml
```

## Quick Start

1. Clone the repository
2. Install Docker and Docker Compose
3. Run `docker-compose up --build`
4. Access the application at http://localhost:3000

## Development

- Frontend development server: `cd frontend && npm run serve`
- Backend development server: `cd backend && npm run dev`

## License

MIT
