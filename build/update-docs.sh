# Prepare
cd docs
rm -rf .vuepress/dist

# Build
npx vuepress build

# Publish to GitHub Pages
cd .vuepress/dist
git init
git add -A
git commit -m '[vuepress] update docs'
git push -f https://github.com/meteor-front/meteor-vscode.git master:docs

# Cleanup
cd ../..
rm -rf .vuepress/dist
