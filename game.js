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
var ENEMY_SHOOT_RATE = 1700;
var ENEMY_BULLET_SPEED = 600;
var HARD_ENEMY_SPEED = 520;
var WEAPON_BOX_SPAWN_RATE = 0.20;//probability

//weapon constants
var BULLET_SPEED = 1000;
var PISTOL_FIRE_RATE = 500;
var RIFLE_FIRE_RATE = 200;
var SHOTGUN_FIRE_RATE = 500;

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
var lastEnemyShootTime = 0;
var ammo = 0;

//function
var onWeaponFire;

//objects
var player;
var floor;
var floor1;
var floor2;
var floor3;
var playerWeapon;
var enemies;
var scoreDisplay;
var gameOverDisplay;
var stop = false;
var deadEnemy;
var deadHardEnemy;
var emptyShell;
var emptyShotShell;
var hand;
var debugDisplay;
var ammoDisplay;
var enemyWeapon;
var weaponBox;
var backgroundMusic;

// load images and resources
function preload()
{

  game.load.image('gray',             'asset/gray.jpg');
  game.load.image('platform',         'asset/platform.jpg');
  game.load.image('man',              'asset/man.gif');
  game.load.image('redMan',           'asset/redMan.gif');
  game.load.image('player',           'asset/capMan.png');
  game.load.image('red',              'asset/red.png');
  game.load.image('yellow',           'asset/particleYellow.png');
  game.load.image('bullet',           'asset/bullet.png');
  game.load.image('shell',            'asset/shell.png');
  
  game.load.spritesheet('weaponBox',  'asset/weaponBox.png', 13, 13);
  game.load.spritesheet('pistol',     'asset/pistolHand.png', 46, 47);
  game.load.spritesheet('rifle',      'asset/rifleHand.png', 73, 47);
  game.load.spritesheet('shotgun',    'asset/shotgunHand.png', 80, 47);
  
  game.load.audio('enemyFire',        'asset/pulseGun.ogg');
  game.load.audio('pistolFire',       'asset/pistolFire.wav');
  game.load.audio('rifleFire',        'asset/rifleFire.wav');
  game.load.audio('shotgunFire',      'asset/shotgunFire.wav');
  game.load.audio('reload',           'asset/reload.wav');
  
  game.load.audio('steamTech',        'asset/Steamtech-Mayhem_Looping.mp3');
}

function create()
{

  this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
  var enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
  enterKey.onDown.add(goFull, this);
  
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
  
  ammoDisplay = game.add.text(
    game.width*8/10,    50, '', { font: '30px Arial', fill: '#ff8200', align: 'center' }
  );
  
  gameOverDisplay = game.add.text(
    270,    game.height/2, '', { font: '30px Arial', fill: '#ff0000', align: 'center' }
  );

  deadEnemy = game.add.emitter(400, 400, 30);
  deadEnemy.makeParticles('man', 0, 30, true);
  deadEnemy.gravity = PLAYER_GRAVITY;
  
  deadHardEnemy = game.add.emitter(400, 400, 30);
  deadHardEnemy.makeParticles('redMan', 0, 30, true);
  deadHardEnemy.gravity = PLAYER_GRAVITY;
  
  emptyShell = game.add.emitter(400, 400, 30);
  emptyShell.makeParticles('bullet', 0, 30, true);
  emptyShell.gravity = PLAYER_GRAVITY;
  
  emptyShotShell = game.add.emitter(400, 400, 30);
  emptyShotShell.makeParticles('shell', 0, 30, true);
  emptyShotShell.gravity = PLAYER_GRAVITY;
  
  floor1.body.velocity.x = FLOOR_SPEED;
  floor2.body.velocity.x = -FLOOR_SPEED;
  
  floor1.body.collideWorldBounds = true;
  floor2.body.collideWorldBounds = true;
  player.body.collideWorldBounds = true;

  pistolSetup();
  
  debugDisplay = game.add.text(
    game.width*7/10,    100, '', { font: '30px Arial', fill: '#ff6b00', align: 'center' }
  );
  
  enemyWeapon = game.add.weapon(40, 'red');
  enemyWeapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
  enemyWeapon.bulletSpeed = ENEMY_BULLET_SPEED;
  enemyWeapon.fireRate = 0;
  enemyWeapon.onFire.add(
    function()
    {
      // var music;
      // music = game.add.audio('pistolFire');
      // music.play();
    }
  );
  
  backgroundMusic = game.add.audio('steamTech', 1, true);
  backgroundMusic.play();
  
  reinitialize();
}//create

