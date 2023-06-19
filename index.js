import './style.css';
import gsap, { Power3 } from 'gsap';

const roundedClipPath = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const getImage = () => {
  const image = new Image();
  image.src = 'https://picsum.photos/1920/1080';
  return image;
};

class Grid {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.parent = document.querySelector('#containerCanvas');
    this.timeline = gsap.timeline();
    this.baseCellSize = 86;
    this.cellWidth = this.baseCellSize;
    this.cellHeight = this.baseCellSize;
    this.gap = 2;
    this.image = getImage();
    this.image.onload = () => {
      this.init();
    };
  }

  setUp() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.grid = [
      Math.floor(this.canvas.height / this.baseCellSize),
      Math.floor(this.canvas.width / this.baseCellSize),
    ];

    this.cellWidth = this.canvas.width / this.grid[1];
    this.cellHeight = this.canvas.height / this.grid[0];
  }

  buildGrid() {
    this.rows = this.grid[0];
    this.cols = this.grid[1];
    this.numberOfCells = this.rows * this.cols;
    this.cells = [];

    for (let i = 0; i < this.numberOfCells; i++) {
      const x = (i % this.cols) * this.cellWidth;
      const y = Math.floor(i / this.cols) * this.cellHeight;
      const cell = new Cell({
        ctx: this.ctx,
        x,
        y,
        width: this.cellWidth,
        height: this.cellHeight,
        image: this.image,
        gap: this.gap,
        blackOut: Math.random() > 1,
        index: i,
      });
      this.cells.push(cell);
      cell.draw();
    }
  }

  getIndex(x, y, rows) {
    const col = Math.floor(x / this.cellWidth);
    const row = Math.floor(y / this.cellHeight);
    return row * rows + col;
  }

  onCellClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.animateBoxes(this.getIndex(x, y, this.grid[1]));
  }

  events() {
    this.setUp();

    window.addEventListener('resize', () => {
      this.setUp();
      this.buildGrid();
    });

    this.canvas.addEventListener('click', (e) => {
      this.onCellClick(e);
    });
  }

  animateBoxes(from) {
    this.timeline.seek(0).clear();

    this.timeline.to(this.cells, {
      duration: 1.3,
      keyframes: {
        scale: [1, 0.9, 1],
        opacity: [1, 0.8, 1],
      },
      stagger: {
        amount: 1,
        grid: this.grid,
        from,
      },
      ease: Power3.easeOut,
      onUpdate: () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.cells.forEach((cell) => cell.draw());
      },
    });
    // .to(this.cells, {
    //   duration: 1.3,
    //   width: 200,
    //   height: 200,
    //   ease: Power3.easeOut,
    //   onUpdate: () => {
    //     this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //     this.cells.forEach((cell) => cell.draw());
    //   },
    // }, '<+=1')
  }

  init() {
    this.parent.appendChild(this.canvas);
    this.events();
    this.ctx = this.canvas.getContext('2d');
    this.buildGrid();
  }
}

class Cell {
  constructor({ ctx, x, y, width, height, image, gap, blackOut, index }) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.scale = 1;
    this.opacity = 1;
    this.width = width;
    this.height = height;
    this.image = image;
    this.blackOut = blackOut;
    this.gap = gap;
    this.borderRadius = 6;
    this.index = index;
  }

  draw() {
    this.ctx.save();
    this.ctx.globalAlpha = this.opacity;
    this.ctx.beginPath();
    this.ctx.translate(this.x + this.width * 0.5, this.y + this.height * 0.5);
    this.destinationX = this.width * -0.5 + this.gap;
    this.destinationY = this.height * -0.5 + this.gap;
    this.destinationSizeWidth = this.width - this.gap * 2;
    this.destinationSizeHeight = this.height - this.gap * 2;
    this.ctx.scale(this.scale, this.scale);
    roundedClipPath(
      this.ctx,
      this.destinationX,
      this.destinationY,
      this.destinationSizeWidth,
      this.destinationSizeHeight,
      this.borderRadius
    );
    this.ctx.clip();

    this.ctx.drawImage(
      this.image,
      this.x,
      this.y,
      this.width,
      this.height,
      this.destinationX,
      this.destinationY,
      this.destinationSizeWidth,
      this.destinationSizeHeight
    );
    if (this.blackOut) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.rect(this.x, this.y, this.width, this.height);
      this.ctx.fill();
    }
    this.ctx.restore();
  }
}

new Grid();
