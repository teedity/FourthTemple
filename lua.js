class TempleLuaCompiler {
  constructor(terminal) {
    this.term = terminal;
    this.storageKey = 'fourthtemple_lua_files_v4';
    this.files = this.loadFiles();
    this.virtualServers = new Map();
    this.globals = {};
    this.initDefaultServers();
    this.initLuaEnvironment();
  }

  normalizeFilename(name) {
    const clean = String(name || 'main').trim().replace(/^["']|['"]$/g, '');
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
local socket = require("socket")

local srv = socket.bind("127.0.0.1", 9090)
srv:on_request(function(payload)
  return "FSOCIETY_ACK:" .. string.upper(payload)
end)

local tcp = socket.tcp()
local ok, err = tcp:connect("127.0.0.1", 9090)
if ok then
  print("Connected to", tcp:getpeername())
  tcp:send("hello friend")
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

  compileLuaToJS(luaSource, chunkName = 'stdin') {
    const startTime = performance.now();
    const tokens = this.tokenizeLua(luaSource, chunkName);
    this.validateLuaSyntax(tokens);
    const jsBody = this.translateTokensToJS(tokens);
    const compileTimeUs = Math.max(1, Math.round((performance.now() - startTime) * 1000));

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    let fn;
    try {
      fn = new AsyncFunction('__env', `with (__env) {\n${jsBody}\n}`);
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

  detectSyntaxErrorLine(luaSource, fallbackMsg) {
    const rawLines = luaSource.replace(/\r\n/g, '\n').split('\n');
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    for (let i = 0; i < rawLines.length; i++) {
      const single = rawLines[i].trim();
      if (!single) continue;
      if (/^(if|elseif|else|for|while|repeat|until|function|local\s+function|end)\b/.test(single)) {
        continue;
      }
      try {
        const toks = this.tokenizeLua(single, 'line');
        const js = this.translateTokensToJS(toks);
        new AsyncFunction('__env', `with (__env) {\n${js}\n}`);
      } catch (e) {
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

      if (['+', '-', '*', '/', '..', '==', '~=', '<=', '>=', '<', '>', '='].includes(last.value)) {
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

  tokenizeLua(src, chunkName) {
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
      if (['==', '~=', '<=', '>=', '..', '//'].includes(two)) {
        tokens.push({ type: 'op', value: two, line });
        i += 2;
        continue;
      }

      if ('+-*/%^#=<>();{},.[]:;'.includes(ch)) {
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

      if (first.type === 'kw' && first.value === 'local' && lineToks[1] && lineToks[1].value === 'function') {
        const fnName = lineToks[2].value;
        const rest = this.tokensToExpr(lineToks.slice(3));
        translatedLines.push(`${trackLine}let ${fnName} = async function ${rest} {`);
        blockStack.push('function');
        continue;
      }

      if (first.type === 'kw' && first.value === 'function') {
        const pIdx = lineToks.findIndex(t => t.value === '(');
        if (pIdx !== -1) {
          const fnName = lineToks.slice(1, pIdx).map(t => t.value).join('');
          const params = this.tokensToExpr(lineToks.slice(pIdx));
          translatedLines.push(`${trackLine}${fnName} = async function ${params} {`);
          blockStack.push('function');
          continue;
        }
      }

      if (first.type === 'kw' && first.value === 'local') {
        const eqIdx = lineToks.findIndex(t => t.value === '=');
        if (eqIdx === -1) {
          const vars = lineToks.slice(1).map(t => t.value).join(' ');
          translatedLines.push(`${trackLine}let ${vars};`);
        } else {
          const lhs = lineToks.slice(1, eqIdx).filter(t => t.value !== ',').map(t => t.value);
          const rhs = this.tokensToExpr(lineToks.slice(eqIdx + 1));
          if (lhs.length === 1) {
            translatedLines.push(`${trackLine}let ${lhs[0]} = ${rhs};`);
          } else {
            translatedLines.push(`${trackLine}let [${lhs.join(', ')}] = __multi(${rhs});`);
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
          const headerJs = `${trackLine}for (const [${vars.join(', ')}] of ${iterExpr}) {`;
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
          const headerJs = `${trackLine}for (let ${varName} = (${startExpr}), __stop_${varName} = (${stopExpr}), __step_${varName} = (${stepExpr}); (__step_${varName} >= 0 ? ${varName} <= __stop_${varName} : ${varName} >= __stop_${varName}); ${varName} += __step_${varName}) {`;
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
        blockStack.pop();
        translatedLines.push(`}`);
        continue;
      }

      if (first.type === 'kw' && first.value === 'return') {
        const parts = this.splitByTopLevelComma(lineToks.slice(1));
        if (parts.length <= 1) {
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

      const exprJs = this.tokensToExpr(lineToks);
      if (lines.length === 1 && !isStatementStart && !hasTopAssign) {
        translatedLines.push(`${trackLine}return (${exprJs});`);
      } else {
        translatedLines.push(`${trackLine}${exprJs};`);
      }
    }

    return translatedLines.join('\n');
  }

  splitTokenLines(tokens) {
    const lines = [];
    let current = [];
    let braceDepth = 0;
    let parenDepth = 0;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.value === '{') braceDepth++;
      if (t.value === '}') braceDepth = Math.max(0, braceDepth - 1);
      if (t.value === '(') parenDepth++;
      if (t.value === ')') parenDepth = Math.max(0, parenDepth - 1);

      if ((t.type === 'nl' || t.value === ';') && braceDepth === 0 && parenDepth === 0) {
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
        const params = inner.slice(0, closeParenIdx + 1).map(tok => tok.value).join('');
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
        let callee = t.value;
        let k = i + 1;
        while (
          k + 1 < tokens.length &&
          (tokens[k].value === '.' || tokens[k].value === ':') &&
          tokens[k + 1].type === 'id'
        ) {
          callee += '.' + tokens[k + 1].value;
          k += 2;
        }

        if (tokens[k] && tokens[k].value === '(') {
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
          out += `(await ${callee}(${argsJs}))`;
          i = j - 1;
          continue;
        } else {
          out += callee;
          i = k - 1;
          continue;
        }
      }

      if (t.value === '#' && next) {
        out += `__len(${next.value})`;
        i++;
        continue;
      }

      if (t.type === 'kw') {
        if (t.value === 'nil') out += 'null';
        else if (t.value === 'and') out += ' && ';
        else if (t.value === 'or') out += ' || ';
        else if (t.value === 'not') out += ' !__truthy ';
        else out += t.value;
        continue;
      }

      if (t.type === 'op') {
        if (t.value === '~=') out += ' !== ';
        else if (t.value === '==') out += ' === ';
        else if (t.value === '..') out += ' + ';
        else if (t.value === '//') out += ' / ';
        else out += ` ${t.value} `;
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
        const entries = Object.entries(v).filter(([k]) => !k.startsWith('__'));
        return '{ ' + entries.map(([k, val]) => `${k}=${formatLuaValue(val)}`).join(', ') + ' }';
      }
      return String(v);
    };

    const socketLib = this.createSocketLibrary();

    this.globals = {
      _VERSION: 'Lua 5.4',
      __line: 1,

      __truthy: (v) => v !== false && v !== null && v !== undefined,
      __len: (v) => {
        if (typeof v === 'string') return v.length;
        if (Array.isArray(v)) return v.length;
        if (v && typeof v === 'object') {
          let n = 0;
          while (v[n + 1] !== undefined) n++;
          return n > 0 ? n : Object.keys(v).length;
        }
        return 0;
      },
      __table: (obj) => obj,
      __multi: (val) => (Array.isArray(val) ? val : [val]),

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
        const n = base === 10 ? Number(v) : parseInt(String(v), base);
        return Number.isNaN(n) ? null : n;
      },
      pairs: (t) => {
        if (!t || typeof t !== 'object') return [];
        return Object.entries(t);
      },
      ipairs: (t) => {
        if (!t || typeof t !== 'object') return [];
        const res = [];
        let idx = 1;
        while (t[idx] !== undefined) {
          res.push([idx, t[idx]]);
          idx++;
        }
        return res;
      },
      assert: (cond, msg = 'assertion failed!') => {
        if (cond === false || cond === null || cond === undefined) {
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
        if (modName === 'math') return self.globals.math;
        if (modName === 'string') return self.globals.string;
        if (modName === 'table') return self.globals.table;
        if (modName === 'os') return self.globals.os;
        const fileKey = self.normalizeFilename(modName);
        if (self.files[fileKey]) {
          const compiled = self.compileLuaToJS(self.files[fileKey], fileKey);
          return compiled.fn(self.globals);
        }
        throw self.makeLuaError(self.globals.__line, `module '${modName}' not found`);
      },

      math: {
        pi: Math.PI,
        huge: Infinity,
        abs: Math.abs,
        acos: Math.acos,
        asin: Math.asin,
        atan: Math.atan2,
        ceil: Math.ceil,
        cos: Math.cos,
        deg: (r) => (r * 180) / Math.PI,
        exp: Math.exp,
        floor: Math.floor,
        fmod: (x, y) => x % y,
        log: Math.log,
        max: Math.max,
        min: Math.min,
        rad: (d) => (d * Math.PI) / 180,
        random: (a, b) => {
          if (a === undefined) return Math.random();
          if (b === undefined) return Math.floor(Math.random() * a) + 1;
          return Math.floor(Math.random() * (b - a + 1)) + a;
        },
        randomseed: () => {},
        sin: Math.sin,
        sqrt: Math.sqrt,
        tan: Math.tan
      },

      string: {
        len: (s) => String(s).length,
        upper: (s) => String(s).toUpperCase(),
        lower: (s) => String(s).toLowerCase(),
        rep: (s, n, sep = '') => new Array(Math.max(0, n)).fill(String(s)).join(sep),
        reverse: (s) => String(s).split('').reverse().join(''),
        sub: (s, i, j) => {
          const str = String(s);
          const start = i < 0 ? Math.max(0, str.length + i) : Math.max(0, i - 1);
          const end = j === undefined ? str.length : (j < 0 ? str.length + j + 1 : j);
          return str.slice(start, end);
        },
        byte: (s, i = 1) => String(s).charCodeAt(i - 1) || null,
        char: (...codes) => String.fromCharCode(...codes),
        find: (s, pat) => {
          const idx = String(s).indexOf(pat);
          return idx === -1 ? null : idx + 1;
        },
        gsub: (s, pat, rep) => String(s).replaceAll(pat, rep),
        format: (fmt, ...args) => {
          let idx = 0;
          return String(fmt).replace(/%(\.\d+)?([sdxf%])/g, (m, prec, spec) => {
            if (spec === '%') return '%';
            const val = args[idx++];
            if (spec === 'd') return String(Math.trunc(Number(val) || 0));
            if (spec === 'x') return Math.trunc(Number(val) || 0).toString(16);
            if (spec === 'f') {
              const digits = prec ? parseInt(prec.slice(1), 10) : 6;
              return Number(val || 0).toFixed(digits);
            }
            return String(val ?? '');
          });
        }
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
        }
      },

      os: {
        clock: () => performance.now() / 1000,
        time: () => Math.floor(Date.now() / 1000),
        date: () => new Date().toISOString(),
        difftime: (t2, t1) => t2 - t1
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
