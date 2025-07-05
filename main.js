// main.js
// 主入口，创建 Phaser.Game 实例，注册 GameScene
import { GAME_WIDTH, GAME_HEIGHT, PIPE_INTERVAL, PIPE_GAP, PIPE_SPEED, FLAP_VELOCITY, GRAVITY,ASSETS,SCORE_DIGIT_WIDTH } from './config.js';

//GameScene 类定义,核心游戏场景，包含 "玩游戏" 的所有逻辑,继承 Phaser.Scene 类组织游戏内容
class GameScene extends Phaser.Scene {
    //constructor 是类创建实例时自动调用的初始化方法
  constructor() {
    // 调用父类 Phaser.Scene 的构造函数，并传入场景名称
    super('GameScene');
  }

  preload() {
    // 加载背景、地面、鸟、管道、按钮、logo、游戏结束文字
    this.load.image('bg', ASSETS.bg);
    this.load.image('land', ASSETS.land);
    this.load.image('pipeUp', ASSETS.pipeUp);
    this.load.image('pipeDown', ASSETS.pipeDown);
    this.load.image('title', ASSETS.title);
    this.load.image('buttonPlay', ASSETS.buttonPlay);
    this.load.image('textGameOver', ASSETS.textGameOver);
    // 鸟动画帧
    this.load.spritesheet({
        key: 'bird0',
        url: ASSETS.bird[0],
        frameConfig: {
          frameWidth: 34,
          frameHeight: 34,
          margin: 7,
          spacing: 0
        }
    });
    this.load.spritesheet({
        key: 'bird1',
        url: ASSETS.bird[1],
        frameConfig: {
          frameWidth: 34,
          frameHeight: 34,
          margin: 7,
          spacing: 0
        }
    });
    this.load.spritesheet({
        key: 'bird2',
        url: ASSETS.bird[2],
        frameConfig: {
          frameWidth: 34,
          frameHeight: 34,
          margin: 7,
          spacing: 0
        }
    });
    // 数字图片（0-9）
    for (let i = 0; i <= 9; i++) {
      const key = `num${i}`;
      const path = ASSETS.numbers[i];
      this.load.image(key, path);
    }
    // 加载音效
    this.load.audio('flap', ASSETS.flap);
    this.load.audio('hit', ASSETS.hit);
    this.load.audio('point', ASSETS.point);
    this.load.audio('die', ASSETS.die);
  }
  create() {
    // 添加背景（tileSprite 可实现循环滚动）
    //x,y是图片在画布中的位置
    this.bg = this.add.tileSprite(0, 0, this.sys.game.config.width, this.sys.game.config.height, 'bg').setOrigin(0, 0);
    // 添加视觉地面
    this.land = this.add.tileSprite(0, this.sys.game.config.height - 112, this.sys.game.config.width, 112, 'land').setOrigin(0, 0);
    // 添加物理地面（用矩形实现，完全不可见）
    this.landCollider = this.add.rectangle(
        //矩形X轴中心
      this.sys.game.config.width / 2,
      //矩形Y轴中心
      this.sys.game.config.height - 56,
      this.sys.game.config.width,
      112
    );
    // 把对象添加到物理系统，设为静态物体
    this.physics.add.existing(this.landCollider, true); // true=static
    this.landCollider.visible = false;//不可见
    // 只创建一次鸟的飞行动画，并确保动画资源不会重复注册
    if (!this.anims.exists('fly')) {
      this.anims.create({
        key: 'fly',
        frames: [
          { key: 'bird0' },
          { key: 'bird1' },
          { key: 'bird2' }
        ],
        frameRate: 10,
        repeat: -1
      });
    }
    // 再添加鸟精灵，设置原点是对象的旋转、缩放和位置计算的参考点
    this.bird = this.physics.add.sprite(60, this.sys.game.config.height / 2, 'bird0').setOrigin(0.5, 0.5);
    this.bird.play('fly');//播放动画
    this.bird.body.allowGravity = false; // 游戏开始前不下落
    this.bird.setCollideWorldBounds(true);//不能超出世界边界
    // 创建管道组
    this.pipes = this.physics.add.group();
    // 鸟与管道碰撞检测
    this.physics.add.collider(this.bird, this.pipes, this.handleGameOver, null, this);
    // 鸟与地面碰撞检测（用物理地面）
    this.physics.add.collider(this.bird, this.landCollider, this.handleGameOver, null, this);
    // 分数初始化
    this.score = 0;
    this.scoreGroup = this.add.group(); // 用于管理分数图片

    // 游戏状态管理
    this.GAME_STATE = {
      READY: 0,
      PLAYING: 1,
      GAMEOVER: 2
    };
    this.state = this.GAME_STATE.READY;

    // 添加 logo 和开始按钮
    this.titleImg = this.add.image(this.sys.game.config.width / 2, 120, 'title').setDepth(10);
    //设置按钮可交互
    this.playBtn = this.add.image(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'buttonPlay').setInteractive().setDepth(10);
    this.playBtn.on('pointerdown', this.startGame, this);

    // 游戏结束相关元素（初始隐藏）
    this.gameOverImg = this.add.image(this.sys.game.config.width / 2, 180, 'textGameOver').setVisible(false).setDepth(10);
    this.restartBtn = this.add.image(this.sys.game.config.width / 2, 300, 'buttonPlay').setVisible(false).setInteractive().setDepth(10);
    this.restartBtn.on('pointerdown', this.restartGame, this);

    // 场景重启时恢复物理
    if (this.physics.world.isPaused) {
      this.physics.resume();
    }

    // 确保物理世界有重力
    this.physics.world.gravity.y = GRAVITY;

    // 音效对象
    this.sfx = {
      flap: this.sound.add('flap'),
      hit: this.sound.add('hit'),
      point: this.sound.add('point'),
      die: this.sound.add('die')
    };

    // 输入处理（点击/空格），添加调试输出
    this.input.on('pointerdown', () => {
      console.log('Pointer down event, state:', this.state);
      this.handleInput();
    }, this);
    this.input.keyboard.on('keydown-SPACE', () => {
      console.log('Space key event, state:', this.state);
      this.handleInput();
    }, this);
    console.log('GameScene create end');
  }

