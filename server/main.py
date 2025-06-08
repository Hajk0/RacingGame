import math
from autobahn.twisted.websocket import WebSocketServerProtocol, WebSocketServerFactory
from Game import Game

MAX_VELOCITY = 31
MIN_VELOCITY = 0
MAX_POSITION = 511
MIN_POSITION = 0

class MyServerProtocol(WebSocketServerProtocol):
    clients = set()
    games = {}
    freePlayerIds = set(range(0, 256))

    def __init__(self):
        super().__init__()
        self.roomId = None
        self.game = None
        self.x = 300
        self.y = 300
        self.playerId = None
        self.velocity = 0
        self.angle = 0.0


    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))

    def onOpen(self):
        print("WebSocket connection open.")
        MyServerProtocol.clients.add(self)

    def onMessage(self, payload, isBinary):
        if isBinary: # dodaj przyjmowanie pozycji od klienta żeby odtworzyć stan przed refreshem
            byte_values = list(payload)
            decoded_values = self.decodeMessage(byte_values[0])
            if decoded_values[1] == 1:
                self.playerId = MyServerProtocol.freePlayerIds.pop()
                print("new playerId:", self.playerId)
                self.roomId = decoded_values[2]
                if decoded_values[2] not in MyServerProtocol.games:
                    MyServerProtocol.games[decoded_values[2]] = Game(decoded_values[2])
                self.game = MyServerProtocol.games[decoded_values[2]]
                self.game.add_player(self)
                payload = self.createMessage(self.playerId, 0, 1, 0, self.roomId, 0)
            else:
                self.updateMove(move=decoded_values[3]) # receive move
                

            #print(f"decoded values:\ntype: {decoded_values[1]}\nroomId: {decoded_values[2]}\nmove: {decoded_values[3]}")
            
        else:
            print("Text message received: {0}".format(payload.decode('utf8')))

    def onClose(self, wasClean, code, reason):
        MyServerProtocol.clients.discard(self)
        if self.game:
            self.game.remove_player(self)
            MyServerProtocol.freePlayerIds.add(self.playerId)
            payload = self.createMessage(self.playerId, 0, 1, 0, 0, 31)
            for player in self.game.players:
                player.sendMessage(payload, isBinary=True)
        print("WebSocket connection closed: {0}".format(reason))

    def decodeMessage(self, byte_value):
        playerId = 0
        type = 0
        roomId = 0
        if byte_value >= 256:
            playerId = byte_value // 256
            byte_value -= playerId * 256
        if byte_value >= 128:
            byte_value -= 128
            type = 1
        if byte_value >= 8:
            roomId = byte_value // 8
            byte_value -= roomId * 8
        move = byte_value
        return (playerId, type, roomId, move)

    def createMessage(self, playerId, angle, type, x, y, velocity):
        angle256 = int((angle / (2 * math.pi)) * 256)
        intX = int(x)
        intY = int(y)
        intVelocity = int(velocity)
        integerValue = playerId * (256 * 256 * 256 * 256) + angle256 * 16777216 + type * 8388608 + intX * 16384 + intY * 32 + intVelocity
        print("integerValue:", integerValue)
        payload = integerValue.to_bytes(5, byteorder='little')
        return payload

    def updateMove(self, move):
        if move == 0:
            self.accelerate(3)
        elif move == 1:
            self.turnRight(0.007)
            self.accelerate(2)
        elif move == 2:
            self.turnRight(0.01)
        elif move == 3:
            self.turnRight(0.02)
            self.brake(1)
        elif move == 4:
            self.brake(2)
        elif move == 5:
            self.turnLeft(0.02)
            self.brake(1)
        elif move == 6:
            self.turnLeft(0.01)
        elif move == 7:
            self.turnLeft(0.007)
            self.accelerate(2)
        


    def updateAngle(self, value):
        self.angle = (self.angle + value) % (2 * math.pi)

    def updatePosition(self):
        self.x = max(min(self.x + self.velocity * math.sin(self.angle), MAX_POSITION), MIN_POSITION)
        #self.x += self.velocity * math.sin(self.angle)# + -> start upwards
        self.y = max(min(self.y - self.velocity* math.cos(self.angle), MAX_POSITION), MIN_POSITION)
        #self.y -= self.velocity * math.cos(self.angle)# - -> start upwards
        self.decreaseVelocityByFriction()
        #print("POSITION:", self.x, self.y, "PLAYER_ID:", self.playerId, "ANGLE:", self.angle)

    def accelerate(self, value):
        self.velocity = min(MAX_VELOCITY, self.velocity + value)

    def decreaseVelocityByFriction(self):
        self.velocity = max(MIN_VELOCITY, self.velocity - 1)

    def turnRight(self, turnSpeed):
        #turnSpeed = 0.01
        self.angle = (self.angle + turnSpeed * self.velocity) % (2 * math.pi)

    def turnLeft(self, turnSpeed):
        #turnSpeed = 0.01
        self.angle = (self.angle - turnSpeed * self.velocity) % (2 * math.pi)
    
    def brake(self, value):
        self.velocity = max(MIN_VELOCITY, self.velocity - value)


def game_loop():
    for game in MyServerProtocol.games.values():
        game.tick()


if __name__ == '__main__':

    import sys

    from twisted.python import log
    from twisted.internet import reactor
    from twisted.internet.task import LoopingCall

    log.startLogging(sys.stdout)

    factory = WebSocketServerFactory("ws://0.0.0.0:8000/ws")
    factory.protocol = MyServerProtocol
    lc = LoopingCall(game_loop)
    lc.start(0.1)
    reactor.listenTCP(8000, factory)
    reactor.run()
    