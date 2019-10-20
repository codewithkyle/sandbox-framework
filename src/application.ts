declare var stylesheets : Array<string>;
declare var criticalCss : Array<string>;
declare var modules : Array<string>;
declare var components : Array<string>;
declare var criticalComponents : Array<string>;
declare var packages : Array<string>;

class Application
{
    constructor()
    {
        this.load();
        document.addEventListener('app:reload', this.handleReloadEvent);
    }

    private handleReloadEvent:EventListener = this.load.bind(this);

    private async fetchFile(element:Element, filename:string, filetype:string)
    {
        try
        {
            const request = await fetch(`${ window.location.origin }/assets/${ document.documentElement.dataset.cachebust }/${ filename }.${ filetype }`);
            if (request.ok)
            {
                const response = await request.blob();
                const fileUrl = URL.createObjectURL(response);
                switch (filetype)
                {
                    case 'css':
                        element.setAttribute('rel', 'stylesheet');
                        element.setAttribute('href', fileUrl);
                        break;
                    case 'js':
                        element.setAttribute('type', 'text/javascript');
                        element.setAttribute('src', fileUrl);
                        break;
                }
                return;
            }
            
            throw `Failed to fetch ${ filename }.${ filetype } server responded with ${ request.status }`;

        }
        catch (error)
        {
            throw error;
        }
    }

    private fetchResources(fileListArray:Array<string>, element:string, filetype:string) : Promise<any>
    {
        return new Promise((resolve) => {
            if (fileListArray.length === 0)
            {
                resolve();
            }

            let count = 0;
            const required = fileListArray.length;

            while (fileListArray.length > 0)
            {
                const filename = fileListArray[0].replace(/(\.js)$|(\.css)$/gi, '');
                let el = document.head.querySelector(`${ element }[file="${ filename }.${ filetype }"]`);
                if (!el)
                {
                    el = document.createElement(element);
                    el.setAttribute('file', `${ filename }.${ filetype }`);
                    document.head.appendChild(el);
                    this.fetchFile(el, filename, filetype)
                    .then(() => {
                        el.addEventListener('load', () => {
                            count++;
                            if (count === required)
                            {
                                resolve();
                            }
                        });
                    })
                    .catch(error => {
                        console.error(error);
                        count++;
                        if (count === required)
                        {
                            resolve();
                        }
                    });
                }
                else
                {
                    count++;
                    if (count === required)
                    {
                        resolve();
                    }
                }

                fileListArray.splice(0, 1);
            }
        });
    }

    private packagesLoaded() : void
    {
        const event = new CustomEvent('app:packagesloaded');
        document.dispatchEvent(event);
    }

    private modulesLoaded() : void
    {
        const event = new CustomEvent('app:modulesloaded');
        document.dispatchEvent(event);
    }

    private finishLoading() : void
    {
        document.documentElement.classList.remove('is-loading');
        const event = new CustomEvent('app:loaded');
        document.dispatchEvent(event);
    }

    private async load()
    {
        try
        {
            document.documentElement.classList.add('is-loading');
            await this.fetchResources(window.criticalCss, 'link', 'css');
            this.fetchResources(window.stylesheets, 'link', 'css');
            await this.fetchResources(window.packages, 'script', 'js');
            this.packagesLoaded();
            await this.fetchResources(window.modules, 'script', 'js');
            this.modulesLoaded();
            await this.fetchResources(window.criticalComponents, 'script', 'js');
            this.fetchResources(window.components, 'script', 'js');
            this.finishLoading();
        }
        catch (error)
        {
            console.error(error);
        }
    }
}

new Application();