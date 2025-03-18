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
let platforms;
let movingPlatform, button;
let goal;
let player1AtGoal = false, player2AtGoal = false;
let buttonPressed = false;
let playerObstacleCollider;
let samOnlyPlatform;
let leftStepPlatform;

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
    // Platforms
    platforms = this.physics.add.staticGroup();
    
    // Main bottom platform
    platforms.create(400, 570, 'ground').setScale(0.25).refreshBody();
    
    // Add a stepping platform to help Sadie reach the left side
    leftStepPlatform = platforms.create(260, 520, 'ground').setScale(0.06).refreshBody();
    
    // Left side path (for reaching the button)
    platforms.create(150, 490, 'ground').setScale(0.08).refreshBody();
    
    // Button platform
    platforms.create(50, 450, 'ground').setScale(0.06).refreshBody();
    
    // Main path platforms
    platforms.create(300, 440, 'ground').setScale(0.08).refreshBody();
    platforms.create(450, 360, 'ground').setScale(0.08).refreshBody();
    platforms.create(600, 280, 'ground').setScale(0.08).refreshBody();
    platforms.create(450, 200, 'ground').setScale(0.08).refreshBody();
    platforms.create(300, 120, 'ground').setScale(0.08).refreshBody();
    
    // Goal platform

    platforms.create(400, 100, 'ground').setScale(0.08).refreshBody(); // Lower it from 80 to 100
// goal = this.physics.add.sprite(400, 60, 'goal').setScale(0.07); // Lower the goal slightly


    // Moving platform - starts lower for easier access
    movingPlatform = this.physics.add.sprite(230, 390, 'platform').setImmovable(true).setScale(0.15, 0.08);
    movingPlatform.body.allowGravity = false;
    movingPlatform.body.velocity.y = 0;
    movingPlatform.setTint(0x99ff99);

    // Button - kept as requested
    button = this.physics.add.sprite(50, 430, 'button').setScale(0.15);
    button.setImmovable(true);
    button.body.allowGravity = false;
    button.setTint(0xff0000); // Make it clearly red

    // Add a Sam-only platform to reach upper areas
    samOnlyPlatform = this.physics.add.sprite(150, 200, 'platform').setImmovable(true).setScale(0.12, 0.05);
    samOnlyPlatform.body.allowGravity = false;
    samOnlyPlatform.setTint(0x00ffff);

   // Players (smaller, more proportional)
player1 = this.physics.add.sprite(350, 550, 'player1').setBounce(0.1).setCollideWorldBounds(true);
player2 = this.physics.add.sprite(450, 550, 'player2').setBounce(0.1).setCollideWorldBounds(true);

// Adjust scale to be significantly smaller
player1.setScale(0.2); // Make Sam smaller

// Fix hitbox sizes to match the scaled-down sprites
player1.body.setSize(player1.width * 0.4, player1.height * 0.8);
player1.body.setOffset(player1.width * 0.3, player1.height * 0.2);

// Add a faint white glow to improve visibility (if using Phaser 3.50+)
player1.setTint(0xffffff);  // White tint for visibility
player2.setTint(0xffffff);  // White tint for visibility

player2.setScale(0.2); // Shrinks Sadie
player2.body.setSize(player2.width * 0.5, player2.height * 0.5); 
player2.body.setOffset(player2.width * 0.25, player2.height * 0.25);


// // Players
//     player1 = this.physics.add.sprite(350, 550, 'player1').setBounce(0.1).setCollideWorldBounds(true);
//     player2 = this.physics.add.sprite(450, 550, 'player2').setBounce(0.1).setCollideWorldBounds(true);
    
//     // Make Sadie smaller to fit between platforms
//     player2.setScale(0.7);
    
//     // Adjust Sadie's hitbox
//     player2.body.setSize(player2.width * 0.7, player2.height * 0.7);
//     player2.body.setOffset(player2.width * 0.15, player2.height * 0.15);

    // Collisions
    this.physics.add.collider(player1, platforms);
    this.physics.add.collider(player2, platforms);
    this.physics.add.collider(player1, movingPlatform);
    this.physics.add.collider(player2, movingPlatform);
    
    // Sam-only platform (only Sam can stand on it)
    this.physics.add.collider(player1, samOnlyPlatform);
    
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
    
    // Create active player indicator text
    this.activePlayerText = this.add.text(16, 50, 'Active: Sam', { fontSize: '18px', fill: '#fff', backgroundColor: '#000' });
    
    // Add hint text
    this.add.text(16, 550, 'Tip: Get Sadie to the red button!', { fontSize: '18px', fill: '#ff0', backgroundColor: '#000' });
    this.add.text(550, 550, 'Work together!', { fontSize: '18px', fill: '#ff0', backgroundColor: '#000' });

    this.cameras.main.setBackgroundColor('#2E4053'); // blue

}

