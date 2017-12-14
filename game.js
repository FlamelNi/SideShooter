var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update});

//constants
var PLAYER_SPEED = 1200;
var PLAYER_GRAVITY = 800;
var PLAYER_JUMP = -620;
var PLAYER_FRICTION = 0.96;
var PLAYER_MAX_SPEED = 300;
var ENEMY_SPAWN_RATE = 1000;
var ENEMY_LIFESPAN = 6500;
var ENEMY_BASE_SPEED = 300;
var TIME_SCORE_RATE = 2000;
var FLOOR_SPEED = 100;

var enemy_level_cap = [10000,20000,99999999];
/*
{
  max speed reached,
  shoot bullet forward

}
*/

//variables
var lastSpawnTime = 0;
var score = 0;
var lastScoreGiven = 0;
var enemy_speed = ENEMY_BASE_SPEED;

//objects
var player;
var playerHand;
var floor;
var floor1;
var floor2;
var floor3;
var rifle;
var enemies;
var scoreDisplay;
var gameOverDisplay;
var stop = false;
var deadEnemy;
var emptyShell;
var hand;
var debugDisplay;

// load images and resources
function preload()
{

  game.load.image('gray',              'asset/gray.jpg');
  game.load.image('platform',          'asset/platform.jpg');
  game.load.image('man',               'asset/man.gif');
  game.load.image('player',           'asset/capMan.png');
  game.load.image('red',              'asset/red.png');
  game.load.image('yellow',           'asset/particleYellow.png');
  game.load.image('bullet',           'asset/bullet.png');
  
  game.load.spritesheet('pistol',     'asset/pistolHand.png', 46, 47);
  
  game.load.audio('pistolFire',       'asset/pulseGun.ogg');
}

function create()
{

  this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
  var enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
  enterKey.onDown.add(goFull, this);
  
  // game.renderer.clearBeforeRender = false;
  // game.renderer.roundPixels = true;
  
  recreate();
  reinitialize();
}//create

function recreate()
{
  //  Background
  game.add.tileSprite(0, 0, game.width, game.height, 'gray');

  //player set up
  player = game.add.sprite(300, 400, 'player');
  player.anchor.set(0.5,0.5);

  //floor set up
  floor = game.add.sprite(400,550, 'platform');
  floor.width = 600;
  floor.height = 40;
  floor.anchor.set(0.5,0.5);

  //physics engine
  game.physics.startSystem(Phaser.Physics.ARCADE);
  //apply physics to player sprite
  game.physics.enable(player, Phaser.Physics.ARCADE);

  //physics - gravity
  player.body.allowGravity = true;
  player.body.gravity.y = PLAYER_GRAVITY;

  //floor is immovable
  game.physics.enable(floor, Phaser.Physics.ARCADE);
  floor.body.immovable = true;

  floor1 = game.add.sprite(150, 350, 'platform');
  floor1.width = 200;
  floor1.height = 40;
  floor1.anchor.set(0.5, 0.5);

  floor2 = game.add.sprite(650, 350, 'platform');
  floor2.width = 200;
  floor2.height = 40;
  floor2.anchor.set(0.5, 0.5);

  floor3 = game.add.sprite(400, 200, 'platform');
  floor3.width = 300;
  floor3.height = 40;
  floor3.anchor.set(0.5, 0.5);

  game.physics.enable(floor1, Phaser.Physics.ARCADE);
  floor1.body.immovable = true;
  game.physics.enable(floor2, Phaser.Physics.ARCADE);
  floor2.body.immovable = true;
  game.physics.enable(floor3, Phaser.Physics.ARCADE);
  floor3.body.immovable = true;

  //weapon
  rifle = game.add.weapon(20, 'bullet');
  rifle.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
  rifle.bulletSpeed = 1000;
  rifle.fireRate = 500;
  
  //enemies
  enemies = game.add.group();
  enemies.enableBody = true;
  enemies.physicsBodyType = Phaser.Physics.ARCADE;

  enemies.createMultiple(25, 'man');
  enemies.setAll('anchor.x', 0.5);
  enemies.setAll('anchor.y', 0.5);
  
  scoreDisplay = game.add.text(
    game.width/10,    50, '', { font: '30px Arial', fill: '#0079ff', align: 'center' }
  );
  
  gameOverDisplay = game.add.text(
    270,    game.height/2, '', { font: '30px Arial', fill: '#ff0000', align: 'center' }
  );

  deadEnemy = game.add.emitter(400, 400, 30);
  deadEnemy.makeParticles('man', 0, 30, true);
  deadEnemy.gravity = PLAYER_GRAVITY;
  
  emptyShell = game.add.emitter(400, 400, 30);
  emptyShell.makeParticles('bullet', 0, 30, true);
  emptyShell.gravity = PLAYER_GRAVITY;
  
  floor1.body.velocity.x = FLOOR_SPEED;
  floor2.body.velocity.x = -FLOOR_SPEED;
  
  floor1.body.collideWorldBounds = true;
  floor2.body.collideWorldBounds = true;
  player.body.collideWorldBounds = true;
  
  hand = game.add.sprite(300, 400, 'pistol');
  game.physics.enable(hand, Phaser.Physics.ARCADE);
  hand.anchor.set(-0.1, 0.5);
  hand.animations.add('shoot', [1,2,0]);
  hand.animations.add('idle', [0]);
  hand.animations.play('idle');
  
  rifle.onFire.add(
    function()
    {
      var music;
      music = game.add.audio('pistolFire');
      music.play();
      hand.animations.play('shoot', 10);
      emptyShellEffect(player.body.x + Math.abs(player.width/2) + player.width*6/7, player.body.y);
    }
  );
  
  debugDisplay = game.add.text(
    game.width*7/10,    50, '', { font: '30px Arial', fill: '#ff6b00', align: 'center' }
  );
  
}

