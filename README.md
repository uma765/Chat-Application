# Real-Time Chat Application

## 📌 Project Description
This is a real-time chat application built using **Node.js, Express.js, Socket.io, and MongoDB**. It allows users to communicate instantly with features like user authentication, private messaging, and online status tracking.

## 🚀 Features
- User authentication (signup/login)
- Real-time messaging using WebSockets
- Online/offline user status
- Group and private chat support
- Message history storage
- Typing indicators
- Responsive UI

## 🛠️ Technologies Used
- **Frontend:** React.js, HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **WebSockets:** Socket.io
- **Authentication:** JWT (JSON Web Token)
- **Styling:** Tailwind CSS

## 📦 Installation

### Prerequisites
Make sure you have the following installed:
- Node.js
- MongoDB
- npm or yarn

### Steps to Run
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/real-time-chat-app.git
   cd real-time-chat-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```env
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret_key
     ```
4. Start the server:
   ```bash
   npm run server
   ```
5. Start the frontend:
   ```bash
   cd client
   npm install
   npm start
   ```

## 📜 API Endpoints
| Method | Endpoint           | Description          |
|--------|-------------------|----------------------|
| POST   | `/api/auth/register` | User registration   |
| POST   | `/api/auth/login`    | User login         |
| GET    | `/api/messages/:id`  | Get chat messages  |
| POST   | `/api/messages/send` | Send a message     |

## 🤝 Contribution
Feel free to fork this repository and submit a pull request with your improvements. Follow these steps:
1. Fork the project
2. Create your feature branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature-branch`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌐 Live Demo
A live demo of the application will be available soon!

