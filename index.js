import './style.css';
import gsap from 'gsap';
import barba from '@barba/core';
// barba.init({
//   debug: true,
//   transitions: [
//     {
//       name: 'opacity-transition',
//       leave(data) {
//         return gsap.to(data.current.container, {
//           opacity: 0,
//         });
//       },
//       enter(data) {
//         return gsap.from(data.next.container, {
//           opacity: 0,
//         });
//       },
//     },
//   ],
// });

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
  // image.src = './image.jpg';
  // image.width = '1769';
  // image.height = '2167';
  // console.log(image);
  image.src = 'https://picsum.photos/1920/1080';
  return image;
};

class Grid {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.parent = document.querySelector('#containerCanvas');
    this.timeline = gsap.timeline();
    this.timelineHover = gsap.timeline();
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
      this.cells.push(
        new Cell({
          ctx: this.ctx,
          width: this.cellWidth,
          height: this.cellHeight,
          image: this.imageCanvas.canvas,
          gap: this.gap,
          blackOut: Math.random() > 1,
          cols: this.cols,
          offsetX: 0,
          offsetY: 0,
          index: i,
        })
      );
    }
  }

  hoverEffect(x, y) {
    this.ctx.beginPath();
    this.fillStyle = 'rgba(255,0,0,0.5)';
    this.ctx.rect(x, y, 100, 100);
    this.ctx.fill();
  }

  getIndex(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / this.cellWidth);
    const row = Math.floor(y / this.cellHeight);
    return row * this.grid[1] + col;
  }

  onCellClick(e) {
    this.animateBoxes(this.getIndex(e));
  }

  events() {
    this.setUp();

    this.lastIndex = 0;

    const handleMouseMove = (e) => {
      const hoveredIndex = this.getIndex(e);
      if (this.lastIndex !== hoveredIndex) {
        this.animateHover(
          this.cells[hoveredIndex].x,
          this.cells[hoveredIndex].y,
          1
        );
        this.lastIndex = hoveredIndex;
      }
    };

    const handleMouseEnter = (e) => {
      const hoveredIndex = this.getIndex(e);
      this.animateHover(
        this.cells[hoveredIndex].x,
        this.cells[hoveredIndex].y,
        1
      );
      this.lastIndex = hoveredIndex;
    };

    const handleMouseLeave = (e) => {
      this.animateHover(
        this.cells[this.lastIndex].x,
        this.cells[this.lastIndex].y,
        0
      );
      this.lastIndex = this.getIndex(e);
    };

    const handleResize = () => {
      this.setUp();
      if (this.imageCanvas) {
        this.imageCanvas.onResize(this.canvas.width, this.canvas.height, 0)
      }
      this.createHover();
      this.buildGrid();
    };

    const handleClick = (e) => {
      this.onCellClick(e);
    };

    window.addEventListener('resize', handleResize);
    this.canvas.addEventListener('click', handleClick);
    this.canvas.addEventListener('mousemove', handleMouseMove);
    this.canvas.addEventListener('mouseenter', handleMouseEnter);
    this.canvas.addEventListener('mouseleave', handleMouseLeave);
  }

  animateHover(x, y, opacity) {
    this.timelineHover.clear();
    this.timelineHover.to(this.cellHover, {
      x,
      y,
      opacity,
      duration: 0.8,
      ease: 'expo.out',
      onUpdate: () => this.onUpdate(),
    });
  }

  createHover() {
    this.cellHover = new CellHover({
      ctx: this.ctx,
      x: 0,
      y: 0,
      width: this.cellWidth,
      height: this.cellHeight,
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
      ease: 'power3.out',
      onUpdate: () => this.onUpdate(),
    });
    // .to(this.cells, {
    //   duration: 1.3,
    //   offsetX: -this.cells[from].x,
    //   offsetY: -this.cells[from].y,
    //   width: 160,
    //   height: 160,
    //   ease: 'power3.out',
    //   onUpdate: () => this.onUpdate(),
    // })
  }

  onUpdate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.cells.forEach((cell) => cell.draw());
    this.imageCanvas.draw()
    this.cellHover.draw();
  }

  init() {
    this.parent.appendChild(this.canvas);
    this.events();
    this.imageCanvas = new ImageCanvas(this.image, this.canvas, 0)
    this.ctx = this.canvas.getContext('2d');
    this.createHover();
    this.buildGrid();
  }
}

