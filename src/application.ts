type DomState = {
    status: 'loading'|'reloading'|'idling'
};

interface WorkerResponse
{
    type: string,
    urls: Array<string>,
}

class Application
{
    private worker : Worker;
    private cachebust : string;
    
    constructor()
    {
        this.cachebust = document.documentElement.dataset.cachebust;
        this.worker = new Worker(`./assets/${ this.cachebust }/resource-worker.js`);
        this.worker.onmessage = this.handleIncomingWorkerMessage.bind(this);
        this.load();
        document.addEventListener('app:reload', this.handleReloadEvent);
    }

    private handleReloadEvent:EventListener = this.load.bind(this);

    private appendStylesheets(urls:Array<string>)
    {
        for (let i = 0; i < urls.length; i++)
        {
            const el:HTMLLinkElement = document.head.querySelector(`link[href="${ urls[i] }"]`) || document.createElement('link');
            if (!el.isConnected)
            {
                el.href = urls[i];
                el.rel = 'stylesheet';
                document.head.append(el);
            }
        }
    }

    private appendScripts(urls:Array<string>)
    {
        for (let i = 0; i < urls.length; i++)
        {
            const el:HTMLScriptElement = document.head.querySelector(`script[src="${ urls[i] }"]`) || document.createElement('script');
            if (!el.isConnected)
            {
                el.src = urls[i];
                el.type = 'module';
                document.head.append(el);
            }
        }
    }

    private handleIncomingWorkerMessage(e:MessageEvent)
    {
        const response:WorkerResponse = e.data;
        switch (response.type)
        {
            case 'criticalCss':
                this.appendStylesheets(response.urls);
                break;
            case 'webComponents':
                this.appendScripts(response.urls);
                break;
        }
    }

    private async load(e:Event = null)
    {
        try
        {
            if (e !== null)
            {
                document.documentElement.setAttribute('state', 'reloading');
            }
            else
            {
                document.documentElement.setAttribute('state', 'loading');
            }

            /** Get web component scripts */
            // const customElements = Array.from(document.body.querySelectorAll('[web-component]:not([state])'));
            // const requestedWebComponents:{ [key:string]:string } = {};
            // for (let i = 0; i < customElements.length; i++)
            // {
            //     const customElement = customElements[i].tagName.toLowerCase().trim();
            //     requestedWebComponents[customElement] = customElement;
            // }
            // this.worker.postMessage({
            //     type: 'scripts',
            //     files: requestedWebComponents
            // });

            const criticalCssElements = Array.from(document.documentElement.querySelectorAll('[critical-css]'));
            let criticalCssFileStrings:Array<string> = [];
            for (let i = 0; i < criticalCssElements.length; i++)
            {
                const files = criticalCssElements[i].getAttribute('critical-css').trim().toLowerCase().split(/(\s+)/g);
                criticalCssFileStrings = [...files];
            }
            this.worker.postMessage({
                type: 'criticalCss',
                criticalCss: criticalCssFileStrings,
                cachebust: this.cachebust,
            });
        }
        catch (error)
        {
            console.error(error);
        }
    }
}

new Application();