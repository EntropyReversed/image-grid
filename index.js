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
    //   width: 200,
    //   height: 200,
    //   ease: Power3.easeOut,
    //   onUpdate: () => this.onUpdate(),
    // })
  }

  onUpdate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.cells.forEach((cell) => cell.draw());
    this.cellHover.draw();
  }

  init() {
    this.parent.appendChild(this.canvas);
    this.events();
    this.ctx = this.canvas.getContext('2d');
    this.cellHover = new CellHover({
      ctx: this.ctx,
      x: 0,
      y: 0,
      width: this.cellWidth,
      height: this.cellHeight,
    });
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


new Grid();