function reset()
{
  player = game.add.sprite(300, 400, 'player');
  player.anchor.set(0.5,0.5);
  
  game.physics.enable(player, Phaser.Physics.ARCADE);

  player.body.allowGravity = true;
  player.body.gravity.y = PLAYER_GRAVITY;
  
  player.body.collideWorldBounds = true;
  
  floor1.x = 150;
  floor2.x = 650;
  
  floor1.body.velocity.x = FLOOR_SPEED;
  floor2.body.velocity.x = -FLOOR_SPEED;
  pistolSetup();
  
  gameOverDisplay.setText('');
  
}

function update()
{
  
  if(stop)
  {
    gameOverDisplay.setText('Game Over\nPress [R] to Restart');
    if(game.input.keyboard.isDown(Phaser.Keyboard.R))
    {
      //reinitialize
      reset();
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
  updatePlayerWeapon();
  
  spawnEnemy();

  enemiesMove();
  
  addScore();
  
  scoreDisplay.setText('Score: ' + score.toString());
  
  ammoDisplay.setText('Ammo: ' + ammo.toString());
  
  updateWeaponBox();

  checkGameOver();
  
  updateEffects();
  
  updateFloor();

}//update

function updatePlayerWeapon()
{
  if(game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))
  {
    playerWeapon.trackSprite(player, hand.width, -10);
    if(player.width > 0)
    {
      playerWeapon.fireAngle = 0;
    }
    else
    {
      playerWeapon.fireAngle = 180;
    }
    if(playerWeapon.fire())
    {
      onWeaponFire();
    }
  }//if
}

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
      enemy.loadTexture('man');
      enemy.lifespan = ENEMY_LIFESPAN;//how long enemy lasts
      game.physics.enable(enemy, Phaser.Physics.ARCADE);
      enemy.body.allowGravity = true;
      enemy.body.gravity.y = PLAYER_GRAVITY;
      enemy.width = enemy.width * (Math.floor(Math.random()*1000%2)*2-1);
      enemy.body.collideWorldBounds = true;//does enemy collided with world bound
    }//if enemy
    
  }//if gametime
  
}

function hardEnemySpawn()
{
  var enemy = enemies.getFirstExists(false);

  //if 'enemy' exists (enemies have at least one un-objectified element)
  if (enemy)
  {
    enemy.reset(400, 120);//set position
    enemy.loadTexture('redMan');
    enemy.lifespan = ENEMY_LIFESPAN;//how long enemy lasts
    game.physics.enable(enemy, Phaser.Physics.ARCADE);
    enemy.body.allowGravity = true;
    enemy.body.gravity.y = PLAYER_GRAVITY;
    enemy.width = enemy.width * (Math.floor(Math.random()*1000%2)*2-1);
    enemy.body.collideWorldBounds = true;//does enemy collided with world bound
  }//if enemy
}

function enemiesMove()
{
  //collide not only work with sprites but also group of sprites
  game.physics.arcade.collide(enemies, floor);
  game.physics.arcade.collide(enemies, floor1);
  game.physics.arcade.collide(enemies, floor2);
  game.physics.arcade.collide(enemies, floor3);

  //run function called 'enemyMove' and put 
  //'for each enemy that currently is objectified'
  //as a parameter 
  enemies.forEachExists(enemyMove, this);
  if( game.time.now >= (lastEnemyShootTime + ENEMY_SHOOT_RATE) &&
      getEnemyLevel() >= 1 )
  {
    var music;
    music = game.add.audio('enemyFire');
    music.play();
    
    enemies.forEachExists(
      function(enemy)
      {
        enemyWeapon.trackSprite(enemy);
        if(enemy.width > 0)
        {
          enemyWeapon.fireAngle = 0;
        }
        else
        {
          enemyWeapon.fireAngle = 180;
        }
        enemyWeapon.fire();
      }, this);
    lastEnemyShootTime = game.time.now;
  }
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
  var speed = ENEMY_BASE_SPEED + score/60;
  if(getEnemyLevel() >= 1 )
  {
    speed = ENEMY_BASE_SPEED + parseInt(enemy_level_cap[0])/60;
  }
  return speed;
}

