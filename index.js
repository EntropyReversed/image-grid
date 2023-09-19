import './style.css';
import gsap from 'gsap';
import barba from '@barba/core';
barba.init({
  debug: true,
  transitions: [
    {
      name: 'opacity-transition',
      leave(data) {
        return gsap.to(data.current.container, {
          opacity: 0,
        });
      },
      enter(data) {
        return gsap.from(data.next.container, {
          opacity: 0,
        });
      },
    },
  ],
});

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
  constructor({ wrap, blackOutCells }) {
    this.wrap = wrap;
    this.canvas = document.createElement('canvas');
    this.parent = this.wrap.querySelector('#containerCanvas');
    this.timeline = gsap.timeline();
    this.timelineHover = gsap.timeline();
    this.blackOutCells = blackOutCells ?? [];
    this.gap = 1;
    this.image = getImage();
    this.image.onload = () => {
      this.init();
    };
  }

  setUp() {
    this.wrapWidth = this.wrap.getBoundingClientRect().width;
    this.wrapHeight = this.wrap.getBoundingClientRect().height;
    this.baseCellSize = this.wrapWidth / (this.wrapWidth < 1000 ? 10 : 20);
    this.cellWidth = this.baseCellSize;
    this.cellHeight = this.baseCellSize;
    this.canvas.width = this.wrapWidth;
    this.canvas.height = this.wrapHeight;
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
      this.cells.push(
        new Cell({
          ctx: this.ctx,
          width: this.cellWidth,
          height: this.cellHeight,
          image: this.imageCanvas.canvas,
          gap: this.gap,
          blackOut:
            this.blackOutCells.filter((bCell) => bCell === i)?.length > 0,
          cols: this.cols,
          index: i,
        })
      );
    }
  }

  events() {
    this.setUp();
    const resizeObserver = new ResizeObserver(() => {
      this.setUp();
      if (this.imageCanvas) {
        this.imageCanvas.onResize(this.canvas.width, this.canvas.height, 0);
      }
      this.buildGrid();
    });

    resizeObserver.observe(this.wrap);
  }
  onUpdate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.cells.forEach((cell) => cell.draw());
    this.imageCanvas.draw();
    this.cellHover.draw();
  }

  init() {
    this.parent.appendChild(this.canvas);
    this.events();
    this.imageCanvas = new ImageCanvas(this.image, this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.buildGrid();
  }
}

class Cell {
  constructor({ ctx, width, height, image, gap, blackOut, cols, index }) {
    this.ctx = ctx;
    this.scale = 1;
    this.opacity = 1;
    this.width = width;
    this.height = height;
    this.image = image;
    this.blackOut = blackOut;
    this.gap = gap;
    this.borderRadius = 20;
    this.cols = cols;
    this.index = index;

    this.draw();
  }

  draw() {
    this.x = (this.index % this.cols) * this.width;
    this.y = Math.floor(this.index / this.cols) * this.height;

    this.ctx.save();
    this.ctx.globalAlpha = this.opacity;
    this.ctx.beginPath();
    this.ctx.setTransform(
      this.scale,
      0,
      0,
      this.scale,
      this.x + this.width * 0.5,
      this.y + this.height * 0.5
    );
    this.destinationX = this.width * -0.5 + this.gap;
    this.destinationY = this.height * -0.5 + this.gap;
    this.destinationSizeWidth = this.width - this.gap * 2;
    this.destinationSizeHeight = this.height - this.gap * 2;
    if (!this.blackOut) {
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
        this.x + this.gap,
        this.y + this.gap,
        this.width,
        this.height,
        this.destinationX,
        this.destinationY,
        this.destinationSizeWidth,
        this.destinationSizeHeight
      );
    }
    this.ctx.restore();
  }
}

class ImageCanvas {
  constructor(image, mainCanvas) {
    this.mainCanvas = mainCanvas;
    this.image = image;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.imageSize = {
      width: this.image.width,
      height: this.image.height,
    };
    this.setUp(this.mainCanvas.width, this.mainCanvas.height);
  }

  onResize(width, height) {
    this.setUp(width, height);
  }

  setUp(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.draw();
  }

  draw() {
    const { width: cw, height: ch } = this.canvas;
    const { width: iw, height: ih } = this.imageSize;

    const scale = Math.max(cw / iw, ch / ih);
    const x = (cw - scale * iw) * 0.5;
    const y = (ch - scale * ih) * 0.5;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(scale, 0, 0, scale, x, y);
    this.ctx.drawImage(this.image, 0, 0);
  }
}

const randomNumbers = [];

for (let i = 0; i < 100; i++) {
  const randomNumber = Math.floor(Math.random() * 401);
  randomNumbers.push(randomNumber);
}

new Grid({
  wrap: document.querySelector('.simple-grid'),
  blackOutCells: randomNumbers,
});
