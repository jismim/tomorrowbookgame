const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player1, player2;
let activePlayer;
let cursors;
let switchKey, phaseKey;
let platforms, obstacles;
let movingPlatform, button;
let goal;
let player1AtGoal = false, player2AtGoal = false;
let buttonPressed = false;
let playerObstacleCollider;

function preload() {
    this.load.image('ground', 'assets/platform.png');
    this.load.image('obstacle', 'assets/obstacle.png');
    this.load.image('player1', 'assets/player1.png'); // Sam (small)
    this.load.image('player2', 'assets/player2.png'); // Sadie (mushroom)
    this.load.image('goal', 'assets/goal.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('button', 'assets/button.png'); // Button for Sadie
}

function create() {
    // Platforms - MUCH SMALLER
    platforms = this.physics.add.staticGroup();
    
    // Main bottom platform - smaller
    platforms.create(400, 570, 'ground').setScale(0.25).refreshBody();
    
    // Left side path (for reaching the button)
    platforms.create(150, 480, 'ground').setScale(0.08).refreshBody();
    
    // Button platform - very small
    platforms.create(50, 430, 'ground').setScale(0.06).refreshBody();
    
    // Main path platforms - all smaller
    platforms.create(300, 440, 'ground').setScale(0.08).refreshBody();
    platforms.create(450, 360, 'ground').setScale(0.08).refreshBody();
    platforms.create(600, 280, 'ground').setScale(0.08).refreshBody();
    platforms.create(450, 200, 'ground').setScale(0.08).refreshBody();
    platforms.create(300, 120, 'ground').setScale(0.08).refreshBody();
    
    // Goal platform - small
    platforms.create(400, 80, 'ground').setScale(0.08).refreshBody();

    // Moving platform - smaller
    movingPlatform = this.physics.add.sprite(230, 370, 'platform').setImmovable(true).setScale(0.15, 0.08);
    movingPlatform.body.allowGravity = false;
    movingPlatform.body.velocity.y = 0;

    // Button
    button = this.physics.add.sprite(50, 410, 'button').setScale(0.15);
    button.setImmovable(true);
    button.body.allowGravity = false;

    // Obstacle - challenge for Sam
    obstacles = this.physics.add.staticGroup();
    let obstacleBlock = obstacles.create(300, 410, 'obstacle').setScale(0.1).refreshBody();

    // Players
    player1 = this.physics.add.sprite(350, 550, 'player1').setBounce(0.1).setCollideWorldBounds(true);
    player2 = this.physics.add.sprite(450, 550, 'player2').setBounce(0.1).setCollideWorldBounds(true);

    // Collisions
    this.physics.add.collider(player1, platforms);
    this.physics.add.collider(player2, platforms);
    this.physics.add.collider(movingPlatform, platforms);
    this.physics.add.collider(player1, movingPlatform);
    this.physics.add.collider(player2, movingPlatform);
    this.physics.add.collider(player2, obstacles);
    playerObstacleCollider = this.physics.add.collider(player1, obstacles);

    // Goal
    goal = this.physics.add.sprite(400, 40, 'goal').setScale(0.07);
    goal.body.allowGravity = false;
    this.physics.add.collider(goal, platforms);
    this.physics.add.overlap(player1, goal, () => checkWinCondition(1, this), null, this);
    this.physics.add.overlap(player2, goal, () => checkWinCondition(2, this), null, this);

    // Goal visual effect
    this.tweens.add({
        targets: goal,
        alpha: { from: 0.5, to: 1 },
        duration: 500,
        yoyo: true,
        repeat: -1
    });

    // Input keys
    cursors = this.input.keyboard.createCursorKeys();
    switchKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    phaseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    activePlayer = player1; // Start with Sam

    // Add visual indicators
    this.add.text(16, 16, 'Press SPACE to switch characters', { fontSize: '18px', fill: '#fff', backgroundColor: '#000' });
    this.add.text(16, 40, 'Press SHIFT for Sam to phase through obstacles', { fontSize: '18px', fill: '#fff', backgroundColor: '#000' });
    
    // Create active player indicator text
    this.activePlayerText = this.add.text(16, 64, 'Active: Sam', { fontSize: '18px', fill: '#fff', backgroundColor: '#000' });
    
    // Add help text
    this.add.text(16, 550, 'Tip: Get Sadie to the red button on the left!', { fontSize: '18px', fill: '#ff0', backgroundColor: '#000' });

    console.log("Game started!");
}

function update() {
    // Switch characters
    if (Phaser.Input.Keyboard.JustDown(switchKey)) {
        activePlayer = (activePlayer === player1) ? player2 : player1;
        this.activePlayerText.setText('Active: ' + (activePlayer === player1 ? 'Sam' : 'Sadie'));
        console.log("Switched player!");
    }

    // Reset velocity
    player1.setVelocityX(0);
    player2.setVelocityX(0);

    // Movement controls - precise movement (slower)
    if (cursors.left.isDown) {
        activePlayer.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        activePlayer.setVelocityX(160);
    }

    // Jump controls 
    if (cursors.up.isDown && activePlayer.body.blocked.down) {
        let jumpPower = (activePlayer === player2) ? -450 : -350;
        activePlayer.setVelocityY(jumpPower);
    }

    // Sam's Phase Ability
    if (activePlayer === player1 && phaseKey.isDown) {
        if (playerObstacleCollider && playerObstacleCollider.active) {
            playerObstacleCollider.active = false;
            obstacles.getChildren().forEach(obstacle => {
                obstacle.setAlpha(0.3);
            });
        }
    } else {
        if (playerObstacleCollider && !playerObstacleCollider.active) {
            playerObstacleCollider.active = true;
            obstacles.getChildren().forEach(obstacle => {
                obstacle.setAlpha(1);
            });
        }
    }

    // Sadie Activates Button
    if (checkOverlap(player2, button) && !buttonPressed) {
        buttonPressed = true;
        button.setTint(0xff0000);
        movePlatform(this);
        
        // Add a hint text when the button is pressed
        this.add.text(200, 350, '↑ Platform moving! ↑', { fontSize: '16px', fill: '#ff0', backgroundColor: '#000' });
    }

    // Add a bit of air control for better precision jumping
    if (!activePlayer.body.blocked.down) {
        if (cursors.left.isDown) {
            activePlayer.setVelocityX(Math.max(activePlayer.body.velocity.x - 5, -160));
        } else if (cursors.right.isDown) {
            activePlayer.setVelocityX(Math.min(activePlayer.body.velocity.x + 5, 160));
        }
    }
}

function checkOverlap(spriteA, spriteB) {
    let boundsA = spriteA.getBounds();
    let boundsB = spriteB.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB);
}

