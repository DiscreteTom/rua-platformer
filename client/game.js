var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

var state = {
  game: null,
  players: {},
  localPlayerId: null,
  platforms: null,
  cursors: null,
  gameOver: false,
  scene: null,
  commandQueue: [],
  syncTime: 0,
};

newGame();

function newGame() {
  state.game = new Phaser.Game(config);
}

function preload() {
  this.load.image("sky", "assets/sky.png");
  this.load.image("ground", "assets/platform.png");
  this.load.spritesheet("dude", "assets/dude.png", {
    frameWidth: 32,
    frameHeight: 48,
  });
}

function create() {
  //  A simple background for our game
  this.add.image(400, 300, "sky");

  //  The platforms group contains the ground and the 2 ledges we can jump on
  state.platforms = this.physics.add.staticGroup();

  //  Here we create the ground.
  //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
  state.platforms.create(400, 568, "ground").setScale(2).refreshBody();

  //  Now let's create some ledges
  state.platforms.create(600, 400, "ground");
  state.platforms.create(50, 250, "ground");
  state.platforms.create(750, 220, "ground");

  //  Our player animations, turning, walking left and walking right.
  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 4 }],
    frameRate: 20,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  //  Input Events
  state.cursors = this.input.keyboard.createCursorKeys();

  state.scene = this;
  state.syncTime = Date.now();
}

function newPlayer(scene, id) {
  // The player and its settings
  let player = scene.physics.add.sprite(100, 450, "dude");

  //  Player physics properties. Give the little guy a slight bounce.
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  //  Collide the player and the stars with the platforms
  scene.physics.add.collider(player, state.platforms);

  state.players[id] = player;
}

function update() {
  if (state.gameOver) {
    return;
  }

  if (state.localPlayerId) {
    // accept input
    if (state.cursors.left.isDown) {
      ws.send(`${state.localPlayerId}:left`);
    } else if (state.cursors.right.isDown) {
      ws.send(`${state.localPlayerId}:right`);
    } else {
      ws.send(`${state.localPlayerId}:still`);
    }
    if (
      state.cursors.up.isDown &&
      state.players[state.localPlayerId].body.touching.down
    ) {
      ws.send(`${state.localPlayerId}:up`);
    }

    // process command
    while (state.commandQueue.length) {
      let cmd = state.commandQueue.shift().split(":");
      // if player exists
      if (state.players[cmd[0]]) {
        if (cmd[1] == "left") {
          state.players[cmd[0]].setVelocityX(-160);
          state.players[cmd[0]].anims.play("left", true);
        } else if (cmd[1] == "right") {
          state.players[cmd[0]].setVelocityX(160);
          state.players[cmd[0]].anims.play("right", true);
        } else if (cmd[1] == "still") {
          state.players[cmd[0]].setVelocityX(0);
          state.players[cmd[0]].anims.play("turn");
        }

        if (cmd[1] == "up") {
          state.players[cmd[0]].setVelocityY(-330);
        }
      }
    }

    // report state
    let now = Date.now();
    if (now - state.syncTime > 1000) {
      // sync every second
      state.syncTime = now;
      let p = state.players[state.localPlayerId];
      ws.send(
        `sync:${state.localPlayerId}:${p.x}:${p.y}:${p.body.velocity.x}:${p.body.velocity.y}`
      );
    }
  }
}

function sync(s) {
  let data = s.split(":");
  if (state.players[data[1]]) {
    state.players[data[1]].setX(Number(data[2]));
    state.players[data[1]].setY(Number(data[3]));
    state.players[data[1]].setVelocityX(Number(data[4]));
    state.players[data[1]].setVelocityY(Number(data[5]));
  } else {
    newPlayer(state.scene, data[1]);
  }
}