function update()
{
  
  if(stop)
  {
    gameOverDisplay.setText('Game Over\nPress [R] to Restart');
    if(game.input.keyboard.isDown(Phaser.Keyboard.R))
    {
      //reinitialize
      recreate();
      reinitialize();
    }
    return;
    
  }
  
  hand.x = player.x;
  hand.y = player.y;
  
  // collsion
  playerCollision();

  //friction
  friction();

  //speed limit
  speedLimit();

  // function for player movement
  movePlayer();


  //weapon
  if(game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))
  {
    rifle.trackSprite(player, player.width, -10);
    if(player.width > 0)
    {
      rifle.fireAngle = 0;
    }
    else
    {
      rifle.fireAngle = 180;
    }
    rifle.fire();
  }//if

  
  spawnEnemy();

  //collide not only work with sprites but also group of sprites
  game.physics.arcade.collide(enemies, floor);
  game.physics.arcade.collide(enemies, floor1);
  game.physics.arcade.collide(enemies, floor2);
  game.physics.arcade.collide(enemies, floor3);

  //run function called 'enemyMove' and put 
  //'for each enemy that currently is objectified'
  //as a parameter 
  enemies.forEachExists(enemyMove, this);
  
  addScore();
  
  scoreDisplay.setText('Score: ' + score.toString());

  deadEnemy.bounce.setTo(0.5,1);

  
  if(game.physics.arcade.collide(enemies, player))
  {
    //gameover
    player.kill();
    enemies.killAll();
    rifle.killAll();
    hand.kill();
    stop = true;
    
  }

  game.physics.arcade.collide(emptyShell, floor);
  game.physics.arcade.collide(emptyShell, floor1);
  game.physics.arcade.collide(emptyShell, floor2);
  game.physics.arcade.collide(emptyShell, floor3);

  if(game.physics.arcade.collide(floor1, floor2))
  {
    floor1.body.velocity.x = -FLOOR_SPEED;
    floor2.body.velocity.x = FLOOR_SPEED;
  }
  
  if(floor1.body.onWall() || floor2.body.onWall())
  {
    floor1.body.velocity.x = FLOOR_SPEED;
    floor2.body.velocity.x = -FLOOR_SPEED;
  }

}//update

function movePlayer()
{
  if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT))
  {
    player.body.acceleration.x = -PLAYER_SPEED;
    player.width = -Math.abs(player.width);
    hand.width = -Math.abs(hand.width);
  }
  else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT))
  {
    player.body.acceleration.x = PLAYER_SPEED;
    player.width = Math.abs(player.width);
    hand.width = Math.abs(hand.width);
  }
  else
  {
    player.body.acceleration.x = 0;
  }

}//movePlayer

