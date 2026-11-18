/**
 * FourthTemple — TempleOS-Style Pixel Terminal & Lua Editor
 * - Grey TempleOS arrow mouse cursor with invert effect on hovered letters/symbols
 * - Top bar with only File dropdown trigger, Name, and Time
 * - 60 FPS pixel-smooth top border spinning text: "lua socket mr robot .. "
 * - 60 FPS spinning Lua circle with orbital ring, orbiting moon, and moving "Lua" text in bottom-right
 * - Palette: Blue-Grey, White, Light Blue, Dark Blue (full colors only in Lua syntax highlighting)
 * - Prompt: @TEEDTHETERRIBLE >
 * - Commands: CREATE, EDIT, EXECUTE, DELETE (flashing opposite colors on the right)
 */

const TEMPLE_ARROW_CURSOR = [
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0],
  [1, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0],
  [1, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0],
  [1, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0],
  [1, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0],
  [1, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [1, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1],
  [1, 2, 2, 1, 2, 2, 1, 0, 0, 0, 0],
  [1, 2, 1, 0, 1, 2, 2, 1, 0, 0, 0],
  [1, 1, 0, 0, 1, 2, 2, 1, 0, 0, 0],
  [1, 0, 0, 0, 0, 1, 2, 2, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 2, 2, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0]
];

const LUA_KEYWORDS = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
  'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat',
  'return', 'then', 'true', 'until', 'while'
]);

const LUA_BUILTINS = new Set([
  'socket', 'require', 'print', 'tostring', 'tonumber', 'pairs', 'ipairs',
  'string', 'table', 'math', 'os', 'gfx', 'tcp', 'udp', 'http', 'dns',
  'connect', 'send', 'receive', 'bind', 'close', 'on_request'
]);

class TempleTerminal {
  constructor() {
    this.width = 640;
    this.height = 480;
    this.cols = 80;
    this.rows = 60;

    this.canvas = document.getElementById('screen');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.imageData = this.ctx.createImageData(this.width, this.height);
    this.pixels = this.imageData.data;

    this.fgMask = new Uint8Array(this.width * this.height);

    this.gfxBuffer = new Uint8Array(this.width * this.height);
    this.gfxBuffer.fill(0xFF);

    this.hiddenInput = document.getElementById('hidden-input');

    this.defaultFg = 1;  // Dark Blue text
    this.defaultBg = 15; // White background

    // Terminal state
    this.lines = [];
    this.scrollOffset = 0;
    this.promptText = '@TEEDTHETERRIBLE > ';
    this.inputBuffer = '';
    this.cursorPos = 0;
    this.history = [
      'CREATE mrrobot',
      'EDIT mrrobot',
      'EXECUTE mrrobot',
      'DELETE mrrobot'
    ];
    this.historyIndex = this.history.length;
    this.busy = false;

    // Mode: 'SHELL' | 'EDITOR'
    this.mode = 'SHELL';
    this.edFilename = 'mrrobot.lua';
    this.edLines = [''];
    this.edRow = 0;
    this.edCol = 0;
    this.edScrollY = 0;
    this.edClipboard = '';
    this.edStatus = '';

    // Top-left File dropdown menu state
    this.fileMenuOpen = false;
    this.mouseX = 320;
    this.mouseY = 240;
    this.mouseCol = 40;
    this.mouseRow = 30;

    // 60 FPS animations: top spinning text & spinning Lua circle
    this.cursorBlink = true;
    this.flashPhase = false;
    this.spinPixelOffset = 0;
    this.orbitAngle = 0;
    this.frameCount = 0;

    this.lua = new window.TempleLuaCompiler(this);

    this.bindEvents();
    this.updateCanvasScale();
    this.startRenderLoop();
  }