  // 更新分数图片显示（居中）
  updateScoreDisplay() {
    // 先清空旧的分数图片
    this.scoreGroup.clear(true, true);
    const scoreStr = this.score.toString();
    const digitWidth = SCORE_DIGIT_WIDTH; // 数字图片宽度
    const totalWidth = digitWidth * scoreStr.length;
    const startX = (this.sys.game.config.width - totalWidth) / 2;
    for (let i = 0; i < scoreStr.length; i++) {
      const num = scoreStr[i];
      //图片中心点x,y坐标
      const img = this.add.image(startX + i * digitWidth + digitWidth / 2, 60, `num${num}`).setDepth(10);
      this.scoreGroup.add(img);
    }
  }

  // 生成一对上下管道
  spawnPipePair() {
    // 随机确定上管道底部位置（留出空隙），最大高度310
    const minY = 60;
    const maxY = 280;
    const pipeDownY = Phaser.Math.Between(minY, maxY); // 上管道底部
    const pipeUpY = Math.min(pipeDownY + PIPE_GAP, 380); // 下管道顶部

    // 上管道（朝下，pipeDown）,create 方法创建一个精灵对象，并添加到管道组中
    const pipeDown = this.pipes.create(
      this.sys.game.config.width + 52,
      pipeDownY,
      'pipeDown'
    ).setOrigin(0, 1);

    // 下管道（朝上，pipeUp）
    const pipeUp = this.pipes.create(
      this.sys.game.config.width + 52,
      pipeUpY,
      'pipeUp'
    ).setOrigin(0, 0);

    // 设置速度
    pipeDown.body.setVelocityX(PIPE_SPEED);
    pipeUp.body.setVelocityX(PIPE_SPEED);
    // 不受重力影响
    pipeDown.body.allowGravity = false;
    pipeUp.body.allowGravity = false;
    // 只需检测与鸟的碰撞,管道碰撞后不移动
    pipeDown.body.immovable = true;
    pipeUp.body.immovable = true;
  }

