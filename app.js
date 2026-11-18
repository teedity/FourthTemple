const TEMPLE_ARROW_CURSOR = [
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
  [2, 2, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [2, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0],
  [2, 1, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0],
  [2, 1, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0],
  [2, 1, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2]
];

const LUA_CONTROL_KEYWORDS = new Set([
  'break', 'do', 'else', 'elseif', 'end', 'for', 'if', 'in',
  'repeat', 'return', 'then', 'until', 'while'
]);

const LUA_STORAGE_KEYWORDS = new Set([
  'local', 'function', 'and', 'or', 'not'
]);

const LUA_CONSTANT_KEYWORDS = new Set([
  'true', 'false', 'nil', 'self', '_G', '_VERSION'
]);

const LUA_KEYWORDS = new Set([
  ...LUA_CONTROL_KEYWORDS,
  ...LUA_STORAGE_KEYWORDS,
  ...LUA_CONSTANT_KEYWORDS
]);

const LUA_BUILTINS = new Set([
  'io', 'string', 'table', 'math', 'os', 'coroutine', 'utf8', 'bit32',
  'debug', 'package', 'print', 'tostring', 'tonumber', 'type', 'pairs',
  'ipairs', 'next', 'select', 'unpack', 'pcall', 'xpcall', 'assert',
  'error', 'setmetatable', 'getmetatable', 'rawget', 'rawset', 'rawequal',
  'rawlen', 'collectgarbage', 'load', 'loadstring', 'loadfile', 'dofile',
  'require', 'socket', 'gfx', 'read', 'write', 'open', 'lines', 'flush'
]);

const AUTO_CLOSE_PAIRS = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'"
};

const CLOSING_CHARS = new Set([')', ']', '}', '"', "'"]);

