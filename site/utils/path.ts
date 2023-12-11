function assertPath(path: string) {
  if (typeof path !== "string") {
    throw new TypeError(
      "Path must be a string. Received " + JSON.stringify(path)
    );
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path: string, allowAboveRoot: boolean) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code;
  for (let i = 0; i <= path.length; ++i) {
    if (i < path.length) code = path.charCodeAt(i);
    else if (code === 47 /*/*/) break;
    else code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (
          res.length < 2 ||
          lastSegmentLength !== 2 ||
          res.charCodeAt(res.length - 1) !== 46 /*.*/ ||
          res.charCodeAt(res.length - 2) !== 46 /*.*/
        ) {
          if (res.length > 2) {
            let lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = "";
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) res += "/..";
          else res = "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) res += "/" + path.slice(lastSlash + 1, i);
        else res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function normalize(path: string) {
  assertPath(path);

  if (path.length === 0) return ".";

  let isAbsolute = path.charCodeAt(0) === 47; /*/*/
  let trailingSeparator = path.charCodeAt(path.length - 1) === 47; /*/*/

  // Normalize the path
  path = normalizeStringPosix(path, !isAbsolute);

  if (path.length === 0 && !isAbsolute) path = ".";
  if (path.length > 0 && trailingSeparator) path += "/";

  if (isAbsolute) return "/" + path;
  return path;
}
export function join(...args: string[]) {
  if (args.length === 0) return ".";
  let joined;
  for (let i = 0; i < args.length; ++i) {
    let arg = args[i];
    assertPath(arg);
    if (arg.length > 0) {
      if (joined === undefined) joined = arg;
      else joined += "/" + arg;
    }
  }
  if (joined === undefined) return ".";
  return normalize(joined);
}

export function dirname(path: string) {
  assertPath(path);
  if (path.length === 0) return ".";
  let code = path.charCodeAt(0);
  let hasRoot = code === 47; /*/*/
  let end = -1;
  let matchedSlash = true;
  for (let i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
      if (!matchedSlash) {
        end = i;
        break;
      }
    } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? "/" : ".";
  if (hasRoot && end === 1) return "//";
  return path.slice(0, end);
}
export function basename(path: string, ext?: string) {
  if (ext !== undefined && typeof ext !== "string")
    throw new TypeError('"ext" argument must be a string');
  assertPath(path);

  let start = 0;
  let end = -1;
  let matchedSlash = true;
  let i;

  if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
    if (ext.length === path.length && ext === path) return "";
    let extIdx = ext.length - 1;
    let firstNonSlashEnd = -1;
    for (i = path.length - 1; i >= 0; --i) {
      let code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else {
        if (firstNonSlashEnd === -1) {
          // We saw the first non-path separator, remember this index in case
          // we need it if the extension ends up not matching
          matchedSlash = false;
          firstNonSlashEnd = i + 1;
        }
        if (extIdx >= 0) {
          // Try to match the explicit extension
          if (code === ext.charCodeAt(extIdx)) {
            if (--extIdx === -1) {
              // We matched the extension, so mark this as the end of our path
              // component
              end = i;
            }
          } else {
            // Extension does not match, so our result is the entire path
            // component
            extIdx = -1;
            end = firstNonSlashEnd;
          }
        }
      }
    }

    if (start === end) end = firstNonSlashEnd;
    else if (end === -1) end = path.length;
    return path.slice(start, end);
  } else {
    for (i = path.length - 1; i >= 0; --i) {
      if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // path component
        matchedSlash = false;
        end = i + 1;
      }
    }

    if (end === -1) return "";
    return path.slice(start, end);
  }
}
