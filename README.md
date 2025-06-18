# RacingGame

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)

## Introduction

RacingGame is a browser-based multiplayer game that uses WebSockets for real-time communication. It suports up to 16 game rooms and can handle up to 255 players simultaneously.


## **Installation**
### Download
```bash
git clone https://github.com/Hajk0/RacingGame.git
cd RacingGame
```

### Server
```bash
cd server
pip -r install requirements.txt
python main.py
```

### Client
```bash
cd client
npm install
npm run dev
```

## **Usage**

![Pick Room](/client/src/assets/readme/PickGame.png) ![Race](/client/src/assets/readme/RacingGame.png)