function movePlatform(scene) {
    scene.tweens.add({
        targets: movingPlatform,
        y: 180,
        duration: 3000,
        ease: 'Linear',
        onComplete: function() {
            console.log("Platform reached final position");
        }
    });
}

function checkWinCondition(playerNumber, scene) {
    if (playerNumber === 1) {
        player1AtGoal = true;
        console.log("Player 1 (Sam) reached goal!");
    }
    if (playerNumber === 2) {
        player2AtGoal = true;
        console.log("Player 2 (Sadie) reached goal!");
    }

    // Update goal status text
    let goalStatus = '';
    if (player1AtGoal) goalStatus += 'Sam ✓ ';
    if (player2AtGoal) goalStatus += 'Sadie ✓';
    
    // Create or update goal status text
    if (!scene.goalStatusText) {
        scene.goalStatusText = scene.add.text(16, 88, 'Goal: ' + goalStatus, { fontSize: '18px', fill: '#fff', backgroundColor: '#000' });
    } else {
        scene.goalStatusText.setText('Goal: ' + goalStatus);
    }

    // BOTH players are required to win
    if (player1AtGoal && player2AtGoal) {
        winGame();
    } else if (player1AtGoal && !player2AtGoal) {
        scene.add.text(300, 88, 'Now bring Sadie to the goal!', { fontSize: '18px', fill: '#ff0', backgroundColor: '#000' });
    } else if (!player1AtGoal && player2AtGoal) {
        scene.add.text(300, 88, 'Now bring Sam to the goal!', { fontSize: '18px', fill: '#ff0', backgroundColor: '#000' });
    }
}

function winGame() {
    alert("🎉 You Win! Both Sam and Sadie reached the goal together! 🎉");

    // Stop movement
    player1.setVelocity(0, 0);
    player2.setVelocity(0, 0);
    player1.body.moves = false;
    player2.body.moves = false;

    // Remove goal
    goal.destroy();

    // Show a restart button
    let restartButton = document.createElement("button");
    restartButton.innerText = "Play Again";
    restartButton.style.position = "absolute";
    restartButton.style.top = "50%";
    restartButton.style.left = "50%";
    restartButton.style.transform = "translate(-50%, -50%)";
    restartButton.style.padding = "15px";
    restartButton.style.fontSize = "20px";
    restartButton.onclick = function() {
        location.reload();
    };
    document.body.appendChild(restartButton);
}