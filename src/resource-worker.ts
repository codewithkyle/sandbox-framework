interface IncomingMessage
{
    type: string,
    files: {
        [key:string]: string
    },
    fileStrings: Array<string>,
    cachebust: string,
}

onmessage = (event) => {
    const message:IncomingMessage = event.data;
    switch (message.type)
    {
        case 'scripts':
            scripts(message.files, message.cachebust);
            break;
        case 'stylesheets':
            stylesheets(message.fileStrings, message.cachebust, 'stylesheets');
            break;
        case 'criticalCss':
            stylesheets(message.fileStrings, message.cachebust, 'criticalCss');
            break;
    }
}

function scripts(scriptFileStrings:{ [key:string]:string }, cachebust:string) : void
{
    new Promise((resolve) => {
        const requestedFiles = Object.keys(scriptFileStrings).length;
        let received = 0;
        const urls:Array<string> = [];
        if (requestedFiles === 0)
        {
            resolve(urls);
        }
        Object.keys(scriptFileStrings).forEach((filename:string) => {
            fetchFile(filename, 'js', cachebust)
            .then((blobUrl:string) => {
                urls.push(blobUrl);
            })
            .catch((error:string) => {
                console.error(error);
            })
            .then(() => {
                received++;
                if (received === requestedFiles)
                {
                    resolve(urls);
                }
            });
        });
    }).then((urls:Array<string>) => {
        // @ts-ignore
        postMessage(
            {
                type: 'scripts',
                urls: urls,
            }
        );
    });
}

/**
 * Creates an object that contains all the required CSS file names.
 * @param elements - Array of HTML elements that contain a `critical-css` attribute
 */
function stylesheets(cssFileStrings:Array<string>, cachebust:string, responseType:string) : void
{
    const requestedCss:{ [key:string]:string } = {};
    for (let i = 0; i < cssFileStrings.length; i++)
    {
        const file = cssFileStrings[i].replace(/(\s)|(\.css)$/g, '');
        if (file !== '')
        {
            requestedCss[file] = file;
        }
    }

    new Promise((resolve) => {
        const requestedFiles = Object.keys(requestedCss).length;
        let received = 0;
        const urls:Array<string> = [];
        if (requestedFiles === 0)
        {
            resolve(urls);
        }
        Object.keys(requestedCss).forEach((filename:string) => {
            fetchFile(filename, 'css', cachebust)
            .then((blobUrl:string) => {
                urls.push(blobUrl);
            })
            .catch((error:string) => {
                console.error(error);
            })
            .then(() => {
                received++;
                if (received === requestedFiles)
                {
                    resolve(urls);
                }
            });
        });
    }).then((urls:Array<string>) => {
        // @ts-ignore
        postMessage(
            {
                type: responseType,
                urls: urls,
            }
        );
    });
}

async function fetchFile(filename:string, extension:string, cachebust:string)
{
    const request = await fetch(`${ self.location.origin }/assets/${ cachebust }/${ filename }.${ extension }`, {
                        method: 'GET',
                        credentials: 'include'
                    });
    if (request.ok)
    {
        const response = await request.blob();
        return URL.createObjectURL(response);
    }
    else
    {
        throw `Failed to fetch ${ filename }.${ extension }. Server responded with ${ request.status }:${ request.statusText }`;
    }
}