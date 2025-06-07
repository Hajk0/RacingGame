from autobahn.twisted.websocket import WebSocketServerProtocol, WebSocketServerFactory
from Game import Game

MAX_VELOCITY = 31

class MyServerProtocol(WebSocketServerProtocol):
    clients = set()
    games = {}
    freePlayerIds = set(range(0, 256))

    def __init__(self):
        super().__init__()
        self.roomId = None
        self.game = None
        self.x = 0
        self.y = 0
        self.playerId = None
        self.velocity = 0
        self.angle = 0


    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))

    def onOpen(self):
        print("WebSocket connection open.")
        MyServerProtocol.clients.add(self)

    def onMessage(self, payload, isBinary):
        if isBinary:
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
            else:
                self.updatePosition(move=decoded_values[3]) # receive move
                

            print(f"decoded values:\ntype: {decoded_values[1]}\nroomId: {decoded_values[2]}\nmove: {decoded_values[3]}")
            
        else:
            print("Text message received: {0}".format(payload.decode('utf8')))

        # send message with new playerId
        #payload = self.createMessage(self.playerId, 0, 1, 0, 0, 0)
        #self.sendMessage(payload, isBinary)

    def onClose(self, wasClean, code, reason):
        MyServerProtocol.clients.discard(self)
        if self.game:
            self.game.remove_player(self)
            MyServerProtocol.freePlayerIds.add(self.playerId)
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
        integerValue = playerId * (256 * 256 * 256 * 256) + angle * 16777216 + type * 8388608 + x * 16384 + y * 32 + velocity
        print("integerValue:", integerValue)
        payload = integerValue.to_bytes(5, byteorder='little')
        return payload

    def updatePosition(self, move):
        if move == 0:
            self.y += self.velocity
            self.increaseVelocity()

    def increaseVelocity(self):
        self.velocity = min(MAX_VELOCITY, self.velocity + 1)


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
    lc.start(1)
    reactor.listenTCP(8000, factory)
    reactor.run()
    