  update() {
    // 背景缓慢滚动
    this.bg.tilePositionX += 0.3;
    // 地面较快滚动
    this.land.tilePositionX += 2;

    if (this.state !== this.GAME_STATE.PLAYING) return; // 只在游戏中执行以下逻辑

    // 鸟的旋转角度随速度变化
    if (this.bird) {
      const maxAngle = 30;
      const minAngle = -30;
      let angle = Phaser.Math.Clamp(this.bird.body.velocity.y / 8, minAngle, maxAngle);
      this.bird.setAngle(angle);
    }

    // 管道超出屏幕后销毁
    this.pipes.getChildren().forEach(pipe => {
      if (pipe.x + pipe.width < 0) {
        this.pipes.remove(pipe, true, true);
      }
    });

    // 检查管道通过并加分
    this.pipes.getChildren().forEach(pipe => {
      if (!pipe.scored && pipe.texture.key === 'pipeUp' && pipe.x + pipe.width / 2 < this.bird.x) {
        pipe.scored = true;
        this.score++;
        this.updateScoreDisplay();
        if (this.sfx && this.sfx.point) this.sfx.point.play();
      }
    });
  }

  startGame() {
    if (this.state !== this.GAME_STATE.READY) return;
    //开始计分
    this.updateScoreDisplay();
    this.state = this.GAME_STATE.PLAYING;
    this.titleImg.setVisible(false);
    this.playBtn.setVisible(false);
    this.bird.body.allowGravity = true;
    this.bird.setVelocityY(FLAP_VELOCITY); // 起跳
    // 仅在游戏开始时启动管道生成定时器
    this.pipeTimer = this.time.addEvent({
      delay: PIPE_INTERVAL,
      callback: this.spawnPipePair,
      callbackScope: this,
      loop: true
    });
  }
  //空格和点击控制鸟跳跃
  handleInput() {
    if (this.state === this.GAME_STATE.PLAYING) {
      this.bird.setVelocityY(FLAP_VELOCITY); // 跳跃
      if (this.sfx && this.sfx.flap) this.sfx.flap.play();
    } 
  }

  handleGameOver() {
    if (this.state !== this.GAME_STATE.PLAYING) return;
    this.state = this.GAME_STATE.GAMEOVER;
    this.physics.pause();
    if (this.pipeTimer) this.pipeTimer.paused = true;
    this.bird.setTint(0xff0000);
    if (this.sfx && this.sfx.hit) this.sfx.hit.play();
    this.gameOverImg.setVisible(true);
    this.restartBtn.setVisible(true);
    console.log('handleGameOver');
  }
  

  restartGame() {
    // 恢复物理世界
    this.physics.resume();
  
    // 清除所有管道
    this.pipes.clear(true, true);
  
    // 重置鸟
    this.bird.clearTint();
    this.bird.setPosition(60, this.sys.game.config.height / 2);
    this.bird.setVelocity(0, FLAP_VELOCITY);
    this.bird.body.allowGravity = true;
    this.bird.angle = 0;
  
    // 重置分数
    this.score = 0;
    this.updateScoreDisplay();
  
    // 隐藏结束界面元素
    this.gameOverImg.setVisible(false);
    this.restartBtn.setVisible(false);
    this.titleImg.setVisible(false);
    this.playBtn.setVisible(false);
  
    // 游戏状态切换到 PLAYING
    this.state = this.GAME_STATE.PLAYING;
  
    // 重新启动管道生成定时器
    if (this.pipeTimer) {
      this.pipeTimer.remove(false);
    }
    this.pipeTimer = this.time.addEvent({
      delay: PIPE_INTERVAL,
      callback: this.spawnPipePair,
      callbackScope: this,
      loop: true
    });
  }
  
  
}
//config 是一个配置对象，它包含了众多参数，这些参数会对游戏的初始化和运行产生影响。
const config = {
  //type: Phaser.AUTO, 表示使用自动检测的渲染器，根据浏览器环境选择 WebGL 或 Canvas
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  //parent: 'game-container', 表示将游戏容器挂载到 HTML 中的 id 为 game-container 的元素上
  parent: 'game-container',
  //物理引擎配置
  physics: {
    // 使用 Arcade 物理引擎
    default: 'arcade',
    arcade: {
      // 设置重力，y 轴方向为 0，表示游戏开始前不下落
      gravity: { y: 0 }, 
      // 是否开启调试模式，false 表示不开启
      debug: false
    }
  },
  scene: [GameScene]
};
//代表游戏实例（Phaser.Game），整个游戏只有一个这样的实例，它是游戏的核心控制器
const game = new Phaser.Game(config); 