function update() {
    // Switch characters
    if (Phaser.Input.Keyboard.JustDown(switchKey)) {
        activePlayer = (activePlayer === player1) ? player2 : player1;
        this.activePlayerText.setText('Active: ' + (activePlayer === player1 ? 'Sam' : 'Sadie'));
    }

    // Reset velocity
    player1.setVelocityX(0);
    player2.setVelocityX(0);

    // Movement controls
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

    // Double jump for Sadie
    if (activePlayer === player2 && Phaser.Input.Keyboard.JustDown(cursors.up) && 
        !activePlayer.body.blocked.down && !activePlayer.hasJumped) {
        activePlayer.setVelocityY(-350);
        activePlayer.hasJumped = true;
    }
    
    // Reset double jump when landing
    if (activePlayer === player2 && activePlayer.body.blocked.down) {
        activePlayer.hasJumped = false;
    }

    // Air control for better precision jumping
    if (!activePlayer.body.blocked.down) {
        if (cursors.left.isDown) {
            activePlayer.setVelocityX(Math.max(activePlayer.body.velocity.x - 5, -160));
        } else if (cursors.right.isDown) {
            activePlayer.setVelocityX(Math.min(activePlayer.body.velocity.x + 5, 160));
        }
    }
    
    // Make the cyan platform glow if Sam is active
    if (activePlayer === player1) {
        samOnlyPlatform.setTint(0x00ffff);
    } else {
        samOnlyPlatform.setTint(0x0088aa);
    }
    
    // Sadie Activates Button
    if (checkOverlap(player2, button) && !buttonPressed) {
        buttonPressed = true;
        button.setTint(0xff3333); // Darker red when pressed
        movePlatform(this);
        
        // Add a hint text when the button is pressed
        this.add.text(200, 350, '↑ Platform moving! ↑', { fontSize: '16px', fill: '#ff0', backgroundColor: '#000' });
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
        ease: 'Linear'
    });
}

function checkWinCondition(playerNumber, scene) {
    if (playerNumber === 1) {
        player1AtGoal = true;
    }
    if (playerNumber === 2) {
        player2AtGoal = true;
    }

    // Update goal status text
    let goalStatus = '';
    if (player1AtGoal) goalStatus += 'Sam ✓ ';
    if (player2AtGoal) goalStatus += 'Sadie ✓';
    
    // Create or update goal status text
    if (!scene.goalStatusText) {
        scene.goalStatusText = scene.add.text(16, 84, 'Goal: ' + goalStatus, { fontSize: '18px', fill: '#fff', backgroundColor: '#000' });
    } else {
        scene.goalStatusText.setText('Goal: ' + goalStatus);
    }

    // Check if both players are at the goal simultaneously
    let bothAtGoal = checkBothPlayersAtGoal();
    
    // BOTH players must be at the goal SIMULTANEOUSLY to win
    if (bothAtGoal) {
        winGame();
    } else if (player1AtGoal && !player2AtGoal) {
        if (!scene.goalHintText) {
            scene.goalHintText = scene.add.text(300, 84, 'Both must be at goal at the same time!', 
                { fontSize: '18px', fill: '#ff0', backgroundColor: '#000' });
        }
        player1AtGoal = false; // Reset status if they leave
    } else if (!player1AtGoal && player2AtGoal) {
        if (!scene.goalHintText) {
            scene.goalHintText = scene.add.text(300, 84, 'Both must be at goal at the same time!', 
                { fontSize: '18px', fill: '#ff0', backgroundColor: '#000' });
        }
        player2AtGoal = false; // Reset status if they leave
    }
}

function checkBothPlayersAtGoal() {
    let player1GoalOverlap = Phaser.Geom.Intersects.RectangleToRectangle(
        player1.getBounds(), goal.getBounds()
    );
    
    let player2GoalOverlap = Phaser.Geom.Intersects.RectangleToRectangle(
        player2.getBounds(), goal.getBounds()
    );
    
    return player1GoalOverlap && player2GoalOverlap;
}

function winGame() {
    alert("🎉 You Win! Sam and Sadie reached the goal together! 🎉");

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