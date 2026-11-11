// Escape regular-expression metacharacters in user-supplied search text before
// it is used in a MongoDB $regex. Prevents regex injection / catastrophic
// backtracking (ReDoS) from crafted patterns like "(a+)+$".
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { escapeRegex };
