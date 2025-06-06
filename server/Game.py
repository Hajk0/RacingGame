class Game:
    def __init__(self, game_id):
        self.game_id = game_id
        self.players = set()

    def add_player(self, player):
        self.players.add(player)

    def remove_player(self, player):
        self.players.discard(player)

    def createMessage(self, playerId, type, x, y, velocity):
        integerValue = playerId * 16777216 + type * 8388608 + x * 16384 + y * 32 + velocity
        payload = integerValue.to_bytes(4, byteorder='little')
        return payload

    def tick(self):
        for player in self.players:
            for playerIn in self.players:
                payload = self.createMessage(playerIn.playerId, 0, 10, 10, 0)
                player.sendMessage(payload, isBinary=True)
