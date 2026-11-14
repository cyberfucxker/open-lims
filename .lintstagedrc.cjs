const path = require("path");

function toPackageRelative(pkg) {
  return (files) =>
    files.map((f) => JSON.stringify(path.relative(path.join(__dirname, pkg), f)));
}

module.exports = {
  "backend/**/*.ts": (files) => {
    const rel = toPackageRelative("backend")(files);
    return [
      `sh -c 'cd backend && npx prettier --write ${rel.join(" ")}'`,
      `sh -c 'cd backend && npx eslint --fix ${rel.join(" ")}'`,
    ];
  },
  "frontend/**/*.{ts,tsx}": (files) => {
    const rel = toPackageRelative("frontend")(files);
    return [
      `sh -c 'cd frontend && npx prettier --write ${rel.join(" ")}'`,
      `sh -c 'cd frontend && npx eslint --fix ${rel.join(" ")}'`,
    ];
  },
};