function enemyMove(enemy)
{
  
  if(enemy.body.onWall())
  {
    enemy.width = -enemy.width;
  }
  if(enemy.key == 'redMan')
  {
    if(enemy.width > 0)
    {
      enemy.body.velocity.x = HARD_ENEMY_SPEED;
    }
    else
    {
      enemy.body.velocity.x = -HARD_ENEMY_SPEED;
    }
  }
  else
  {
    if(enemy.width > 0)
    {
      enemy.body.velocity.x = enemy_speed;
    }
    else
    {
      enemy.body.velocity.x = -enemy_speed;
    }
  }
  playerWeapon.bullets.forEachExists(bulletHitEnemy, this, enemy);
  
  if(enemy.body.y >= 550)
  {
    hardEnemySpawn();
    enemy.kill();
  }

}

function bulletHitEnemy(bullet, enemy)
{
  if(game.physics.arcade.collide(enemy, bullet))
  {
    if(enemy.key == 'redMan')
      deadHardEnemyEffect(enemy.body.x, enemy.body.y);
    else
      deadEnemyEffect(enemy.body.x, enemy.body.y);

    bullet.kill();
    enemy.kill();
    score = score + 500;
    if(Math.random() <= WEAPON_BOX_SPAWN_RATE)
    {
      spawnWeaponBox(bullet.x, bullet.y);
    }
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

function checkGameOver()
{
  if( game.physics.arcade.collide(enemies, player) ||
      game.physics.arcade.collide(enemyWeapon.bullets, player) )
  {
    //gameover
    player.kill();
    enemies.killAll();
    playerWeapon.killAll();
    hand.kill();
    enemyWeapon.bullets.killAll();
    if(weaponBox != null)
      weaponBox.kill();
    stop = true;
    
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

function deadHardEnemyEffect(x,y)
{
    deadHardEnemy.x = x
    deadHardEnemy.y = y;
    
    deadHardEnemy.setYSpeed(-400, -600);
    deadHardEnemy.start(true, 2000, null, 1);
}

function emptyShellEffect(x,y)
{
    emptyShell.x = x
    emptyShell.y = y;
    
    emptyShell.setYSpeed(-400, -600);
    emptyShell.start(true, 2000, null, 1);
}

function emptyShotShellEffect(x,y)
{
    emptyShotShell.x = x
    emptyShotShell.y = y;
    
    emptyShotShell.setYSpeed(-400, -600);
    emptyShotShell.start(true, 2000, null, 1);
}

function updateEffects()
{
  game.physics.arcade.collide(emptyShell, floor);
  game.physics.arcade.collide(emptyShell, floor1);
  game.physics.arcade.collide(emptyShell, floor2);
  game.physics.arcade.collide(emptyShell, floor3);
  
  game.physics.arcade.collide(emptyShotShell, floor);
  game.physics.arcade.collide(emptyShotShell, floor1);
  game.physics.arcade.collide(emptyShotShell, floor2);
  game.physics.arcade.collide(emptyShotShell, floor3);
}

function updateFloor()
{
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
}

function rifleSetup()
{
  if(hand != null)
    hand.kill();
  
  hand = game.add.sprite(300, 400, 'rifle');
  game.physics.enable(hand, Phaser.Physics.ARCADE);
  hand.anchor.set(0.15, 0.4);
  hand.animations.add('shoot', [1,2,0]);
  hand.animations.add('idle', [0]);
  hand.animations.play('idle');
  
  if(player.width > 0)
    hand.width = Math.abs(hand.width);
  else
    hand.width = -Math.abs(hand.width);
  
  //weapon
  playerWeapon = game.add.weapon(20, 'bullet');
  playerWeapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
  playerWeapon.bulletSpeed = BULLET_SPEED;
  playerWeapon.fireRate = RIFLE_FIRE_RATE;
  
  ammo = 15;
  
  onWeaponFire = function()
  {
    var music;
    music = game.add.audio('rifleFire');
    music.play();
    hand.animations.play('shoot', 10);
    emptyShellEffect(player.body.x + Math.abs(player.width/2) + player.width*6/7, player.body.y);
    ammo--;
    if(ammo <= 0)
      pistolSetup();
  }
}

function shotgunSetup()
{
  if(hand != null)
    hand.kill();
  
  hand = game.add.sprite(300, 400, 'shotgun');
  game.physics.enable(hand, Phaser.Physics.ARCADE);
  hand.anchor.set(0.15, 0.4);
  hand.animations.add('shoot', [1,2,0]);
  hand.animations.add('idle', [0]);
  hand.animations.play('idle');
  
  if(player.width > 0)
    hand.width = Math.abs(hand.width);
  else
    hand.width = -Math.abs(hand.width);
  
  //weapon
  playerWeapon = game.add.weapon(20, 'bullet');
  playerWeapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
  playerWeapon.bulletSpeed = BULLET_SPEED;
  playerWeapon.fireRate = 0;
  playerWeapon.bulletAngleVariance = 0;
  
  ammo = 8;
  
  onWeaponFire = function()
  {
    playerWeapon.fire();
    playerWeapon.bulletAngleVariance = 20;
    playerWeapon.fire();
    playerWeapon.fire();
    playerWeapon.fireRate = SHOTGUN_FIRE_RATE;
    playerWeapon.fire();
    playerWeapon.fireRate = 0;
    playerWeapon.bulletAngleVariance = 0;
    
    var music;
    music = game.add.audio('shotgunFire');
    music.play();
    hand.animations.play('shoot', 10);
    emptyShotShellEffect(player.body.x + Math.abs(player.width/2) + player.width*6/7, player.body.y);
    ammo--;
    if(ammo <= 0)
      pistolSetup();
  }
}

function pistolSetup()
{
  if(hand != null)
    hand.kill();
  
  hand = game.add.sprite(300, 400, 'pistol');
  game.physics.enable(hand, Phaser.Physics.ARCADE);
  hand.anchor.set(-0.1, 0.5);
  hand.animations.add('shoot', [1,2,0]);
  hand.animations.add('idle', [0]);
  hand.animations.play('idle');
  
  if(player.width > 0)
    hand.width = Math.abs(hand.width);
  else
    hand.width = -Math.abs(hand.width);
  
  //weapon
  playerWeapon = game.add.weapon(20, 'bullet');
  playerWeapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
  playerWeapon.bulletSpeed = BULLET_SPEED;
  playerWeapon.fireRate = PISTOL_FIRE_RATE;
  
  
  onWeaponFire = function()
  {
    var music;
    music = game.add.audio('pistolFire');
    music.play();
    hand.animations.play('shoot', 10);
    emptyShellEffect(player.body.x + Math.abs(player.width/2) + player.width*6/7, player.body.y);
  }
  
}

function spawnWeaponBox(x, y)
{
  if(weaponBox != null)
  {
    weaponBox.kill();
  }
  // var x = ( (Math.random()*10000)%600 )+100;
  // var y = ( (Math.random()*10000)%250 )+230;
  weaponBox = game.add.sprite(x, y, 'weaponBox');
  weaponBox.width = 26;
  weaponBox.height = 24;
  
  game.physics.enable(weaponBox, Phaser.Physics.ARCADE);
  weaponBox.anchor.set(0.5, 0.5);
  weaponBox.animations.add('idle', [0, 1, 2, 3], 2, true);
  weaponBox.animations.play('idle');
}

function updateWeaponBox()
{
  
  if(game.physics.arcade.collide(player, weaponBox))
  {
    var music;
    music = game.add.audio('reload');
    music.play();
    var numOfWeapons = 2;
    var probability = 1/numOfWeapons;
    var chance = Math.random();
    
    if(chance <= probability*1)
    {
      rifleSetup();
    }
    else if(chance <= probability*2)
    {
      shotgunSetup();
    }
    
    weaponBox.kill();
  }
}

function reinitialize()
{
  lastSpawnTime = 0;
  score = 0;
  lastScoreGiven = game.time.now;
  enemy_speed = ENEMY_BASE_SPEED;
  stop = false;
  lastEnemyShootTime = 0;
  ammo = 0;
  deadEnemy.bounce.setTo(0.5,1);
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




