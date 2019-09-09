const fs = require('fs');
const glob = require('glob');
const sass = require('node-sass');
const rollup = require('rollup');
const rollupPluginNodeResolve = require('rollup-plugin-node-resolve');
const rollupPluginCommonjs = require('rollup-plugin-commonjs');

const projectPackage = require('./package.json');

class Compiler
{
    constructor()
    {
        this.run();
    }

    async run()
    {
        try
        {
            await this.removeAssetsDirectory();
            await this.createAssetsDirectory();
            await this.moveApplication();
            await this.moveWorker();
            const timestamp = Date.now();
            await this.createCachebustDirectory(timestamp);
            const htmlFiles = await this.getHtmlFiles();
            const homepageHtmlFile = await this.getHomepageHtmlFile();
            await this.updateHomepageHtml(homepageHtmlFile, timestamp);
            await this.updateHtmlFiles(htmlFiles, timestamp)
            
            /** SASS */
            const sassFiles = await this.getSassFiles();
            await this.compileSass(sassFiles, timestamp);
            
            /** Web Components */
            const componentFiles = await this.getComponentFiles();
            await this.moveComponents(componentFiles, timestamp);

            /** NPM Package Bundling */
            await this.removeBundleDirectory();
            await this.makeBundleDirectory();
            const dependencies = await this.getWebDependencies();
            const serverSafeBundleNames = await this.writeBundles(dependencies);
            await this.buildPackages(serverSafeBundleNames, timestamp);

            await this.moveCNAME();
        }
        catch (error)
        {
            console.log(error);
        }
    }

    moveCNAME()
    {
        return new Promise((resolve, reject) => {
            fs.promises.access('CNAME')
            .then(() => {
                fs.copyFile('CNAME', 'build/CNAME', (error) => {
                    if (error)
                    {
                        reject(error);
                    }

                    resolve();
                });
            })
            .catch(() => {
                resolve();
            });
        });
    }

    buildPackages(serverSafeBundleNames, timestamp)
    {
        const built = [];
        return new Promise((resolve, reject)=>{
            for (let i = 0; i < serverSafeBundleNames.length; i++)
            {
                const inputOptions = {
                    input: `_packages/${ serverSafeBundleNames[i] }.js`,
                    plugins: [
                        rollupPluginNodeResolve({
                            mainFields: ['browser', 'module', 'jsnext:main'],
                            extensions: [ '.mjs', '.js', '.json'],
                            browser: true
                        }),
                        rollupPluginCommonjs({
                            include: /node_modules/,
                            extensions: ['.cjs', '.js']
                        })
                    ]
                };
                const outputOptions = {
                    file: `build/assets/${ timestamp }/${ serverSafeBundleNames[i] }.js`,
                    format: 'iife'
                };
                this.build(inputOptions, outputOptions)
                .then(()=>{
                    built.push(serverSafeBundleNames[i]);

                    if (built.length === serverSafeBundleNames.length)
                    {
                        resolve();
                    }
                })
                .catch(err => {
                    reject(err);
                });
            }
        });
    }

    build(inputOptions, outputOptions)
    {
        return new Promise((resolve, reject)=>{
            (async ()=>{
                try
                {
                    const bundle = await rollup.rollup(inputOptions);
                    await bundle.write(outputOptions); 
                    resolve();
                }
                catch (err)
                {
                    reject(err)
                }
            })();
        });
    }

