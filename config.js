// 游戏配置参数与资源路径集中管理
//export 是用于 模块系统 的关键词，主要用于将模块内部定义的变量、函数、类等成员导出
// ，以便其他模块可以导入并使用它们
// 画布尺寸
export const GAME_WIDTH = 288;
export const GAME_HEIGHT = 512;

// 物理参数
export const GRAVITY = 900; // 像素/秒^2
export const FLAP_VELOCITY = -250; // 鸟上升速度
export const PIPE_INTERVAL = 1500; // 管道生成间隔（毫秒）
export const PIPE_GAP = 125; // 上下管道间隙（像素）
export const PIPE_SPEED = -120; // 管道移动速度
export const SCORE_DIGIT_WIDTH = 14; // 数字图片宽度

// 资源路径
export const ASSETS = {
  bg: 'assets/bg_day.png',
  land: 'assets/land.png',
  bird: [
    'assets/bird0_0.png',
    'assets/bird0_1.png',
    'assets/bird0_2.png'
  ],
  pipeUp: 'assets/pipe_up.png',
  pipeDown: 'assets/pipe_down.png',
  title: 'assets/title.png',
  buttonPlay: 'assets/button_play.png',
  textGameOver: 'assets/text_game_over.png',
  // 数字图片（0-9）
  numbers: [
    'assets/number_score_00.png',
    'assets/number_score_01.png',
    'assets/number_score_02.png',
    'assets/number_score_03.png',
    'assets/number_score_04.png',
    'assets/number_score_05.png',
    'assets/number_score_06.png',
    'assets/number_score_07.png',
    'assets/number_score_08.png',
    'assets/number_score_09.png'
  ],
  //音效
  flap: 'assets/wing.ogg',
  hit: 'assets/hit.ogg',
  point: 'assets/point.ogg',
  die: 'assets/die.ogg'
}; 