const VSCODE_LUA_SUGGESTIONS = {
  global: [
    { label: 'local', insert: 'local ', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'function', insert: 'function ', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'if', insert: 'if ', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'then', insert: 'then', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'elseif', insert: 'elseif ', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'else', insert: 'else', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'end', insert: 'end', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'for', insert: 'for ', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'in', insert: 'in ', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'while', insert: 'while ', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'do', insert: 'do', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'repeat', insert: 'repeat', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'until', insert: 'until ', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'return', insert: 'return ', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'break', insert: 'break', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'and', insert: 'and ', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'or', insert: 'or ', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'not', insert: 'not ', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'true', insert: 'true', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'false', insert: 'false', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'nil', insert: 'nil', kind: 'kw', cursorOffset: 0, rank: 2 },
    { label: 'print', insert: 'print()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'io', insert: 'io', kind: 'mod', cursorOffset: 0, rank: 1 },
    { label: 'string', insert: 'string', kind: 'mod', cursorOffset: 0, rank: 1 },
    { label: 'table', insert: 'table', kind: 'mod', cursorOffset: 0, rank: 1 },
    { label: 'math', insert: 'math', kind: 'mod', cursorOffset: 0, rank: 1 },
    { label: 'os', insert: 'os', kind: 'mod', cursorOffset: 0, rank: 1 },
    { label: 'coroutine', insert: 'coroutine', kind: 'mod', cursorOffset: 0, rank: 1 },
    { label: 'utf8', insert: 'utf8', kind: 'mod', cursorOffset: 0, rank: 1 },
    { label: 'bit32', insert: 'bit32', kind: 'mod', cursorOffset: 0, rank: 1 },
    { label: 'debug', insert: 'debug', kind: 'mod', cursorOffset: 0, rank: 1 },
    { label: 'tonumber', insert: 'tonumber()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'tostring', insert: 'tostring()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'type', insert: 'type()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'pairs', insert: 'pairs()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'ipairs', insert: 'ipairs()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'next', insert: 'next()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'select', insert: 'select()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'unpack', insert: 'unpack()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'pcall', insert: 'pcall()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'xpcall', insert: 'xpcall()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'assert', insert: 'assert()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'error', insert: 'error()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'setmetatable', insert: 'setmetatable()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'getmetatable', insert: 'getmetatable()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'rawget', insert: 'rawget()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'rawset', insert: 'rawset()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'rawequal', insert: 'rawequal()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'rawlen', insert: 'rawlen()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'collectgarbage', insert: 'collectgarbage()', kind: 'fn', cursorOffset: 0, rank: 1 },
    { label: 'load', insert: 'load()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'dofile', insert: 'dofile()', kind: 'fn', cursorOffset: -1, rank: 1 },
    { label: 'require', insert: 'require("")', kind: 'fn', cursorOffset: -2, rank: 1 },
    { label: 'gfx', insert: 'gfx', kind: 'mod', cursorOffset: 0, rank: 2 }
  ],
  'io.': [
    { label: 'read', insert: 'read()', kind: 'fn', cursorOffset: 0 },
    { label: 'write', insert: 'write()', kind: 'fn', cursorOffset: -1 },
    { label: 'open', insert: 'open("file.lua", "r")', kind: 'fn', cursorOffset: -1 },
    { label: 'lines', insert: 'lines()', kind: 'fn', cursorOffset: -1 },
    { label: 'flush', insert: 'flush()', kind: 'fn', cursorOffset: 0 },
    { label: 'type', insert: 'type()', kind: 'fn', cursorOffset: -1 },
    { label: 'popen', insert: 'popen()', kind: 'fn', cursorOffset: -1 },
    { label: 'tmpfile', insert: 'tmpfile()', kind: 'fn', cursorOffset: 0 },
    { label: 'input', insert: 'input()', kind: 'fn', cursorOffset: 0 },
    { label: 'output', insert: 'output()', kind: 'fn', cursorOffset: 0 },
    { label: 'stdin', insert: 'stdin', kind: 'var', cursorOffset: 0 },
    { label: 'stdout', insert: 'stdout', kind: 'var', cursorOffset: 0 },
    { label: 'stderr', insert: 'stderr', kind: 'var', cursorOffset: 0 }
  ],
  'string.': [
    { label: 'format', insert: 'format()', kind: 'fn', cursorOffset: -1 },
    { label: 'sub', insert: 'sub()', kind: 'fn', cursorOffset: -1 },
    { label: 'len', insert: 'len()', kind: 'fn', cursorOffset: -1 },
    { label: 'upper', insert: 'upper()', kind: 'fn', cursorOffset: -1 },
    { label: 'lower', insert: 'lower()', kind: 'fn', cursorOffset: -1 },
    { label: 'find', insert: 'find()', kind: 'fn', cursorOffset: -1 },
    { label: 'match', insert: 'match()', kind: 'fn', cursorOffset: -1 },
    { label: 'gmatch', insert: 'gmatch()', kind: 'fn', cursorOffset: -1 },
    { label: 'gsub', insert: 'gsub()', kind: 'fn', cursorOffset: -1 },
    { label: 'rep', insert: 'rep()', kind: 'fn', cursorOffset: -1 },
    { label: 'reverse', insert: 'reverse()', kind: 'fn', cursorOffset: -1 },
    { label: 'byte', insert: 'byte()', kind: 'fn', cursorOffset: -1 },
    { label: 'char', insert: 'char()', kind: 'fn', cursorOffset: -1 },
    { label: 'pack', insert: 'pack()', kind: 'fn', cursorOffset: -1 },
    { label: 'unpack', insert: 'unpack()', kind: 'fn', cursorOffset: -1 }
  ],
  'table.': [
    { label: 'insert', insert: 'insert()', kind: 'fn', cursorOffset: -1 },
    { label: 'remove', insert: 'remove()', kind: 'fn', cursorOffset: -1 },
    { label: 'concat', insert: 'concat()', kind: 'fn', cursorOffset: -1 },
    { label: 'sort', insert: 'sort()', kind: 'fn', cursorOffset: -1 },
    { label: 'move', insert: 'move()', kind: 'fn', cursorOffset: -1 },
    { label: 'pack', insert: 'pack()', kind: 'fn', cursorOffset: -1 },
    { label: 'unpack', insert: 'unpack()', kind: 'fn', cursorOffset: -1 }
  ],
  'math.': [
    { label: 'floor', insert: 'floor()', kind: 'fn', cursorOffset: -1 },
    { label: 'ceil', insert: 'ceil()', kind: 'fn', cursorOffset: -1 },
    { label: 'sqrt', insert: 'sqrt()', kind: 'fn', cursorOffset: -1 },
    { label: 'abs', insert: 'abs()', kind: 'fn', cursorOffset: -1 },
    { label: 'random', insert: 'random()', kind: 'fn', cursorOffset: -1 },
    { label: 'randomseed', insert: 'randomseed()', kind: 'fn', cursorOffset: -1 },
    { label: 'max', insert: 'max()', kind: 'fn', cursorOffset: -1 },
    { label: 'min', insert: 'min()', kind: 'fn', cursorOffset: -1 },
    { label: 'sin', insert: 'sin()', kind: 'fn', cursorOffset: -1 },
    { label: 'cos', insert: 'cos()', kind: 'fn', cursorOffset: -1 },
    { label: 'tan', insert: 'tan()', kind: 'fn', cursorOffset: -1 },
    { label: 'atan', insert: 'atan()', kind: 'fn', cursorOffset: -1 },
    { label: 'asin', insert: 'asin()', kind: 'fn', cursorOffset: -1 },
    { label: 'acos', insert: 'acos()', kind: 'fn', cursorOffset: -1 },
    { label: 'deg', insert: 'deg()', kind: 'fn', cursorOffset: -1 },
    { label: 'rad', insert: 'rad()', kind: 'fn', cursorOffset: -1 },
    { label: 'exp', insert: 'exp()', kind: 'fn', cursorOffset: -1 },
    { label: 'log', insert: 'log()', kind: 'fn', cursorOffset: -1 },
    { label: 'fmod', insert: 'fmod()', kind: 'fn', cursorOffset: -1 },
    { label: 'modf', insert: 'modf()', kind: 'fn', cursorOffset: -1 },
    { label: 'tointeger', insert: 'tointeger()', kind: 'fn', cursorOffset: -1 },
    { label: 'type', insert: 'type()', kind: 'fn', cursorOffset: -1 },
    { label: 'ult', insert: 'ult()', kind: 'fn', cursorOffset: -1 },
    { label: 'pi', insert: 'pi', kind: 'var', cursorOffset: 0 },
    { label: 'huge', insert: 'huge', kind: 'var', cursorOffset: 0 },
    { label: 'maxinteger', insert: 'maxinteger', kind: 'var', cursorOffset: 0 },
    { label: 'mininteger', insert: 'mininteger', kind: 'var', cursorOffset: 0 }
  ],
  'os.': [
    { label: 'clock', insert: 'clock()', kind: 'fn', cursorOffset: 0 },
    { label: 'time', insert: 'time()', kind: 'fn', cursorOffset: 0 },
    { label: 'date', insert: 'date()', kind: 'fn', cursorOffset: 0 },
    { label: 'difftime', insert: 'difftime()', kind: 'fn', cursorOffset: -1 },
    { label: 'getenv', insert: 'getenv()', kind: 'fn', cursorOffset: -1 },
    { label: 'remove', insert: 'remove()', kind: 'fn', cursorOffset: -1 },
    { label: 'rename', insert: 'rename()', kind: 'fn', cursorOffset: -1 },
    { label: 'tmpname', insert: 'tmpname()', kind: 'fn', cursorOffset: 0 },
    { label: 'exit', insert: 'exit()', kind: 'fn', cursorOffset: 0 },
    { label: 'execute', insert: 'execute()', kind: 'fn', cursorOffset: -1 }
  ],
  'coroutine.': [
    { label: 'create', insert: 'create()', kind: 'fn', cursorOffset: -1 },
    { label: 'resume', insert: 'resume()', kind: 'fn', cursorOffset: -1 },
    { label: 'yield', insert: 'yield()', kind: 'fn', cursorOffset: -1 },
    { label: 'wrap', insert: 'wrap()', kind: 'fn', cursorOffset: -1 },
    { label: 'status', insert: 'status()', kind: 'fn', cursorOffset: -1 },
    { label: 'running', insert: 'running()', kind: 'fn', cursorOffset: 0 },
    { label: 'isyieldable', insert: 'isyieldable()', kind: 'fn', cursorOffset: 0 },
    { label: 'close', insert: 'close()', kind: 'fn', cursorOffset: -1 }
  ],
  'utf8.': [
    { label: 'len', insert: 'len()', kind: 'fn', cursorOffset: -1 },
    { label: 'char', insert: 'char()', kind: 'fn', cursorOffset: -1 },
    { label: 'codes', insert: 'codes()', kind: 'fn', cursorOffset: -1 },
    { label: 'codepoint', insert: 'codepoint()', kind: 'fn', cursorOffset: -1 },
    { label: 'offset', insert: 'offset()', kind: 'fn', cursorOffset: -1 },
    { label: 'charpattern', insert: 'charpattern', kind: 'var', cursorOffset: 0 }
  ],
  'bit32.': [
    { label: 'band', insert: 'band()', kind: 'fn', cursorOffset: -1 },
    { label: 'bor', insert: 'bor()', kind: 'fn', cursorOffset: -1 },
    { label: 'bxor', insert: 'bxor()', kind: 'fn', cursorOffset: -1 },
    { label: 'bnot', insert: 'bnot()', kind: 'fn', cursorOffset: -1 },
    { label: 'lshift', insert: 'lshift()', kind: 'fn', cursorOffset: -1 },
    { label: 'rshift', insert: 'rshift()', kind: 'fn', cursorOffset: -1 },
    { label: 'arshift', insert: 'arshift()', kind: 'fn', cursorOffset: -1 }
  ],
  'debug.': [
    { label: 'traceback', insert: 'traceback()', kind: 'fn', cursorOffset: 0 },
    { label: 'getinfo', insert: 'getinfo()', kind: 'fn', cursorOffset: -1 },
    { label: 'getmetatable', insert: 'getmetatable()', kind: 'fn', cursorOffset: -1 },
    { label: 'setmetatable', insert: 'setmetatable()', kind: 'fn', cursorOffset: -1 }
  ],
  'socket.': [
    { label: 'tcp', insert: 'tcp()', kind: 'fn', cursorOffset: 0 },
    { label: 'udp', insert: 'udp()', kind: 'fn', cursorOffset: 0 },
    { label: 'bind', insert: 'bind("127.0.0.1", 9090)', kind: 'fn', cursorOffset: -1 },
    { label: 'connect', insert: 'connect("127.0.0.1", 9090)', kind: 'fn', cursorOffset: -1 },
    { label: 'gettime', insert: 'gettime()', kind: 'fn', cursorOffset: 0 },
    { label: 'sleep', insert: 'sleep(1)', kind: 'fn', cursorOffset: -1 },
    { label: 'http', insert: 'http', kind: 'mod', cursorOffset: 0 },
    { label: 'dns', insert: 'dns', kind: 'mod', cursorOffset: 0 }
  ],
  'socket.http.': [
    { label: 'request', insert: 'request("https://api.github.com/zen")', kind: 'fn', cursorOffset: -2 },
    { label: 'get', insert: 'get("https://api.github.com/zen")', kind: 'fn', cursorOffset: -2 }
  ],
  'socket.dns.': [
    { label: 'toip', insert: 'toip("localhost")', kind: 'fn', cursorOffset: -2 },
    { label: 'gethostname', insert: 'gethostname()', kind: 'fn', cursorOffset: 0 }
  ],
  'gfx.': [
    { label: 'pset', insert: 'pset(x, y, 1)', kind: 'fn', cursorOffset: -1 },
    { label: 'line', insert: 'line(x1, y1, x2, y2, 1)', kind: 'fn', cursorOffset: -1 },
    { label: 'rect', insert: 'rect(x, y, w, h, 1, true)', kind: 'fn', cursorOffset: -1 },
    { label: 'circle', insert: 'circle(cx, cy, r, 1)', kind: 'fn', cursorOffset: -1 },
    { label: 'text', insert: 'text(x, y, "text", 1, 15)', kind: 'fn', cursorOffset: -1 },
    { label: 'clear', insert: 'clear()', kind: 'fn', cursorOffset: 0 }
  ],
  ':': [
    { label: 'read', insert: 'read("*l")', kind: 'fn', cursorOffset: -2 },
    { label: 'write', insert: 'write()', kind: 'fn', cursorOffset: -1 },
    { label: 'lines', insert: 'lines()', kind: 'fn', cursorOffset: 0 },
    { label: 'seek', insert: 'seek("set", 0)', kind: 'fn', cursorOffset: -1 },
    { label: 'flush', insert: 'flush()', kind: 'fn', cursorOffset: 0 },
    { label: 'close', insert: 'close()', kind: 'fn', cursorOffset: 0 },
    { label: 'upper', insert: 'upper()', kind: 'fn', cursorOffset: 0 },
    { label: 'lower', insert: 'lower()', kind: 'fn', cursorOffset: 0 },
    { label: 'sub', insert: 'sub(1, 1)', kind: 'fn', cursorOffset: -1 },
    { label: 'find', insert: 'find("")', kind: 'fn', cursorOffset: -2 },
    { label: 'match', insert: 'match("")', kind: 'fn', cursorOffset: -2 },
    { label: 'gmatch', insert: 'gmatch("")', kind: 'fn', cursorOffset: -2 },
    { label: 'gsub', insert: 'gsub("", "")', kind: 'fn', cursorOffset: -2 },
    { label: 'format', insert: 'format()', kind: 'fn', cursorOffset: -1 },
    { label: 'rep', insert: 'rep(2)', kind: 'fn', cursorOffset: -1 },
    { label: 'reverse', insert: 'reverse()', kind: 'fn', cursorOffset: 0 },
    { label: 'byte', insert: 'byte(1)', kind: 'fn', cursorOffset: -1 },
    { label: 'len', insert: 'len()', kind: 'fn', cursorOffset: 0 },
    { label: 'connect', insert: 'connect("127.0.0.1", 9090)', kind: 'fn', cursorOffset: -1 },
    { label: 'send', insert: 'send()', kind: 'fn', cursorOffset: -1 },
    { label: 'receive', insert: 'receive("*l")', kind: 'fn', cursorOffset: -2 },
    { label: 'settimeout', insert: 'settimeout(2)', kind: 'fn', cursorOffset: -1 },
    { label: 'getpeername', insert: 'getpeername()', kind: 'fn', cursorOffset: 0 },
    { label: 'getsockname', insert: 'getsockname()', kind: 'fn', cursorOffset: 0 },
    { label: 'on_request', insert: 'on_request(function(payload)\n  return payload\nend)', kind: 'fn', cursorOffset: 0 }
  ]
};

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

    this.defaultFg = 1;
    this.defaultBg = 15;

    this.lines = [];
    this.scrollOffset = 0;
    this.promptText = '@TEEDTHETERRIBLE > ';
    this.inputBuffer = '';
    this.cursorPos = 0;
    this.shellSelStart = null;
    this.shellSelEnd = null;
    this.history = [
      'CREATE mrrobot',
      'EDIT mrrobot',
      'EXECUTE mrrobot',
      'DELETE mrrobot'
    ];
    this.historyIndex = this.history.length;
    this.busy = false;

    this.waitingForStdin = false;
    this.stdinResolve = null;
    this.stdinPrefix = '';
    this.inlineWriteBuffer = '';

    this.mode = 'SHELL';
    this.edFilename = 'mrrobot.lua';
    this.edLines = [''];
    this.edRow = 0;
    this.edCol = 0;
    this.edScrollY = 0;
    this.edClipboard = '';
    this.edStatus = '';

    this.selAnchor = null;
    this.selActive = null;
    this.isDraggingSelection = false;
    this.lastClickTime = 0;

    this.suggestions = [];
    this.suggestIndex = 0;
    this.suggestPrefix = '';
    this.suggestStartCol = 0;
    this.suggestPopupRect = null;

    this.fileMenuOpen = false;
    this.mouseX = 320;
    this.mouseY = 240;
    this.mouseCol = 40;
    this.mouseRow = 30;

    this.cursorBlink = true;
    this.flashPhase = false;
    this.spinPixelOffset = 0;
    this.orbitAngle = 0;
    this.portRotX = 0.1;
    this.portRotY = 0.0;
    this.portRotZ = 0.0;
    this.portVelX = 0.008;
    this.portVelY = 0.024;
    this.portVelZ = 0.005;
    this.portTargetVelX = 0.012;
    this.portTargetVelY = 0.028;
    this.portTargetVelZ = -0.006;
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

  requestStdinLine() {
    return new Promise((resolve) => {
      this.waitingForStdin = true;
      this.stdinPrefix = this.inlineWriteBuffer || '';
      this.inlineWriteBuffer = '';
      this.inputBuffer = '';
      this.cursorPos = 0;
      this.shellSelStart = null;
      this.shellSelEnd = null;
      this.scrollOffset = 0;
      this.stdinResolve = resolve;
    });
  }

  writeInline(text) {
    const combined = this.inlineWriteBuffer + String(text ?? '');
    const parts = combined.split('\n');
    for (let i = 0; i < parts.length - 1; i++) {
      this.lines.push({ text: parts[i].slice(0, 54), fg: this.defaultFg, bg: this.defaultBg });
    }
    this.inlineWriteBuffer = parts[parts.length - 1];
  }

  flushInlineWrite() {
    if (this.inlineWriteBuffer) {
      this.printLine(this.inlineWriteBuffer);
      this.inlineWriteBuffer = '';
    }
  }

  screenToEditorPos(col, row) {
    const targetRow = Math.max(0, Math.min(this.edLines.length - 1, this.edScrollY + (row - 3)));
    const lineLen = (this.edLines[targetRow] || '').length;
    const targetCol = Math.max(0, Math.min(lineLen, col - 5));
    return { row: targetRow, col: targetCol };
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

      if (this.mode === 'EDITOR' && this.isDraggingSelection) {
        if (this.mouseRow < 3 && this.edScrollY > 0) {
          this.edScrollY = Math.max(0, this.edScrollY - 1);
        } else if (this.mouseRow > 55 && this.edScrollY < this.edLines.length - 1) {
          this.edScrollY = Math.min(Math.max(0, this.edLines.length - 1), this.edScrollY + 1);
        }
        const pos = this.screenToEditorPos(this.mouseCol, Math.max(3, Math.min(55, this.mouseRow)));
        this.edRow = pos.row;
        this.edCol = pos.col;
        this.selActive = { row: pos.row, col: pos.col };
        this.suggestions = [];
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingSelection = false;
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
      this.handleMouseClick(this.mouseCol, this.mouseRow, e.shiftKey);
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
        this.deleteShellSelection();
        const clean = text.replace(/\r?\n/g, ' ');
        this.inputBuffer =
          this.inputBuffer.slice(0, this.cursorPos) +
          clean +
          this.inputBuffer.slice(this.cursorPos);
        this.cursorPos += clean.length;
      } else if (this.mode === 'EDITOR') {
        this.insertEditorText(text.replace(/\r\n/g, '\n'));
        this.updateEditorSuggestions();
      }
    });
  }

  getFileMenuItems() {
    const items = [
      { label: 'Save to Browser   ^S', action: () => this.saveCurrentFile() },
      { label: 'Save & Exit      Esc', action: () => { this.saveCurrentFile(); this.mode = 'SHELL'; } },
      { label: 'Select All        ^A', action: () => { if (this.mode === 'EDITOR') this.selectAllEditor(); } },
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
    for (const f of files.slice(0, 6)) {
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

  async handleMouseClick(col, row, shiftKey = false) {
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

    if (this.mode === 'EDITOR' && this.suggestions.length > 0 && this.suggestPopupRect) {
      const r = this.suggestPopupRect;
      if (col >= r.col && col < r.col + r.width && row > r.row && row < r.row + r.height - 1) {
        const clickedIdx = row - r.row - 1;
        if (this.suggestions[clickedIdx]) {
          this.suggestIndex = clickedIdx;
          this.acceptEditorSuggestion();
          return;
        }
      }
    }

    if (this.mode === 'EDITOR' && row >= 3 && row <= 55 && col >= 1 && col <= 78) {
      const pos = this.screenToEditorPos(Math.max(5, col), row);
      const now = Date.now();

      if (now - this.lastClickTime < 320 && pos.row === this.edRow) {
        this.selectWordAt(pos.row, pos.col);
        this.lastClickTime = 0;
        return;
      }
      this.lastClickTime = now;

      if (shiftKey && this.selAnchor) {
        this.edRow = pos.row;
        this.edCol = pos.col;
        this.selActive = { row: pos.row, col: pos.col };
      } else {
        this.edRow = pos.row;
        this.edCol = pos.col;
        this.selAnchor = { row: pos.row, col: pos.col };
        this.selActive = null;
        this.isDraggingSelection = true;
      }
      this.suggestions = [];
      return;
    }

    if (this.mode === 'SHELL' && !this.waitingForStdin && col >= 57 && col <= 78) {
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
      if (fileIdx >= 0 && fileIdx < Math.min(files.length, 12)) {
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

  selectWordAt(row, col) {
    const line = this.edLines[row] || '';
    if (!line) return;
    let start = Math.min(col, line.length);
    let end = start;
    while (start > 0 && /[a-zA-Z0-9_]/.test(line[start - 1])) start--;
    while (end < line.length && /[a-zA-Z0-9_]/.test(line[end])) end++;
    if (start < end) {
      this.selAnchor = { row, col: start };
      this.selActive = { row, col: end };
      this.edRow = row;
      this.edCol = end;
    }
  }

  hasShellSelection() {
    return this.shellSelStart !== null && this.shellSelEnd !== null && this.shellSelStart !== this.shellSelEnd;
  }

  deleteShellSelection() {
    if (!this.hasShellSelection()) return false;
    const s = Math.min(this.shellSelStart, this.shellSelEnd);
    const e = Math.max(this.shellSelStart, this.shellSelEnd);
    this.inputBuffer = this.inputBuffer.slice(0, s) + this.inputBuffer.slice(e);
    this.cursorPos = s;
    this.shellSelStart = null;
    this.shellSelEnd = null;
    return true;
  }

  async handleShellKey(e) {
    if (this.busy && !this.waitingForStdin) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      this.shellSelStart = 0;
      this.shellSelEnd = this.inputBuffer.length;
      this.cursorPos = this.inputBuffer.length;
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      if (this.hasShellSelection()) {
        e.preventDefault();
        const s = Math.min(this.shellSelStart, this.shellSelEnd);
        const end = Math.max(this.shellSelStart, this.shellSelEnd);
        const copied = this.inputBuffer.slice(s, end);
        this.edClipboard = copied;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(copied).catch(() => {});
        }
        return;
      }
      e.preventDefault();
      if (this.waitingForStdin && this.stdinResolve) {
        const activePfx = this.stdinPrefix;
        const resolver = this.stdinResolve;
        this.waitingForStdin = false;
        this.stdinResolve = null;
        this.stdinPrefix = '';
        this.printLine(`${activePfx}${this.inputBuffer}^C`, 8, 15);
        this.inputBuffer = '';
        this.cursorPos = 0;
        resolver('');
        return;
      }
      this.printLine(`${this.promptText}${this.inputBuffer}^C`, 8, 15);
      this.inputBuffer = '';
      this.cursorPos = 0;
      this.shellSelStart = null;
      this.shellSelEnd = null;
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
      if (this.hasShellSelection()) {
        e.preventDefault();
        const s = Math.min(this.shellSelStart, this.shellSelEnd);
        const end = Math.max(this.shellSelStart, this.shellSelEnd);
        const cut = this.inputBuffer.slice(s, end);
        this.edClipboard = cut;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(cut).catch(() => {});
        }
        this.deleteShellSelection();
      }
      return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      this.clearScreen();
      return;
    }

    if (e.key === 'Tab' && !this.waitingForStdin) {
      e.preventDefault();
      const trimmed = this.inputBuffer.trimStart();
      const parts = trimmed.split(/\s+/);
      if (parts.length <= 1) {
        const cmds = ['CREATE ', 'EDIT ', 'EXECUTE ', 'DELETE '];
        const match = cmds.find(c => c.startsWith(trimmed.toUpperCase()));
        if (match) {
          this.inputBuffer = match;
          this.cursorPos = this.inputBuffer.length;
        }
      } else {
        const verb = parts[0].toUpperCase();
        const filePrefix = parts[1].toLowerCase();
        const files = Object.keys(this.lua.files).sort();
        const fMatch = files.find(f => f.toLowerCase().startsWith(filePrefix));
        if (fMatch) {
          this.inputBuffer = `${verb} ${fMatch}`;
          this.cursorPos = this.inputBuffer.length;
        }
      }
      this.shellSelStart = null;
      this.shellSelEnd = null;
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (this.waitingForStdin && this.stdinResolve) {
        const entered = this.inputBuffer;
        const pfx = this.stdinPrefix;
        const resolver = this.stdinResolve;
        this.waitingForStdin = false;
        this.stdinResolve = null;
        this.stdinPrefix = '';
        this.inputBuffer = '';
        this.cursorPos = 0;
        this.shellSelStart = null;
        this.shellSelEnd = null;
        this.printLine(`${pfx}${entered}`, 0, 15);
        resolver(entered);
        return;
      }

      const code = this.inputBuffer;
      this.printLine(`${this.promptText}${code}`, 1, 15);
      if (code.trim() && this.history[this.history.length - 1] !== code) {
        this.history.push(code);
      }
      this.historyIndex = this.history.length;
      this.inputBuffer = '';
      this.cursorPos = 0;
      this.shellSelStart = null;
      this.shellSelEnd = null;
      this.scrollOffset = 0;

      this.busy = true;
      await this.lua.executeCommandOrLua(code);
      this.flushInlineWrite();
      this.busy = false;
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.deleteShellSelection()) return;
      if (this.cursorPos > 0) {
        const prevCh = this.inputBuffer[this.cursorPos - 1];
        const nextCh = this.inputBuffer[this.cursorPos];
        if (!this.waitingForStdin && AUTO_CLOSE_PAIRS[prevCh] && AUTO_CLOSE_PAIRS[prevCh] === nextCh) {
          this.inputBuffer =
            this.inputBuffer.slice(0, this.cursorPos - 1) +
            this.inputBuffer.slice(this.cursorPos + 1);
          this.cursorPos--;
        } else {
          this.inputBuffer =
            this.inputBuffer.slice(0, this.cursorPos - 1) +
            this.inputBuffer.slice(this.cursorPos);
          this.cursorPos--;
        }
      }
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      if (this.deleteShellSelection()) return;
      if (this.cursorPos < this.inputBuffer.length) {
        this.inputBuffer =
          this.inputBuffer.slice(0, this.cursorPos) +
          this.inputBuffer.slice(this.cursorPos + 1);
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (e.shiftKey) {
        if (this.shellSelStart === null) this.shellSelStart = this.cursorPos;
        if (this.cursorPos > 0) this.cursorPos--;
        this.shellSelEnd = this.cursorPos;
      } else {
        this.shellSelStart = null;
        this.shellSelEnd = null;
        if (this.cursorPos > 0) this.cursorPos--;
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (e.shiftKey) {
        if (this.shellSelStart === null) this.shellSelStart = this.cursorPos;
        if (this.cursorPos < this.inputBuffer.length) this.cursorPos++;
        this.shellSelEnd = this.cursorPos;
      } else {
        this.shellSelStart = null;
        this.shellSelEnd = null;
        if (this.cursorPos < this.inputBuffer.length) this.cursorPos++;
      }
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      this.cursorPos = 0;
      this.shellSelStart = null;
      this.shellSelEnd = null;
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      this.cursorPos = this.inputBuffer.length;
      this.shellSelStart = null;
      this.shellSelEnd = null;
      return;
    }

    if (e.key === 'ArrowUp' && !this.waitingForStdin) {
      e.preventDefault();
      this.shellSelStart = null;
      this.shellSelEnd = null;
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.inputBuffer = this.history[this.historyIndex] || '';
        this.cursorPos = this.inputBuffer.length;
      }
      return;
    }

    if (e.key === 'ArrowDown' && !this.waitingForStdin) {
      e.preventDefault();
      this.shellSelStart = null;
      this.shellSelEnd = null;
      if (this.historyIndex < this.history.length) {
        this.historyIndex++;
        this.inputBuffer = this.history[this.historyIndex] || '';
        this.cursorPos = this.inputBuffer.length;
      }
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      this.deleteShellSelection();
      const ch = e.key;
      if (!this.waitingForStdin) {
        const nextCh = this.inputBuffer[this.cursorPos];
        if (CLOSING_CHARS.has(ch) && nextCh === ch) {
          this.cursorPos++;
          return;
        }
        if (AUTO_CLOSE_PAIRS[ch]) {
          const closeCh = AUTO_CLOSE_PAIRS[ch];
          this.inputBuffer =
            this.inputBuffer.slice(0, this.cursorPos) +
            ch + closeCh +
            this.inputBuffer.slice(this.cursorPos);
          this.cursorPos++;
          return;
        }
      }
      this.inputBuffer =
        this.inputBuffer.slice(0, this.cursorPos) +
        ch +
        this.inputBuffer.slice(this.cursorPos);
      this.cursorPos++;
      this.scrollOffset = 0;
    }
  }

  openEditor(filename) {
    this.edFilename = this.lua.normalizeFilename(filename);
    const existing = this.lua.files[this.edFilename];
    this.edLines = existing !== undefined
      ? existing.replace(/\r\n/g, '\n').split('\n')
      : [`--!${this.edFilename}`, ''];
    if (this.edLines.length === 0) this.edLines = [''];
    this.edRow = 0;
    this.edCol = 0;
    this.edScrollY = 0;
    this.selAnchor = null;
    this.selActive = null;
    this.suggestions = [];
    this.suggestIndex = 0;
    this.edStatus = `[ Editing ${this.edFilename} ]`;
    this.mode = 'EDITOR';
  }

  saveEditor() {
    this.lua.files[this.edFilename] = this.edLines.join('\n');
    this.lua.saveFiles();
    this.edStatus = `[ Wrote ${this.edLines.length} lines to ${this.edFilename} (Saved in Browser) ]`;
  }

  hasEditorSelection() {
    if (!this.selAnchor || !this.selActive) return false;
    return this.selAnchor.row !== this.selActive.row || this.selAnchor.col !== this.selActive.col;
  }

  getNormalizedSelection() {
    if (!this.hasEditorSelection()) return null;
    const a = this.selAnchor;
    const b = this.selActive;
    if (a.row < b.row || (a.row === b.row && a.col <= b.col)) {
      return { startRow: a.row, startCol: a.col, endRow: b.row, endCol: b.col };
    }
    return { startRow: b.row, startCol: b.col, endRow: a.row, endCol: a.col };
  }

  clearEditorSelection() {
    this.selAnchor = null;
    this.selActive = null;
  }

  selectAllEditor() {
    const lastRow = Math.max(0, this.edLines.length - 1);
    const lastCol = (this.edLines[lastRow] || '').length;
    this.selAnchor = { row: 0, col: 0 };
    this.selActive = { row: lastRow, col: lastCol };
    this.edRow = lastRow;
    this.edCol = lastCol;
    this.suggestions = [];
    this.edStatus = `[ Selected All (${this.edLines.length} lines) ]`;
  }

  getSelectedText() {
    const sel = this.getNormalizedSelection();
    if (!sel) return '';
    if (sel.startRow === sel.endRow) {
      return (this.edLines[sel.startRow] || '').slice(sel.startCol, sel.endCol);
    }
    const parts = [];
    parts.push((this.edLines[sel.startRow] || '').slice(sel.startCol));
    for (let r = sel.startRow + 1; r < sel.endRow; r++) {
      parts.push(this.edLines[r] || '');
    }
    parts.push((this.edLines[sel.endRow] || '').slice(0, sel.endCol));
    return parts.join('\n');
  }

  deleteEditorSelection() {
    const sel = this.getNormalizedSelection();
    if (!sel) return false;
    const before = (this.edLines[sel.startRow] || '').slice(0, sel.startCol);
    const after = (this.edLines[sel.endRow] || '').slice(sel.endCol);
    this.edLines.splice(sel.startRow, sel.endRow - sel.startRow + 1, before + after);
    if (this.edLines.length === 0) this.edLines = [''];
    this.edRow = sel.startRow;
    this.edCol = sel.startCol;
    this.clearEditorSelection();
    this.ensureEditorCursorVisible();
    return true;
  }

  insertEditorText(text) {
    if (this.hasEditorSelection()) {
      this.deleteEditorSelection();
    }
    const curLine = this.edLines[this.edRow] || '';
    const before = curLine.slice(0, this.edCol);
    const after = curLine.slice(this.edCol);
    const incoming = String(text).split('\n');
    if (incoming.length === 1) {
      this.edLines[this.edRow] = before + incoming[0] + after;
      this.edCol += incoming[0].length;
    } else {
      const midLines = incoming.slice(1, -1);
      const firstLine = before + incoming[0];
      const lastLine = incoming[incoming.length - 1] + after;
      this.edLines.splice(this.edRow, 1, firstLine, ...midLines, lastLine);
      this.edRow += incoming.length - 1;
      this.edCol = incoming[incoming.length - 1].length;
    }
    this.ensureEditorCursorVisible();
  }

  ensureEditorCursorVisible() {
    if (this.edRow < this.edScrollY) {
      this.edScrollY = this.edRow;
    } else if (this.edRow >= this.edScrollY + 53) {
      this.edScrollY = this.edRow - 52;
    }
  }

  moveCursorWithShift(newRow, newCol, shiftKey) {
    if (shiftKey) {
      if (!this.selAnchor) {
        this.selAnchor = { row: this.edRow, col: this.edCol };
      }
      this.edRow = newRow;
      this.edCol = newCol;
      this.selActive = { row: newRow, col: newCol };
    } else {
      this.edRow = newRow;
      this.edCol = newCol;
      this.clearEditorSelection();
    }
    this.ensureEditorCursorVisible();
  }

  collectDocumentSymbols() {
    const symbols = new Map();
    const tableMembers = new Map();

    for (let r = 0; r < this.edLines.length; r++) {
      const rawLine = this.edLines[r];
      const line = rawLine.replace(/--.*$/, '');

      const fnMatches = line.matchAll(/\bfunction\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:([.:])([a-zA-Z_][a-zA-Z0-9_]*))?\s*\(/g);
      for (const fm of fnMatches) {
        const baseName = fm[1];
        const sep = fm[2];
        const subName = fm[3];
        if (!LUA_KEYWORDS.has(baseName) && !LUA_BUILTINS.has(baseName)) {
          symbols.set(baseName, {
            label: baseName,
            insert: subName ? baseName : `${baseName}()`,
            kind: subName ? 'tbl' : 'fn',
            cursorOffset: subName ? 0 : -1,
            rank: 0
          });
        }
        if (subName) {
          const key = `${baseName}${sep}`;
          if (!tableMembers.has(key)) tableMembers.set(key, new Map());
          tableMembers.get(key).set(subName, {
            label: subName,
            insert: `${subName}()`,
            kind: 'fn',
            cursorOffset: -1,
            rank: 0
          });
        }
      }

      const propAssignMatches = line.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g);
      for (const pm of propAssignMatches) {
        const tbl = pm[1];
        const field = pm[2];
        const key = `${tbl}.`;
        if (!tableMembers.has(key)) tableMembers.set(key, new Map());
        tableMembers.get(key).set(field, {
          label: field,
          insert: field,
          kind: 'var',
          cursorOffset: 0,
          rank: 0
        });
      }

      const matches = line.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g);
      for (const m of matches) {
        const word = m[1];
        if (word.length < 2) continue;
        if (LUA_KEYWORDS.has(word) || LUA_BUILTINS.has(word)) continue;
        if (r === this.edRow && m.index <= this.edCol && m.index + word.length >= this.edCol) {
          continue;
        }
        if (!symbols.has(word)) {
          symbols.set(word, {
            label: word,
            insert: word,
            kind: 'var',
            cursorOffset: 0,
            rank: 0
          });
        }
      }
    }

    return {
      globals: Array.from(symbols.values()),
      tableMembers
    };
  }

  updateEditorSuggestions(forceOpen = false) {
    if (this.hasEditorSelection()) {
      this.suggestions = [];
      return;
    }
    const line = this.edLines[this.edRow] || '';
    const before = line.slice(0, this.edCol);
    const prevSelectedLabel = this.suggestions[this.suggestIndex]?.label || null;
    const docData = this.collectDocumentSymbols();

    let pool = [];
    let prefix = '';
    let startCol = this.edCol;

    const memberMatch = before.match(/([a-zA-Z_][a-zA-Z0-9_.]*)([.:])([a-zA-Z0-9_]*)$/);
    if (memberMatch) {
      const objName = memberMatch[1];
      const sep = memberMatch[2];
      prefix = memberMatch[3];
      startCol = this.edCol - prefix.length;

      const userKey = `${objName}${sep}`;
      const userMembers = docData.tableMembers.get(userKey)
        ? Array.from(docData.tableMembers.get(userKey).values())
        : [];

      if (sep === ':') {
        pool = [...userMembers, ...(VSCODE_LUA_SUGGESTIONS[':'] || [])];
      } else {
        const key = `${objName}.`;
        pool = [...userMembers, ...(VSCODE_LUA_SUGGESTIONS[key] || [])];
      }
    } else {
      const wordMatch = before.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
      if (wordMatch) {
        prefix = wordMatch[1];
        startCol = this.edCol - prefix.length;
        pool = [...docData.globals, ...VSCODE_LUA_SUGGESTIONS.global];
      } else if (forceOpen) {
        prefix = '';
        startCol = this.edCol;
        pool = [...docData.globals, ...VSCODE_LUA_SUGGESTIONS.global];
      }
    }

    if (!forceOpen && prefix.length === 0 && !memberMatch) {
      this.suggestions = [];
      this.suggestIndex = 0;
      this.suggestPrefix = '';
      return;
    }

    const lowPrefix = prefix.toLowerCase();
    const seen = new Set();
    const filtered = pool
      .filter(item => {
        if (seen.has(item.label)) return false;
        if (!lowPrefix) {
          seen.add(item.label);
          return true;
        }
        const lowLabel = item.label.toLowerCase();
        if (lowLabel.startsWith(lowPrefix) && lowLabel !== lowPrefix) {
          seen.add(item.label);
          return true;
        }
        return false;
      })
      .sort((a, b) => {
        const rA = a.rank ?? 1;
        const rB = b.rank ?? 1;
        if (rA !== rB) return rA - rB;
        const aExact = a.label.startsWith(prefix) ? 0 : 1;
        const bExact = b.label.startsWith(prefix) ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        return a.label.localeCompare(b.label);
      })
      .slice(0, 6);

    this.suggestions = filtered;
    this.suggestPrefix = prefix;
    this.suggestStartCol = startCol;

    if (prevSelectedLabel) {
      const keptIdx = filtered.findIndex(x => x.label === prevSelectedLabel);
      this.suggestIndex = keptIdx !== -1 ? keptIdx : 0;
    } else {
      this.suggestIndex = 0;
    }
  }

  acceptEditorSuggestion() {
    if (this.suggestions.length === 0) return false;
    const item = this.suggestions[this.suggestIndex] || this.suggestions[0];
    const line = this.edLines[this.edRow] || '';
    const before = line.slice(0, this.suggestStartCol);
    const after = line.slice(this.edCol);

    const insertLines = item.insert.split('\n');
    if (insertLines.length === 1) {
      this.edLines[this.edRow] = before + item.insert + after;
      this.edCol = before.length + item.insert.length + (item.cursorOffset || 0);
    } else {
      const indentMatch = before.match(/^(\s*)/);
      const baseIndent = indentMatch ? indentMatch[1] : '';
      this.edLines[this.edRow] = before + insertLines[0];
      for (let i = 1; i < insertLines.length; i++) {
        const content = baseIndent + insertLines[i] + (i === insertLines.length - 1 ? after : '');
        this.edLines.splice(this.edRow + i, 0, content);
      }
      this.edRow += 1;
      this.edCol = baseIndent.length + 2;
    }

    this.suggestions = [];
    this.suggestIndex = 0;
    return true;
  }

  needsAutoEnd() {
    let balance = 0;
    for (const line of this.edLines) {
      const tokens = line.replace(/--.*$/, '').match(/\b(function|if|for|while|repeat|end|until)\b/g) || [];
      for (const tok of tokens) {
        if (['function', 'if', 'for', 'while', 'repeat'].includes(tok)) balance++;
        else if (tok === 'end' || tok === 'until') balance--;
      }
    }
    return balance > 0;
  }

  async handleEditorKey(e) {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      this.updateEditorSuggestions(true);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      this.selectAllEditor();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      if (this.hasEditorSelection()) {
        e.preventDefault();
        const text = this.getSelectedText();
        this.edClipboard = text;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        this.edStatus = `[ Copied ${text.length} chars ]`;
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
      e.preventDefault();
      if (this.hasEditorSelection()) {
        const text = this.getSelectedText();
        this.edClipboard = text;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        this.deleteEditorSelection();
        this.edStatus = `[ Cut ${text.length} chars ]`;
        return;
      }
      this.saveEditor();
      this.mode = 'SHELL';
      this.printLine(`Saved ${this.edFilename}.`, 1, 15);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
      if (navigator.clipboard && navigator.clipboard.readText) {
        e.preventDefault();
        try {
          const clipText = await navigator.clipboard.readText();
          if (clipText) {
            this.insertEditorText(clipText.replace(/\r\n/g, '\n'));
            this.updateEditorSuggestions();
            return;
          }
        } catch {}
      }
      if (this.edClipboard) {
        e.preventDefault();
        this.insertEditorText(this.edClipboard);
        this.updateEditorSuggestions();
      }
      return;
    }

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
      this.clearEditorSelection();
      this.suggestions = [];
      this.edStatus = `[ Cut 1 line ]`;
      return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      if (this.edClipboard !== '') {
        this.insertEditorText(this.edClipboard);
        this.suggestions = [];
        this.edStatus = `[ Pasted ]`;
      }
      return;
    }

    if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r')) {
      e.preventDefault();
      this.saveEditor();
      const target = this.edFilename;
      this.mode = 'SHELL';
      this.printLine(`@TEEDTHETERRIBLE > EXECUTE ${target}`, 1, 15);
      this.busy = true;
      await this.lua.cmdExecute(target);
      this.flushInlineWrite();
      this.busy = false;
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      if (this.suggestions.length > 0) {
        this.suggestions = [];
        return;
      }
      if (this.hasEditorSelection()) {
        this.clearEditorSelection();
        return;
      }
      this.saveEditor();
      this.mode = 'SHELL';
      this.printLine(`Saved ${this.edFilename}.`, 1, 15);
      return;
    }

    if (this.suggestions.length > 0 && !e.shiftKey) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.suggestIndex = (this.suggestIndex + 1) % this.suggestions.length;
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.suggestIndex = (this.suggestIndex - 1 + this.suggestions.length) % this.suggestions.length;
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        this.acceptEditorSuggestion();
        return;
      }
    }

    const curLine = this.edLines[this.edRow] || '';

    if (e.key === 'Tab') {
      e.preventDefault();
      if (this.hasEditorSelection()) {
        const sel = this.getNormalizedSelection();
        for (let r = sel.startRow; r <= sel.endRow; r++) {
          if (e.shiftKey) {
            this.edLines[r] = (this.edLines[r] || '').replace(/^ {1,2}/, '');
          } else {
            this.edLines[r] = '  ' + (this.edLines[r] || '');
          }
        }
        this.edCol = (this.edLines[this.edRow] || '').length;
        return;
      }

      if (e.shiftKey) {
        const removed = curLine.startsWith('  ') ? 2 : (curLine.startsWith(' ') ? 1 : 0);
        if (removed > 0) {
          this.edLines[this.edRow] = curLine.slice(removed);
          this.edCol = Math.max(0, this.edCol - removed);
        }
        return;
      }

      const afterCursor = curLine.slice(this.edCol);
      const jumpMatch = afterCursor.match(/^(\s*["')\]}]+|,\s*)/);
      if (jumpMatch) {
        this.edCol += jumpMatch[0].length;
        this.suggestions = [];
        return;
      }

      const spacesToNextTabStop = 2 - (this.edCol % 2);
      const pad = ' '.repeat(spacesToNextTabStop);
      this.edLines[this.edRow] = curLine.slice(0, this.edCol) + pad + curLine.slice(this.edCol);
      this.edCol += pad.length;
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.suggestions = [];
      if (this.edRow > 0) {
        const nextRow = this.edRow - 1;
        const nextCol = Math.min(this.edCol, this.edLines[nextRow].length);
        this.moveCursorWithShift(nextRow, nextCol, e.shiftKey);
      } else if (!e.shiftKey) {
        this.clearEditorSelection();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.suggestions = [];
      if (this.edRow < this.edLines.length - 1) {
        const nextRow = this.edRow + 1;
        const nextCol = Math.min(this.edCol, this.edLines[nextRow].length);
        this.moveCursorWithShift(nextRow, nextCol, e.shiftKey);
      } else if (!e.shiftKey) {
        this.clearEditorSelection();
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (!e.shiftKey && this.hasEditorSelection()) {
        const sel = this.getNormalizedSelection();
        this.edRow = sel.startRow;
        this.edCol = sel.startCol;
        this.clearEditorSelection();
        this.updateEditorSuggestions();
        return;
      }
      let nextRow = this.edRow;
      let nextCol = this.edCol;
      if (nextCol > 0) {
        nextCol--;
      } else if (nextRow > 0) {
        nextRow--;
        nextCol = this.edLines[nextRow].length;
      }
      this.moveCursorWithShift(nextRow, nextCol, e.shiftKey);
      this.updateEditorSuggestions();
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (!e.shiftKey && this.hasEditorSelection()) {
        const sel = this.getNormalizedSelection();
        this.edRow = sel.endRow;
        this.edCol = sel.endCol;
        this.clearEditorSelection();
        this.updateEditorSuggestions();
        return;
      }
      let nextRow = this.edRow;
      let nextCol = this.edCol;
      if (nextCol < curLine.length) {
        nextCol++;
      } else if (nextRow < this.edLines.length - 1) {
        nextRow++;
        nextCol = 0;
      }
      this.moveCursorWithShift(nextRow, nextCol, e.shiftKey);
      this.updateEditorSuggestions();
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      const firstNonSpace = (curLine.match(/^\s*/) || [''])[0].length;
      const targetCol = this.edCol === firstNonSpace ? 0 : firstNonSpace;
      this.moveCursorWithShift(this.edRow, targetCol, e.shiftKey);
      this.suggestions = [];
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      this.moveCursorWithShift(this.edRow, curLine.length, e.shiftKey);
      this.suggestions = [];
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      this.suggestions = [];
      if (this.hasEditorSelection()) {
        this.deleteEditorSelection();
      }
      const lineNow = this.edLines[this.edRow] || '';
      const before = lineNow.slice(0, this.edCol);
      const after = lineNow.slice(this.edCol);
      const indentMatch = before.match(/^(\s*)/);
      const baseIndent = indentMatch ? indentMatch[1] : '';
      const trimmedBefore = before.trim();

      const opensBlock =
        /\b(then|do|repeat)\s*$/.test(trimmedBefore) ||
        /^(local\s+)?function\b.*\)\s*$/.test(trimmedBefore) ||
        /\bfunction\s*\([^)]*\)\s*$/.test(trimmedBefore);

      const betweenBraces =
        (before.endsWith('{') && after.startsWith('}')) ||
        (before.endsWith('(') && after.startsWith(')'));

      if (betweenBraces) {
        const innerIndent = baseIndent + '  ';
        this.edLines[this.edRow] = before;
        this.edLines.splice(this.edRow + 1, 0, innerIndent, baseIndent + after);
        this.edRow++;
        this.edCol = innerIndent.length;
      } else if (opensBlock) {
        const nextIndent = baseIndent + '  ';
        this.edLines[this.edRow] = before;
        this.edLines.splice(this.edRow + 1, 0, nextIndent + after);
        if (this.needsAutoEnd()) {
          const closeKw = /\brepeat\s*$/.test(trimmedBefore) ? 'until false' : 'end';
          const closingSuffix = after.startsWith(')') ? ')' : '';
          if (closingSuffix) {
            this.edLines[this.edRow + 1] = nextIndent + after.slice(1);
          }
          this.edLines.splice(this.edRow + 2, 0, baseIndent + closeKw + closingSuffix);
        }
        this.edRow++;
        this.edCol = nextIndent.length;
      } else {
        this.edLines[this.edRow] = before;
        this.edLines.splice(this.edRow + 1, 0, baseIndent + after);
        this.edRow++;
        this.edCol = baseIndent.length;
      }

      this.ensureEditorCursorVisible();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.deleteEditorSelection()) {
        this.updateEditorSuggestions();
        return;
      }
      if (this.edCol > 0) {
        const prevCh = curLine[this.edCol - 1];
        const nextCh = curLine[this.edCol];
        if (AUTO_CLOSE_PAIRS[prevCh] && AUTO_CLOSE_PAIRS[prevCh] === nextCh) {
          this.edLines[this.edRow] = curLine.slice(0, this.edCol - 1) + curLine.slice(this.edCol + 1);
          this.edCol--;
        } else {
          this.edLines[this.edRow] = curLine.slice(0, this.edCol - 1) + curLine.slice(this.edCol);
          this.edCol--;
        }
      } else if (this.edRow > 0) {
        const prevLen = this.edLines[this.edRow - 1].length;
        this.edLines[this.edRow - 1] += curLine;
        this.edLines.splice(this.edRow, 1);
        this.edRow--;
        this.edCol = prevLen;
      }
      this.ensureEditorCursorVisible();
      this.updateEditorSuggestions();
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      if (this.deleteEditorSelection()) {
        this.updateEditorSuggestions();
        return;
      }
      if (this.edCol < curLine.length) {
        this.edLines[this.edRow] = curLine.slice(0, this.edCol) + curLine.slice(this.edCol + 1);
      } else if (this.edRow < this.edLines.length - 1) {
        this.edLines[this.edRow] += this.edLines[this.edRow + 1];
        this.edLines.splice(this.edRow + 1, 1);
      }
      this.updateEditorSuggestions();
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const ch = e.key;

      if (this.hasEditorSelection() && AUTO_CLOSE_PAIRS[ch]) {
        const selected = this.getSelectedText();
        if (!selected.includes('\n')) {
          const closeCh = AUTO_CLOSE_PAIRS[ch];
          this.insertEditorText(ch + selected + closeCh);
          return;
        }
      }

      if (this.hasEditorSelection()) {
        this.deleteEditorSelection();
      }

      const lineAfterDel = this.edLines[this.edRow] || '';
      const nextCh = lineAfterDel[this.edCol];

      if (CLOSING_CHARS.has(ch) && nextCh === ch) {
        this.edCol++;
        this.updateEditorSuggestions();
        return;
      }

      if (AUTO_CLOSE_PAIRS[ch]) {
        const closeCh = AUTO_CLOSE_PAIRS[ch];
        const shouldAutoClose = !nextCh || /[\s)\]};,]/.test(nextCh);
        if (shouldAutoClose) {
          this.edLines[this.edRow] =
            lineAfterDel.slice(0, this.edCol) +
            ch + closeCh +
            lineAfterDel.slice(this.edCol);
          this.edCol++;
          this.updateEditorSuggestions();
          return;
        }
      }

      this.edLines[this.edRow] = lineAfterDel.slice(0, this.edCol) + ch + lineAfterDel.slice(this.edCol);
      this.edCol++;
      this.updateEditorSuggestions();
    }
  }

  printLine(text, fg = this.defaultFg, bg = this.defaultBg) {
    if (this.inlineWriteBuffer) {
      text = this.inlineWriteBuffer + String(text ?? '');
      this.inlineWriteBuffer = '';
    }
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
    this.inlineWriteBuffer = '';
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

  setFbRGB(x, y, r, g, b, isStroke = true) {
    const px = Math.trunc(x);
    const py = Math.trunc(y);
    if (px < 0 || px >= this.width || py < 0 || py >= this.height) return;
    const maskIdx = py * this.width + px;
    if (isStroke) this.fgMask[maskIdx] = 1;
    const offset = maskIdx * 4;
    this.pixels[offset] = r;
    this.pixels[offset + 1] = g;
    this.pixels[offset + 2] = b;
    this.pixels[offset + 3] = 255;
  }

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

  renderTopBar() {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    this.putString(0, 0, ' '.repeat(80), 15, 1, 80);

    const fileHovered = this.mouseRow === 0 && this.mouseCol >= 0 && this.mouseCol <= 6;
    let fileFg = this.flashPhase ? 1 : 15;
    let fileBg = this.flashPhase ? 15 : 1;
    if (this.fileMenuOpen || fileHovered) {
      fileFg = this.flashPhase ? 15 : 1;
      fileBg = this.flashPhase ? 9 : 11;
    }
    this.putString(0, 0, ' File ', fileFg, fileBg);

    const name = 'FourthTemple';
    this.putString(Math.floor((80 - name.length) / 2), 0, name, 15, 1);

    this.putString(80 - timeStr.length - 1, 0, timeStr, 15, 1);
  }

  renderPixelMarquee(startCol, widthCells, row, unit, pixelOffset, fgIdx = 15, bgIdx = 1) {
    const unitPxLen = unit.length * 8;
    const startPx = startCol * 8;
    const widthPx = widthCells * 8;
    const baseY = row * 8;
    const fgRGB = window.VGA_PALETTE[fgIdx & 15];
    const bgRGB = window.VGA_PALETTE[bgIdx & 15];

    for (let x = 0; x < widthPx; x++) {
      const srcPx = (((pixelOffset + x) % unitPxLen) + unitPxLen) % unitPxLen;
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

  renderBigPixelMarquee(startCol, widthCells, topRow, unit, pixelOffset, fgIdx = 15, bgIdx = 1) {
    const unitPxLen = unit.length * 16;
    const startPx = startCol * 8;
    const widthPx = widthCells * 8;
    const baseY = topRow * 8;
    const fgRGB = window.VGA_PALETTE[fgIdx & 15];
    const bgRGB = window.VGA_PALETTE[bgIdx & 15];

    for (let x = 0; x < widthPx; x++) {
      const srcPx = (((pixelOffset + x) % unitPxLen) + unitPxLen) % unitPxLen;
      const charIdx = Math.floor(srcPx / 16);
      const glyphCol = Math.floor((srcPx % 16) / 2);
      const glyph = window.getGlyph8x8(unit[charIdx]);
      const screenX = startPx + x;

      for (let gy = 0; gy < 16; gy++) {
        const glyphRow = Math.floor(gy / 2);
        const bit = (glyph[glyphRow] & (0x80 >> glyphCol)) !== 0;
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

    const unit = 'casper the terrible .. ';
    const boxWidthCells = 28;
    const boxStartCol = Math.floor((80 - boxWidthCells) / 2);

    this.putCell(boxStartCol - 1, 1, '[', 1, 15);
    this.putCell(boxStartCol + boxWidthCells, 1, ']', 1, 15);

    this.renderPixelMarquee(boxStartCol, boxWidthCells, 1, unit, this.spinPixelOffset, 15, 1);
  }

  renderPortrait3D() {
    const dots = window.PORTRAIT_3D_DOTS;
    if (!dots || dots.length === 0) return;

    const minX = 458;
    const maxX = 630;
    const minY = 238;
    const maxY = 452;

    const cx = 544;
    const cy = 348;
    const fov = 220;
    const camDist = 155;

    const sinX = Math.sin(this.portRotX), cosX = Math.cos(this.portRotX);
    const sinY = Math.sin(this.portRotY), cosY = Math.cos(this.portRotY);
    const sinZ = Math.sin(this.portRotZ), cosZ = Math.cos(this.portRotZ);

    const transform3D = (vx, vy, vz) => {
      const x1 = vx * cosY + vz * sinY;
      const z1 = -vx * sinY + vz * cosY;
      const y2 = vy * cosX - z1 * sinX;
      const z2 = vy * sinX + z1 * cosX;
      const x3 = x1 * cosZ - y2 * sinZ;
      const y3 = x1 * sinZ + y2 * cosZ;

      const scale = fov / (fov - z2 + camDist);
      return {
        x: cx + x3 * scale,
        y: cy + y3 * scale,
        z: z2,
        scale
      };
    };

    const toBluePalette = (r, g, b, isBack) => {
      const lum = (r * 0.35 + g * 0.45 + b * 0.2) / 255;
      const dim = isBack ? 0.72 : 1.0;
      const br = Math.round((10 + Math.pow(lum, 1.35) * 115) * dim);
      const bg = Math.round((32 + Math.pow(lum, 1.15) * 165) * dim);
      const bb = Math.round((135 + Math.pow(lum, 0.75) * 120) * dim);
      return [br, bg, bb];
    };

    const sceneItems = [];

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const vx = (d[0] - 19.5) * 2.95;
      const vy = (d[1] - 16.5) * 4.75;
      const vz = d[2] * 2.6;

      const frontP = transform3D(vx, vy, vz);
      const [fr, fg, fb] = toBluePalette(d[3], d[4], d[5], false);
      sceneItems.push({
        type: 'dot',
        x: frontP.x,
        y: frontP.y,
        z: frontP.z,
        r: fr,
        g: fg,
        b: fb
      });

      if (d[2] > 1.5 && ((i & 1) === 0)) {
        const backP = transform3D(vx, vy, -vz * 0.85);
        const [br, bg, bb] = toBluePalette(d[3], d[4], d[5], true);
        sceneItems.push({
          type: 'dot',
          x: backP.x,
          y: backP.y,
          z: backP.z,
          r: br,
          g: bg,
          b: bb
        });
      }
    }

    const orbitRadius = 74;
    const ringSteps = 120;
    for (let s = 0; s < ringSteps; s++) {
      if (s % 4 === 0) continue;
      const theta = (s / ringSteps) * Math.PI * 2;
      const rx = Math.cos(theta) * orbitRadius;
      const ry = Math.sin(theta) * orbitRadius * 0.35;
      const rz = Math.sin(theta) * orbitRadius;
      const rp = transform3D(rx, ry, rz);
      sceneItems.push({
        type: 'ring',
        x: rp.x,
        y: rp.y,
        z: rp.z
      });
    }

    const moonTheta = this.orbitAngle * 1.5;
    const moonP = transform3D(
      Math.cos(moonTheta) * orbitRadius,
      Math.sin(moonTheta) * orbitRadius * 0.35,
      Math.sin(moonTheta) * orbitRadius
    );
    sceneItems.push({
      type: 'moon',
      x: moonP.x,
      y: moonP.y,
      z: moonP.z,
      scale: moonP.scale
    });

    sceneItems.sort((a, b) => a.z - b.z);

    for (let i = 0; i < sceneItems.length; i++) {
      const item = sceneItems[i];
      const px = Math.round(item.x);
      const py = Math.round(item.y);

      if (item.type === 'ring') {
        if (px <= minX || px >= maxX || py <= minY || py >= maxY) continue;
        const col = item.z > 0 ? 1 : 7;
        this.setFbPixel(px, py, col, true);
        this.setFbPixel(px + 1, py, col, true);
        this.setFbPixel(px, py + 1, col, true);
        if (item.z > 0) {
          this.setFbPixel(px + 1, py + 1, col, true);
        }
        continue;
      }

      if (item.type === 'moon') {
        const mR = Math.max(5, Math.round(8 * item.scale));
        for (let dy = -mR; dy <= mR; dy++) {
          for (let dx = -mR; dx <= mR; dx++) {
            const d2 = dx * dx + dy * dy;
            if (d2 <= mR * mR) {
              const mx = px + dx;
              const my = py + dy;
              if (mx <= minX || mx >= maxX || my <= minY || my >= maxY) continue;
              const nz = Math.sqrt(Math.max(0, mR * mR - d2)) / mR;
              const light = (-dx / mR) * 0.4 + (-dy / mR) * 0.4 + nz * 0.85;
              const col = light > 0.65 ? 11 : (light > 0.28 ? 9 : 1);
              this.setFbPixel(mx, my, col, true);
            }
          }
        }
        continue;
      }

      if (px <= minX || px >= maxX || py <= minY || py >= maxY) {
        continue;
      }

      const depthBoost = Math.max(0.65, Math.min(1.25, 0.94 + item.z / 70));
      const rr = Math.min(245, Math.round(item.r * depthBoost));
      const gg = Math.min(245, Math.round(item.g * depthBoost));
      const bb = Math.min(255, Math.round(item.b * depthBoost));

      this.setFbRGB(px, py, rr, gg, bb, true);
      this.setFbRGB(px + 1, py, rr, gg, bb, true);
      this.setFbRGB(px, py + 1, rr, gg, bb, true);
      if (item.z > 0) {
        this.setFbRGB(px + 1, py + 1, rr, gg, bb, true);
      }
    }
  }

  renderRightCommandPanel() {
    for (let r = 2; r <= 58; r++) {
      this.putCell(56, r, '│', 1, 15);
    }

    this.putString(58, 2, 'COMMANDS', 1, 15);

    this.putString(58, 4, ' CREATE <name>      ', 15, 1, 20);
    this.putString(58, 6, ' EDIT <name>        ', 15, 9, 20);
    this.putString(58, 8, ' EXECUTE <name>     ', 15, 8, 20);
    this.putString(58, 10, ' DELETE <name>      ', 1, 7, 20);

    this.putString(58, 12, '────────────────────', 7, 15, 20);
    this.putString(58, 13, 'FILES', 1, 15);

    const files = Object.keys(this.lua.files).sort();
    for (let i = 0; i < Math.min(files.length, 12); i++) {
      const f = files[i];
      const isEven = i % 2 === 0;
      const fFg = isEven ? 1 : 15;
      const fBg = isEven ? 7 : 8;
      this.putString(58, 14 + i, ` ${f.padEnd(18, ' ')} `, fFg, fBg, 20);
    }

    this.renderPortrait3D();

    const roll1Fg = this.flashPhase ? 15 : 1;
    const roll1Bg = this.flashPhase ? 1 : 15;
    const roll2Fg = this.flashPhase ? 1 : 15;
    const roll2Bg = this.flashPhase ? 15 : 1;

    this.putCell(57, 57, '[', roll1Fg, roll1Bg);
    this.putCell(78, 57, ']', roll1Fg, roll1Bg);
    this.renderPixelMarquee(
      58,
      20,
      57,
      'im the best programmer on earth .. ',
      -this.spinPixelOffset,
      roll1Fg,
      roll1Bg
    );

    this.putCell(57, 58, '[', roll2Fg, roll2Bg);
    this.putCell(78, 58, ']', roll2Fg, roll2Bg);
    this.renderPixelMarquee(
      58,
      20,
      58,
      'thats why god chose me .. ',
      this.spinPixelOffset,
      roll2Fg,
      roll2Bg
    );
  }

  renderShellFrame() {
    this.fillBackground(this.defaultBg);
    this.renderTopBar();
    this.renderWindowBorder();
    this.renderRightCommandPanel();

    const paneWidth = 54;
    const activePrefix = this.waitingForStdin ? this.stdinPrefix : this.promptText;
    const fullPrompt = activePrefix + this.inputBuffer;
    const promptChunks = [];
    for (let i = 0; i < Math.max(1, fullPrompt.length); i += paneWidth) {
      promptChunks.push(fullPrompt.slice(i, i + paneWidth));
    }

    const availRows = 55;
    const maxHistoryRows = Math.max(1, availRows - promptChunks.length);
    const endIdx = Math.max(0, this.lines.length - this.scrollOffset);
    const startIdx = Math.max(0, endIdx - maxHistoryRows);
    const visibleLines = this.lines.slice(startIdx, endIdx);

    let screenRow = 2;
    for (const lineObj of visibleLines) {
      this.putString(1, screenRow, lineObj.text, lineObj.fg, lineObj.bg, paneWidth);
      screenRow++;
    }

    if (this.scrollOffset === 0 && (!this.busy || this.waitingForStdin)) {
      const promptStartRow = screenRow;
      const hasSel = this.hasShellSelection();
      const selMin = hasSel ? Math.min(this.shellSelStart, this.shellSelEnd) : -1;
      const selMax = hasSel ? Math.max(this.shellSelStart, this.shellSelEnd) : -1;

      for (let cIdx = 0; cIdx < promptChunks.length; cIdx++) {
        if (promptStartRow + cIdx > 56) break;
        const textChunk = promptChunks[cIdx];
        for (let i = 0; i < textChunk.length; i++) {
          const globalPos = cIdx * paneWidth + i;
          const isPromptPart = globalPos < activePrefix.length;
          const inputIdx = globalPos - activePrefix.length;
          const isSelected = !isPromptPart && hasSel && inputIdx >= selMin && inputIdx < selMax;
          const cellFg = isSelected ? 15 : (isPromptPart ? 1 : 0);
          const cellBg = isSelected ? 9 : this.defaultBg;
          this.putCell(1 + i, promptStartRow + cIdx, textChunk[i], cellFg, cellBg);
        }
      }

      if (this.cursorBlink) {
        const totalCursorIdx = activePrefix.length + this.cursorPos;
        const cRow = promptStartRow + Math.floor(totalCursorIdx / paneWidth);
        const cCol = 1 + (totalCursorIdx % paneWidth);
        if (cRow <= 56 && cCol <= 55) {
          const chUnder = this.inputBuffer[this.cursorPos] || ' ';
          this.putCell(cCol, cRow, chUnder, 15, 1);
        }
      }
    }

    const bigFg = 15;
    const bigBg = 1;
    this.putCell(1, 57, '╔', bigFg, bigBg);
    this.putCell(1, 58, '╚', bigFg, bigBg);
    this.putCell(55, 57, '╗', bigFg, bigBg);
    this.putCell(55, 58, '╝', bigFg, bigBg);
    this.renderBigPixelMarquee(
      2,
      53,
      57,
      'PRAISE_TEED_PRAISE_SKIDS_',
      this.spinPixelOffset * 2,
      bigFg,
      bigBg
    );

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

  colorizeLuaLine(lineText) {
    const chars = [];
    let i = 0;
    while (i < lineText.length) {
      const ch = lineText[i];
      const next = lineText[i + 1];

      if (ch === '-' && next === '-') {
        const isHeaderTag = lineText[i + 2] === '!';
        const commentFg = isHeaderTag ? 3 : 2;
        while (i < lineText.length) {
          chars.push({ ch: lineText[i++], fg: commentFg });
        }
        break;
      }

      if (ch === '"' || ch === "'") {
        const q = ch;
        chars.push({ ch: lineText[i++], fg: 4 });
        while (i < lineText.length && lineText[i] !== q) {
          if (lineText[i] === '\\' && i + 1 < lineText.length) {
            chars.push({ ch: lineText[i++], fg: 6 });
            chars.push({ ch: lineText[i++], fg: 6 });
            continue;
          }
          chars.push({ ch: lineText[i++], fg: 4 });
        }
        if (i < lineText.length) chars.push({ ch: lineText[i++], fg: 4 });
        continue;
      }

      if (/[0-9]/.test(ch)) {
        while (i < lineText.length && /[0-9.xXa-fA-FeE+-]/.test(lineText[i])) {
          chars.push({ ch: lineText[i++], fg: 5 });
        }
        continue;
      }

      if (/[a-zA-Z_]/.test(ch)) {
        const startIdx = i;
        let word = '';
        while (i < lineText.length && /[a-zA-Z0-9_]/.test(lineText[i])) {
          word += lineText[i++];
        }
        let lookahead = i;
        while (lookahead < lineText.length && lineText[lookahead] === ' ') lookahead++;
        const isCall = lineText[lookahead] === '(' || lineText[lookahead] === '"' || lineText[lookahead] === '{';
        const prevChar = startIdx > 0 ? lineText[startIdx - 1] : '';

        let fg = 0;
        if (LUA_CONTROL_KEYWORDS.has(word)) fg = 5;
        else if (LUA_STORAGE_KEYWORDS.has(word)) fg = 1;
        else if (LUA_CONSTANT_KEYWORDS.has(word)) fg = 9;
        else if (LUA_BUILTINS.has(word)) fg = 3;
        else if (isCall) fg = 6;
        else if (prevChar === '.' || prevChar === ':') fg = 3;

        for (const wc of word) chars.push({ ch: wc, fg });
        continue;
      }

      if ('()[]{}'.includes(ch)) {
        chars.push({ ch: lineText[i++], fg: 1 });
        continue;
      }

      chars.push({ ch: lineText[i++], fg: 8 });
    }
    return chars;
  }

  isCellSelected(row, col, normSel) {
    if (!normSel) return false;
    if (row < normSel.startRow || row > normSel.endRow) return false;
    if (normSel.startRow === normSel.endRow) {
      return col >= normSel.startCol && col < normSel.endCol;
    }
    if (row === normSel.startRow) return col >= normSel.startCol;
    if (row === normSel.endRow) return col < normSel.endCol;
    return true;
  }

  renderEditorSuggestionsPopup(curScreenRow) {
    if (this.suggestions.length === 0) {
      this.suggestPopupRect = null;
      return;
    }

    const activeItem = this.suggestions[this.suggestIndex] || this.suggestions[0];
    const curLine = this.edLines[this.edRow] || '';
    if (
      activeItem &&
      this.edCol === curLine.length &&
      activeItem.label.toLowerCase().startsWith(this.suggestPrefix.toLowerCase())
    ) {
      const ghostSuffix = activeItem.insert.split('\n')[0].slice(this.suggestPrefix.length);
      const startGhostCol = 5 + this.edCol;
      for (let g = 0; g < ghostSuffix.length && startGhostCol + g <= 77; g++) {
        this.putCell(startGhostCol + g, curScreenRow, ghostSuffix[g], 7, 15);
      }
    }

    const boxW = 26;
    const boxH = this.suggestions.length + 2;
    const anchorCol = Math.min(79 - boxW, Math.max(5, 5 + this.suggestStartCol));
    const anchorRow = (curScreenRow + 1 + boxH <= 55)
      ? curScreenRow + 1
      : Math.max(3, curScreenRow - boxH);

    this.suggestPopupRect = {
      col: anchorCol,
      row: anchorRow,
      width: boxW,
      height: boxH
    };

    this.putCell(anchorCol, anchorRow, '┌', 1, 15);
    for (let c = 1; c < boxW - 1; c++) this.putCell(anchorCol + c, anchorRow, '─', 1, 15);
    this.putCell(anchorCol + boxW - 1, anchorRow, '┐', 1, 15);

    for (let i = 0; i < this.suggestions.length; i++) {
      const item = this.suggestions[i];
      const r = anchorRow + 1 + i;
      const isSelected = i === this.suggestIndex;
      const rowFg = isSelected ? 15 : 1;
      const rowBg = isSelected ? 1 : 15;
      const kindFg = isSelected ? 11 : 8;

      this.putCell(anchorCol, r, '│', 1, 15);
      const labelText = ` ${item.label}`.slice(0, boxW - 7).padEnd(boxW - 7, ' ');
      const kindText = `${item.kind.padStart(4, ' ')} `;
      this.putString(anchorCol + 1, r, labelText, rowFg, rowBg, boxW - 7);
      this.putString(anchorCol + 1 + labelText.length, r, kindText, kindFg, rowBg, 5);
      this.putCell(anchorCol + boxW - 1, r, '│', 1, 15);
    }

    const botR = anchorRow + boxH - 1;
    this.putCell(anchorCol, botR, '└', 1, 15);
    for (let c = 1; c < boxW - 1; c++) this.putCell(anchorCol + c, botR, '─', 1, 15);
    this.putCell(anchorCol + boxW - 1, botR, '┘', 1, 15);
  }

  renderEditorFrame() {
    this.fillBackground(15);
    this.renderTopBar();
    this.renderWindowBorder();

    this.putString(1, 2, ' '.repeat(78), 15, 8, 78);
    const tabTitle = ` ✎ ${this.edFilename} `;
    this.putString(1, 2, tabTitle, 15, 1);
    this.putString(1 + tabTitle.length + 1, 2, this.edStatus, 15, 8, 76 - tabTitle.length);

    const normSel = this.getNormalizedSelection();
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

      const rawLine = this.edLines[lineIdx] || '';
      const colored = this.colorizeLuaLine(rawLine);
      const maxCols = Math.max(colored.length + 1, 73);

      for (let c = 0; c < Math.min(maxCols, 73); c++) {
        const selected = this.isCellSelected(lineIdx, c, normSel);
        if (c < colored.length) {
          this.putCell(5 + c, screenRow, colored[c].ch, selected ? 1 : colored[c].fg, selected ? 11 : 15);
        } else if (selected && c === colored.length) {
          this.putCell(5 + c, screenRow, ' ', 1, 11);
        }
      }
    }

    const curScreenRow = 3 + (this.edRow - this.edScrollY);
    const curScreenCol = 5 + Math.min(73, this.edCol);

    if (curScreenRow >= 3 && curScreenRow <= 55) {
      this.renderEditorSuggestionsPopup(curScreenRow);
      if (this.cursorBlink) {
        const ch = (this.edLines[this.edRow] || '')[this.edCol] || ' ';
        this.putCell(curScreenCol, curScreenRow, ch, 15, 1);
      }
    }

    const posInfo = ` Ln ${this.edRow + 1}, Col ${this.edCol + 1} | ^A: Select All | ^C/^V: Copy/Paste | Tab: Jump/Complete `.padEnd(78, ' ');
    this.putString(1, 56, posInfo, 15, 1, 78);

    this.putString(1, 57, ' '.repeat(78), 1, 7, 78);
    this.putString(1, 58, ' '.repeat(78), 1, 7, 78);

    this.putString(2, 57, '^S', 15, 1);
    this.putString(5, 57, 'Save Browser', 0, 7);
    this.putString(22, 57, 'F5', 15, 1);
    this.putString(25, 57, 'Execute Lua', 0, 7);
    this.putString(42, 57, '^A', 15, 1);
    this.putString(45, 57, 'Select All', 0, 7);
    this.putString(58, 57, 'File', 15, 1);
    this.putString(63, 57, 'Top-Left Menu', 0, 7);

    this.putString(2, 58, '^C', 15, 1);
    this.putString(5, 58, 'Copy / ^V Paste', 0, 7);
    this.putString(22, 58, '^R', 15, 1);
    this.putString(25, 58, 'Compile+Run', 0, 7);
    this.putString(42, 58, '^K', 15, 1);
    this.putString(45, 58, 'Cut Line', 0, 7);
    this.putString(58, 58, 'Esc', 15, 1);
    this.putString(62, 58, 'Save & Exit', 0, 7);
  }

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

  startRenderLoop() {
    setInterval(() => {
      this.cursorBlink = !this.cursorBlink;
      this.flashPhase = !this.flashPhase;
    }, 420);

    const tick = () => {
      this.frameCount++;
      this.spinPixelOffset = (this.spinPixelOffset + 1) & 0x3FFFFFFF;
      this.orbitAngle += 0.035;

      if (this.frameCount % 95 === 0) {
        this.portTargetVelY = (Math.random() > 0.25 ? 1 : -1) * (0.014 + Math.random() * 0.024);
        this.portTargetVelX = (Math.random() - 0.5) * 0.022;
        this.portTargetVelZ = (Math.random() - 0.5) * 0.014;
      }

      this.portVelX += (this.portTargetVelX - this.portVelX) * 0.025;
      this.portVelY += (this.portTargetVelY - this.portVelY) * 0.025;
      this.portVelZ += (this.portTargetVelZ - this.portVelZ) * 0.025;

      this.portRotY += this.portVelY;
      this.portRotX = Math.max(-0.55, Math.min(0.55, this.portRotX + this.portVelX));
      if (Math.abs(this.portRotX) >= 0.54) this.portTargetVelX = -this.portTargetVelX;
      this.portRotZ = Math.max(-0.35, Math.min(0.35, this.portRotZ + this.portVelZ));
      if (Math.abs(this.portRotZ) >= 0.34) this.portTargetVelZ = -this.portTargetVelZ;

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
