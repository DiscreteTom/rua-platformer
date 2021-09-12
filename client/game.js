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
  stars: null,
  bombs: null,
  platforms: null,
  cursors: null,
  score: 0,
  gameOver: false,
  scoreText: null,
  scene: null,
};

newGame();

function newGame() {
  state.game = new Phaser.Game(config);
}

function preload() {
  this.load.image("sky", "assets/sky.png");
  this.load.image("ground", "assets/platform.png");
  this.load.image("star", "assets/star.png");
  this.load.image("bomb", "assets/bomb.png");
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

  //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
  state.stars = this.physics.add.group({
    key: "star",
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 },
  });

  state.stars.children.iterate(function (child) {
    //  Give each star a slightly different bounce
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  state.bombs = this.physics.add.group();

  //  The score
  state.scoreText = this.add.text(16, 16, "score: 0", {
    fontSize: "32px",
    fill: "#000",
  });

  this.physics.add.collider(state.stars, state.platforms);
  this.physics.add.collider(state.bombs, state.platforms);

  state.scene = this;
}

function newPlayer(scene) {
  // The player and its settings
  let player = scene.physics.add.sprite(100, 450, "dude");

  //  Player physics properties. Give the little guy a slight bounce.
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  //  Collide the player and the stars with the platforms
  scene.physics.add.collider(player, state.platforms);

  //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
  scene.physics.add.overlap(player, state.stars, collectStar, null, scene);

  scene.physics.add.collider(player, state.bombs, hitBomb, null, scene);
  state.players[state.localPlayerId] = player;
}

function update() {
  if (state.gameOver) {
    return;
  }

  if (state.localPlayerId) {
    if (state.cursors.left.isDown) {
      state.players[state.localPlayerId].setVelocityX(-160);

      state.players[state.localPlayerId].anims.play("left", true);
    } else if (state.cursors.right.isDown) {
      state.players[state.localPlayerId].setVelocityX(160);

      state.players[state.localPlayerId].anims.play("right", true);
    } else {
      state.players[state.localPlayerId].setVelocityX(0);

      state.players[state.localPlayerId].anims.play("turn");
    }

    if (
      state.cursors.up.isDown &&
      state.players[state.localPlayerId].body.touching.down
    ) {
      state.players[state.localPlayerId].setVelocityY(-330);
    }
  }
}

function collectStar(player, star) {
  star.disableBody(true, true);

  //  Add and update the score
  state.score += 10;
  state.scoreText.setText("Score: " + state.score);

  if (state.stars.countActive(true) === 0) {
    //  A new batch of stars to collect
    state.stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    var x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    var bomb = state.bombs.create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    bomb.allowGravity = false;
  }
}

function hitBomb(player, bomb) {
  this.physics.pause();

  player.setTint(0xff0000);

  player.anims.play("turn");

  state.gameOver = true;
}