  updateCanvasScale() {
    const scaleX = window.innerWidth / 640;
    const scaleY = window.innerHeight / 480;
    const scale = Math.max(1, Math.min(scaleX, scaleY));
    this.canvas.style.width = `${Math.floor(640 * scale)}px`;
    this.canvas.style.height = `${Math.floor(480 * scale)}px`;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.updateCanvasScale());

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.floor(((e.clientX - rect.left) / rect.width) * this.width);
      const y = Math.floor(((e.clientY - rect.top) / rect.height) * this.height);
      this.mouseX = Math.max(0, Math.min(this.width - 1, x));
      this.mouseY = Math.max(0, Math.min(this.height - 1, y));
      this.mouseCol = Math.floor(this.mouseX / 8);
      this.mouseRow = Math.floor(this.mouseY / 8);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.hiddenInput.focus();
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.floor(((e.clientX - rect.left) / rect.width) * this.width);
      const y = Math.floor(((e.clientY - rect.top) / rect.height) * this.height);
      this.mouseX = Math.max(0, Math.min(this.width - 1, x));
      this.mouseY = Math.max(0, Math.min(this.height - 1, y));
      this.mouseCol = Math.floor(this.mouseX / 8);
      this.mouseRow = Math.floor(this.mouseY / 8);
      this.handleMouseClick(this.mouseCol, this.mouseRow);
    });

    window.addEventListener('wheel', (e) => {
      if (this.mode === 'SHELL') {
        if (e.deltaY < 0) {
          this.scrollOffset = Math.min(Math.max(0, this.lines.length - 10), this.scrollOffset + 3);
        } else {
          this.scrollOffset = Math.max(0, this.scrollOffset - 3);
        }
      } else if (this.mode === 'EDITOR') {
        if (e.deltaY < 0) {
          this.edScrollY = Math.max(0, this.edScrollY - 3);
        } else {
          this.edScrollY = Math.min(Math.max(0, this.edLines.length - 10), this.edScrollY + 3);
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this.fileMenuOpen = !this.fileMenuOpen;
        return;
      }
      if (this.fileMenuOpen && e.key === 'Escape') {
        e.preventDefault();
        this.fileMenuOpen = false;
        return;
      }
      if (this.mode === 'EDITOR') {
        this.handleEditorKey(e);
      } else {
        this.handleShellKey(e);
      }
    });

    window.addEventListener('paste', (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('text');
      if (!text) return;
      e.preventDefault();
      if (this.mode === 'SHELL') {
        const clean = text.replace(/\r?\n/g, ' ');
        this.inputBuffer =
          this.inputBuffer.slice(0, this.cursorPos) +
          clean +
          this.inputBuffer.slice(this.cursorPos);
        this.cursorPos += clean.length;
      } else if (this.mode === 'EDITOR') {
        const curLine = this.edLines[this.edRow] || '';
        const clean = text.replace(/\r?\n/g, ' ');
        this.edLines[this.edRow] = curLine.slice(0, this.edCol) + clean + curLine.slice(this.edCol);
        this.edCol += clean.length;
      }
    });
  }

  /* ==========================================================================
     Mouse Click Handling (Top-Left File Dropdown & Right Flashing Commands)
     ========================================================================== */

  getFileMenuItems() {
    const items = [
      { label: 'Save to Browser   ^S', action: () => this.saveCurrentFile() },
      { label: 'Save & Exit       ^X', action: () => { this.saveCurrentFile(); this.mode = 'SHELL'; } },
      { label: 'New File (CREATE)   ', action: () => {
        const name = `script${Object.keys(this.lua.files).length + 1}.lua`;
        this.lua.cmdCreate(name);
        this.openEditor(name);
      }},
      { label: 'Delete Current File ', action: () => {
        if (this.edFilename) {
          this.lua.cmdDelete(this.edFilename);
          this.mode = 'SHELL';
        }
      }}
    ];
    const files = Object.keys(this.lua.files).sort();
    for (const f of files.slice(0, 7)) {
      items.push({
        label: `Open: ${f}`.slice(0, 20).padEnd(20, ' '),
        action: () => this.openEditor(f)
      });
    }
    return items;
  }

  saveCurrentFile() {
    if (this.mode === 'EDITOR') {
      this.saveEditor();
    } else {
      this.lua.saveFiles();
      this.printLine(`Saved all files to browser storage.`, 1, 15);
    }
  }

  async handleMouseClick(col, row) {
    if (row === 0 && col >= 0 && col <= 6) {
      this.fileMenuOpen = !this.fileMenuOpen;
      return;
    }

    if (this.fileMenuOpen) {
      const items = this.getFileMenuItems();
      const menuWidth = 24;
      const menuTop = 1;
      const menuBottom = menuTop + items.length + 1;
      if (col >= 0 && col < menuWidth && row > menuTop && row < menuBottom) {
        const idx = row - menuTop - 1;
        if (items[idx]) {
          this.fileMenuOpen = false;
          items[idx].action();
          return;
        }
      }
      this.fileMenuOpen = false;
      return;
    }

    if (this.mode === 'SHELL' && col >= 57 && col <= 78) {
      if (row === 4) {
        this.inputBuffer = 'CREATE ';
        this.cursorPos = this.inputBuffer.length;
        return;
      }
      if (row === 6) {
        this.inputBuffer = 'EDIT ';
        this.cursorPos = this.inputBuffer.length;
        return;
      }
      if (row === 8) {
        this.inputBuffer = 'EXECUTE ';
        this.cursorPos = this.inputBuffer.length;
        return;
      }
      if (row === 10) {
        this.inputBuffer = 'DELETE ';
        this.cursorPos = this.inputBuffer.length;
        return;
      }
      const files = Object.keys(this.lua.files).sort();
      const fileIdx = row - 14;
      if (fileIdx >= 0 && fileIdx < Math.min(files.length, 23)) {
        const target = files[fileIdx];
        this.inputBuffer = `EXECUTE ${target}`;
        this.cursorPos = this.inputBuffer.length;
      }
    }

    if (this.mode === 'EDITOR' && (row === 57 || row === 58)) {
      if (col < 20) {
        this.saveEditor();
      } else if (col >= 20 && col < 42) {
        this.saveEditor();
        const f = this.edFilename;
        this.mode = 'SHELL';
        await this.lua.cmdExecute(f);
      } else if (col >= 55) {
        this.saveEditor();
        this.mode = 'SHELL';
      }
    }
  }

  /* ==========================================================================
     Shell Keyboard Handling
     ========================================================================== */

  async handleShellKey(e) {
    if (this.busy) return;

    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      this.clearScreen();
      return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      this.printLine(`${this.promptText}${this.inputBuffer}^C`, 8, 15);
      this.inputBuffer = '';
      this.cursorPos = 0;
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const code = this.inputBuffer;
      this.printLine(`${this.promptText}${code}`, 1, 15);
      if (code.trim() && this.history[this.history.length - 1] !== code) {
        this.history.push(code);
      }
      this.historyIndex = this.history.length;
      this.inputBuffer = '';
      this.cursorPos = 0;
      this.scrollOffset = 0;

      this.busy = true;
      await this.lua.executeCommandOrLua(code);
      this.busy = false;
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.cursorPos > 0) {
        this.inputBuffer =
          this.inputBuffer.slice(0, this.cursorPos - 1) +
          this.inputBuffer.slice(this.cursorPos);
        this.cursorPos--;
      }
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      if (this.cursorPos < this.inputBuffer.length) {
        this.inputBuffer =
          this.inputBuffer.slice(0, this.cursorPos) +
          this.inputBuffer.slice(this.cursorPos + 1);
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (this.cursorPos > 0) this.cursorPos--;
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (this.cursorPos < this.inputBuffer.length) this.cursorPos++;
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      this.cursorPos = 0;
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      this.cursorPos = this.inputBuffer.length;
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.inputBuffer = this.history[this.historyIndex] || '';
        this.cursorPos = this.inputBuffer.length;
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex < this.history.length) {
        this.historyIndex++;
        this.inputBuffer = this.history[this.historyIndex] || '';
        this.cursorPos = this.inputBuffer.length;
      }
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      this.inputBuffer =
        this.inputBuffer.slice(0, this.cursorPos) +
        e.key +
        this.inputBuffer.slice(this.cursorPos);
      this.cursorPos++;
      this.scrollOffset = 0;
    }
  }

  /* ==========================================================================
     Editor Mode (Syntax Highlighting + Nano & VS Code Controls)
     ========================================================================== */

  openEditor(filename) {
    this.edFilename = this.lua.normalizeFilename(filename);
    const existing = this.lua.files[this.edFilename];
    this.edLines = existing !== undefined
      ? existing.replace(/\r\n/g, '\n').split('\n')
      : [`-- ${this.edFilename}`, ''];
    if (this.edLines.length === 0) this.edLines = [''];
    this.edRow = 0;
    this.edCol = 0;
    this.edScrollY = 0;
    this.edStatus = `[ Editing ${this.edFilename} ]`;
    this.mode = 'EDITOR';
  }

  saveEditor() {
    this.lua.files[this.edFilename] = this.edLines.join('\n');
    this.lua.saveFiles();
    this.edStatus = `[ Wrote ${this.edLines.length} lines to ${this.edFilename} (Saved in Browser) ]`;
  }

  async handleEditorKey(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'o')) {
      e.preventDefault();
      this.saveEditor();
      return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.edClipboard = this.edLines[this.edRow] || '';
      if (this.edLines.length > 1) {
        this.edLines.splice(this.edRow, 1);
        if (this.edRow >= this.edLines.length) this.edRow = this.edLines.length - 1;
      } else {
        this.edLines[0] = '';
      }
      this.edCol = 0;
      this.edStatus = `[ Cut 1 line ]`;
      return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      if (this.edClipboard !== '') {
        this.edLines.splice(this.edRow, 0, this.edClipboard);
        this.edRow++;
        this.edStatus = `[ Pasted line ]`;
      }
      return;
    }

    if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r')) {
      e.preventDefault();
      this.saveEditor();
      const target = this.edFilename;
      this.mode = 'SHELL';
      this.printLine(`@TEEDTHETERRIBLE > EXECUTE ${target}`, 1, 15);
      await this.lua.cmdExecute(target);
      return;
    }

    if (e.key === 'Escape' || (e.ctrlKey && e.key.toLowerCase() === 'x')) {
      e.preventDefault();
      this.saveEditor();
      this.mode = 'SHELL';
      this.printLine(`Saved ${this.edFilename}.`, 1, 15);
      return;
    }

    const curLine = this.edLines[this.edRow] || '';

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.edRow > 0) {
        this.edRow--;
        this.edCol = Math.min(this.edCol, this.edLines[this.edRow].length);
        if (this.edRow < this.edScrollY) this.edScrollY = this.edRow;
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.edRow < this.edLines.length - 1) {
        this.edRow++;
        this.edCol = Math.min(this.edCol, this.edLines[this.edRow].length);
        if (this.edRow >= this.edScrollY + 53) this.edScrollY = this.edRow - 52;
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (this.edCol > 0) {
        this.edCol--;
      } else if (this.edRow > 0) {
        this.edRow--;
        this.edCol = this.edLines[this.edRow].length;
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (this.edCol < curLine.length) {
        this.edCol++;
      } else if (this.edRow < this.edLines.length - 1) {
        this.edRow++;
        this.edCol = 0;
      }
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      this.edCol = 0;
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      this.edCol = curLine.length;
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const before = curLine.slice(0, this.edCol);
      const after = curLine.slice(this.edCol);
      const indentMatch = before.match(/^(\s*)/);
      const baseIndent = indentMatch ? indentMatch[1] : '';
      const extraIndent = /\b(then|do|function|repeat)\s*$/.test(before.trim()) ? '  ' : '';
      const nextIndent = baseIndent + extraIndent;

      this.edLines[this.edRow] = before;
      this.edLines.splice(this.edRow + 1, 0, nextIndent + after);
      this.edRow++;
      this.edCol = nextIndent.length;
      if (this.edRow >= this.edScrollY + 53) this.edScrollY = this.edRow - 52;
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.edCol > 0) {
        this.edLines[this.edRow] = curLine.slice(0, this.edCol - 1) + curLine.slice(this.edCol);
        this.edCol--;
      } else if (this.edRow > 0) {
        const prevLen = this.edLines[this.edRow - 1].length;
        this.edLines[this.edRow - 1] += curLine;
        this.edLines.splice(this.edRow, 1);
        this.edRow--;
        this.edCol = prevLen;
      }
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      if (this.edCol < curLine.length) {
        this.edLines[this.edRow] = curLine.slice(0, this.edCol) + curLine.slice(this.edCol + 1);
      } else if (this.edRow < this.edLines.length - 1) {
        this.edLines[this.edRow] += this.edLines[this.edRow + 1];
        this.edLines.splice(this.edRow + 1, 1);
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      this.edLines[this.edRow] = curLine.slice(0, this.edCol) + '  ' + curLine.slice(this.edCol);
      this.edCol += 2;
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      this.edLines[this.edRow] = curLine.slice(0, this.edCol) + e.key + curLine.slice(this.edCol);
      this.edCol++;
    }
  }

  /* ==========================================================================
     Terminal Output & Graphics Primitives
     ========================================================================== */

  printLine(text, fg = this.defaultFg, bg = this.defaultBg) {
    const rawLines = String(text ?? '').split('\n');
    const maxInnerCols = 54;

    for (const raw of rawLines) {
      if (raw.length === 0) {
        this.lines.push({ text: '', fg, bg });
        continue;
      }
      for (let i = 0; i < raw.length; i += maxInnerCols) {
        this.lines.push({
          text: raw.slice(i, i + maxInnerCols),
          fg,
          bg
        });
      }
    }

    if (this.lines.length > 500) {
      this.lines = this.lines.slice(this.lines.length - 500);
    }
  }

  clearScreen() {
    this.lines = [];
    this.scrollOffset = 0;
    this.clearGraphicsLayer();
  }

  clearGraphicsLayer() {
    this.gfxBuffer.fill(0xFF);
  }

  plotPixel(x, y, color) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.gfxBuffer[y * this.width + x] = color & 15;
  }

  drawLine(x0, y0, x1, y1, color) {
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    while (true) {
      this.plotPixel(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  drawRect(x, y, w, h, color, fill = false) {
    if (fill) {
      for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) {
          this.plotPixel(px, py, color);
        }
      }
    } else {
      this.drawLine(x, y, x + w - 1, y, color);
      this.drawLine(x, y + h - 1, x + w - 1, y + h - 1, color);
      this.drawLine(x, y, x, y + h - 1, color);
      this.drawLine(x + w - 1, y, x + w - 1, y + h - 1, color);
    }
  }

  drawCircle(cx, cy, r, color) {
    let x = r;
    let y = 0;
    let err = 1 - x;
    while (x >= y) {
      this.plotPixel(cx + x, cy + y, color);
      this.plotPixel(cx + y, cy + x, color);
      this.plotPixel(cx - y, cy + x, color);
      this.plotPixel(cx - x, cy + y, color);
      this.plotPixel(cx - x, cy - y, color);
      this.plotPixel(cx - y, cy - x, color);
      this.plotPixel(cx + y, cy - x, color);
      this.plotPixel(cx + x, cy - y, color);
      y++;
      if (err < 0) {
        err += 2 * y + 1;
      } else {
        x--;
        err += 2 * (y - x + 1);
      }
    }
  }

  drawPixelString(px, py, str, fg = 0, bg = 15) {
    for (let i = 0; i < str.length; i++) {
      const glyph = window.getGlyph8x8(str[i]);
      for (let row = 0; row < 8; row++) {
        const bits = glyph[row];
        for (let col = 0; col < 8; col++) {
          const on = (bits & (0x80 >> col)) !== 0;
          this.plotPixel(px + i * 8 + col, py + row, on ? fg : bg);
        }
      }
    }
  }

  /* ==========================================================================
     Direct Framebuffer Pixel Helper
     ========================================================================== */

  setFbPixel(x, y, colorIdx, isStroke = true) {
    const px = Math.trunc(x);
    const py = Math.trunc(y);
    if (px < 0 || px >= this.width || py < 0 || py >= this.height) return;
    const rgb = window.VGA_PALETTE[colorIdx & 15];
    const maskIdx = py * this.width + px;
    if (isStroke) this.fgMask[maskIdx] = 1;
    const offset = maskIdx * 4;
    this.pixels[offset] = rgb[0];
    this.pixels[offset + 1] = rgb[1];
    this.pixels[offset + 2] = rgb[2];
    this.pixels[offset + 3] = 255;
  }

  /* ==========================================================================
     Pixel Framebuffer Rasterizer (80x60 8x8 Cells)
     ========================================================================== */

  putCell(col, row, ch, fg = 0, bg = 15) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    const glyph = window.getGlyph8x8(ch);
    const fgRGB = window.VGA_PALETTE[fg & 15];
    const bgRGB = window.VGA_PALETTE[bg & 15];
    const baseX = col * 8;
    const baseY = row * 8;

    for (let gy = 0; gy < 8; gy++) {
      const rowByte = glyph[gy];
      const py = baseY + gy;
      let maskIdx = py * this.width + baseX;
      let pixelOffset = maskIdx * 4;
      for (let gx = 0; gx < 8; gx++) {
        const bit = (rowByte & (0x80 >> gx)) !== 0;
        this.fgMask[maskIdx++] = bit ? 1 : 0;
        const rgb = bit ? fgRGB : bgRGB;
        this.pixels[pixelOffset] = rgb[0];
        this.pixels[pixelOffset + 1] = rgb[1];
        this.pixels[pixelOffset + 2] = rgb[2];
        this.pixels[pixelOffset + 3] = 255;
        pixelOffset += 4;
      }
    }
  }

  putString(col, row, str, fg = 0, bg = 15, maxLen = 80) {
    const s = String(str);
    for (let i = 0; i < Math.min(s.length, maxLen); i++) {
      if (col + i >= this.cols) break;
      this.putCell(col + i, row, s[i], fg, bg);
    }
  }

  fillBackground(bg = 15) {
    const rgb = window.VGA_PALETTE[bg & 15];
    this.fgMask.fill(0);
    for (let i = 0; i < this.pixels.length; i += 4) {
      this.pixels[i] = rgb[0];
      this.pixels[i + 1] = rgb[1];
      this.pixels[i + 2] = rgb[2];
      this.pixels[i + 3] = 255;
    }
  }

  /* ==========================================================================
     Top Bar (Only File Dropdown, Name, and Time)
     ========================================================================== */

  renderTopBar() {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    this.putString(0, 0, ' '.repeat(80), 15, 1, 80);

    const fileHovered = this.mouseRow === 0 && this.mouseCol >= 0 && this.mouseCol <= 6;
    const fileFg = (this.fileMenuOpen || fileHovered) ? 1 : 15;
    const fileBg = (this.fileMenuOpen || fileHovered) ? 15 : 1;
    this.putString(0, 0, ' File ', fileFg, fileBg);

    const name = 'FourthTemple';
    this.putString(Math.floor((80 - name.length) / 2), 0, name, 15, 1);

    this.putString(80 - timeStr.length - 1, 0, timeStr, 15, 1);
  }

  /* ==========================================================================
     Window Border with 60 FPS Pixel-Scrolling Top Marquee
     ========================================================================== */

  renderWindowBorder() {
    this.putCell(0, 1, '╔', 1, 15);
    for (let c = 1; c < 79; c++) this.putCell(c, 1, '═', 1, 15);
    this.putCell(79, 1, '╗', 1, 15);

    for (let r = 2; r <= 58; r++) {
      this.putCell(0, r, '║', 1, 15);
      this.putCell(79, r, '║', 1, 15);
    }

    this.putCell(0, 59, '╚', 1, 15);
    for (let c = 1; c < 79; c++) this.putCell(c, 59, '═', 1, 15);
    this.putCell(79, 59, '╝', 1, 15);

    const unit = ' DIVINE FUCKING INTELLECT ';
    const unitPxLen = unit.length * 8;
    const boxWidthCells = 28;
    const boxStartCol = Math.floor((80 - boxWidthCells) / 2);

    this.putCell(boxStartCol - 1, 1, '[', 1, 15);
    this.putCell(boxStartCol + boxWidthCells, 1, ']', 1, 15);

    const startPx = boxStartCol * 8;
    const widthPx = boxWidthCells * 8;
    const baseY = 1 * 8;

    const fgRGB = window.VGA_PALETTE[15];
    const bgRGB = window.VGA_PALETTE[1];

    for (let x = 0; x < widthPx; x++) {
      const srcPx = (this.spinPixelOffset + x) % unitPxLen;
      const charIdx = Math.floor(srcPx / 8);
      const glyphCol = srcPx % 8;
      const glyph = window.getGlyph8x8(unit[charIdx]);
      const screenX = startPx + x;

      for (let gy = 0; gy < 8; gy++) {
        const bit = (glyph[gy] & (0x80 >> glyphCol)) !== 0;
        const screenY = baseY + gy;
        const maskIdx = screenY * this.width + screenX;
        this.fgMask[maskIdx] = bit ? 1 : 0;
        const rgb = bit ? fgRGB : bgRGB;
        const offset = maskIdx * 4;
        this.pixels[offset] = rgb[0];
        this.pixels[offset + 1] = rgb[1];
        this.pixels[offset + 2] = rgb[2];
        this.pixels[offset + 3] = 255;
      }
    }
  }

  /* ==========================================================================
     60 FPS 3D Spinning Sphere (with 3D Inner White Ball) + 3D Rotating Ring
     ========================================================================== */

  renderLuaCircle() {
    const cx = 542;
    const cy = 402;
    const planetRadius = 26;
    const orbitRadius = 46;
    const fov = 160;
    const camDist = 110;

    // 3D rotation angles for the ring & sphere
    const rxAngle = this.orbitAngle * 0.75;
    const ryAngle = this.orbitAngle * 1.1;
    const rzAngle = this.orbitAngle * 0.45;

    const sinX = Math.sin(rxAngle), cosX = Math.cos(rxAngle);
    const sinY = Math.sin(ryAngle), cosY = Math.cos(ryAngle);
    const sinZ = Math.sin(rzAngle), cosZ = Math.cos(rzAngle);

    const rotate3D = (vx, vy, vz) => {
      // Rotate around X
      const y1 = vy * cosX - vz * sinX;
      const z1 = vy * sinX + vz * cosX;
      const x1 = vx;
      // Rotate around Y
      const x2 = x1 * cosY + z1 * sinY;
      const z2 = -x1 * sinY + z1 * cosY;
      const y2 = y1;
      // Rotate around Z
      const x3 = x2 * cosZ - y2 * sinZ;
      const y3 = x2 * sinZ + y2 * cosZ;
      const z3 = z2;

      const scale = fov / (fov + z3 + camDist);
      return {
        x: cx + x3 * scale,
        y: cy + y3 * scale,
        z: z3,
        nx: x3,
        ny: y3,
        nz: z3
      };
    };

    const drawRing3D = (onlyBehindSphere) => {
      const steps = 84;
      for (let s = 0; s < steps; s++) {
        // Dashed 3D ring segments
        if (s % 3 === 0) continue;
        const theta = (s / steps) * Math.PI * 2;
        const p = rotate3D(
          Math.cos(theta) * orbitRadius,
          Math.sin(theta) * orbitRadius,
          0
        );
        // Positive z is further away (behind sphere), negative z is closer (in front of sphere)
        if (onlyBehindSphere && p.z < 0) continue;
        if (!onlyBehindSphere && p.z >= 0) continue;

        const color = p.z < 0 ? 1 : 7;
        this.setFbPixel(p.x, p.y, color, true);
        if (p.z < 0) {
          this.setFbPixel(p.x + 1, p.y, color, true);
        }
      }
    };

    // Orbiting 3D Moon ball traveling along the 3D rotating ring
    const moonTheta = this.orbitAngle * 1.6;
    const moonPos = rotate3D(
      Math.cos(moonTheta) * orbitRadius,
      Math.sin(moonTheta) * orbitRadius,
      0
    );

    const drawOrbitingMoon = () => {
      const mR = Math.max(3, Math.round(5 * (fov / (fov + moonPos.z + camDist))));
      for (let dy = -mR; dy <= mR; dy++) {
        for (let dx = -mR; dx <= mR; dx++) {
          const d2 = dx * dx + dy * dy;
          if (d2 <= mR * mR) {
            const nz = Math.sqrt(Math.max(0, mR * mR - d2)) / mR;
            const light = (-dx / mR) * 0.4 + (-dy / mR) * 0.4 + nz * 0.8;
            const col = light > 0.65 ? 11 : (light > 0.25 ? 9 : 1);
            this.setFbPixel(moonPos.x + dx, moonPos.y + dy, col, false);
          }
        }
      }
    };

    // 1. Draw back half of the 3D rotating ring & moon (when behind the main sphere)
    drawRing3D(true);
    if (moonPos.z >= 0) drawOrbitingMoon();

    // 2. 3D Rotating Main Sphere + 3D Inner White Ball/Crater on the sphere's 3D surface
    // Unit vector of the inner white ball rotating in 3D
    const whiteVecRaw = rotate3D(0.55, -0.45, -0.70);
    const wLen = Math.hypot(whiteVecRaw.nx, whiteVecRaw.ny, whiteVecRaw.nz) || 1;
    const wx = whiteVecRaw.nx / wLen;
    const wy = whiteVecRaw.ny / wLen;
    const wz = -whiteVecRaw.nz / wLen; // +wz faces viewer

    for (let dy = -planetRadius; dy <= planetRadius; dy++) {
      for (let dx = -planetRadius; dx <= planetRadius; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 <= planetRadius * planetRadius) {
          // True 3D spherical normal (nx, ny, nz) at this pixel
          const nx = dx / planetRadius;
          const ny = dy / planetRadius;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

          // 3D dot product with the rotating inner white ball direction
          const dotWhite = nx * wx + ny * wy + nz * wz;

          if (dotWhite > 0.86) {
            // Inside the 3D white ball/crater (curves naturally across the 3D sphere!)
            // Add 3D inner depth shading near the rim of the white ball
            const innerColor = dotWhite > 0.90 ? 15 : 7;
            this.setFbPixel(cx + dx, cy + dy, innerColor, false);
          } else if (d2 >= (planetRadius - 1.4) * (planetRadius - 1.4)) {
            // Outer sphere silhouette edge
            this.setFbPixel(cx + dx, cy + dy, 8, true);
          } else {
            // 3D directional lighting + rotating 3D longitude/latitude grid cues on the main sphere
            const light = (-nx * 0.35) + (-ny * 0.35) + (nz * 0.85);
            let sphereColor = 1; // Dark Blue core
            if (light > 0.88 && ((dx + dy) & 1) === 0) {
              sphereColor = 9; // 3D specular highlight in Light Blue
            } else if (light < 0.38 && ((dx ^ dy) & 1) === 0) {
              sphereColor = 8; // 3D shadow limb in Blue-Grey
            }
            this.setFbPixel(cx + dx, cy + dy, sphereColor, false);
          }
        }
      }
    }

    // 3. Draw front half of the 3D rotating ring & moon (when in front of the main sphere)
    drawRing3D(false);
    if (moonPos.z < 0) drawOrbitingMoon();
  }

  /* ==========================================================================
     Right-Side Flashing Opposite-Color Commands (CREATE, EDIT, EXECUTE, DELETE)
     ========================================================================== */

  renderRightCommandPanel() {
    for (let r = 2; r <= 58; r++) {
      this.putCell(56, r, '│', 1, 15);
    }

    const cmd1Fg = this.flashPhase ? 15 : 1;
    const cmd1Bg = this.flashPhase ? 1 : 15;

    const cmd2Fg = this.flashPhase ? 1 : 9;
    const cmd2Bg = this.flashPhase ? 9 : 15;

    const cmd3Fg = this.flashPhase ? 15 : 8;
    const cmd3Bg = this.flashPhase ? 8 : 15;

    const cmd4Fg = this.flashPhase ? 1 : 15;
    const cmd4Bg = this.flashPhase ? 7 : 8;

    this.putString(58, 2, 'COMMANDS', 1, 15);

    this.putString(58, 4, ' CREATE <name>      ', cmd1Fg, cmd1Bg, 20);
    this.putString(58, 6, ' EDIT <name>        ', cmd2Fg, cmd2Bg, 20);
    this.putString(58, 8, ' EXECUTE <name>     ', cmd3Fg, cmd3Bg, 20);
    this.putString(58, 10, ' DELETE <name>      ', cmd4Fg, cmd4Bg, 20);

    this.putString(58, 12, '────────────────────', 7, 15, 20);
    this.putString(58, 13, 'FILES', 1, 15);

    const files = Object.keys(this.lua.files).sort();
    for (let i = 0; i < Math.min(files.length, 20); i++) {
      const f = files[i];
      const inv = this.flashPhase ? (i % 2 === 0) : (i % 2 !== 0);
      const fFg = inv ? 15 : 1;
      const fBg = inv ? 8 : 7;
      this.putString(58, 14 + i, ` ${f.padEnd(18, ' ')} `, fFg, fBg, 20);
    }

    // Render the 60 FPS Spinning Lua Circle & Ring in the bottom-right corner
    this.renderLuaCircle();
  }

  /* ==========================================================================
     Shell Screen Renderer
     ========================================================================== */

  renderShellFrame() {
    this.fillBackground(this.defaultBg);
    this.renderTopBar();
    this.renderWindowBorder();
    this.renderRightCommandPanel();

    const paneWidth = 54;
    const fullPrompt = this.promptText + this.inputBuffer;
    const promptChunks = [];
    for (let i = 0; i < Math.max(1, fullPrompt.length); i += paneWidth) {
      promptChunks.push(fullPrompt.slice(i, i + paneWidth));
    }

    const availRows = 57;
    const maxHistoryRows = Math.max(1, availRows - promptChunks.length);
    const endIdx = Math.max(0, this.lines.length - this.scrollOffset);
    const startIdx = Math.max(0, endIdx - maxHistoryRows);
    const visibleLines = this.lines.slice(startIdx, endIdx);

    let screenRow = 2;
    for (const lineObj of visibleLines) {
      this.putString(1, screenRow, lineObj.text, lineObj.fg, lineObj.bg, paneWidth);
      screenRow++;
    }

    if (this.scrollOffset === 0) {
      const promptStartRow = screenRow;
      for (let cIdx = 0; cIdx < promptChunks.length; cIdx++) {
        if (promptStartRow + cIdx > 58) break;
        const textChunk = promptChunks[cIdx];
        for (let i = 0; i < textChunk.length; i++) {
          const globalPos = cIdx * paneWidth + i;
          const isPromptPart = globalPos < this.promptText.length;
          this.putCell(1 + i, promptStartRow + cIdx, textChunk[i], isPromptPart ? 1 : 0, this.defaultBg);
        }
      }

      if (this.cursorBlink && !this.busy) {
        const totalCursorIdx = this.promptText.length + this.cursorPos;
        const cRow = promptStartRow + Math.floor(totalCursorIdx / paneWidth);
        const cCol = 1 + (totalCursorIdx % paneWidth);
        if (cRow <= 58 && cCol <= 55) {
          const chUnder = this.inputBuffer[this.cursorPos] || ' ';
          this.putCell(cCol, cRow, chUnder, 15, 1);
        }
      }
    }

    // Composite pixel graphics layer
    for (let i = 0; i < this.gfxBuffer.length; i++) {
      const c = this.gfxBuffer[i];
      if (c !== 0xFF) {
        const rgb = window.VGA_PALETTE[c & 15];
        const pIdx = i * 4;
        this.pixels[pIdx] = rgb[0];
        this.pixels[pIdx + 1] = rgb[1];
        this.pixels[pIdx + 2] = rgb[2];
        this.pixels[pIdx + 3] = 255;
      }
    }
  }

  /* ==========================================================================
     Editor Screen Renderer (Full Syntax Highlighting + Blue/Grey Chrome)
     ========================================================================== */

  colorizeLuaLine(lineText) {
    const chars = [];
    let i = 0;
    while (i < lineText.length) {
      const ch = lineText[i];
      const next = lineText[i + 1];

      if (ch === '-' && next === '-') {
        while (i < lineText.length) {
          chars.push({ ch: lineText[i++], fg: 2 });
        }
        break;
      }

      if (ch === '"' || ch === "'") {
        const q = ch;
        chars.push({ ch: lineText[i++], fg: 4 });
        while (i < lineText.length && lineText[i] !== q) {
          if (lineText[i] === '\\' && i + 1 < lineText.length) {
            chars.push({ ch: lineText[i++], fg: 6 });
          }
          chars.push({ ch: lineText[i++], fg: 4 });
        }
        if (i < lineText.length) chars.push({ ch: lineText[i++], fg: 4 });
        continue;
      }

      if (/[0-9]/.test(ch)) {
        while (i < lineText.length && /[0-9.xXa-fA-F]/.test(lineText[i])) {
          chars.push({ ch: lineText[i++], fg: 5 });
        }
        continue;
      }

      if (/[a-zA-Z_]/.test(ch)) {
        let word = '';
        while (i < lineText.length && /[a-zA-Z0-9_]/.test(lineText[i])) {
          word += lineText[i++];
        }
        let fg = 0;
        if (LUA_KEYWORDS.has(word)) fg = 1;
        else if (LUA_BUILTINS.has(word)) fg = 3;
        for (const wc of word) chars.push({ ch: wc, fg });
        continue;
      }

      chars.push({ ch: lineText[i++], fg: 8 });
    }
    return chars;
  }

  renderEditorFrame() {
    this.fillBackground(15);
    this.renderTopBar();
    this.renderWindowBorder();

    this.putString(1, 2, ' '.repeat(78), 15, 8, 78);
    const tabTitle = ` ✎ ${this.edFilename} `;
    this.putString(1, 2, tabTitle, 15, 1);
    this.putString(1 + tabTitle.length + 1, 2, this.edStatus, 15, 8, 76 - tabTitle.length);

    const visibleRows = 53;
    for (let i = 0; i < visibleRows; i++) {
      const lineIdx = this.edScrollY + i;
      const screenRow = 3 + i;
      const isCurrentRow = lineIdx === this.edRow;

      if (lineIdx >= this.edLines.length) {
        this.putString(1, screenRow, '   ~', 7, 15);
        continue;
      }

      const numStr = String(lineIdx + 1).padStart(3, ' ') + '│';
      this.putString(1, screenRow, numStr, isCurrentRow ? 1 : 8, 15);

      const colored = this.colorizeLuaLine(this.edLines[lineIdx]);
      for (let c = 0; c < Math.min(colored.length, 73); c++) {
        this.putCell(5 + c, screenRow, colored[c].ch, colored[c].fg, 15);
      }
    }

    if (this.cursorBlink) {
      const curScreenRow = 3 + (this.edRow - this.edScrollY);
      const curScreenCol = 5 + Math.min(73, this.edCol);
      if (curScreenRow >= 3 && curScreenRow <= 55) {
        const ch = (this.edLines[this.edRow] || '')[this.edCol] || ' ';
        this.putCell(curScreenCol, curScreenRow, ch, 15, 1);
      }
    }

    const posInfo = ` Ln ${this.edRow + 1}, Col ${this.edCol + 1} | Lua | UTF-8 `.padEnd(78, ' ');
    this.putString(1, 56, posInfo, 15, 1, 78);

    this.putString(1, 57, ' '.repeat(78), 1, 7, 78);
    this.putString(1, 58, ' '.repeat(78), 1, 7, 78);

    this.putString(2, 57, '^S', 15, 1);
    this.putString(5, 57, 'Save Browser', 0, 7);
    this.putString(22, 57, 'F5', 15, 1);
    this.putString(25, 57, 'Execute Lua', 0, 7);
    this.putString(42, 57, '^K', 15, 1);
    this.putString(45, 57, 'Cut Line', 0, 7);
    this.putString(58, 57, 'File', 15, 1);
    this.putString(63, 57, 'Top-Left Menu', 0, 7);

    this.putString(2, 58, '^O', 15, 1);
    this.putString(5, 58, 'WriteOut', 0, 7);
    this.putString(22, 58, '^R', 15, 1);
    this.putString(25, 58, 'Compile+Run', 0, 7);
    this.putString(42, 58, '^U', 15, 1);
    this.putString(45, 58, 'UnCut Line', 0, 7);
    this.putString(58, 58, '^X', 15, 1);
    this.putString(61, 58, 'Save & Exit', 0, 7);
  }

  /* ==========================================================================
     Top-Left File Dropdown Menu Overlay
     ========================================================================== */

  renderFileMenuDropdown() {
    if (!this.fileMenuOpen) return;

    const items = this.getFileMenuItems();
    const w = 24;
    const h = items.length + 2;

    this.putCell(0, 1, '┌', 15, 1);
    for (let c = 1; c < w - 1; c++) this.putCell(c, 1, '─', 15, 1);
    this.putCell(w - 1, 1, '┐', 15, 1);

    for (let i = 0; i < items.length; i++) {
      const r = 2 + i;
      const hovered = this.mouseRow === r && this.mouseCol >= 0 && this.mouseCol < w;
      const fg = hovered ? 1 : 15;
      const bg = hovered ? 11 : 1;
      this.putCell(0, r, '│', 15, 1);
      this.putString(1, r, ` ${items[i].label.padEnd(w - 3, ' ')}`, fg, bg, w - 2);
      this.putCell(w - 1, r, '│', 15, 1);
    }

    const botRow = 1 + h - 1;
    this.putCell(0, botRow, '└', 15, 1);
    for (let c = 1; c < w - 1; c++) this.putCell(c, botRow, '─', 15, 1);
    this.putCell(w - 1, botRow, '┘', 15, 1);
  }

  /* ==========================================================================
     TempleOS Grey Arrow Mouse Cursor with Hover Invert Effect
     ========================================================================== */

  renderTempleMouseCursor() {
    for (let sy = 0; sy < TEMPLE_ARROW_CURSOR.length; sy++) {
      const row = TEMPLE_ARROW_CURSOR[sy];
      for (let sx = 0; sx < row.length; sx++) {
        const val = row[sx];
        if (val === 0) continue;
        const px = this.mouseX + sx;
        const py = this.mouseY + sy;
        if (px < 0 || px >= this.width || py < 0 || py >= this.height) continue;

        const maskIdx = py * this.width + px;
        const offset = maskIdx * 4;
        const r = this.pixels[offset];
        const g = this.pixels[offset + 1];
        const b = this.pixels[offset + 2];

        if (this.fgMask[maskIdx] === 1) {
          this.pixels[offset] = 255 - r;
          this.pixels[offset + 1] = 255 - g;
          this.pixels[offset + 2] = 255 - b;
          this.pixels[offset + 3] = 255;
        } else if (val === 1) {
          const isDarkBg = (r + g + b) < 300;
          this.pixels[offset] = isDarkBg ? 210 : 74;
          this.pixels[offset + 1] = isDarkBg ? 218 : 93;
          this.pixels[offset + 2] = isDarkBg ? 228 : 115;
          this.pixels[offset + 3] = 255;
        } else {
          const invR = 255 - r;
          const invG = 255 - g;
          const invB = 255 - b;
          this.pixels[offset] = Math.round(155 * 0.65 + invR * 0.35);
          this.pixels[offset + 1] = Math.round(162 * 0.65 + invG * 0.35);
          this.pixels[offset + 2] = Math.round(172 * 0.65 + invB * 0.35);
          this.pixels[offset + 3] = 255;
        }
      }
    }
  }

  /* ==========================================================================
     Main 60fps Framebuffer Loop
     ========================================================================== */

  startRenderLoop() {
    setInterval(() => {
      this.cursorBlink = !this.cursorBlink;
      this.flashPhase = !this.flashPhase;
    }, 420);

    const tick = () => {
      this.frameCount++;

      // Advance top marquee by 1 pixel per 60fps frame
      this.spinPixelOffset = (this.spinPixelOffset + 1) % (23 * 8);

      // Advance Lua circle & orbital ring rotation at 60fps
      this.orbitAngle += 0.035;

      if (this.mode === 'EDITOR') {
        this.renderEditorFrame();
      } else {
        this.renderShellFrame();
      }
      this.renderFileMenuDropdown();
      this.renderTempleMouseCursor();
      this.ctx.putImageData(this.imageData, 0, 0);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.temple = new TempleTerminal();
});
