var config = {}

config.logLevel = 3//ERR

config.server_port = 9999
config.server_resource = "s"

config.area = {
    width: 30,
    height: 9
}

config.player = {
    move_ps: 100,
    shoot_ps: 50,
    shoot_max_alive: 20
}


module.exports = config