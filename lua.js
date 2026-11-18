class TempleLuaCompiler {
  constructor(terminal) {
    this.term = terminal;
    this.storageKey = 'fourthtemple_lua_files_v4';
    this.files = this.loadFiles();
    this.virtualServers = new Map();
    this.globals = {};
    this.metatables = new WeakMap();
    this.initDefaultServers();
    this.initLuaEnvironment();
  }

  normalizeFilename(name) {
    const clean = String(name || 'main').trim().replace(/^["']|["']$/g, '');
    if (!clean) return 'main.lua';
    return clean.toLowerCase().endsWith('.lua') ? clean : `${clean}.lua`;
  }

  loadFiles() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return this.defaultFiles();
  }

  saveFiles() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.files));
    } catch (e) {}
  }

  defaultFiles() {
    return {
      'mrrobot.lua': `--!mrrobot.lua
io.write("Enter target alias: ")
local alias = io.read()
if not alias or alias == "" then
  alias = "elliot"
end
print("Initializing session for " .. string.upper(alias))

local socket = require("socket")
local srv = socket.bind("127.0.0.1", 9090)
srv:on_request(function(payload)
  return "FSOCIETY_ACK:" .. string.upper(payload)
end)

local tcp = socket.tcp()
local ok, err = tcp:connect("127.0.0.1", 9090)
if ok then
  tcp:send("hello " .. alias)
  local reply = tcp:receive("*l")
  print("Received:", reply)
  tcp:close()
end
srv:close()
`
    };
  }

  initDefaultServers() {
    this.virtualServers.set(7, {
      host: '127.0.0.1',
      port: 7,
      name: 'echo-d',
      handler: (data) => `ECHO: ${String(data).replace(/\r?\n$/, '')}`
    });

    this.virtualServers.set(13, {
      host: '127.0.0.1',
      port: 13,
      name: 'daytime-d',
      handler: () => new Date().toUTCString()
    });

    this.virtualServers.set(80, {
      host: '127.0.0.1',
      port: 80,
      name: 'httpd-lua',
      handler: (req) => {
        const firstLine = String(req).split('\n')[0] || 'GET / HTTP/1.1';
        return `HTTP/1.1 200 OK\r\nServer: FourthTemple-Lua\r\nContent-Type: text/plain\r\n\r\nOK from 127.0.0.1:80 (${firstLine.trim()})`;
      }
    });
  }

  makeLuaError(line, message) {
    const err = new Error(message);
    err.luaLine = line || 1;
    return err;
  }

  luaPatternToRegExp(pat, global = false) {
    let s = String(pat);
    let anchoredStart = false;
    let anchoredEnd = false;
    if (s.startsWith('^')) {
      anchoredStart = true;
      s = s.slice(1);
    }
    if (s.endsWith('$') && !s.endsWith('%$')) {
      anchoredEnd = true;
      s = s.slice(0, -1);
    }

    let out = anchoredStart ? '^' : '';
    let inBracket = false;

    const classMap = {
      a: '[a-zA-Z]',
      A: '[^a-zA-Z]',
      c: '[\\x00-\\x1f\\x7f]',
      C: '[^\\x00-\\x1f\\x7f]',
      d: '[0-9]',
      D: '[^0-9]',
      l: '[a-z]',
      L: '[^a-z]',
      p: '[!-/:-@\\[-`{-~]',
      P: '[^!-/:-@\\[-`{-~]',
      s: '\\s',
      S: '\\S',
      u: '[A-Z]',
      U: '[^A-Z]',
      w: '[a-zA-Z0-9]',
      W: '[^a-zA-Z0-9]',
      x: '[0-9a-fA-F]',
      X: '[^0-9a-fA-F]',
      z: '\\x00',
      Z: '[^\\x00]'
    };

    const classInsideBracket = {
      a: 'a-zA-Z',
      d: '0-9',
      l: 'a-z',
      s: '\\s',
      u: 'A-Z',
      w: 'a-zA-Z0-9',
      x: '0-9a-fA-F'
    };

    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '%') {
        const next = s[++i] || '';
        if (inBracket && classInsideBracket[next]) {
          out += classInsideBracket[next];
        } else if (!inBracket && classMap[next]) {
          out += classMap[next];
        } else {
          out += '\\' + next;
        }
        continue;
      }
      if (ch === '[') {
        inBracket = true;
        out += '[';
        continue;
      }
      if (ch === ']') {
        inBracket = false;
        out += ']';
        continue;
      }
      if (!inBracket && ch === '-' && i > 0 && !['^', '('].includes(s[i - 1])) {
        out += '*?';
        continue;
      }
      if ('\\^${}|'.includes(ch)) {
        out += '\\' + ch;
        continue;
      }
      out += ch;
    }

    if (anchoredEnd) out += '$';
    try {
      return new RegExp(out, global ? 'g' : '');
    } catch {
      const escaped = String(pat).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(escaped, global ? 'g' : '');
    }
  }

  compileLuaToJS(luaSource, chunkName = 'stdin') {
    const startTime = performance.now();
    const tokens = this.tokenizeLua(luaSource, chunkName);
    this.validateLuaSyntax(tokens);
    const jsBody = this.translateTokensToJS(tokens);
    const compileTimeUs = Math.max(1, Math.round((performance.now() - startTime) * 1000));

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    let fn;
    try {
      fn = new AsyncFunction('__env', '...__varargs', `with (__env) {\n${jsBody}\n}`);
    } catch (err) {
      const detectedLine = this.detectSyntaxErrorLine(luaSource, err.message);
      throw this.makeLuaError(detectedLine, `Syntax error near line ${detectedLine}: ${err.message}`);
    }

    return {
      chunkName,
      fn,
      jsBody,
      compileTimeUs,
      sourceSize: luaSource.length
    };
  }

  detectSyntaxErrorLine(luaSource) {
    const rawLines = luaSource.replace(/\r\n/g, '\n').split('\n');
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    for (let i = 0; i < rawLines.length; i++) {
      const single = rawLines[i].trim();
      if (!single) continue;
      if (/^(if|elseif|else|for|while|repeat|until|function|local\s+function|do|end)\b/.test(single)) {
        continue;
      }
      try {
        const toks = this.tokenizeLua(single, 'line');
        const js = this.translateTokensToJS(toks);
        new AsyncFunction('__env', '...__varargs', `with (__env) {\n${js}\n}`);
      } catch {
        return i + 1;
      }
    }
    return 1;
  }

  validateLuaSyntax(tokens) {
    const blockStack = [];
    const bracketStack = [];
    const lines = this.splitTokenLines(tokens);

    for (const lineToks of lines) {
      if (lineToks.length === 0) continue;
      const lineNum = lineToks[0].line || 1;
      const first = lineToks[0];
      const last = lineToks[lineToks.length - 1];

      if (first.type === 'kw' && (first.value === 'if' || first.value === 'elseif')) {
        const hasThen = lineToks.some(t => t.type === 'kw' && t.value === 'then');
        if (!hasThen) {
          throw this.makeLuaError(lineNum, `'then' expected near '${last.value}'`);
        }
      }

      if (first.type === 'kw' && (first.value === 'while' || first.value === 'for')) {
        const hasDo = lineToks.some(t => t.type === 'kw' && t.value === 'do');
        if (!hasDo) {
          throw this.makeLuaError(lineNum, `'do' expected near '${last.value}'`);
        }
      }

      if (['+', '-', '*', '/', '//', '..', '==', '~=', '<=', '>=', '<', '>', '='].includes(last.value)) {
        throw this.makeLuaError(lineNum, `unexpected end of line after '${last.value}'`);
      }
    }

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.type === 'nl') continue;

      if (t.value === '(' || t.value === '[' || t.value === '{') {
        bracketStack.push({ ch: t.value, line: t.line });
      } else if (t.value === ')' || t.value === ']' || t.value === '}') {
        const expected = t.value === ')' ? '(' : (t.value === ']' ? '[' : '{');
        const top = bracketStack.pop();
        if (!top || top.ch !== expected) {
          throw this.makeLuaError(t.line, `unmatched '${t.value}'`);
        }
      }

      if (t.type === 'kw') {
        if (['function', 'if', 'for', 'while'].includes(t.value)) {
          blockStack.push({ kw: t.value, line: t.line });
        } else if (t.value === 'do') {
          let isLoopDo = false;
          for (let back = i - 1; back >= 0; back--) {
            if (tokens[back].type === 'nl') break;
            if (tokens[back].type === 'kw' && (tokens[back].value === 'for' || tokens[back].value === 'while')) {
              isLoopDo = true;
              break;
            }
          }
          if (!isLoopDo) {
            blockStack.push({ kw: 'do', line: t.line });
          }
        } else if (t.value === 'repeat') {
          blockStack.push({ kw: 'repeat', line: t.line });
        } else if (t.value === 'end') {
          const top = blockStack.pop();
          if (!top || top.kw === 'repeat') {
            throw this.makeLuaError(t.line, `unexpected 'end'`);
          }
        } else if (t.value === 'until') {
          const top = blockStack.pop();
          if (!top || top.kw !== 'repeat') {
            throw this.makeLuaError(t.line, `'until' without matching 'repeat'`);
          }
        }
      }
    }

    if (bracketStack.length > 0) {
      const unclosed = bracketStack[bracketStack.length - 1];
      throw this.makeLuaError(unclosed.line, `unclosed '${unclosed.ch}'`);
    }

    if (blockStack.length > 0) {
      const unclosed = blockStack[blockStack.length - 1];
      const expected = unclosed.kw === 'repeat' ? 'until' : 'end';
      throw this.makeLuaError(unclosed.line, `'${expected}' expected (to close '${unclosed.kw}' at line ${unclosed.line})`);
    }
  }

  tokenizeLua(src) {
    const tokens = [];
    let i = 0;
    let line = 1;

    while (i < src.length) {
      const ch = src[i];
      const next = src[i + 1];

      if (ch === '\n') {
        tokens.push({ type: 'nl', value: '\n', line });
        line++;
        i++;
        continue;
      }
      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      if (ch === '-' && next === '-') {
        if (src.slice(i + 2, i + 4) === '[[') {
          const endIdx = src.indexOf(']]', i + 4);
          if (endIdx === -1) break;
          const chunk = src.slice(i + 4, endIdx);
          line += (chunk.match(/\n/g) || []).length;
          i = endIdx + 2;
          continue;
        }
        while (i < src.length && src[i] !== '\n') i++;
        continue;
      }

      if (ch === '[' && next === '[') {
        const startLine = line;
        const endIdx = src.indexOf(']]', i + 2);
        if (endIdx === -1) throw this.makeLuaError(startLine, `unfinished long string`);
        const raw = src.slice(i + 2, endIdx);
        line += (raw.match(/\n/g) || []).length;
        tokens.push({ type: 'string', value: JSON.stringify(raw), line: startLine });
        i = endIdx + 2;
        continue;
      }

      if (ch === '"' || ch === "'") {
        const quote = ch;
        const startLine = line;
        let str = '';
        i++;
        while (i < src.length && src[i] !== quote) {
          if (src[i] === '\n') {
            throw this.makeLuaError(startLine, `unfinished string near '${str.slice(0, 16)}'`);
          }
          if (src[i] === '\\' && i + 1 < src.length) {
            str += src[i] + src[i + 1];
            i += 2;
          } else {
            str += src[i++];
          }
        }
        if (i >= src.length) {
          throw this.makeLuaError(startLine, `unfinished string near '${str.slice(0, 16)}'`);
        }
        i++;
        tokens.push({ type: 'string', value: `"${str.replace(/"/g, '\\"')}"`, line: startLine });
        continue;
      }

      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(next || ''))) {
        let num = '';
        if (ch === '0' && (next === 'x' || next === 'X')) {
          num = '0x';
          i += 2;
          while (i < src.length && /[0-9a-fA-F]/.test(src[i])) num += src[i++];
        } else {
          while (i < src.length && /[0-9.eE+-]/.test(src[i])) {
            if ((src[i] === '+' || src[i] === '-') && !/[eE]/.test(num[num.length - 1] || '')) break;
            num += src[i++];
          }
        }
        tokens.push({ type: 'number', value: num, line });
        continue;
      }

      const three = src.slice(i, i + 3);
      if (three === '...') {
        tokens.push({ type: 'op', value: '...', line });
        i += 3;
        continue;
      }

      const two = src.slice(i, i + 2);
      if (['==', '~=', '<=', '>=', '..', '//', '<<', '>>'].includes(two)) {
        tokens.push({ type: 'op', value: two, line });
        i += 2;
        continue;
      }

      if ('+-*/%^#=&|~<>();{},.[]:;'.includes(ch)) {
        tokens.push({ type: 'punct', value: ch, line });
        i++;
        continue;
      }

      if (/[a-zA-Z_]/.test(ch)) {
        let id = '';
        while (i < src.length && /[a-zA-Z0-9_]/.test(src[i])) id += src[i++];
        const keywords = new Set([
          'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
          'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat',
          'return', 'then', 'true', 'until', 'while'
        ]);
        tokens.push({
          type: keywords.has(id) ? 'kw' : 'id',
          value: id,
          line
        });
        continue;
      }

      throw this.makeLuaError(line, `unexpected symbol '${ch}'`);
    }

    return tokens;
  }

  translateTokensToJS(tokens) {
    const cleanTokens = tokens.filter(t => t.type !== 'nl');
    if (cleanTokens.length === 0) return '';

    const isStatementStart = cleanTokens[0].type === 'kw' &&
      ['local', 'if', 'for', 'while', 'repeat', 'function', 'return', 'do'].includes(cleanTokens[0].value);

    let hasTopAssign = false;
    let depth = 0;
    for (const t of cleanTokens) {
      if (['(', '{', '['].includes(t.value)) depth++;
      if ([')', '}', ']'].includes(t.value)) depth--;
      if (depth === 0 && t.value === '=') hasTopAssign = true;
    }

    const lines = this.splitTokenLines(tokens);
    const translatedLines = [];
    const blockStack = [];

    for (let lIdx = 0; lIdx < lines.length; lIdx++) {
      const lineToks = lines[lIdx];
      if (lineToks.length === 0) continue;

      const first = lineToks[0];
      const lineNum = first.line || 1;
      const trackLine = `__line = ${lineNum}; `;

      if (first.type === 'kw' && first.value === 'do' && lineToks.length === 1) {
        translatedLines.push(`${trackLine}{`);
        blockStack.push('do');
        continue;
      }

      if (first.type === 'kw' && first.value === 'local' && lineToks[1] && lineToks[1].value === 'function') {
        const fnName = lineToks[2].value;
        const paramsJs = this.translateParamList(lineToks.slice(3), false);
        translatedLines.push(`${trackLine}let ${fnName} = async function ${paramsJs} {`);
        blockStack.push('function');
        continue;
      }

      if (first.type === 'kw' && first.value === 'function') {
        const pIdx = lineToks.findIndex(t => t.value === '(');
        if (pIdx !== -1) {
          const nameToks = lineToks.slice(1, pIdx);
          const hasColon = nameToks.some(t => t.value === ':');
          const fnName = nameToks.map(t => (t.value === ':' ? '.' : t.value)).join('');
          const paramsJs = this.translateParamList(lineToks.slice(pIdx), hasColon);
          if (hasColon) {
            translatedLines.push(`${trackLine}${fnName} = Object.assign(async function ${paramsJs} {`);
            blockStack.push('colon_function');
          } else {
            translatedLines.push(`${trackLine}${fnName} = async function ${paramsJs} {`);
            blockStack.push('function');
          }
          continue;
        }
      }

      if (first.type === 'kw' && first.value === 'local') {
        const eqIdx = lineToks.findIndex(t => t.value === '=');
        if (eqIdx === -1) {
          const vars = lineToks.slice(1).filter(t => t.value !== ',').map(t => t.value);
          translatedLines.push(`${trackLine}let ${vars.map(v => `${v} = null`).join(', ')};`);
        } else {
          const lhs = lineToks.slice(1, eqIdx).filter(t => t.value !== ',').map(t => t.value);
          const rhsParts = this.splitByTopLevelComma(lineToks.slice(eqIdx + 1));
          if (lhs.length === 1 && rhsParts.length === 1) {
            const rhs = this.tokensToExpr(rhsParts[0]);
            translatedLines.push(`${trackLine}let ${lhs[0]} = __first(${rhs});`);
          } else if (rhsParts.length === 1) {
            const rhs = this.tokensToExpr(rhsParts[0]);
            translatedLines.push(`${trackLine}let [${lhs.join(', ')}] = __multi(${rhs});`);
          } else {
            const rhsList = rhsParts.map(p => `__first(${this.tokensToExpr(p)})`).join(', ');
            translatedLines.push(`${trackLine}let [${lhs.join(', ')}] = [${rhsList}];`);
          }
        }
        continue;
      }

      if (first.type === 'kw' && first.value === 'if') {
        const thenIdx = lineToks.findIndex(t => t.type === 'kw' && t.value === 'then');
        const condToks = thenIdx !== -1 ? lineToks.slice(1, thenIdx) : lineToks.slice(1);
        const condExpr = this.tokensToExpr(condToks);

        if (thenIdx !== -1 && thenIdx < lineToks.length - 1) {
          const afterThen = lineToks.slice(thenIdx + 1);
          const hasEndAtTail = afterThen[afterThen.length - 1].type === 'kw' && afterThen[afterThen.length - 1].value === 'end';
          const innerToks = hasEndAtTail ? afterThen.slice(0, -1) : afterThen;
          const innerJs = this.translateTokensToJS(innerToks);
          if (hasEndAtTail) {
            translatedLines.push(`${trackLine}if (__truthy(${condExpr})) { ${innerJs} }`);
          } else {
            translatedLines.push(`${trackLine}if (__truthy(${condExpr})) { ${innerJs}`);
            blockStack.push('if');
          }
        } else {
          translatedLines.push(`${trackLine}if (__truthy(${condExpr})) {`);
          blockStack.push('if');
        }
        continue;
      }

      if (first.type === 'kw' && first.value === 'elseif') {
        const thenIdx = lineToks.findIndex(t => t.type === 'kw' && t.value === 'then');
        const condToks = thenIdx !== -1 ? lineToks.slice(1, thenIdx) : lineToks.slice(1);
        translatedLines.push(`} else if ((__line = ${lineNum}, __truthy(${this.tokensToExpr(condToks)}))) {`);
        continue;
      }

      if (first.type === 'kw' && first.value === 'else') {
        translatedLines.push(`} else {`);
        continue;
      }

      if (first.type === 'kw' && first.value === 'while') {
        const doIdx = lineToks.findIndex(t => t.type === 'kw' && t.value === 'do');
        const condToks = doIdx !== -1 ? lineToks.slice(1, doIdx) : lineToks.slice(1);
        translatedLines.push(`${trackLine}while (__truthy(${this.tokensToExpr(condToks)})) {`);
        blockStack.push('while');
        continue;
      }

      if (first.type === 'kw' && first.value === 'repeat') {
        translatedLines.push(`${trackLine}do {`);
        blockStack.push('repeat');
        continue;
      }
      if (first.type === 'kw' && first.value === 'until') {
        const condExpr = this.tokensToExpr(lineToks.slice(1));
        blockStack.pop();
        translatedLines.push(`${trackLine}} while (!__truthy(${condExpr}));`);
        continue;
      }

      if (first.type === 'kw' && first.value === 'for') {
        const doIdx = lineToks.findIndex(t => t.type === 'kw' && t.value === 'do');
        const headerToks = doIdx !== -1 ? lineToks.slice(1, doIdx) : lineToks.slice(1);
        const inIdx = headerToks.findIndex(t => t.type === 'kw' && t.value === 'in');
        const eqIdx = headerToks.findIndex(t => t.value === '=');

        let inlineBody = null;
        let closesImmediately = false;
        if (doIdx !== -1 && doIdx < lineToks.length - 1) {
          const afterDo = lineToks.slice(doIdx + 1);
          if (afterDo[afterDo.length - 1].type === 'kw' && afterDo[afterDo.length - 1].value === 'end') {
            closesImmediately = true;
            inlineBody = this.translateTokensToJS(afterDo.slice(0, -1));
          } else {
            inlineBody = this.translateTokensToJS(afterDo);
          }
        }

        if (inIdx !== -1) {
          const vars = headerToks.slice(0, inIdx).filter(t => t.value !== ',').map(t => t.value);
          const iterExpr = this.tokensToExpr(headerToks.slice(inIdx + 1));
          const headerJs = `${trackLine}for (const [${vars.join(', ')}] of __toIterable(${iterExpr})) {`;
          if (closesImmediately) {
            translatedLines.push(`${headerJs} ${inlineBody} }`);
          } else {
            translatedLines.push(headerJs + (inlineBody ? ' ' + inlineBody : ''));
            blockStack.push('for');
          }
        } else if (eqIdx !== -1) {
          const varName = headerToks[0].value;
          const rangeParts = this.splitByTopLevelComma(headerToks.slice(eqIdx + 1));
          const startExpr = this.tokensToExpr(rangeParts[0] || [{ type: 'number', value: '1' }]);
          const stopExpr = this.tokensToExpr(rangeParts[1] || [{ type: 'number', value: '1' }]);
          const stepExpr = rangeParts[2] ? this.tokensToExpr(rangeParts[2]) : '1';
          const headerJs = `${trackLine}for (let ${varName} = Number(${startExpr}), __stop_${varName} = Number(${stopExpr}), __step_${varName} = Number(${stepExpr}); (__step_${varName} >= 0 ? ${varName} <= __stop_${varName} : ${varName} >= __stop_${varName}); ${varName} += __step_${varName}) {`;
          if (closesImmediately) {
            translatedLines.push(`${headerJs} ${inlineBody} }`);
          } else {
            translatedLines.push(headerJs + (inlineBody ? ' ' + inlineBody : ''));
            blockStack.push('for');
          }
        }
        continue;
      }

      if (first.type === 'kw' && first.value === 'end') {
        const closed = blockStack.pop();
        if (closed === 'colon_function') {
          translatedLines.push(`}, { __needsSelf: true });`);
        } else {
          translatedLines.push(`}`);
        }
        continue;
      }

      if (first.type === 'kw' && first.value === 'return') {
        const parts = this.splitByTopLevelComma(lineToks.slice(1));
        if (parts.length === 0) {
          translatedLines.push(`${trackLine}return;`);
        } else if (parts.length === 1) {
          translatedLines.push(`${trackLine}return ${this.tokensToExpr(lineToks.slice(1))};`);
        } else {
          translatedLines.push(`${trackLine}return [${parts.map(p => this.tokensToExpr(p)).join(', ')}];`);
        }
        continue;
      }

      if (first.type === 'kw' && first.value === 'break') {
        translatedLines.push(`${trackLine}break;`);
        continue;
      }

      let topEqIdx = -1;
      let pDepth = 0;
      for (let k = 0; k < lineToks.length; k++) {
        const v = lineToks[k].value;
        if (['(', '{', '['].includes(v)) pDepth++;
        if ([')', '}', ']'].includes(v)) pDepth--;
        if (pDepth === 0 && v === '=') {
          topEqIdx = k;
          break;
        }
      }

      if (topEqIdx !== -1) {
        const lhsParts = this.splitByTopLevelComma(lineToks.slice(0, topEqIdx));
        const rhsParts = this.splitByTopLevelComma(lineToks.slice(topEqIdx + 1));
        if (lhsParts.length > 1) {
          const lhsJs = lhsParts.map(p => this.tokensToExpr(p)).join(', ');
          if (rhsParts.length === 1) {
            translatedLines.push(`${trackLine}[${lhsJs}] = __multi(${this.tokensToExpr(rhsParts[0])});`);
          } else {
            const rhsJs = rhsParts.map(p => `__first(${this.tokensToExpr(p)})`).join(', ');
            translatedLines.push(`${trackLine}[${lhsJs}] = [${rhsJs}];`);
          }
          continue;
        } else {
          const lhsJs = this.tokensToExpr(lhsParts[0]);
          const rhsJs = this.tokensToExpr(lineToks.slice(topEqIdx + 1));
          translatedLines.push(`${trackLine}${lhsJs} = __first(${rhsJs});`);
          continue;
        }
      }

      const exprJs = this.tokensToExpr(lineToks);
      if (lines.length === 1 && !isStatementStart && !hasTopAssign) {
        translatedLines.push(`${trackLine}return (${exprJs});`);
      } else {
        translatedLines.push(`${trackLine}${exprJs};`);
      }
    }

    return translatedLines.join('\n');
  }

  translateParamList(tokens, injectSelf = false) {
    const openIdx = tokens.findIndex(t => t.value === '(');
    const closeIdx = tokens.findIndex(t => t.value === ')');
    if (openIdx === -1 || closeIdx === -1) {
      return injectSelf ? '(self)' : '()';
    }
    const inner = tokens.slice(openIdx + 1, closeIdx).filter(t => t.value !== ',');
    const names = inner.map(t => (t.value === '...' ? '...__varargs' : t.value));
    if (injectSelf) names.unshift('self');
    return `(${names.join(', ')})`;
  }

  splitTokenLines(tokens) {
    const lines = [];
    let current = [];
    let braceDepth = 0;
    let parenDepth = 0;
    let bracketDepth = 0;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.value === '{') braceDepth++;
      if (t.value === '}') braceDepth = Math.max(0, braceDepth - 1);
      if (t.value === '(') parenDepth++;
      if (t.value === ')') parenDepth = Math.max(0, parenDepth - 1);
      if (t.value === '[') bracketDepth++;
      if (t.value === ']') bracketDepth = Math.max(0, bracketDepth - 1);

      if ((t.type === 'nl' || t.value === ';') && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
        if (current.length > 0) {
          lines.push(current);
          current = [];
        }
        continue;
      }
      if (t.type !== 'nl') {
        current.push(t);
      }
    }
    if (current.length > 0) lines.push(current);
    return lines;
  }

  splitByTopLevelComma(tokens) {
    const parts = [];
    let cur = [];
    let depth = 0;
    for (const t of tokens) {
      if (['(', '{', '['].includes(t.value)) depth++;
      if ([')', '}', ']'].includes(t.value)) depth--;
      if (depth === 0 && t.value === ',') {
        parts.push(cur);
        cur = [];
      } else {
        cur.push(t);
      }
    }
    if (cur.length > 0) parts.push(cur);
    return parts;
  }

  tokensToExpr(tokens) {
    if (!tokens || tokens.length === 0) return 'undefined';

    let out = '';
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const next = tokens[i + 1];

      if (t.type === 'kw' && t.value === 'function') {
        let depth = 1;
        let j = i + 1;
        while (j < tokens.length && depth > 0) {
          if (tokens[j].type === 'kw' && ['function', 'if', 'for', 'while'].includes(tokens[j].value)) depth++;
          if (tokens[j].type === 'kw' && tokens[j].value === 'end') depth--;
          j++;
        }
        const inner = tokens.slice(i + 1, j - 1);
        const closeParenIdx = inner.findIndex(tok => tok.value === ')');
        const params = this.translateParamList(inner.slice(0, closeParenIdx + 1), false);
        const bodyJs = this.translateTokensToJS(inner.slice(closeParenIdx + 1));
        out += `(async function ${params} { ${bodyJs} })`;
        i = j - 1;
        continue;
      }

      if (t.value === '{') {
        let depth = 1;
        let j = i + 1;
        while (j < tokens.length && depth > 0) {
          if (tokens[j].value === '{') depth++;
          if (tokens[j].value === '}') depth--;
          j++;
        }
        const inner = tokens.slice(i + 1, j - 1);
        out += this.translateTableLiteral(inner);
        i = j - 1;
        continue;
      }

      if (t.type === 'id') {
        let chainExpr = t.value;
        let k = i + 1;

        while (k < tokens.length) {
          if (tokens[k].value === '.' && tokens[k + 1] && tokens[k + 1].type === 'id') {
            chainExpr += '.' + tokens[k + 1].value;
            k += 2;
            continue;
          }
          if (tokens[k].value === '[' && tokens[k + 1]) {
            let bDepth = 1;
            let j = k + 1;
            while (j < tokens.length && bDepth > 0) {
              if (tokens[j].value === '[') bDepth++;
              if (tokens[j].value === ']') bDepth--;
              j++;
            }
            const idxExpr = this.tokensToExpr(tokens.slice(k + 1, j - 1));
            chainExpr += `[${idxExpr}]`;
            k = j;
            continue;
          }
          if (tokens[k].value === ':' && tokens[k + 1] && tokens[k + 1].type === 'id' && tokens[k + 2] && tokens[k + 2].value === '(') {
            const methodName = tokens[k + 1].value;
            let pDepth = 1;
            let j = k + 3;
            while (j < tokens.length && pDepth > 0) {
              if (tokens[j].value === '(') pDepth++;
              if (tokens[j].value === ')') pDepth--;
              j++;
            }
            const argTokens = tokens.slice(k + 3, j - 1);
            const argsParts = this.splitByTopLevelComma(argTokens);
            const argsJs = argsParts.map(p => this.tokensToExpr(p)).join(', ');
            chainExpr = `(await __callMethod(${chainExpr}, ${JSON.stringify(methodName)}, [${argsJs}]))`;
            k = j;
            continue;
          }
          if (tokens[k].value === '(') {
            let pDepth = 1;
            let j = k + 1;
            while (j < tokens.length && pDepth > 0) {
              if (tokens[j].value === '(') pDepth++;
              if (tokens[j].value === ')') pDepth--;
              j++;
            }
            const argTokens = tokens.slice(k + 1, j - 1);
            const argsParts = this.splitByTopLevelComma(argTokens);
            const argsJs = argsParts.map(p => this.tokensToExpr(p)).join(', ');
            chainExpr = `(await ${chainExpr}(${argsJs}))`;
            k = j;
            continue;
          }
          if (tokens[k].type === 'string') {
            chainExpr = `(await ${chainExpr}(${tokens[k].value}))`;
            k += 1;
            continue;
          }
          break;
        }

        out += chainExpr;
        i = k - 1;
        continue;
      }

      if (t.value === '#' && next) {
        if (next.value === '(') {
          let pDepth = 1;
          let j = i + 2;
          while (j < tokens.length && pDepth > 0) {
            if (tokens[j].value === '(') pDepth++;
            if (tokens[j].value === ')') pDepth--;
            j++;
          }
          const innerExpr = this.tokensToExpr(tokens.slice(i + 2, j - 1));
          out += `__len(${innerExpr})`;
          i = j - 1;
          continue;
        }
        let targetExpr = next.value;
        let k = i + 2;
        while (k + 1 < tokens.length && tokens[k].value === '.' && tokens[k + 1].type === 'id') {
          targetExpr += '.' + tokens[k + 1].value;
          k += 2;
        }
        out += `__len(${targetExpr})`;
        i = k - 1;
        continue;
      }

      if (t.type === 'kw') {
        if (t.value === 'nil') out += 'null';
        else if (t.value === 'and') out += ' && ';
        else if (t.value === 'or') out += ' || ';
        else if (t.value === 'not') {
          if (next) {
            if (next.value === '(') {
              let pDepth = 1;
              let j = i + 2;
              while (j < tokens.length && pDepth > 0) {
                if (tokens[j].value === '(') pDepth++;
                if (tokens[j].value === ')') pDepth--;
                j++;
              }
              const innerExpr = this.tokensToExpr(tokens.slice(i + 2, j - 1));
              out += `(!__truthy(${innerExpr}))`;
              i = j - 1;
              continue;
            } else {
              let target = next.value;
              let k = i + 2;
              while (k + 1 < tokens.length && tokens[k].value === '.' && tokens[k + 1].type === 'id') {
                target += '.' + tokens[k + 1].value;
                k += 2;
              }
              out += `(!__truthy(${target}))`;
              i = k - 1;
              continue;
            }
          }
          out += ' !';
        } else {
          out += t.value;
        }
        continue;
      }

      if (t.type === 'op') {
        if (t.value === '~=') out += ' !== ';
        else if (t.value === '==') out += ' === ';
        else if (t.value === '..') out += ' + ';
        else if (t.value === '//') out += ' / ';
        else if (t.value === '...') out += '...__varargs';
        else out += ` ${t.value} `;
        continue;
      }

      if (t.value === '~') {
        out += ' ~ ';
        continue;
      }

      if (t.value === '^') {
        out += ' ** ';
        continue;
      }

      if (t.value === '[') {
        let bDepth = 1;
        let j = i + 1;
        while (j < tokens.length && bDepth > 0) {
          if (tokens[j].value === '[') bDepth++;
          if (tokens[j].value === ']') bDepth--;
          j++;
        }
        const idxExpr = this.tokensToExpr(tokens.slice(i + 1, j - 1));
        out += `[${idxExpr}]`;
        i = j - 1;
        continue;
      }

      out += t.value;
    }

    return out;
  }

  translateTableLiteral(innerTokens) {
    if (innerTokens.length === 0) return '__table({})';
    const items = this.splitByTopLevelComma(innerTokens);
    const props = [];
    let autoIdx = 1;

    for (const item of items) {
      if (item.length === 0) continue;
      if (item.length >= 3 && item[0].type === 'id' && item[1].value === '=') {
        const key = item[0].value;
        const val = this.tokensToExpr(item.slice(2));
        props.push(`${JSON.stringify(key)}: ${val}`);
      } else if (item.length >= 5 && item[0].value === '[' && item.findIndex(x => x.value === ']') !== -1) {
        const closeB = item.findIndex(x => x.value === ']');
        if (item[closeB + 1] && item[closeB + 1].value === '=') {
          const keyExpr = this.tokensToExpr(item.slice(1, closeB));
          const valExpr = this.tokensToExpr(item.slice(closeB + 2));
          props.push(`[${keyExpr}]: ${valExpr}`);
          continue;
        }
      } else {
        const val = this.tokensToExpr(item);
        props.push(`${autoIdx++}: ${val}`);
      }
    }
    return `__table({ ${props.join(', ')} })`;
  }

  initLuaEnvironment() {
    const self = this;

    const formatLuaValue = (v) => {
      if (v === null || v === undefined) return 'nil';
      if (typeof v === 'boolean') return v ? 'true' : 'false';
      if (typeof v === 'number') return String(v);
      if (typeof v === 'string') return v;
      if (typeof v === 'function') return 'function';
      if (typeof v === 'object') {
        const mt = self.metatables.get(v);
        if (mt && typeof mt.__tostring === 'function') {
          try {
            return String(mt.__tostring(v));
          } catch {}
        }
        const entries = Object.entries(v).filter(([k]) => !k.startsWith('__'));
        return '{ ' + entries.map(([k, val]) => `${k}=${formatLuaValue(val)}`).join(', ') + ' }';
      }
      return String(v);
    };

    const socketLib = this.createSocketLibrary();
    const ioLib = this.createIoLibrary(formatLuaValue);

    const stringLib = {
      len: (s) => String(s ?? '').length,
      upper: (s) => String(s ?? '').toUpperCase(),
      lower: (s) => String(s ?? '').toLowerCase(),
      rep: (s, n, sep = '') => new Array(Math.max(0, Math.trunc(Number(n) || 0))).fill(String(s ?? '')).join(String(sep)),
      reverse: (s) => String(s ?? '').split('').reverse().join(''),
      sub: (s, i = 1, j = undefined) => {
        const str = String(s ?? '');
        const start = i < 0 ? Math.max(0, str.length + i) : Math.max(0, i - 1);
        const end = j === undefined ? str.length : (j < 0 ? str.length + j + 1 : j);
        return str.slice(start, end);
      },
      byte: (s, i = 1, j = i) => {
        const str = String(s ?? '');
        const start = i < 0 ? Math.max(0, str.length + i) : Math.max(0, i - 1);
        const end = j < 0 ? str.length + j + 1 : j;
        const codes = [];
        for (let k = start; k < Math.min(str.length, end); k++) {
          codes.push(str.charCodeAt(k));
        }
        return codes.length <= 1 ? (codes[0] ?? null) : codes;
      },
      char: (...codes) => String.fromCharCode(...codes.map(c => Number(c) || 0)),
      find: (s, pat, init = 1, plain = false) => {
        const str = String(s ?? '');
        const startOffset = init < 0 ? Math.max(0, str.length + init) : Math.max(0, (Number(init) || 1) - 1);
        const sub = str.slice(startOffset);
        if (plain) {
          const idx = sub.indexOf(String(pat));
          if (idx === -1) return null;
          return [startOffset + idx + 1, startOffset + idx + String(pat).length];
        }
        const re = self.luaPatternToRegExp(pat, false);
        const m = re.exec(sub);
        if (!m) return null;
        const sIdx = startOffset + m.index + 1;
        const eIdx = sIdx + m[0].length - 1;
        return m.length > 1 ? [sIdx, eIdx, ...m.slice(1)] : [sIdx, eIdx];
      },
      match: (s, pat, init = 1) => {
        const str = String(s ?? '');
        const startOffset = init < 0 ? Math.max(0, str.length + init) : Math.max(0, (Number(init) || 1) - 1);
        const re = self.luaPatternToRegExp(pat, false);
        const m = re.exec(str.slice(startOffset));
        if (!m) return null;
        if (m.length > 1) return m.length === 2 ? m[1] : m.slice(1);
        return m[0];
      },
      gmatch: (s, pat) => {
        const str = String(s ?? '');
        const re = self.luaPatternToRegExp(pat, true);
        const results = [];
        let m;
        while ((m = re.exec(str)) !== null) {
          if (m[0].length === 0) re.lastIndex++;
          if (m.length > 1) results.push(m.slice(1));
          else results.push([m[0]]);
        }
        return results;
      },
      gsub: (s, pat, rep, maxN = undefined) => {
        const str = String(s ?? '');
        const re = self.luaPatternToRegExp(pat, true);
        let count = 0;
        const replaced = str.replace(re, (...args) => {
          if (maxN !== undefined && count >= maxN) return args[0];
          count++;
          if (typeof rep === 'function') {
            return String(rep(...args.slice(1, -2)) ?? args[0]);
          }
          if (rep && typeof rep === 'object') {
            const key = args[1] !== undefined ? args[1] : args[0];
            return rep[key] !== undefined ? String(rep[key]) : args[0];
          }
          return String(rep).replace(/%([0-9%])/g, (m, d) => {
            if (d === '%') return '%';
            const idx = Number(d);
            return idx === 0 ? args[0] : (args[idx] ?? '');
          });
        });
        return [replaced, count];
      },
      format: (fmt, ...args) => {
        let idx = 0;
        return String(fmt).replace(/%([0+\- ]*)(\d+)?(\.\d+)?([sdxXofegcq%])/g, (m, flags, width, prec, spec) => {
          if (spec === '%') return '%';
          const val = args[idx++];
          let res = '';
          if (spec === 'd' || spec === 'i') res = String(Math.trunc(Number(val) || 0));
          else if (spec === 'x') res = Math.trunc(Number(val) || 0).toString(16);
          else if (spec === 'X') res = Math.trunc(Number(val) || 0).toString(16).toUpperCase();
          else if (spec === 'o') res = Math.trunc(Number(val) || 0).toString(8);
          else if (spec === 'c') res = String.fromCharCode(Number(val) || 0);
          else if (spec === 'q') res = JSON.stringify(String(val ?? ''));
          else if (spec === 'f' || spec === 'g' || spec === 'e') {
            const digits = prec ? parseInt(prec.slice(1), 10) : 6;
            res = Number(val || 0).toFixed(digits);
          } else {
            res = formatLuaValue(val);
            if (prec) res = res.slice(0, parseInt(prec.slice(1), 10));
          }
          const w = width ? parseInt(width, 10) : 0;
          if (w > res.length) {
            const padChar = flags && flags.includes('0') && !flags.includes('-') ? '0' : ' ';
            res = flags && flags.includes('-') ? res.padEnd(w, ' ') : res.padStart(w, padChar);
          }
          return res;
        });
      },
      pack: (fmt, ...vals) => vals.map(v => String(v)).join('|'),
      unpack: (fmt, s) => String(s).split('|')
    };

    this.globals = {
      _VERSION: 'Lua 5.4',
      __line: 1,

      __truthy: (v) => v !== false && v !== null && v !== undefined,
      __first: (v) => (Array.isArray(v) ? v[0] : v),
      __multi: (val) => (Array.isArray(val) ? val : [val]),
      __toIterable: (iterVal) => {
        if (!iterVal) return [];
        if (Array.isArray(iterVal)) {
          if (iterVal.length > 0 && !Array.isArray(iterVal[0])) {
            return iterVal.map((v, i) => [v, i + 1]);
          }
          return iterVal;
        }
        if (typeof iterVal === 'function') {
          const rows = [];
          for (let guard = 0; guard < 10000; guard++) {
            const r = iterVal();
            const first = Array.isArray(r) ? r[0] : r;
            if (first === null || first === undefined) break;
            rows.push(Array.isArray(r) ? r : [r]);
          }
          return rows;
        }
        return [];
      },
      __callMethod: async (obj, method, args) => {
        if (typeof obj === 'string') {
          const fn = stringLib[method];
          if (typeof fn === 'function') {
            return await fn(obj, ...args);
          }
        }
        if (obj === null || obj === undefined) {
          throw self.makeLuaError(self.globals.__line, `attempt to index a nil value (calling '${method}')`);
        }
        let fn = obj[method];
        if (typeof fn !== 'function') {
          const mt = self.metatables.get(obj);
          if (mt && mt.__index) {
            fn = typeof mt.__index === 'function' ? await mt.__index(obj, method) : mt.__index[method];
          }
        }
        if (typeof fn !== 'function') {
          throw self.makeLuaError(self.globals.__line, `attempt to call a nil value (method '${method}')`);
        }
        if (fn.__needsSelf) {
          return await fn(obj, ...args);
        }
        return await fn.apply(obj, args);
      },
      __len: (v) => {
        if (typeof v === 'string') return v.length;
        if (Array.isArray(v)) return v.length;
        if (v && typeof v === 'object') {
          const mt = self.metatables.get(v);
          if (mt && typeof mt.__len === 'function') return mt.__len(v);
          let n = 0;
          while (v[n + 1] !== undefined && v[n + 1] !== null) n++;
          return n > 0 ? n : Object.keys(v).length;
        }
        return 0;
      },
      __table: (obj) => obj,

      print: (...args) => {
        const text = args.map(formatLuaValue).join('  ');
        self.term.printLine(text);
      },
      type: (v) => {
        if (v === null || v === undefined) return 'nil';
        if (typeof v === 'object') return 'table';
        return typeof v;
      },
      tostring: (v) => formatLuaValue(v),
      tonumber: (v, base = 10) => {
        if (typeof v === 'number') return v;
        const s = String(v ?? '').trim();
        if (!s) return null;
        const n = base === 10 ? Number(s) : parseInt(s, base);
        return Number.isNaN(n) ? null : n;
      },
      pairs: (t) => {
        if (!t || typeof t !== 'object') return [];
        return Object.entries(t).map(([k, val]) => {
          const numK = Number(k);
          return [!Number.isNaN(numK) && String(numK) === k ? numK : k, val];
        });
      },
      ipairs: (t) => {
        if (!t || typeof t !== 'object') return [];
        const res = [];
        let idx = 1;
        while (t[idx] !== undefined && t[idx] !== null) {
          res.push([idx, t[idx]]);
          idx++;
        }
        return res;
      },
      next: (t, k = null) => {
        if (!t || typeof t !== 'object') return [null, null];
        const keys = Object.keys(t);
        if (keys.length === 0) return [null, null];
        if (k === null || k === undefined) {
          const firstK = keys[0];
          const numK = Number(firstK);
          return [!Number.isNaN(numK) && String(numK) === firstK ? numK : firstK, t[firstK]];
        }
        const idx = keys.indexOf(String(k));
        if (idx === -1 || idx + 1 >= keys.length) return [null, null];
        const nextK = keys[idx + 1];
        const numK = Number(nextK);
        return [!Number.isNaN(numK) && String(numK) === nextK ? numK : nextK, t[nextK]];
      },
      select: (index, ...args) => {
        if (index === '#') return args.length;
        const n = Number(index) || 1;
        const start = n < 0 ? Math.max(0, args.length + n) : Math.max(0, n - 1);
        const sliced = args.slice(start);
        return sliced.length <= 1 ? sliced[0] : sliced;
      },
      unpack: (t, i = 1, j = undefined) => {
        if (!t || typeof t !== 'object') return [];
        const end = j === undefined ? self.globals.__len(t) : j;
        const out = [];
        for (let k = i; k <= end; k++) out.push(t[k]);
        return out;
      },
      rawget: (t, k) => (t && typeof t === 'object' ? (t[k] ?? null) : null),
      rawset: (t, k, v) => {
        if (t && typeof t === 'object') t[k] = v;
        return t;
      },
      rawequal: (a, b) => a === b,
      rawlen: (v) => self.globals.__len(v),
      setmetatable: (t, mt) => {
        if (!t || typeof t !== 'object') return t;
        if (mt === null || mt === undefined) {
          self.metatables.delete(t);
          return t;
        }
        self.metatables.set(t, mt);
        if (mt.__index && typeof mt.__index === 'object') {
          Object.setPrototypeOf(t, mt.__index);
        }
        return t;
      },
      getmetatable: (t) => {
        if (typeof t === 'string') return { __index: stringLib };
        if (!t || typeof t !== 'object') return null;
        return self.metatables.get(t) || null;
      },
      collectgarbage: (opt = 'collect') => (opt === 'count' ? 128.5 : 0),
      pcall: async (fn, ...args) => {
        try {
          const res = await fn(...args);
          if (Array.isArray(res)) return [true, ...res];
          return [true, res];
        } catch (err) {
          return [false, err.message || String(err)];
        }
      },
      xpcall: async (fn, msgh, ...args) => {
        try {
          const res = await fn(...args);
          if (Array.isArray(res)) return [true, ...res];
          return [true, res];
        } catch (err) {
          let handled = err.message || String(err);
          if (typeof msgh === 'function') {
            try { handled = await msgh(handled); } catch {}
          }
          return [false, handled];
        }
      },
      load: (chunk, chunkname = 'load') => {
        try {
          const compiled = self.compileLuaToJS(String(chunk), chunkname);
          return [async (...a) => await compiled.fn(self.globals, ...a), null];
        } catch (err) {
          return [null, err.message];
        }
      },
      loadstring: (chunk, chunkname = 'loadstring') => self.globals.load(chunk, chunkname),
      dofile: async (filename) => {
        const fileKey = self.normalizeFilename(filename);
        if (self.files[fileKey] === undefined) {
          throw self.makeLuaError(self.globals.__line, `cannot open ${fileKey}: No such file`);
        }
        const compiled = self.compileLuaToJS(self.files[fileKey], fileKey);
        return await compiled.fn(self.globals);
      },
      loadfile: (filename) => {
        const fileKey = self.normalizeFilename(filename);
        if (self.files[fileKey] === undefined) {
          return [null, `cannot open ${fileKey}: No such file`];
        }
        return self.globals.load(self.files[fileKey], fileKey);
      },
      assert: (cond, msg = 'assertion failed!') => {
        const val = Array.isArray(cond) ? cond[0] : cond;
        if (val === false || val === null || val === undefined) {
          throw self.makeLuaError(self.globals.__line, msg);
        }
        return cond;
      },
      error: (msg) => {
        throw self.makeLuaError(self.globals.__line, String(msg));
      },
      require: (modName) => {
        if (modName === 'socket' || modName === 'socket.core') return socketLib;
        if (modName === 'socket.http' || modName === 'http') return socketLib.http;
        if (modName === 'io') return ioLib;
        if (modName === 'math') return self.globals.math;
        if (modName === 'string') return self.globals.string;
        if (modName === 'table') return self.globals.table;
        if (modName === 'os') return self.globals.os;
        if (modName === 'coroutine') return self.globals.coroutine;
        if (modName === 'utf8') return self.globals.utf8;
        if (modName === 'bit32') return self.globals.bit32;
        if (modName === 'debug') return self.globals.debug;
        const fileKey = self.normalizeFilename(modName);
        if (self.files[fileKey]) {
          const compiled = self.compileLuaToJS(self.files[fileKey], fileKey);
          return compiled.fn(self.globals);
        }
        throw self.makeLuaError(self.globals.__line, `module '${modName}' not found`);
      },

      io: ioLib,
      string: stringLib,

      math: {
        pi: Math.PI,
        huge: Infinity,
        maxinteger: Number.MAX_SAFE_INTEGER,
        mininteger: Number.MIN_SAFE_INTEGER,
        abs: Math.abs,
        acos: Math.acos,
        asin: Math.asin,
        atan: (y, x = undefined) => (x === undefined ? Math.atan(y) : Math.atan2(y, x)),
        ceil: Math.ceil,
        cos: Math.cos,
        deg: (r) => (r * 180) / Math.PI,
        exp: Math.exp,
        floor: Math.floor,
        fmod: (x, y) => x % y,
        log: (x, base = undefined) => (base === undefined ? Math.log(x) : Math.log(x) / Math.log(base)),
        max: Math.max,
        min: Math.min,
        modf: (x) => {
          const intPart = Math.trunc(x);
          return [intPart, x - intPart];
        },
        rad: (d) => (d * Math.PI) / 180,
        random: (a, b) => {
          if (a === undefined) return Math.random();
          if (b === undefined) return Math.floor(Math.random() * a) + 1;
          return Math.floor(Math.random() * (b - a + 1)) + a;
        },
        randomseed: () => {},
        sin: Math.sin,
        sqrt: Math.sqrt,
        tan: Math.tan,
        tointeger: (x) => {
          const n = Number(x);
          return Number.isInteger(n) ? n : null;
        },
        type: (x) => {
          if (typeof x !== 'number') return null;
          return Number.isInteger(x) ? 'integer' : 'float';
        },
        ult: (m, n) => (m >>> 0) < (n >>> 0)
      },

      table: {
        insert: (t, posOrVal, maybeVal) => {
          if (!t || typeof t !== 'object') return;
          const len = self.globals.__len(t);
          if (maybeVal === undefined) {
            t[len + 1] = posOrVal;
          } else {
            for (let k = len; k >= posOrVal; k--) t[k + 1] = t[k];
            t[posOrVal] = maybeVal;
          }
        },
        remove: (t, pos) => {
          if (!t || typeof t !== 'object') return null;
          const len = self.globals.__len(t);
          if (len === 0) return null;
          const idx = pos === undefined ? len : pos;
          const removed = t[idx];
          for (let k = idx; k < len; k++) t[k] = t[k + 1];
          delete t[len];
          return removed;
        },
        concat: (t, sep = '', i = 1, j = undefined) => {
          if (!t || typeof t !== 'object') return '';
          const end = j === undefined ? self.globals.__len(t) : j;
          const out = [];
          for (let k = i; k <= end; k++) {
            if (t[k] !== undefined) out.push(String(t[k]));
          }
          return out.join(sep);
        },
        sort: async (t, comp = undefined) => {
          if (!t || typeof t !== 'object') return;
          const len = self.globals.__len(t);
          const arr = [];
          for (let k = 1; k <= len; k++) arr.push(t[k]);
          if (typeof comp === 'function') {
            for (let i = 0; i < arr.length; i++) {
              for (let j = i + 1; j < arr.length; j++) {
                const less = await comp(arr[j], arr[i]);
                if (less) {
                  const tmp = arr[i];
                  arr[i] = arr[j];
                  arr[j] = tmp;
                }
              }
            }
          } else {
            arr.sort((a, b) => (a < b ? -1 : (a > b ? 1 : 0)));
          }
          for (let k = 0; k < arr.length; k++) t[k + 1] = arr[k];
        },
        move: (a1, f, e, t, a2 = a1) => {
          if (!a1 || !a2) return a2;
          const count = e - f;
          for (let i = 0; i <= count; i++) {
            a2[t + i] = a1[f + i];
          }
          return a2;
        },
        pack: (...args) => {
          const obj = { n: args.length };
          args.forEach((v, idx) => { obj[idx + 1] = v; });
          return obj;
        },
        unpack: (t, i = 1, j = undefined) => self.globals.unpack(t, i, j)
      },

      os: {
        clock: () => performance.now() / 1000,
        time: () => Math.floor(Date.now() / 1000),
        date: (fmt = '%c') => {
          const d = new Date();
          if (fmt === '*t') {
            return {
              year: d.getFullYear(),
              month: d.getMonth() + 1,
              day: d.getDate(),
              hour: d.getHours(),
              min: d.getMinutes(),
              sec: d.getSeconds(),
              wday: d.getDay() + 1
            };
          }
          return d.toISOString().replace('T', ' ').slice(0, 19);
        },
        difftime: (t2, t1) => Number(t2) - Number(t1),
        getenv: (k) => (k === 'USER' ? 'TEEDTHETERRIBLE' : null),
        remove: (filename) => {
          const f = self.normalizeFilename(filename);
          if (self.files[f] !== undefined) {
            delete self.files[f];
            self.saveFiles();
            return true;
          }
          return [null, `${f}: No such file`];
        },
        rename: (oldName, newName) => {
          const o = self.normalizeFilename(oldName);
          const n = self.normalizeFilename(newName);
          if (self.files[o] === undefined) return [null, `${o}: No such file`];
          self.files[n] = self.files[o];
          delete self.files[o];
          self.saveFiles();
          return true;
        },
        tmpname: () => `tmp_${Date.now()}.lua`,
        exit: (code = 0) => {
          throw self.makeLuaError(self.globals.__line, `os.exit(${code})`);
        },
        execute: async (cmd) => {
          if (cmd) await self.executeCommandOrLua(String(cmd));
          return [true, 'exit', 0];
        }
      },

      coroutine: {
        create: (fn) => ({ fn, status: 'suspended', result: null }),
        status: (co) => (co && co.status ? co.status : 'dead'),
        isyieldable: () => true,
        running: () => [null, true],
        resume: async (co, ...args) => {
          if (!co || typeof co.fn !== 'function' || co.status === 'dead') {
            return [false, 'cannot resume dead coroutine'];
          }
          try {
            co.status = 'running';
            const res = await co.fn(...args);
            co.status = 'dead';
            if (Array.isArray(res)) return [true, ...res];
            return [true, res];
          } catch (err) {
            co.status = 'dead';
            return [false, err.message || String(err)];
          }
        },
        wrap: (fn) => async (...args) => await fn(...args),
        yield: (...vals) => (vals.length <= 1 ? vals[0] : vals),
        close: (co) => {
          if (co) co.status = 'dead';
          return true;
        }
      },

      utf8: {
        charpattern: '[\\x00-\\x7F\\xC2-\\xFD][\\x80-\\xBF]*',
        char: (...codes) => String.fromCodePoint(...codes.map(c => Number(c) || 0)),
        len: (s) => Array.from(String(s ?? '')).length,
        codepoint: (s, i = 1, j = i) => {
          const chars = Array.from(String(s ?? ''));
          const out = [];
          for (let k = Math.max(1, i); k <= Math.min(chars.length, j); k++) {
            out.push(chars[k - 1].codePointAt(0));
          }
          return out.length <= 1 ? out[0] : out;
        },
        codes: (s) => {
          const chars = Array.from(String(s ?? ''));
          return chars.map((ch, idx) => [idx + 1, ch.codePointAt(0)]);
        },
        offset: (s, n) => Math.max(1, Number(n) || 1)
      },

      bit32: {
        band: (...a) => a.reduce((acc, v) => (acc & v) >>> 0, 0xFFFFFFFF),
        bor: (...a) => a.reduce((acc, v) => (acc | v) >>> 0, 0),
        bxor: (...a) => a.reduce((acc, v) => (acc ^ v) >>> 0, 0),
        bnot: (x) => (~x) >>> 0,
        lshift: (x, disp) => (x << disp) >>> 0,
        rshift: (x, disp) => (x >>> disp) >>> 0,
        arshift: (x, disp) => (x >> disp) >>> 0
      },

      debug: {
        traceback: (msg = '') => `${msg ? msg + '\n' : ''}stack traceback:\n\t[Lua 5.4]: in line ${self.globals.__line}`,
        getinfo: () => ({ currentline: self.globals.__line, what: 'Lua', short_src: 'chunk.lua' }),
        getmetatable: (v) => self.globals.getmetatable(v),
        setmetatable: (v, mt) => self.globals.setmetatable(v, mt)
      },

      package: {
        path: './?.lua',
        loaded: {},
        preload: {}
      },

      socket: socketLib,

      gfx: {
        pset: (x, y, c = 1) => self.term.plotPixel(Math.trunc(x), Math.trunc(y), c),
        line: (x1, y1, x2, y2, c = 1) => self.term.drawLine(Math.trunc(x1), Math.trunc(y1), Math.trunc(x2), Math.trunc(y2), c),
        rect: (x, y, w, h, c = 1, fill = false) => self.term.drawRect(Math.trunc(x), Math.trunc(y), Math.trunc(w), Math.trunc(h), c, fill),
        circle: (cx, cy, r, c = 1) => self.term.drawCircle(Math.trunc(cx), Math.trunc(cy), Math.trunc(r), c),
        text: (x, y, str, fg = 0, bg = 15) => self.term.drawPixelString(Math.trunc(x), Math.trunc(y), String(str), fg, bg),
        clear: () => self.term.clearGraphicsLayer()
      }
    };

    this.globals._G = this.globals;
  }

  createIoLibrary(formatLuaValue) {
    const self = this;

    const parseIoReadFormat = (rawLine, fmt = '*l') => {
      if (rawLine === null || rawLine === undefined) return null;
      const f = typeof fmt === 'number' ? fmt : String(fmt).replace(/^\*/, '');
      if (typeof f === 'number') {
        return String(rawLine).slice(0, f);
      }
      if (f === 'n') {
        const m = String(rawLine).trim().match(/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?/);
        return m ? Number(m[0]) : null;
      }
      if (f === 'L') {
        return String(rawLine) + '\n';
      }
      if (f === 'a') {
        return String(rawLine);
      }
      return String(rawLine).replace(/\r?\n$/, '');
    };

    const readFromTerminal = async (...formats) => {
      const fmts = formats.length === 0 ? ['*l'] : formats;
      const results = [];
      for (const fmt of fmts) {
        const userLine = await self.term.requestStdinLine();
        results.push(parseIoReadFormat(userLine, fmt));
      }
      return results.length === 1 ? results[0] : results;
    };

    const writeToTerminal = (...args) => {
      const text = args.map(v => (typeof v === 'string' ? v : formatLuaValue(v))).join('');
      self.term.writeInline(text);
      return true;
    };

    const stdinHandle = {
      __ioHandle: 'file',
      read: async (...fmts) => await readFromTerminal(...fmts),
      lines: async () => [await readFromTerminal('*l')],
      close: () => [null, 'cannot close standard file']
    };

    const stdoutHandle = {
      __ioHandle: 'file',
      write: (...args) => writeToTerminal(...args),
      flush: () => true,
      close: () => [null, 'cannot close standard file']
    };

    const createVfsFileHandle = (fileKey, mode = 'r') => {
      let closed = false;
      let cursor = 0;
      if (mode.startsWith('w')) {
        self.files[fileKey] = '';
        self.saveFiles();
      } else if (mode.startsWith('a')) {
        if (self.files[fileKey] === undefined) self.files[fileKey] = '';
        cursor = self.files[fileKey].length;
        self.saveFiles();
      }

      return {
        __ioHandle: 'file',
        read: (...formats) => {
          if (closed) throw self.makeLuaError(self.globals.__line, 'attempt to use a closed file');
          const content = self.files[fileKey] ?? '';
          const fmts = formats.length === 0 ? ['*l'] : formats;
          const out = [];

          for (const fmt of fmts) {
            if (cursor >= content.length) {
              out.push(null);
              continue;
            }
            const f = typeof fmt === 'number' ? fmt : String(fmt).replace(/^\*/, '');
            if (typeof f === 'number') {
              const chunk = content.slice(cursor, cursor + f);
              cursor += chunk.length;
              out.push(chunk);
            } else if (f === 'a') {
              const chunk = content.slice(cursor);
              cursor = content.length;
              out.push(chunk);
            } else if (f === 'n') {
              const rest = content.slice(cursor);
              const m = rest.match(/^\s*([+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)/);
              if (!m) {
                out.push(null);
              } else {
                cursor += m[0].length;
                out.push(Number(m[1]));
              }
            } else {
              const nlIdx = content.indexOf('\n', cursor);
              if (nlIdx === -1) {
                const line = content.slice(cursor);
                cursor = content.length;
                out.push(f === 'L' ? line : line);
              } else {
                const line = content.slice(cursor, nlIdx);
                cursor = nlIdx + 1;
                out.push(f === 'L' ? line + '\n' : line);
              }
            }
          }
          return out.length === 1 ? out[0] : out;
        },
        write: (...parts) => {
          if (closed) throw self.makeLuaError(self.globals.__line, 'attempt to use a closed file');
          const str = parts.map(p => String(p ?? '')).join('');
          const cur = self.files[fileKey] ?? '';
          self.files[fileKey] = cur.slice(0, cursor) + str + cur.slice(cursor);
          cursor += str.length;
          self.saveFiles();
          return true;
        },
        lines: () => {
          const content = self.files[fileKey] ?? '';
          return content.split(/\r?\n/).map(l => [l]);
        },
        seek: (whence = 'cur', offset = 0) => {
          const len = (self.files[fileKey] ?? '').length;
          if (whence === 'set') cursor = Math.max(0, Math.min(len, offset));
          else if (whence === 'end') cursor = Math.max(0, Math.min(len, len + offset));
          else cursor = Math.max(0, Math.min(len, cursor + offset));
          return cursor;
        },
        flush: () => {
          self.saveFiles();
          return true;
        },
        close: () => {
          closed = true;
          self.saveFiles();
          return true;
        }
      };
    };

    return {
      stdin: stdinHandle,
      stdout: stdoutHandle,
      stderr: stdoutHandle,
      read: readFromTerminal,
      write: writeToTerminal,
      flush: () => true,
      open: (filename, mode = 'r') => {
        const fKey = self.normalizeFilename(filename);
        if (mode.startsWith('r') && self.files[fKey] === undefined) {
          return [null, `${fKey}: No such file or directory`];
        }
        return [createVfsFileHandle(fKey, mode), null];
      },
      lines: (filename) => {
        if (!filename) return [];
        const fKey = self.normalizeFilename(filename);
        if (self.files[fKey] === undefined) {
          throw self.makeLuaError(self.globals.__line, `cannot open file '${fKey}'`);
        }
        return self.files[fKey].split(/\r?\n/).map(l => [l]);
      },
      type: (obj) => (obj && obj.__ioHandle ? obj.__ioHandle : null),
      tmpfile: () => createVfsFileHandle(`tmp_${Date.now()}.lua`, 'w+'),
      input: () => stdinHandle,
      output: () => stdoutHandle,
      popen: (cmd) => createVfsFileHandle(self.normalizeFilename(cmd || 'out.lua'), 'r')
    };
  }

  createSocketLibrary() {
    const self = this;

    const createTcpSocket = () => {
      const state = {
        host: null,
        port: null,
        connected: false,
        timeout: 5,
        recvQueue: [],
        ws: null
      };

      return {
        settimeout(t) {
          state.timeout = t;
          return 1;
        },
        async connect(host, port) {
          state.host = String(host);
          state.port = Number(port);

          if (state.host === '127.0.0.1' || state.host === 'localhost' || self.virtualServers.has(state.port)) {
            const srv = self.virtualServers.get(state.port);
            if (srv) {
              state.connected = true;
              if (state.port === 13) {
                state.recvQueue.push(srv.handler(''));
              }
              return [1, null];
            }
          }

          if (state.host.startsWith('ws://') || state.host.startsWith('wss://')) {
            return await new Promise((resolve) => {
              try {
                const ws = new WebSocket(state.host);
                ws.onmessage = (ev) => state.recvQueue.push(String(ev.data));
                ws.onopen = () => {
                  state.ws = ws;
                  state.connected = true;
                  resolve([1, null]);
                };
                ws.onerror = () => resolve([null, 'WebSocket connection failed']);
              } catch (e) {
                resolve([null, e.message]);
              }
            });
          }

          state.connected = true;
          return [1, null];
        },
        async send(data) {
          if (!state.connected) return [null, 'closed'];
          const payload = String(data);

          if (state.ws && state.ws.readyState === WebSocket.OPEN) {
            state.ws.send(payload);
            return payload.length;
          }

          const srv = self.virtualServers.get(state.port);
          if (srv && srv.handler) {
            const resp = await srv.handler(payload);
            if (resp !== undefined && resp !== null) {
              state.recvQueue.push(String(resp));
            }
            return payload.length;
          }

          state.recvQueue.push(`ACK(${state.host}:${state.port}) len=${payload.length}: ${payload.trim()}`);
          return payload.length;
        },
        async receive(pattern = '*l') {
          if (!state.connected) return [null, 'closed'];
          if (state.recvQueue.length === 0 && state.ws) {
            await new Promise(r => setTimeout(r, 250));
          }
          if (state.recvQueue.length === 0) return [null, 'timeout'];
          const msg = state.recvQueue.shift();
          if (pattern === '*l') {
            return String(msg).split(/\r?\n/)[0];
          }
          return String(msg);
        },
        getpeername() {
          return `${state.host || '127.0.0.1'}:${state.port || 0}`;
        },
        getsockname() {
          return `127.0.0.1:49152`;
        },
        close() {
          if (state.ws) {
            try { state.ws.close(); } catch {}
          }
          state.connected = false;
          return 1;
        }
      };
    };

    const createUdpSocket = () => {
      let peerHost = '127.0.0.1';
      let peerPort = 7;
      const queue = [];
      return {
        setpeername(h, p) { peerHost = h; peerPort = Number(p); return 1; },
        setsockname() { return 1; },
        sendto(data, ip, port) {
          const srv = self.virtualServers.get(Number(port || peerPort));
          const reply = srv ? srv.handler(data) : `UDP_ACK:${data}`;
          queue.push([reply, ip || peerHost, port || peerPort]);
          return String(data).length;
        },
        receivefrom() {
          if (queue.length === 0) return [null, 'timeout'];
          return queue.shift();
        },
        close() { return 1; }
      };
    };

    return {
      _VERSION: 'LuaSocket 3.1.0',
      gettime: () => Date.now() / 1000,
      sleep: async (sec = 0) => {
        await new Promise(r => setTimeout(r, Math.min(Number(sec) || 0, 5) * 1000));
      },
      tcp: createTcpSocket,
      udp: createUdpSocket,
      bind: (host, port) => {
        const p = Number(port) || 8080;
        const serverObj = {
          host: host || '127.0.0.1',
          port: p,
          name: `lua-srv-${p}`,
          handler: (data) => `OK:${data}`,
          on_request: (fn) => {
            serverObj.handler = fn;
          },
          getsockname: () => `${host || '127.0.0.1'}:${p}`,
          close: () => {
            self.virtualServers.delete(p);
          }
        };
        self.virtualServers.set(p, serverObj);
        return serverObj;
      },
      connect: async (host, port) => {
        const s = createTcpSocket();
        await s.connect(host, port);
        return s;
      },
      dns: {
        gethostname: () => 'FOURTHTEMPLE',
        toip: (host) => {
          if (host === 'localhost' || host === '127.0.0.1') return '127.0.0.1';
          if (host.includes('github')) return '140.82.121.4';
          let h = 0;
          for (let i = 0; i < host.length; i++) h = (h * 31 + host.charCodeAt(i)) & 0xffffff;
          return `93.${(h >> 16) & 255}.${(h >> 8) & 255}.${(h & 254) || 1}`;
        }
      },
      http: {
        request: async (url) => {
          try {
            const res = await fetch(url);
            const text = await res.text();
            return [text.trim(), res.status];
          } catch {
            return [`[200 OK from ${url}]`, 200];
          }
        },
        get: async (url) => {
          try {
            const res = await fetch(url);
            return (await res.text()).trim();
          } catch {
            return `[200 OK from ${url}]`;
          }
        }
      }
    };
  }

  cmdCreate(rawName) {
    if (!rawName) {
      this.term.printLine('Usage: CREATE <filename>', 8, 15);
      return;
    }
    const file = this.normalizeFilename(rawName);
    if (this.files[file] === undefined) {
      this.files[file] = `--!${file}\n`;
      this.saveFiles();
      this.term.printLine(`Created ${file} in browser storage.`, 1, 15);
    } else {
      this.term.printLine(`File ${file} already exists.`, 8, 15);
    }
  }

  cmdEdit(rawName) {
    const defaultName = Object.keys(this.files)[0] || 'mrrobot.lua';
    const file = rawName ? this.normalizeFilename(rawName) : defaultName;
    if (this.files[file] === undefined) {
      this.files[file] = `--!${file}\n`;
      this.saveFiles();
    }
    this.term.openEditor(file);
  }

  async cmdExecute(rawName) {
    if (!rawName) {
      this.term.printLine('Usage: EXECUTE <filename>', 8, 15);
      return;
    }
    const file = this.normalizeFilename(rawName);
    if (this.files[file] === undefined) {
      this.term.printLine(`File '${file}' not found. Use CREATE ${rawName} first.`, 8, 15);
      return;
    }
    await this.executeSource(this.files[file], file);
  }

  cmdDelete(rawName) {
    if (!rawName) {
      this.term.printLine('Usage: DELETE <filename>', 8, 15);
      return;
    }
    const file = this.normalizeFilename(rawName);
    if (this.files[file] === undefined) {
      this.term.printLine(`File '${file}' not found.`, 8, 15);
      return;
    }
    delete this.files[file];
    this.saveFiles();
    this.term.printLine(`Deleted ${file} from browser storage.`, 1, 15);
  }

  async executeCommandOrLua(input) {
    const trimmed = input.trim();
    if (!trimmed) return;

    const match = trimmed.match(/^([a-zA-Z]+)(?:\s+(.*))?$/);
    if (match) {
      const verb = match[1].toUpperCase();
      const arg = (match[2] || '').trim();

      if (verb === 'CREATE') {
        this.cmdCreate(arg);
        return;
      }
      if (verb === 'EDIT') {
        this.cmdEdit(arg);
        return;
      }
      if (verb === 'EXECUTE') {
        await this.cmdExecute(arg);
        return;
      }
      if (verb === 'DELETE') {
        this.cmdDelete(arg);
        return;
      }
    }

    await this.executeSource(trimmed, 'stdin');
  }

  async executeSource(source, chunkName = 'stdin') {
    const trimmed = source.trim();
    if (!trimmed) return;

    this.globals.__line = 1;
    try {
      const compiled = this.compileLuaToJS(trimmed, chunkName);
      const result = await compiled.fn(this.globals);
      if (result !== undefined && chunkName === 'stdin') {
        if (Array.isArray(result)) {
          this.term.printLine(result.map(x => String(x)).join('\t'), 1, 15);
        } else {
          this.term.printLine(String(result), 1, 15);
        }
      }
    } catch (e) {
      const lineNum = e.luaLine || this.globals.__line || 1;
      const cleanMessage = String(e.message || e).replace(/^Syntax error near line \d+:\s*/i, '');
      this.term.printLine(`Lua Error [${chunkName} : Line ${lineNum}]: ${cleanMessage}`, 8, 15);
    }
  }
}

window.TempleLuaCompiler = TempleLuaCompiler;