    writeBundles(dependencies)
    {
        return new Promise((resolve, reject)=>{
            
            const writtenBundles = [];
            
            for (let i = 0; i < dependencies.length; i++)
            {
                let serverSafeName = dependencies[i].package.toLowerCase();
                serverSafeName = serverSafeName.replace(/[\/]/g, '-');
                serverSafeName = serverSafeName.replace(/\@/g, '');

                /**
                 * Example:
                 * fullPackageName = @codewithkyle/demo-package
                 * namespace = codewithkyle
                 * package = demo-package
                 * filename = codewithkyle-demo-package
                 */
                let fullPackageName = dependencies[i].package.toLowerCase();
                let namespace = (fullPackageName.match(/.*[\/]/)) ? fullPackageName.match(/.*[\/]/)[0].replace(/[\/\@]/g, '') : '';
                let packageName = fullPackageName.replace(/(.*?\/)/, '');

                /** Write pre-bundled bundle file */
                let data = `import ${ dependencies[i].import } from '${ fullPackageName }'\n`;
                if(dependencies[i].import.match(/(\*\sas)/))
                {
                    let importName = dependencies[i].import;
                    importName = importName.replace(/(.*\sas\s)/, '');
                    importName = importName.trim();
                    data += `\nwindow.${ importName } = ${ importName }.default;`;
                }
                else
                {
                    let importName = dependencies[i].import;
                    importName = importName.replace(/[\{\}]/g, '');
                    importName = importName.trim();
                    data += `\nwindow.${ importName } = ${ importName };`;
                }
                
                fs.writeFile(`_packages/${ serverSafeName }.js`, data, (err)=>{
                    if (err)
                    {
                        reject(err);
                    }

                    writtenBundles.push(serverSafeName);

                    if (writtenBundles.length === dependencies.length)
                    {
                        resolve(writtenBundles);
                    }
                });
            }
        });
    }

    getWebDependencies()
    {
        return new Promise((resolve)=>{
            let dependencies = [];
    
            if (projectPackage.webDependencies.length)
            {
                dependencies = projectPackage.webDependencies;
            }
            
            resolve(dependencies);
        });
    }

    makeBundleDirectory()
    {
        return new Promise((resolve, reject)=>{
            fs.mkdir('_packages', (err)=>{
                if (err)
                {
                    reject(err);
                }
        
                resolve();
            });
        });
    }

    removeBundleDirectory()
    {
        return new Promise((resolve, reject)=>{
            fs.promises.access('_packages')
            .then(() => {
                fs.rmdir('_packages', { recursive: true }, (error) => {
                    if (error)
                    {
                        reject(error);
                    }

                    resolve();
                })
            })
            .catch(()=>{ resolve(); });
        });
    }

