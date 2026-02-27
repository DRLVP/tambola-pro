# Tambola Pro Backend API Routes

Base URL: `http://localhost:8080` (Development)

## Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/assign-role` | Assign role to user | ✅ Yes |
| `POST` | `/api/auth/sync-user` | Sync user data after sign-in | ✅ Yes |
| `POST` | `/api/auth/sync-admin` | Sync admin data (maps to syncUser) | ✅ Yes |

## Games (`/api/games`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/games` | List all games (supports pagination) | ❌ No |
| `GET` | `/api/games/active` | List active games | ❌ No |
| `POST` | `/api/games` | Create a new game | ✅ Yes (Admin) |
| `POST` | `/api/games/:id/start` | Start a game | ✅ Yes (Admin) |
| `POST` | `/api/games/:id/call` | Call a number | ✅ Yes (Admin) |
| `POST` | `/api/games/:id/pause` | Pause a game | ✅ Yes (Admin) |
| `POST` | `/api/games/:id/resume` | Resume a game | ✅ Yes (Admin) |
| `POST` | `/api/games/:id/end` | End a game | ✅ Yes (Admin) |

## Tickets (`/api/tickets`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/tickets/purchase` | Purchase a ticket | ❌ No |
| `POST` | `/api/tickets/:ticketId/claim`| Claim a prize | ❌ No |

## Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | List all users (role='user') | ✅ Yes |
| `GET` | `/api/users/profile` | Get user profile | ✅ Yes |
| `PUT` | `/api/users/profile` | Update user profile | ✅ Yes |
| `GET` | `/api/users/winnings` | Get user winnings | ✅ Yes |
| `GET` | `/api/users/game-history` | Get user game history | ✅ Yes |
| `DELETE`| `/api/users/:id` | Delete a user | ✅ Yes (Admin) |

## Admin (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard/stats` | Get dashboard statistics | ✅ Yes (Admin) |
