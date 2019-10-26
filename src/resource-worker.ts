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
            break;
        case 'stylesheets':
            console.log(message.files);
            break;
        case 'criticalCss':
            criticalCss(message.criticalCss, message.cachebust);
            break;
    }
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

    this.fetchFiles(requestedCriticalCss, 'css', cachebust).then((urls:Array<string>) => {
        // @ts-ignore
        postMessage(
            {
                type: 'criticalCss',
                urls: urls,
            }
        );
    });
}

function fetchFiles(files:{ [key:string]:string }, extension:string, cachebust:string) : Promise<any>
{
    return new Promise((resolve) => {
        const requestedFiles = Object.keys(files).length;
        let received = 0;
        const urls:Array<string> = [];
        if (requestedFiles === 0)
        {
            resolve(urls);
        }
        Object.keys(files).forEach((filename:string) => {
            fetchFile(filename, extension, cachebust)
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