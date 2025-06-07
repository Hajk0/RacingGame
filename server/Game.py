import math


class Game:
    def __init__(self, game_id):
        self.game_id = game_id
        self.players = set()

    def add_player(self, player):
        self.players.add(player)

    def remove_player(self, player):
        self.players.discard(player)

    def createMessage(self, playerId, angle, type, x, y, velocity):
        angle256 = int((angle / (2 * math.pi)) * 256)
        integerValue = int(playerId * (256 * 256 * 256 * 256) + angle256 * 16777216 + type * 8388608 + x * 16384 + y * 32 + velocity)
        payload = integerValue.to_bytes(5, byteorder='little')
        return payload

    def tick(self):
        for player in self.players:
            player.updatePosition()
            for playerIn in self.players:
                payload = self.createMessage(playerIn.playerId, playerIn.angle, 0, playerIn.x, playerIn.y, playerIn.velocity)
                player.sendMessage(payload, isBinary=True)
