from autobahn.twisted.websocket import WebSocketServerProtocol, WebSocketServerFactory

class MyServerProtocol(WebSocketServerProtocol):

    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))

    def onOpen(self):
        print("WebSocket connection open.")

    def onMessage(self, payload, isBinary):
        if isBinary:
            byte_values = list(payload)
            print("Binary message received: {0} bytes: {1}".format(len(payload), byte_values))
            print("byte_values[0]: ", byte_values[0])
            decoded_values = self.decodeMessage(byte_values[0])
            print(f"decoded values:\ntype: {decoded_values[0]}\nroomId: {decoded_values[1]}\nmove: {decoded_values[2]}")
            
        else:
            print("Text message received: {0}".format(payload.decode('utf8')))

        # echo back message verbatim
        self.sendMessage(payload, isBinary)

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {0}".format(reason))

    def decodeMessage(self, byte_value):
        type = 0
        roomId = 0
        if byte_value >= 128:
            byte_value -= 128
            type = 1
        if byte_value >= 8:
            roomId = byte_value // 8
            byte_value -= roomId * 8
        move = byte_value
        return (type, roomId, move)




if __name__ == '__main__':

    import sys

    from twisted.python import log
    from twisted.internet import reactor

    log.startLogging(sys.stdout)

    factory = WebSocketServerFactory("ws://0.0.0.0:8000/ws")
    factory.protocol = MyServerProtocol
    reactor.listenTCP(8000, factory)
    reactor.run()