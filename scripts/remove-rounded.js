const fs = require("fs");
const path = require("path");

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach((f) => {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath, callback);
        } else if (f.endsWith(".tsx") || f.endsWith(".ts") || f.endsWith(".jsx") || f.endsWith(".js") || f.endsWith(".css")) {
            callback(fullPath);
        }
    });
}

const srcDir = path.join(__dirname, "../src");

let changedFiles = 0;
walkDir(srcDir, (file) => {
    let content = fs.readFileSync(file, "utf8");
    const original = content;

    // Replace rounded classes with rounded-none or remove them
    // rounded-3xl, rounded-2xl, rounded-xl, rounded-lg, rounded-md, rounded-sm, rounded-full, rounded
    content = content.replace(/\brounded-(?:3xl|2xl|xl|lg|md|sm|full|t-3xl|b-3xl|t-2xl|b-2xl|t-xl|b-xl|r-full|l-full|r-2xl|l-2xl|r-xl|l-xl)\b/g, "rounded-none");
    content = content.replace(/\brounded\b(?!\s*:\s*0)/g, "rounded-none");

    if (content !== original) {
        fs.writeFileSync(file, content, "utf8");
        console.log("Updated:", path.relative(srcDir, file));
        changedFiles++;
    }
});

console.log(`Finished. Updated ${changedFiles} files.`);