function playerCollision()
{
  if(game.physics.arcade.collide(player, floor) ||
    game.physics.arcade.collide(player, floor1) ||
    game.physics.arcade.collide(player, floor2) ||
    game.physics.arcade.collide(player, floor3) )
  {
    //jump
    if (game.input.keyboard.isDown(Phaser.Keyboard.UP) &&
        player.body.touching.down)
    {
      player.body.velocity.y = PLAYER_JUMP;
    }
  }

}

function friction()
{
  player.body.velocity.x *= PLAYER_FRICTION;
}

function speedLimit()
{
  if(Math.abs(player.body.velocity.x) >= PLAYER_MAX_SPEED)
  {
    player.body.velocity.x *= PLAYER_MAX_SPEED/Math.abs(player.body.velocity.x);
  }
}

function spawnEnemy()
{
  

  //if game waited ENEMY_SPAWN_RATE amount since last spawn
  if( game.time.now >= (lastSpawnTime + ENEMY_SPAWN_RATE) )
  {
    
    lastSpawnTime = game.time.now + Math.floor(Math.random()*1000%4)*200;

    //gets any element of enemies that is not objectified yet
    var enemy = enemies.getFirstExists(false);

    //if 'enemy' exists (enemies have at least one un-objectified element)
    if (enemy)
    {
      enemy.reset(400, 120);//set position
      enemy.lifespan = ENEMY_LIFESPAN;//how long enemy lasts
      game.physics.enable(enemy, Phaser.Physics.ARCADE);
      enemy.body.allowGravity = true;
      enemy.body.gravity.y = PLAYER_GRAVITY;
      enemy.width = enemy.width * (Math.floor(Math.random()*1000%2)*2-1);
      enemy.body.collideWorldBounds = true;//does enemy collided with world bound
    }//if enemy
    
  }//if gametime
  
}


function getEnemyLevel()
{
  for(var i = 0; i < enemy_level_cap.length; i++)
  {
    if(score < enemy_level_cap[i])
      return i;
  }
  
  return enemy_level_cap;
}

function getEnemySpeed()
{
  var speed = ENEMY_BASE_SPEED + score/80;
  if(getEnemyLevel() >= 1 )
  {
    speed = ENEMY_BASE_SPEED + parseInt(enemy_level_cap[0])/80;
  }
  return speed;
}

function enemyMove(enemy)
{
  if(enemy.body.onWall())
  {
    enemy.width = -enemy.width;
  }
  if(enemy.width > 0)
  {
    // enemy.body.velocity.x =  ENEMY_BASE_SPEED;
    enemy.body.velocity.x = enemy_speed;
  }
  else
  {
    // enemy.body.velocity.x = -ENEMY_BASE_SPEED;
    enemy.body.velocity.x = -enemy_speed;

  }
  rifle.bullets.forEachExists(bulletHitEnemy, this, enemy);

}

function bulletHitEnemy(bullet, enemy)
{
  if(game.physics.arcade.collide(enemy, bullet))
  {

    deadEnemyEffect(enemy.body.x, enemy.body.y);
    bullet.kill();
    enemy.kill();
    score = score + 500;
    enemy_speed = getEnemySpeed();
  }
}

function addScore()
{
  if( game.time.now >= (lastScoreGiven + TIME_SCORE_RATE) )
  {
    score = score + 100;
    lastScoreGiven = game.time.now;
    enemy_speed = getEnemySpeed();
  }
}


function deadEnemyEffect(x,y)
{
    deadEnemy.x = x
    deadEnemy.y = y;

    //  The first parameter sets the effect to 'explode' which means all particles are emitted at once
    //  The second gives each particle a 2000ms lifespan
    //  The third is ignored when using burst/explode mode
    //  The final parameter (10) is how many particles will be emitted in this single burst
    deadEnemy.setYSpeed(-400, -600);
    deadEnemy.start(true, 2000, null, 1);
}

function emptyShellEffect(x,y)
{
    emptyShell.x = x
    emptyShell.y = y;
    
    emptyShell.setYSpeed(-400, -600);
    emptyShell.start(true, 2000, null, 1);
}

function reinitialize()
{
  lastSpawnTime = 0;
  score = 0;
  lastScoreGiven = game.time.now;
  enemy_speed = ENEMY_BASE_SPEED;
  stop = false;
}

function goFull()
{
      if (game.scale.isFullScreen) {
          game.scale.stopFullScreen();
      }
      else {
          game.scale.startFullScreen(false);
      }
}

function debug(text)
{
  if(text == undefined)
    debugDisplay.setText('debugging');
  else
    debugDisplay.setText(text);
}