class Cell {
  constructor({
    ctx,
    width,
    height,
    image,
    gap,
    blackOut,
    cols,
    offsetX,
    offsetY,
    index,
  }) {
    this.ctx = ctx;
    this.scale = 1;
    this.opacity = 1;
    this.width = width;
    this.height = height;
    this.image = image;
    this.blackOut = blackOut;
    this.gap = gap;
    this.borderRadius = 6;
    this.cols = cols;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.index = index;

    this.draw();
  }

  draw() {
    this.x = (this.index % this.cols) * this.width + this.offsetX;
    this.y = Math.floor(this.index / this.cols) * this.height + this.offsetY;

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

class CellHover {
  constructor({ ctx, x, y, width, height }) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.opacity = 0;
  }

  draw() {
    this.ctx.save();
    this.ctx.beginPath();
    roundedClipPath(this.ctx, this.x, this.y, this.width, this.height, 6);
    this.ctx.clip();
    this.ctx.strokeStyle = `rgba(255,255,255,${this.opacity})`;
    this.ctx.lineWidth = 5;
    this.ctx.rect(this.x, this.y, this.width, this.height);
    this.ctx.shadowColor = `rgba(255,255,255,${this.opacity})`;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.stroke();
    this.ctx.restore();

    // this.ctx.save();
    // this.ctx.beginPath();
    // roundedClipPath(this.ctx, this.x, this.y, this.width, this.height, 6);
    // this.ctx.clip();

    // // Get the pixel data of the background image at the top-left corner of the rectangle
    // const imageData = this.ctx.getImageData(this.x, this.y, 1, 1);
    // const [r, g, b] = imageData.data;

    // // Invert the stroke color based on the average of the RGB values
    // const averageColor = (r + g + b) / 3;
    // const invertedColor = 255 - averageColor;

    // // Set the stroke color and shadow color using the inverted value
    // this.ctx.strokeStyle = `rgba(${invertedColor}, ${invertedColor}, ${invertedColor}, ${this.opacity})`;
    // this.ctx.shadowColor = `rgba(${invertedColor}, ${invertedColor}, ${invertedColor}, ${this.opacity})`;

    // this.ctx.lineWidth = 5;
    // this.ctx.rect(this.x, this.y, this.width, this.height);
    // this.ctx.shadowBlur = 10;
    // this.ctx.shadowOffsetX = 0;
    // this.ctx.shadowOffsetY = 0;
    // this.ctx.stroke();
    // this.ctx.restore();
  }
}

class ImageCanvas {
  constructor(image, mainCanvas, offsetX) {
    this.mainCanvas = mainCanvas;
    this.image = image;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.imageWidth = this.image.width;
    this.imageHeight = this.image.height;
    this.sceneOffsetX = offsetX;
    this.offsetX = offsetX;
    this.offsetY = 0;
    this.imageScale = 1;
    this.setUp();
  }

  onResize(width, height, sceneOffsetX) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.sceneOffsetX = sceneOffsetX;
    this.draw();
  }

  setUp() {
    this.canvas.width = this.mainCanvas.width;
    this.canvas.height = this.mainCanvas.height;
    this.offsetX = this.sceneOffsetX;
    this.draw();
  }

  draw() {
    const cw = (this.canvas.width - this.sceneOffsetX) * this.imageScale;
    const ch = this.canvas.height * this.imageScale;
    console.log(this.canvas.width, this.canvas.height, this.sceneOffsetX, this.imageScale)
    const scale = Math.max(cw / this.imageWidth, ch / this.imageHeight);
    const x = (cw - scale * this.imageWidth) * 0.5 + this.offsetX;
    const y = (ch - scale * this.imageHeight) * 0.5 + this.offsetY;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(scale, 0, 0, scale, x, y);
    this.ctx.drawImage(this.image, 0, 0);
  }
}

new Grid();