    moveComponents(files, timestamp)
    {
        return new Promise((resolve, reject)=>{
            let moved = 0;

            for (let i = 0; i < files.length; i++)
            {
                const filename = files[i].replace(/.*\//g, '');
                fs.rename(files[i], `build/assets/${ timestamp }/${ filename }`, (error)=>{
                    if (error)
                    {
                        reject(error);
                    }

                    moved++;
                    if (moved === files.length)
                    {
                        resolve();
                    }
                });
            }
        });
    }

    getComponentFiles()
    {
        return new Promise((resolve, reject)=>{
            glob('_compiled/**/*.js', (error, files)=>{
                if (error)
                {
                    reject(error);
                }

                resolve(files);
            });
        });
    }

    compileSass(files, timestamp)
    {
        return new Promise((resolve, reject)=>{
            let compiled = 0;

            for (let i = 0; i < files.length; i++)
            {
                const file = files[i];

                sass.render(
                    {
                        file: file,
                        outputStyle: 'compressed'
                    },
                    (error, result) => {
                        if (error)
                        {
                            reject(`${ error.message } at line ${ error.line } ${ error.file }`);
                        }

                        let fileName = result.stats.entry.replace(/.*\//g, '').toLowerCase();
                        fileName = fileName.replace(/(.scss)|(.sass)/g, '').trim();

                        if (fileName)
                        {
                            const newFile = `build/assets/${ timestamp }/${ fileName }.css`;
                            fs.writeFile(newFile, result.css.toString(), (error)=>{
                                if (error)
                                {
                                    reject('Something went wrong saving the file' + error);
                                }

                                console.log(`${ file } [compiled]`);
                                compiled++;

                                if (compiled === files.length)
                                {
                                    resolve();
                                }
                            });
                        }
                        else
                        {
                            reject('Something went wrong with the file name of ' + result.stats.entry);
                        }
                    }
                );
            }
        });
    }

    getSassFiles()
    {
        return new Promise((resolve, reject)=>{
            glob('src/**/*.scss', (error, files)=>{
                if (error)
                {
                    reject(error);
                }

                resolve(files);
            });
        });
    }

    updateHtmlFiles(htmlFiles, timestamp)
    {
        return new Promise((resolve, reject)=>{
            if (htmlFiles.length === 0)
            {
                resolve();
            }
            
            fs.readFile('src/shell.html', (error, buffer)=>{
                if (error)
                {
                    reject(error);
                }

                let moved = 0;
                for (let i = 0; i < htmlFiles.length; i++)
                {
                    fs.readFile(htmlFiles[i], (error, htmlBuffer)=>{
                        if (error)
                        {
                            reject(error);
                        }
                        
                        const htmlSnippet = htmlBuffer.toString();
                        let data = buffer.toString();
                        data = data.replace('REPLACE_WITH_HTML', htmlSnippet);
                        data = data.replace(/data-cachebust\=\"\d*\"/g, `data-cachebust="${ timestamp }"`);

                        const htmlPath = htmlFiles[i].replace('src/', 'build/').match(/.*\//g)[0].replace(/[\/]$/g, '').trim();

                        fs.promises.mkdir(htmlPath, { recursive: true })
                        .then(()=>{
                            fs.writeFile(`${ htmlPath }/index.html`, data, (error)=>{
                                if (error)
                                {
                                    reject(error);
                                }
    
                                moved++;
    
                                if (moved === htmlFiles.length)
                                {
                                    resolve();
                                }
                            });
                        })
                        .catch(error => reject(error));
                    });
                }
            });
        });
    }

    updateHomepageHtml(homepageHtmlFilePath, timestamp)
    {
        return new Promise((resolve, reject)=>{
            fs.readFile('src/shell.html', (error, buffer)=>{
                if (error)
                {
                    reject(error);
                }

                let data = buffer.toString();
                
                fs.readFile(homepageHtmlFilePath, (error, buffer)=>{
                    if (error)
                    {
                        reject(error);
                    }

                    const homepageData = buffer.toString();

                    data = data.replace('REPLACE_WITH_HTML', homepageData);
                    data = data.replace(/data-cachebust\=\"\d*\"/g, `data-cachebust="${ timestamp }"`);

                    fs.writeFile('build/index.html', data, (error)=>{
                        if (error)
                        {
                            reject(error);
                        }

                        resolve();
                    });
                });
            });
        });
    }

    updateCachebustTimestamp(timestamp, files)
    {
        return new Promise((resolve, reject)=>{
            let updated = 0;
            for (let i = 0; i < files.length; i++)
            {
                fs.readFile(files[i], (error, buffer)=>{
                    if (error)
                    {
                        reject(error);
                    }

                    let data = buffer.toString();
                    data = data.replace(/data-cachebust\=\"\d*\"/g, `data-cachebust="${ timestamp }"`);

                    fs.writeFile(files[i], data, (error)=>{
                        if (error)
                        {
                            reject(error);
                        }

                        updated++;

                        if (updated === files.length)
                        {
                            resolve();
                        }
                    });
                });
            }
        });
    }

    getHomepageHtmlFile()
    {
        return new Promise((resolve, reject)=>{
            fs.promises.access('src/homepage.html')
            .then(()=>{
                resolve('src/homepage.html');
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    getHtmlFiles()
    {
        return new Promise((resolve, reject)=>{
            glob('src/**/index.html', (error, files)=>{
                if (error)
                {
                    reject(error);
                }

                resolve(files);
            });
        });
    }

    createCachebustDirectory(timestamp)
    {
        return new Promise((resolve, reject)=>{
            fs.mkdir(`build/assets/${ timestamp }`, (error)=>{
                if (error)
                {
                    reject(error);
                }

                resolve();
            });
        });
    }

    createAssetsDirectory()
    {
        return new Promise((resolve, reject)=>{
            fs.mkdir('build/assets', (error)=>{
                if (error)
                {
                    reject(error);
                }

                resolve();
            });
        });
    }

    removeAssetsDirectory()
    {
        return new Promise((resolve, reject)=>{
            fs.rmdir('build/assets', { recursive: true }, (error)=>{
                if (error)
                {
                    reject(error);
                }

                resolve();
            });
        });
    }

    moveWorker()
    {
        return new Promise((resolve, reject)=>{
            fs.rename('_compiled/worker.js', 'build/worker.js', (error)=>{
                if (error)
                {
                    reject(error);
                }

                resolve();
            });
        });
    }

    moveApplication()
    {
        return new Promise((resolve, reject)=>{
            fs.rename('_compiled/application.js', 'build/assets/application.js', (error)=>{
                if (error)
                {
                    reject(error);
                }

                resolve();
            });
        });
    }
}

new Compiler();