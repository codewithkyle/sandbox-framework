interface IncomingMessage
{
    type: string,
    files: {
        [key:string]: string
    },
    criticalCss: Array<string>,
    cachebust: string,
}

onmessage = (event) => {
    const message:IncomingMessage = event.data;
    switch (message.type)
    {
        case 'scripts':
            console.log(message.files);
            scripts(message.files, message.cachebust)
            break;
        case 'stylesheets':
            console.log(message.files);
            break;
        case 'criticalCss':
            criticalCss(message.criticalCss, message.cachebust);
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
function criticalCss(criticalCssFileStrings:Array<string>, cachebust:string) : void
{
    const requestedCriticalCss:{ [key:string]:string } = {};
    for (let i = 0; i < criticalCssFileStrings.length; i++)
    {
        const file = criticalCssFileStrings[i].replace(/(\s)|(\.css)$/g, '');
        if (file !== '')
        {
            requestedCriticalCss[file] = file;
        }
    }

    new Promise((resolve) => {
        const requestedFiles = Object.keys(requestedCriticalCss).length;
        let received = 0;
        const urls:Array<string> = [];
        if (requestedFiles === 0)
        {
            resolve(urls);
        }
        Object.keys(requestedCriticalCss).forEach((filename:string) => {
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
                type: 'criticalCss',
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